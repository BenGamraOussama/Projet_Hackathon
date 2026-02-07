import { useState, useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';
import { attendanceService } from '../../services/attendance.service';
import { sessionService } from '../../services/session.service';
import { authService } from '../../services/auth.service';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;
type SessionItem = {
  id: number;
  levelNumber?: number;
  sessionNumber?: number;
  startAt?: string;
  date?: string;
  title?: string;
  durationMin?: number;
  duration?: number;
};

export default function Attendance() {
  const [selectedTraining, setSelectedTraining] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [levels, setLevels] = useState<number[]>([1, 2, 3, 4]);
  const [quickMode, setQuickMode] = useState(false);
  const [savedData, setSavedData] = useState<{
    sessionTitle: string;
    date: string;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
  } | null>(null);
  const userRole = authService.getUserRole();
  const canMarkExcused = userRole === 'ADMIN' || userRole === 'RESPONSABLE';
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setQuickMode(true);
    }

    const loadData = async () => {
      try {
        const [trainingsData, studentsData] = await Promise.all([
          trainingService.getAll(),
          studentService.getAll()
        ]);
        const normalizedStudents = studentsData.map((student) => ({
          ...student,
          trainingId: student.training?.id ?? student.trainingId ?? null
        }));
        setTrainings(trainingsData);
        setStudents(normalizedStudents);
        if (trainingsData.length > 0) {
          setSelectedTraining(trainingsData[0].id);
        }
      } catch (error) {
        console.error("Failed to load attendance data", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedTraining) {
        setSessions([]);
        return;
      }
      try {
        const data = (await sessionService.getByTraining(selectedTraining)) as SessionItem[];
        const sorted = [...data].sort((a, b) => {
          const levelDiff = (a.levelNumber ?? 0) - (b.levelNumber ?? 0);
          if (levelDiff !== 0) return levelDiff;
          return (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0);
        });
        setSessions(sorted);
        const levelNumbers = Array.from(
          new Set(
            data
              .map((s) => Number(s.levelNumber))
              .filter((n) => Number.isFinite(n))
          )
        ).sort((a, b) => a - b);
        setLevels(levelNumbers.length > 0 ? levelNumbers : [1, 2, 3, 4]);
        if (levelNumbers.length > 0 && !levelNumbers.includes(selectedLevel)) {
          setSelectedLevel(levelNumbers[0]);
        }
      } catch (error) {
        console.error("Failed to load sessions", error);
        setSessions([]);
      }
    };

    loadSessions();
  }, [selectedTraining, selectedLevel]);

  useEffect(() => {
    const sessionsForSelection = sessions.filter(
      (s) => Number(s.levelNumber) === Number(selectedLevel)
    );
    if (sessionsForSelection.length > 0) {
      setSelectedSession(sessionsForSelection[0].id);
    } else {
      setSelectedSession(0);
    }
  }, [sessions, selectedLevel]);

  useEffect(() => {
    const loadSessionAttendance = async () => {
      if (!selectedSession) {
        setAttendance({});
        return;
      }
      try {
        const records = await attendanceService.getBySession(selectedSession);
        const mapped: Record<number, AttendanceStatus> = {};
        records.forEach((record: any) => {
          const studentId = record.student?.id ?? record.studentId;
          if (studentId != null) {
            mapped[Number(studentId)] = record.status;
          }
        });
        setAttendance(mapped);
      } catch (error) {
        console.error("Failed to load session attendance", error);
        setAttendance({});
      }
    };

    loadSessionAttendance();
  }, [selectedSession]);

  const session = sessions.find(s => s.id === selectedSession);
  const sessionDateValue = session?.startAt ?? session?.date;
  const sessionDate = sessionDateValue ? new Date(sessionDateValue).toISOString().split('T')[0] : '';
  const enrolledStudents = students.filter(s => s.trainingId === selectedTraining);
  
  const handleAttendance = (studentId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };
  
  const getAttendanceCount = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0
    };
    
    enrolledStudents.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        counts[status]++;
      } else {
        counts.unmarked++;
      }
    });
    
    return counts;
  };
  
  const counts = getAttendanceCount();

  const handleSaveAttendance = async () => {
    // Check if any attendance is marked
    const markedCount = Object.values(attendance).filter(status => status !== null).length;
    
    if (markedCount === 0) {
      return;
    }
    
    setIsSaving(true);

    try {
      const records = Object.entries(attendance)
        .filter(([, status]) => status !== null)
        .map(([studentId, status]) => ({
          studentId: Number(studentId),
          status
        }));

      await attendanceService.saveBulk({
        sessionId: selectedSession,
        date: sessionDate,
        records
      });

      const refreshed = await attendanceService.getBySession(selectedSession);
      const refreshedMap: Record<number, AttendanceStatus> = {};
      refreshed.forEach((record: any) => {
        const studentId = record.student?.id ?? record.studentId;
        if (studentId != null) {
          refreshedMap[Number(studentId)] = record.status;
        }
      });
      setAttendance(refreshedMap);
    } catch (error) {
      console.error("Failed to save attendance", error);
    }
    
    // Store saved data for confirmation
    setSavedData({
      sessionTitle: session?.title || '',
      date: sessionDate || '',
      totalStudents: enrolledStudents.length,
      present: counts.present,
      absent: counts.absent,
      late: counts.late
    });
    
    setIsSaving(false);
    setShowSuccess(true);
  };

  const handleReset = () => {
    setAttendance({});
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSavedData(null);
    setAttendance({});
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
          <p className="text-base text-gray-600">Mark student attendance for training sessions</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Info</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="training-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Training
                </label>
                <select
                  id="training-select"
                  value={selectedTraining}
                  onChange={(e) => setSelectedTraining(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="level-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  id="level-select"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="session-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Session
                </label>
                <select
                  id="session-select"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {sessions
                    .filter(s => Number(s.levelNumber) === Number(selectedLevel))
                    .map(s => (
                    <option key={s.id} value={s.id}>Session {s.sessionNumber}</option>
                  ))}
                </select>
              </div>
              
              {session && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">{session.title}</p>
                  <p className="text-xs text-gray-600">{sessionDateValue ? new Date(sessionDateValue).toLocaleDateString() : ''}</p>
                  <p className="text-xs text-gray-600">{session.durationMin ?? session.duration ?? 0} minutes</p>
                </div>
              )}
            </div>
          </Card>
          
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card padding="sm" className="bg-green-50 border-green-200">
                <div className="text-center">
                  <i className="ri-checkbox-circle-line text-3xl text-green-600 mb-2" aria-hidden="true"></i>
                  <p className="text-2xl font-bold text-gray-900">{counts.present}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
              </Card>
              
              <Card padding="sm" className="bg-red-50 border-red-200">
                <div className="text-center">
                  <i className="ri-close-circle-line text-3xl text-red-600 mb-2" aria-hidden="true"></i>
                  <p className="text-2xl font-bold text-gray-900">{counts.absent}</p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
              </Card>
              
              <Card padding="sm" className="bg-amber-50 border-amber-200">
                <div className="text-center">
                  <i className="ri-time-line text-3xl text-amber-600 mb-2" aria-hidden="true"></i>
                  <p className="text-2xl font-bold text-gray-900">{counts.late}</p>
                  <p className="text-sm text-gray-600">Late</p>
                </div>
              </Card>
              
              <Card padding="sm" className="bg-gray-50 border-gray-200">
                <div className="text-center">
                  <i className="ri-question-line text-3xl text-gray-600 mb-2" aria-hidden="true"></i>
                  <p className="text-2xl font-bold text-gray-900">{counts.unmarked}</p>
                  <p className="text-sm text-gray-600">Unmarked</p>
                </div>
              </Card>
            </div>
            
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{enrolledStudents.length} students enrolled</span>
                  <button
                    onClick={() => setQuickMode(!quickMode)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {quickMode ? 'Mode liste' : 'Mode rapide'}
                  </button>
                </div>
              </div>
              
              {quickMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold text-lg">
                          {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-600">Level {student.currentLevel}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3" role="group" aria-label={`Attendance options for ${student.firstName} ${student.lastName}`}>
                        <button
                          onClick={() => handleAttendance(student.id, 'present')}
                          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer ${
                            attendance[student.id] === 'present'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                          aria-pressed={attendance[student.id] === 'present'}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendance(student.id, 'absent')}
                          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                            attendance[student.id] === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                          aria-pressed={attendance[student.id] === 'absent'}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleAttendance(student.id, 'late')}
                          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                            attendance[student.id] === 'late'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                          aria-pressed={attendance[student.id] === 'late'}
                        >
                          Late
                        </button>
                        {canMarkExcused ? (
                          <button
                            onClick={() => handleAttendance(student.id, 'excused')}
                            className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                              attendance[student.id] === 'excused'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                            aria-pressed={attendance[student.id] === 'excused'}
                          >
                            Excused
                          </button>
                        ) : (
                          <div className="px-4 py-3 rounded-lg bg-gray-50 text-gray-400 text-sm flex items-center justify-center">
                            N/A
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledStudents.map((student) => (
                    <div 
                      key={student.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold">
                            {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-600">Level {student.currentLevel}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2" role="group" aria-label={`Attendance options for ${student.firstName} ${student.lastName}`}>
                          <button
                            onClick={() => handleAttendance(student.id, 'present')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer whitespace-nowrap ${
                              attendance[student.id] === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-600'
                            }`}
                            aria-pressed={attendance[student.id] === 'present'}
                          >
                            <i className="ri-checkbox-circle-line mr-1" aria-hidden="true"></i>
                            Present
                          </button>

                          <button
                            onClick={() => handleAttendance(student.id, 'absent')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer whitespace-nowrap ${
                              attendance[student.id] === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-600'
                            }`}
                            aria-pressed={attendance[student.id] === 'absent'}
                          >
                            <i className="ri-close-circle-line mr-1" aria-hidden="true"></i>
                            Absent
                          </button>

                          <button
                            onClick={() => handleAttendance(student.id, 'late')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer whitespace-nowrap ${
                              attendance[student.id] === 'late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-600'
                            }`}
                            aria-pressed={attendance[student.id] === 'late'}
                          >
                            <i className="ri-time-line mr-1" aria-hidden="true"></i>
                            Late
                          </button>

                          {canMarkExcused && (
                            <button
                              onClick={() => handleAttendance(student.id, 'excused')}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer whitespace-nowrap ${
                                attendance[student.id] === 'excused'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-600'
                              }`}
                              aria-pressed={attendance[student.id] === 'excused'}
                            >
                              <i className="ri-information-line mr-1" aria-hidden="true"></i>
                              Excused
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <Button 
                  variant="primary" 
                  fullWidth
                  onClick={handleSaveAttendance}
                  disabled={isSaving || counts.unmarked === enrolledStudents.length}
                >
                  {isSaving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line" aria-hidden="true"></i>
                      Save Attendance
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={handleReset}
                  disabled={isSaving || counts.unmarked === enrolledStudents.length}
                >
                  <i className="ri-refresh-line" aria-hidden="true"></i>
                  Reset
                </Button>
              </div>

              {counts.unmarked === enrolledStudents.length && (
                <p className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                  <i className="ri-information-line" aria-hidden="true"></i>
                  Please mark attendance for at least one student before saving.
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccess && savedData && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-4xl text-green-600" aria-hidden="true"></i>
              </div>
              <h3 id="success-title" className="text-xl font-bold text-gray-900 mb-2">
                Attendance Saved Successfully!
              </h3>
              <p className="text-gray-600">
                The attendance records have been saved.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session:</span>
                  <span className="font-medium text-gray-900">{savedData.sessionTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(savedData.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students:</span>
                  <span className="font-medium text-gray-900">{savedData.totalStudents}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600 flex items-center gap-1">
                      <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
                      Present
                    </span>
                    <span className="font-medium text-gray-900">{savedData.present}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 flex items-center gap-1">
                      <i className="ri-close-circle-line" aria-hidden="true"></i>
                      Absent
                    </span>
                    <span className="font-medium text-gray-900">{savedData.absent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600 flex items-center gap-1">
                      <i className="ri-time-line" aria-hidden="true"></i>
                      Late
                    </span>
                    <span className="font-medium text-gray-900">{savedData.late}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleCloseSuccess}
              >
                <i className="ri-check-line" aria-hidden="true"></i>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

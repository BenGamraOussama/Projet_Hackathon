import { useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { studentsData } from '../../mocks/students';
import { trainingsData, sessionsData } from '../../mocks/trainings';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

export default function Attendance() {
  const [selectedTraining, setSelectedTraining] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedData, setSavedData] = useState<{
    sessionTitle: string;
    date: string;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
  } | null>(null);
  
  const training = trainingsData.find(t => t.id === selectedTraining);
  const session = sessionsData.find(s => s.id === selectedSession);
  const enrolledStudents = studentsData.filter(s => s.trainingId === selectedTraining);
  
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store saved data for confirmation
    setSavedData({
      sessionTitle: session?.title || '',
      date: session?.date || '',
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
                  {trainingsData.map(t => (
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
                  {[1, 2, 3, 4].map(level => (
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
                  {sessionsData.filter(s => s.level === selectedLevel).map(s => (
                    <option key={s.id} value={s.id}>Session {s.sessionNumber}</option>
                  ))}
                </select>
              </div>
              
              {session && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">{session.title}</p>
                  <p className="text-xs text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-600">{session.duration} minutes</p>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
                <div className="text-sm text-gray-600">
                  {enrolledStudents.length} students enrolled
                </div>
              </div>
              
              <div className="space-y-3">
                {enrolledStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold">
                          {student.firstName[0]}{student.lastName[0]}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
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
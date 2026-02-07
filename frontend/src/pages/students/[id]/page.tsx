import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import Badge from '../../../components/base/Badge';
import { studentService } from '../../../services/student.service';
import { trainingService } from '../../../services/training.service';
import { attendanceService } from '../../../services/attendance.service';
import { sessionService } from '../../../services/session.service';
import { enrollmentService } from '../../../services/enrollment.service';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type SessionItem = {
  id: number;
  levelNumber?: number | null;
  level?: number | null;
  sessionNumber?: number | null;
  title?: string | null;
};
type TrainingSummary = {
  id: number;
  name?: string | null;
  title?: string | null;
};
type AttendanceRecord = {
  id: number;
  sessionId: number;
  status: AttendanceStatus;
  date: string;
  student?: { id?: number | null };
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'progress'>('overview');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [student, setStudent] = useState<any | null>(null);
  const [training, setTraining] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      if (!id) return;
      setIsLoading(true);

      try {
        const progressData = await studentService.getProgressById(id);
        const trainingId = progressData.trainingId ?? null;

        const [trainingsData, sessionsData, attendanceData, enrollmentsData] = await Promise.all([
          trainingService.getAll(),
          trainingId ? sessionService.getByTraining(trainingId) : Promise.resolve([]),
          attendanceService.getByStudent(Number(id)),
          enrollmentService.getByStudent(Number(id))
        ]);

        const trainingsList = (trainingsData ?? []) as TrainingSummary[];
        const sessionsList = (sessionsData ?? []) as SessionItem[];
        const attendanceList = (attendanceData ?? []) as AttendanceRecord[];
        const enrollmentsList = (enrollmentsData ?? []) as any[];

        setTraining(trainingsList.find(t => t.id === trainingId) || null);
        setSessions(sessionsList);
        setEnrollments(enrollmentsList);

        const totalSessionsFromTraining = sessionsList.length > 0 ? sessionsList.length : 24;
        const totalSessions = progressData.totalSessions ?? totalSessionsFromTraining;
        const completedSessions = progressData.completedSessions ?? attendanceList.length;
        const presentCount = attendanceList.filter((record) => record.status === 'present' || record.status === 'late').length;
        const attendanceRate = progressData.attendanceRate ?? (completedSessions > 0
          ? Math.round((presentCount / completedSessions) * 100)
          : 0);
        const eligibleForCertification = progressData.eligibleForCertification ?? (completedSessions >= totalSessions && attendanceRate >= 80);

        setStudent({
          id: progressData.studentId ?? progressData.id,
          firstName: progressData.firstName,
          lastName: progressData.lastName,
          email: progressData.email,
          phone: progressData.phone,
          enrollmentDate: progressData.enrollmentDate,
          status: progressData.status ?? 'active',
          trainingId,
          currentLevel: progressData.currentLevel ?? 1,
          totalSessions,
          completedSessions,
          attendanceRate,
          eligibleForCertification,
          blockReason: progressData.blockReason
        });

        const sessionMap = new Map(
          sessionsList.map((session) => [session.id, session])
        );
        const mappedAttendance = attendanceList.map((record) => {
          const session = sessionMap.get(record.sessionId);
          return {
            id: record.id,
            studentId: record.student?.id ?? Number(id),
            level: session?.levelNumber ?? session?.level ?? 1,
            sessionNumber: session?.sessionNumber ?? record.sessionId,
            sessionTitle: session?.title ?? `Session ${record.sessionId}`,
            date: record.date,
            status: record.status
          };
        });
        setAttendanceRecords(mappedAttendance);
      } catch (error) {
        console.error("Failed to load student details", error);
        setStudent(null);
        setTraining(null);
        setAttendanceRecords([]);
        setSessions([]);
        setEnrollments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudent();
  }, [id]);
  
  const attendanceStats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    
    return { total, present, absent, late, excused };
  }, [attendanceRecords]);
  
  const filteredAttendance = useMemo(() => {
    if (filterLevel === 'all') return attendanceRecords;
    return attendanceRecords.filter(r => r.level === filterLevel);
  }, [attendanceRecords, filterLevel]);
  
  const levelOptions = useMemo(() => {
    const numbers = Array.from(
      new Set(
        sessions
          .map((session) => Number(session.levelNumber))
          .filter((n) => Number.isFinite(n))
      )
    ).sort((a: number, b: number) => a - b);
    return numbers.length > 0 ? numbers : [1, 2, 3, 4];
  }, [sessions]);

  const totalLevels = levelOptions.length > 0 ? levelOptions.length : 4;
  const sessionsPerLevel = sessions.length > 0 ? Math.round(sessions.length / totalLevels) : 6;

  const levelProgress = useMemo(() => {
    return levelOptions.map(level => {
      const levelRecords = attendanceRecords.filter(r => r.level === level);
      const completed = levelRecords.length;
      const attended = levelRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const total = sessions.filter((session) => Number(session.levelNumber) === Number(level)).length || 6;
      return {
        level,
        completed,
        total,
        attended,
        isComplete: completed === total,
        isCurrent: student?.currentLevel === level
      };
    });
  }, [attendanceRecords, student, sessions, levelOptions]);
  
  // Training history with detailed stats
  const trainingHistory = useMemo(() => {
    if (!training) return [];
    
    const history = levelOptions.map(level => {
      const levelRecords = attendanceRecords.filter(r => r.level === level);
      const present = levelRecords.filter(r => r.status === 'present').length;
      const late = levelRecords.filter(r => r.status === 'late').length;
      const absent = levelRecords.filter(r => r.status === 'absent').length;
      const excused = levelRecords.filter(r => r.status === 'excused').length;
      const total = sessions.filter((session) => Number(session.levelNumber) === Number(level)).length || 6;
      const completed = levelRecords.length;
      const attendanceRate = completed > 0 ? Math.round(((present + late) / completed) * 100) : 0;
      
      return {
        level,
        trainingName: training.name,
        completed,
        total,
        present,
        late,
        absent,
        excused,
        attendanceRate,
        isComplete: completed === total,
        isCurrent: student?.currentLevel === level,
        startDate: levelRecords.length > 0 ? levelRecords[0].date : null,
        endDate: completed === total && levelRecords.length > 0 ? levelRecords[levelRecords.length - 1].date : null
      };
    });
    
    return history;
  }, [training, attendanceRecords, student, sessions, levelOptions]);
  
  const getStatusBadge = (status: AttendanceStatus) => {
    const config = {
      present: { variant: 'success' as const, icon: 'ri-check-line', label: 'Present' },
      absent: { variant: 'danger' as const, icon: 'ri-close-line', label: 'Absent' },
      late: { variant: 'warning' as const, icon: 'ri-time-line', label: 'Late' },
      excused: { variant: 'info' as const, icon: 'ri-information-line', label: 'Excused' }
    };
    const { variant, icon, label } = config[status];
    return (
      <Badge variant={variant}>
        <i className={`${icon} mr-1`} aria-hidden="true"></i>
        {label}
      </Badge>
    );
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center py-16">
              <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin mb-4" aria-hidden="true"></i>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Chargement...</h2>
              <p className="text-sm text-gray-600">Récupération des données de l'élève</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center py-16">
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
                <i className="ri-user-unfollow-line text-4xl text-gray-400" aria-hidden="true"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
              <p className="text-gray-600 mb-6">The student you're looking for doesn't exist or has been removed.</p>
              <Link to="/students">
                <Button variant="primary">
                  <i className="ri-arrow-left-line mr-2" aria-hidden="true"></i>
                  Back to Students
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                to="/students" 
                className="text-gray-500 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded cursor-pointer"
              >
                Students
              </Link>
            </li>
            <li aria-hidden="true">
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </li>
            <li>
              <span className="text-gray-900 font-medium" aria-current="page">
                {student.firstName} {student.lastName}
              </span>
            </li>
          </ol>
        </nav>
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Profile Card */}
          <Card className="lg:w-80 flex-shrink-0">
            <div className="text-center">
              <div className="w-24 h-24 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full mx-auto mb-4 text-3xl font-bold">
                {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-gray-500 mb-4">Student ID: {student.id}</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {student.eligibleForCertification ? (
                  <Badge variant="success">
                    <i className="ri-award-line mr-1" aria-hidden="true"></i>
                    Eligible for Certification
                  </Badge>
                ) : (
                  <Badge variant="info">
                    <i className="ri-loader-4-line mr-1" aria-hidden="true"></i>
                    In Progress
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3 text-left border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                    <i className="ri-mail-line text-gray-600" aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 truncate">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                    <i className="ri-phone-line text-gray-600" aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{student.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                    <i className="ri-calendar-line text-gray-600" aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Enrolled</p>
                    <p className="text-sm text-gray-900">{formatDate(student.enrollmentDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Stats Cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-teal-100 rounded-xl">
                  <i className="ri-book-open-line text-2xl text-teal-600" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="text-2xl font-bold text-gray-900">Level {student.currentLevel}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-green-100 rounded-xl">
                  <i className="ri-checkbox-circle-line text-2xl text-green-600" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sessions Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{student.completedSessions}/{student.totalSessions}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-amber-100 rounded-xl">
                  <i className="ri-pie-chart-line text-2xl text-amber-600" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{student.attendanceRate}%</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-rose-100 rounded-xl">
                  <i className="ri-close-circle-line text-2xl text-rose-600" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missed Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.absent}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Training Info Banner */}
        {training && (
          <Card className="mb-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl">
                  <i className="ri-graduation-cap-line text-2xl" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Enrolled Training</p>
                  <h3 className="text-lg font-semibold">{training.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalLevels}</p>
                  <p className="text-xs text-gray-300">Levels</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{sessionsPerLevel}</p>
                  <p className="text-xs text-gray-300">Sessions/Level</p>
                </div>
                <Link to="/trainings">
                  <Button variant="outline" size="sm" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
                    View Training
                    <i className="ri-arrow-right-line ml-2" aria-hidden="true"></i>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1" role="tablist" aria-label="Student information tabs">
              {[
                { id: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
                { id: 'attendance', label: 'Attendance History', icon: 'ri-calendar-check-line' },
                { id: 'progress', label: 'Level Progress', icon: 'ri-bar-chart-line' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                >
                  <i className={`${tab.icon} text-lg`} aria-hidden="true"></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="space-y-6">
            {/* Attendance Summary */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-pie-chart-2-line text-teal-600" aria-hidden="true"></i>
                Attendance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-2">
                    <i className="ri-check-line text-xl text-green-600" aria-hidden="true"></i>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
                  <p className="text-sm text-green-600">Present</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-2">
                    <i className="ri-close-line text-xl text-red-600" aria-hidden="true"></i>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
                  <p className="text-sm text-red-600">Absent</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-full mx-auto mb-2">
                    <i className="ri-time-line text-xl text-amber-600" aria-hidden="true"></i>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{attendanceStats.late}</p>
                  <p className="text-sm text-amber-600">Late</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-xl text-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-full mx-auto mb-2">
                    <i className="ri-information-line text-xl text-teal-600" aria-hidden="true"></i>
                  </div>
                  <p className="text-2xl font-bold text-teal-700">{attendanceStats.excused}</p>
                  <p className="text-sm text-teal-600">Excused</p>
                </div>
              </div>
            </Card>

            {/* Enrollment History */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-clipboard-line text-teal-600" aria-hidden="true"></i>
                Historique des formations
              </h2>
              {enrollments.length > 0 ? (
                <div className="space-y-3">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-500">Formation</p>
                          <p className="text-base font-semibold text-gray-900">
                            {enrollment.training?.name || 'Formation'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Debut: {enrollment.startDate ? formatDate(enrollment.startDate) : '-'}
                          </span>
                          <span>
                            Fin: {enrollment.endDate ? formatDate(enrollment.endDate) : '-'}
                          </span>
                        </div>
                        <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'info'}>
                          {enrollment.status || 'ACTIVE'}
                        </Badge>
                      </div>
                      {enrollment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{enrollment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">Aucune formation n'est enregistree pour cet eleve.</div>
              )}
            </Card>
            
            {/* Training History */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-history-line text-teal-600" aria-hidden="true"></i>
                Training History by Level
              </h2>
              <div className="space-y-4">
                {trainingHistory.map((item) => (
                  <div 
                    key={item.level}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      item.isComplete 
                        ? 'bg-green-50 border-green-200' 
                        : item.isCurrent 
                          ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
                          : item.completed > 0
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Level Badge */}
                      <div className={`w-16 h-16 flex items-center justify-center rounded-xl text-2xl font-bold flex-shrink-0 ${
                        item.isComplete 
                          ? 'bg-green-100 text-green-700' 
                          : item.isCurrent 
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isComplete ? (
                          <i className="ri-check-double-line" aria-hidden="true"></i>
                        ) : (
                          item.level
                        )}
                      </div>
                      
                      {/* Level Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Level {item.level}
                          </h3>
                          {item.isCurrent && (
                            <Badge variant="info">
                              <i className="ri-focus-line mr-1" aria-hidden="true"></i>
                              Current
                            </Badge>
                          )}
                          {item.isComplete && (
                            <Badge variant="success">
                              <i className="ri-checkbox-circle-line mr-1" aria-hidden="true"></i>
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {item.trainingName}
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              {item.completed} / {item.total} sessions
                            </span>
                            <span className="text-xs font-semibold text-gray-900">
                              {Math.round((item.completed / item.total) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                item.isComplete 
                                  ? 'bg-green-500' 
                                  : item.isCurrent 
                                    ? 'bg-teal-500'
                                    : 'bg-gray-400'
                              }`}
                              style={{ width: `${(item.completed / item.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Dates */}
                        {item.startDate && (
                          <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <i className="ri-calendar-line" aria-hidden="true"></i>
                              Started: {formatDate(item.startDate)}
                            </span>
                            {item.endDate && (
                              <span className="flex items-center gap-1">
                                <i className="ri-calendar-check-line" aria-hidden="true"></i>
                                Completed: {formatDate(item.endDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Stats Grid */}
                      {item.completed > 0 && (
                        <div className="grid grid-cols-4 gap-3 lg:w-80 flex-shrink-0">
                          <div className="text-center p-2 bg-white rounded-lg border border-green-200">
                            <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-1">
                              <i className="ri-check-line text-xs text-green-600" aria-hidden="true"></i>
                            </div>
                            <p className="text-lg font-bold text-green-700">{item.present}</p>
                            <p className="text-xs text-gray-600">Present</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-amber-200">
                            <div className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full mx-auto mb-1">
                              <i className="ri-time-line text-xs text-amber-600" aria-hidden="true"></i>
                            </div>
                            <p className="text-lg font-bold text-amber-700">{item.late}</p>
                            <p className="text-xs text-gray-600">Late</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-red-200">
                            <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-1">
                              <i className="ri-close-line text-xs text-red-600" aria-hidden="true"></i>
                            </div>
                            <p className="text-lg font-bold text-red-700">{item.absent}</p>
                            <p className="text-xs text-gray-600">Absent</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-teal-200">
                            <div className="w-6 h-6 flex items-center justify-center bg-teal-100 rounded-full mx-auto mb-1">
                              <i className="ri-information-line text-xs text-teal-600" aria-hidden="true"></i>
                            </div>
                            <p className="text-lg font-bold text-teal-700">{item.excused}</p>
                            <p className="text-xs text-gray-600">Excused</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Attendance Rate Badge */}
                    {item.completed > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Attendance Rate for this Level:</span>
                          <Badge variant={item.attendanceRate >= 80 ? 'success' : item.attendanceRate >= 60 ? 'warning' : 'danger'}>
                            <i className="ri-bar-chart-line mr-1" aria-hidden="true"></i>
                            {item.attendanceRate}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Overall Training Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Overall Training Progress</h3>
                    <p className="text-sm text-gray-300">
                      {training?.name} • {student?.completedSessions} / {student?.totalSessions} sessions
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{student?.attendanceRate}%</p>
                      <p className="text-xs text-gray-300">Global Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{levelProgress.filter(l => l.isComplete).length}/{totalLevels}</p>
                      <p className="text-xs text-gray-300">Levels Done</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-time-line text-teal-600" aria-hidden="true"></i>
                Recent Sessions
              </h2>
              <div className="space-y-3">
                {attendanceRecords.slice(-5).reverse().map((record) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">L{record.level}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{record.sessionTitle}</p>
                        <p className="text-sm text-gray-500">
                          Level {record.level}, Session {record.sessionNumber} • {formatDate(record.date)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(record.status as AttendanceStatus)}
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Certification Status */}
            <Card className={student.eligibleForCertification ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${
                  student.eligibleForCertification ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  <i className={`text-3xl ${
                    student.eligibleForCertification 
                      ? 'ri-award-fill text-green-600' 
                      : 'ri-hourglass-line text-amber-600'
                  }`} aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    student.eligibleForCertification ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {student.eligibleForCertification 
                      ? 'Ready for Certification!' 
                      : 'Certification In Progress'}
                  </h3>
                  <p className={`text-sm ${
                    student.eligibleForCertification ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {student.eligibleForCertification 
                      ? 'This student has completed all required sessions and is eligible to receive their certificate.'
                      : (student.blockReason && student.blockReason.trim() !== ''
                        ? student.blockReason
                        : `${student.totalSessions - student.completedSessions} sessions remaining to complete the training program.`)}
                  </p>
                </div>
                {student.eligibleForCertification && (
                  <Link to="/certification">
                    <Button variant="success">
                      <i className="ri-file-download-line mr-2" aria-hidden="true"></i>
                      View Certificate
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'attendance' && (
          <div id="attendance-panel" role="tabpanel" aria-labelledby="attendance-tab">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-calendar-check-line text-teal-600" aria-hidden="true"></i>
                  Attendance History
                </h2>
                <div className="flex items-center gap-2">
                  <label htmlFor="filter-level" className="text-sm text-gray-600">Filter by Level:</label>
                  <select
                    id="filter-level"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full" role="table" aria-label="Attendance history">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Level</th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Topic</th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(record.date)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold">
                            {record.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">Session {record.sessionNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.sessionTitle}</td>
                        <td className="px-4 py-3">{getStatusBadge(record.status as AttendanceStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredAttendance.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-teal-100 text-teal-700 rounded-lg text-sm font-bold">
                          L{record.level}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">Session {record.sessionNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                        </div>
                      </div>
                      {getStatusBadge(record.status as AttendanceStatus)}
                    </div>
                    <p className="text-sm text-gray-700">{record.sessionTitle}</p>
                  </div>
                ))}
              </div>
              
              {filteredAttendance.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-calendar-line text-5xl text-gray-300 mb-4" aria-hidden="true"></i>
                  <p className="text-gray-600">No attendance records found for this filter.</p>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div id="progress-panel" role="tabpanel" aria-labelledby="progress-tab" className="space-y-6">
            {/* Overall Progress */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-bar-chart-line text-teal-600" aria-hidden="true"></i>
                Overall Progress
              </h2>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Training Completion</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round((student.completedSessions / student.totalSessions) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(student.completedSessions / student.totalSessions) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={(student.completedSessions / student.totalSessions) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Overall progress: ${student.completedSessions} of ${student.totalSessions} sessions completed`}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {student.completedSessions} of {student.totalSessions} sessions completed
              </p>
            </Card>
            
            {/* Level by Level Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levelProgress.map((level) => (
                <Card 
                  key={level.level} 
                  className={`relative overflow-hidden ${
                    level.isCurrent ? 'ring-2 ring-teal-500' : ''
                  } ${level.isComplete ? 'bg-green-50/50' : ''}`}
                >
                  {level.isCurrent && (
                    <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                      Current
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 flex items-center justify-center rounded-xl text-xl font-bold ${
                      level.isComplete 
                        ? 'bg-green-100 text-green-700' 
                        : level.isCurrent 
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {level.isComplete ? (
                        <i className="ri-check-line text-2xl" aria-hidden="true"></i>
                      ) : (
                        level.level
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Level {level.level}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {level.completed} of {level.total} sessions
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            level.isComplete 
                              ? 'bg-green-500' 
                              : level.isCurrent 
                                ? 'bg-teal-500'
                                : 'bg-gray-400'
                          }`}
                          style={{ width: `${(level.completed / level.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={(level.completed / level.total) * 100}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        ></div>
                      </div>
                      {level.isComplete && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <i className="ri-check-double-line" aria-hidden="true"></i>
                          Level completed
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/students')}
            icon={<i className="ri-arrow-left-line text-xl" aria-hidden="true"></i>}
          >
            Back to Students
          </Button>
          <Link to="/attendance">
            <Button 
              variant="primary"
              icon={<i className="ri-checkbox-line text-xl" aria-hidden="true"></i>}
            >
              Mark Attendance
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

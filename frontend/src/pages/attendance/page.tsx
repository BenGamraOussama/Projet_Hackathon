
import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';
import { attendanceService } from '../../services/attendance.service';
import { sessionService } from '../../services/session.service';
import { authService } from '../../services/auth.service';
import { useAnnouncer } from '../../components/a11y/Announcer';

type PresenceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

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

export default function Presence() {
  const [selectedTraining, setSelectedTraining] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [attendance, setAttendance] = useState<Record<number, PresenceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [levels, setLevels] = useState<number[]>([1, 2, 3, 4]);
  const [quickMode, setQuickMode] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedData, setSavedData] = useState<{
    sessionTitle: string;
    date: string;
    totalEleves: number;
    present: number;
    absent: number;
    late: number;
  } | null>(null);
  const successDialogRef = useRef<HTMLDivElement>(null);
  const successCloseButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const userRole = authService.getUserRole();
  const canMarkExcused = userRole === 'ADMIN' || userRole === 'RESPONSABLE';
  const { announce } = useAnnouncer();

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
        const normalizedStudents = (studentsData || []).map((student: any) => ({
          ...student,
          trainingId: student.training?.id || student.trainingId || null
        }));
        setTrainings(trainingsData || []);
        setStudents(normalizedStudents);
        if (trainingsData?.length) {
          setSelectedTraining(trainingsData[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des donnes de prsence', error);
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
          const levelDiff = (a.levelNumber || 0) - (b.levelNumber || 0);
          if (levelDiff !== 0) return levelDiff;
          return (a.sessionNumber || 0) - (b.sessionNumber || 0);
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
        console.error('Erreur lors du chargement des sances', error);
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
    const loadSessionPresence = async () => {
      if (!selectedSession) {
        setAttendance({});
        return;
      }
      try {
        const records = await attendanceService.getBySession(selectedSession);
        const mapped: Record<number, PresenceStatus> = {};
        (records || []).forEach((record: any) => {
          const studentId = record.student?.id || record.studentId;
          if (studentId != null) {
            mapped[Number(studentId)] = record.status;
          }
        });
        setAttendance(mapped);
      } catch (error) {
        console.error('Erreur lors du chargement des prsences', error);
        setAttendance({});
      }
    };

    loadSessionPresence();
  }, [selectedSession]);

  const session = sessions.find((s) => s.id === selectedSession);
  const sessionDateValue = session?.startAt || session?.date;
  const sessionDate = sessionDateValue ? new Date(sessionDateValue).toISOString().split('T')[0] : '';
  const sessionDurationMinutes = session?.durationMin ?? session?.duration ?? 0;
  const enrolledStudents = students.filter((s) => s.trainingId === selectedTraining);

  const statusLabels: Record<Exclude<PresenceStatus, null>, string> = {
    present: 'Prsent',
    absent: 'Absent',
    late: 'En retard',
    excused: 'Excus'
  };

  const getStatusLabel = (status: PresenceStatus) => {
    if (!status) return 'Non marqu';
    return statusLabels[status];
  };

  const handleRowKeyDown = (event: React.KeyboardEvent, student: any) => {
    if (event.currentTarget !== event.target) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (!['p', 'a', 'l', 'e'].includes(key)) return;
    event.preventDefault();
    if (key === 'p') {
      handlePresence(student, 'present');
    } else if (key === 'a') {
      handlePresence(student, 'absent');
    } else if (key === 'l') {
      handlePresence(student, 'late');
    } else if (key === 'e') {
      if (canMarkExcused) {
        handlePresence(student, 'excused');
      } else {
        setLiveMessage('Le statut  excus  nest pas disponible pour votre rle.');
      }
    }
  };

  const handlePresence = (student: any, status: PresenceStatus) => {
    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'lve';
    setSaveError('');
    setAttendance((prev) => {
      const nextStatus = prev[student.id] === status ? null : status;
      const label = nextStatus ? statusLabels[nextStatus].toLowerCase() : 'non marqu';
      setLiveMessage(nextStatus ? `Prsence: ${name} marqu  ${label} . ` : `Prsence efface pour ${name}.`);
      return {
        ...prev,
        [student.id]: nextStatus
      };
    });
  };

  const getPresenceCount = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0
    };

    enrolledStudents.forEach((student) => {
      const status = attendance[student.id];
      if (status) {
        counts[status] += 1;
      } else {
        counts.unmarked += 1;
      }
    });

    return counts;
  };

  const counts = getPresenceCount();

  const handleSavePresence = async () => {
    const markedCount = Object.values(attendance).filter((status) => status !== null).length;

    if (markedCount === 0) {
      setSaveError('Veuillez marquer au moins un lve avant denregistrer.');
      setLiveMessage('chec de lenregistrement. Veuillez marquer au moins un lve.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    const summary = getPresenceCount();
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
      const refreshedMap: Record<number, PresenceStatus> = {};
      (refreshed || []).forEach((record: any) => {
        const studentId = record.student?.id || record.studentId;
        if (studentId != null) {
          refreshedMap[Number(studentId)] = record.status;
        }
      });
      setAttendance(refreshedMap);
      const summaryMessage = `Prsences enregistres. ${summary.present} prsent, ${summary.absent} absent${summary.late ? `, ${summary.late} en retard` : ''}${summary.excused ? `, ${summary.excused} excus` : ''}.`;
      setLiveMessage(summaryMessage);
      announce(summaryMessage);
    } catch (error) {
      console.error('Erreur lors de lenregistrement des prsences', error);
      setSaveError('Erreur lors de lenregistrement. Veuillez ressayer.');
      setLiveMessage('chec de lenregistrement. Veuillez ressayer.');
    }

    setSavedData({
      sessionTitle: session?.title || '',
      date: sessionDate || '',
      totalEleves: enrolledStudents.length,
      present: summary.present,
      absent: summary.absent,
      late: summary.late
    });

    setIsSaving(false);
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    setShowSuccess(true);
  };

  const handleReset = () => {
    setAttendance({});
    setSaveError('');
    setLiveMessage('Prsences rinitialises.');
  };

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setSavedData(null);
    setAttendance({});
    const activeElement = lastActiveElementRef.current;
    if (activeElement) {
      activeElement.focus();
    }
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const dialog = successDialogRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseSuccess();
        return;
      }
      if (event.key !== 'Tab') return;

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    if (successCloseButtonRef.current) {
      successCloseButtonRef.current.focus();
    } else {
      first?.focus();
    }

    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [showSuccess, handleCloseSuccess]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Gestion des prsences</h1>
          <p className="text-base text-gray-600">Marquez la prsence des lves pour chaque sance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations sance</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="training-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Formation
                </label>
                <select
                  id="training-select"
                  value={selectedTraining}
                  onChange={(e) => setSelectedTraining(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {trainings.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau
                </label>
                <select
                  id="level-select"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>Niveau {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="session-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Sance
                </label>
                <select
                  id="session-select"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {sessions
                    .filter((s) => Number(s.levelNumber) === Number(selectedLevel))
                    .map((s) => (
                      <option key={s.id} value={s.id}>Sance {s.sessionNumber}</option>
                    ))}
                </select>
              </div>

              {session && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">{session.title}</p>
                  <p className="text-xs text-gray-600">{sessionDateValue ? new Date(sessionDateValue).toLocaleDateString() : ''}</p>
                  <p className="text-xs text-gray-600">{sessionDurationMinutes} minutes</p>
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
                  <p className="text-sm text-gray-600">Prsent</p>
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
                  <p className="text-sm text-gray-600">En retard</p>
                </div>
              </Card>

              <Card padding="sm" className="bg-gray-50 border-gray-200">
                <div className="text-center">
                  <i className="ri-question-line text-3xl text-gray-600 mb-2" aria-hidden="true"></i>
                  <p className="text-2xl font-bold text-gray-900">{counts.unmarked}</p>
                  <p className="text-sm text-gray-600">Non marqu</p>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Marquer les prsences</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{enrolledStudents.length} lves inscrits</span>
                  <button
                    onClick={() => setQuickMode(!quickMode)}
                    aria-pressed={quickMode}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {quickMode ? 'Mode liste' : 'Mode rapide'}
                  </button>
                </div>
              </div>

              {quickMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="attendance-quick-grid" role="table" aria-label="Liste des prsences">
                  {enrolledStudents.map((student) => {
                    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'lve';
                    const nameId = `attendance-student-${student.id}-name`;
                    const statusId = `attendance-student-${student.id}-status`;
                    const shortcutsId = `attendance-student-${student.id}-shortcuts`;
                    const currentStatus = getStatusLabel(attendance[student.id]);
                    return (
                      <div
                        key={student.id}
                        className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        role="row"
                        tabIndex={0}
                        aria-labelledby={nameId}
                        aria-describedby={`${statusId} ${shortcutsId}`}
                        aria-keyshortcuts={canMarkExcused ? 'P A L E' : 'P A L'}
                        onKeyDown={(event) => handleRowKeyDown(event, student)}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold text-lg">
                            {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p id={nameId} className="font-semibold text-gray-900" data-announcer-label>
                              {name}
                            </p>
                            <p className="text-sm text-gray-600">Niveau {student.currentLevel}</p>
                            <p id={statusId} className="text-xs text-gray-500">Statut actuel : {currentStatus}</p>
                            <p id={shortcutsId} className="sr-only">
                              Raccourcis : P prsent, A absent, L en retard{canMarkExcused ? ', E excus' : ''}.
                            </p>
                          </div>
                        </div>
                        <div
                          className="grid grid-cols-2 gap-3"
                          role="row"
                          aria-labelledby={nameId}
                          aria-describedby={statusId}
                        >
                          <span className="sr-only" role="cell">lve {name}</span>
                          <span className="sr-only" role="cell">Prsent</span>
                          <button
                            type="button"
                            onClick={() => handlePresence(student, 'present')}
                            className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer ${
                              attendance[student.id] === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                            aria-pressed={attendance[student.id] === 'present'}
                            aria-label={`Marquer ${name} prsent`}
                            data-colheader="Prsent"
                          >
                            Prsent
                          </button>
                          <span className="sr-only" role="cell">Absent</span>
                          <button
                            type="button"
                            onClick={() => handlePresence(student, 'absent')}
                            className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                              attendance[student.id] === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                            aria-pressed={attendance[student.id] === 'absent'}
                            aria-label={`Marquer ${name} absent`}
                            data-colheader="Absent"
                          >
                            Absent
                          </button>
                          <span className="sr-only" role="cell">En retard</span>
                          <button
                            type="button"
                            onClick={() => handlePresence(student, 'late')}
                            className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                              attendance[student.id] === 'late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                            aria-pressed={attendance[student.id] === 'late'}
                            aria-label={`Marquer ${name} en retard`}
                            data-colheader="En retard"
                          >
                            En retard
                          </button>
                          {canMarkExcused ? (
                            <>
                              <span className="sr-only" role="cell">Excus</span>
                              <button
                                type="button"
                                onClick={() => handlePresence(student, 'excused')}
                                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                                  attendance[student.id] === 'excused'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                                aria-pressed={attendance[student.id] === 'excused'}
                                aria-label={`Marquer ${name} excus`}
                                data-colheader="Excus"
                              >
                                Excus
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-3 rounded-lg bg-gray-50 text-gray-400 text-sm flex items-center justify-center">
                              N/A
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3" role="table" aria-label="Liste des prsences">
                  {enrolledStudents.map((student) => {
                    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'lve';
                    const nameId = `attendance-student-${student.id}-name`;
                    const statusId = `attendance-student-${student.id}-status`;
                    const currentStatus = getStatusLabel(attendance[student.id]);
                    const rowDescId = `attendance-student-${student.id}-row`;
                    const shortcutsId = `attendance-student-${student.id}-shortcuts`;
                    return (
                      <div
                        key={student.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        role="row"
                        aria-labelledby={rowDescId}
                        aria-describedby={shortcutsId}
                        aria-keyshortcuts={canMarkExcused ? 'P A L E' : 'P A L'}
                        tabIndex={0}
                        onKeyDown={(event) => handleRowKeyDown(event, student)}
                      >
                        <span id={rowDescId} className="sr-only">lve {name}</span>
                        <span id={shortcutsId} className="sr-only">
                          Raccourcis : P prsent, A absent, L en retard{canMarkExcused ? ', E excus' : ''}.
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold">
                              {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                            </div>
                            <div>
                              <p id={nameId} className="font-medium text-gray-900" data-announcer-label>
                                {name}
                              </p>
                              <p className="text-sm text-gray-600">Niveau {student.currentLevel}</p>
                              <p id={statusId} className="text-xs text-gray-500">Statut actuel : {currentStatus}</p>
                            </div>
                          </div>

                          <div className="flex gap-2" role="row" aria-labelledby={nameId} aria-describedby={statusId}>
                            <span className="sr-only" role="cell">lve {name}</span>
                            <span className="sr-only" role="cell">Prsent</span>
                            <button
                              type="button"
                              onClick={() => handlePresence(student, 'present')}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer whitespace-nowrap ${
                                attendance[student.id] === 'present'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-600'
                              }`}
                              aria-pressed={attendance[student.id] === 'present'}
                              aria-label={`Marquer ${name} prsent`}
                              data-colheader="Prsent"
                            >
                              <i className="ri-checkbox-circle-line mr-1" aria-hidden="true"></i>
                              Prsent
                            </button>

                            <span className="sr-only" role="cell">Absent</span>
                            <button
                              type="button"
                              onClick={() => handlePresence(student, 'absent')}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer whitespace-nowrap ${
                                attendance[student.id] === 'absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-600'
                              }`}
                              aria-pressed={attendance[student.id] === 'absent'}
                              aria-label={`Marquer ${name} absent`}
                              data-colheader="Absent"
                            >
                              <i className="ri-close-circle-line mr-1" aria-hidden="true"></i>
                              Absent
                            </button>

                            <span className="sr-only" role="cell">En retard</span>
                            <button
                              type="button"
                              onClick={() => handlePresence(student, 'late')}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer whitespace-nowrap ${
                                attendance[student.id] === 'late'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-600'
                              }`}
                              aria-pressed={attendance[student.id] === 'late'}
                              aria-label={`Marquer ${name} en retard`}
                              data-colheader="En retard"
                            >
                              <i className="ri-time-line mr-1" aria-hidden="true"></i>
                              En retard
                            </button>

                            {canMarkExcused && (
                              <>
                                <span className="sr-only" role="cell">Excus</span>
                                <button
                                  type="button"
                                  onClick={() => handlePresence(student, 'excused')}
                                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer whitespace-nowrap ${
                                    attendance[student.id] === 'excused'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-600'
                                  }`}
                                  aria-pressed={attendance[student.id] === 'excused'}
                                  aria-label={`Marquer ${name} excus`}
                                  data-colheader="Excus"
                                >
                                  <i className="ri-information-line mr-1" aria-hidden="true"></i>
                                  Excus
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSavePresence}
                  disabled={isSaving || counts.unmarked === enrolledStudents.length}
                  aria-describedby={counts.unmarked === enrolledStudents.length ? 'attendance-warning' : saveError ? 'attendance-save-error' : undefined}
                >
                  {isSaving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line" aria-hidden="true"></i>
                      Enregistrer les prsences
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
                  Rinitialiser
                </Button>
              </div>

              {counts.unmarked === enrolledStudents.length && (
                <p id="attendance-warning" role="alert" className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                  <i className="ri-information-line" aria-hidden="true"></i>
                  Veuillez marquer la prsence dau moins un lve avant denregistrer.
                </p>
              )}

              {saveError && counts.unmarked !== enrolledStudents.length && (
                <p id="attendance-save-error" role="alert" className="mt-3 text-sm text-red-600 flex items-center gap-2">
                  <i className="ri-error-warning-line" aria-hidden="true"></i>
                  {saveError}
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>

      {showSuccess && savedData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div
            ref={successDialogRef}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-4xl text-green-600" aria-hidden="true"></i>
              </div>
              <h3 id="success-title" className="text-xl font-bold text-gray-900 mb-2">
                Prsences enregistres avec succs !
              </h3>
              <p className="text-gray-600">
                Les prsences ont t sauvegardes.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Rsum</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sance :</span>
                  <span className="font-medium text-gray-900">{savedData.sessionTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date :</span>
                  <span className="font-medium text-gray-900">
                    {new Date(savedData.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total lves :</span>
                  <span className="font-medium text-gray-900">{savedData.totalEleves}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600 flex items-center gap-1">
                      <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
                      Prsent
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
                      En retard
                    </span>
                    <span className="font-medium text-gray-900">{savedData.late}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                ref={successCloseButtonRef}
                variant="primary"
                fullWidth
                onClick={handleCloseSuccess}
              >
                <i className="ri-check-line" aria-hidden="true"></i>
                Terminer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

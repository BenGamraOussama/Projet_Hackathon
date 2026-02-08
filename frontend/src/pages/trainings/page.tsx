
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { authService } from '../../services/auth.service';
import { trainingService } from '../../services/training.service';
import { levelService } from '../../services/level.service';
import { sessionService } from '../../services/session.service';
import { studentService } from '../../services/student.service';
import { attendanceService } from '../../services/attendance.service';
import { auditService } from '../../services/audit.service';
import { useAnnouncer } from '../../components/a11y/Announcer';

const LEVELS_COUNT = 4;
const SESSIONS_PER_LEVEL = 6;
const DEFAULT_TOTAL_SESSIONS = LEVELS_COUNT * SESSIONS_PER_LEVEL;

type PresenceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

type PresenceOption = {
  value: Exclude<PresenceStatus, null>;
  label: string;
  color: string;
};

type SessionDraft = {
  title: string;
  description: string;
};

type LevelDraft = {
  title: string;
  description: string;
  sessions: SessionDraft[];
};

const attendanceOptions: PresenceOption[] = [
  { value: 'present', label: 'Présent', color: 'text-emerald-700' },
  { value: 'late', label: 'Retard', color: 'text-amber-700' },
  { value: 'excused', label: 'Excusé', color: 'text-blue-700' },
  { value: 'absent', label: 'Absent', color: 'text-rose-700' }
];

const getTrainingId = (item: any) => item?.training?.id || item?.trainingId || null;

const formatDate = (value?: string | null) => {
  if (!value) return 'À planifier';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'À planifier';
  return parsed.toLocaleDateString('fr-FR');
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'À planifier';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'À planifier';
  return parsed.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const buildDefaultStructure = () =>
  Array.from({ length: LEVELS_COUNT }, (_, levelIndex) => ({
    title: `Niveau ${levelIndex + 1}`,
    description: '',
    sessions: Array.from({ length: SESSIONS_PER_LEVEL }, (_, sessionIndex) => ({
      title: `Séance ${sessionIndex + 1}`,
      description: ''
    }))
  }));

export default function Trainings() {
  const navigate = useNavigate();
  const { announce } = useAnnouncer();
  const userRole = authService.getUserRole();
  const isAdmin = userRole === 'ADMIN';
  const isResponsable = userRole === 'RESPONSABLE' || isAdmin;
  const isFormateur = userRole === 'FORMATEUR' || isAdmin;

  const [trainings, setTrainings] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setPresenceRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [simplifyMode, setSimplifyMode] = useState(false);

  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [advancedCreation, setAdvancedCreation] = useState(false);
  const [structureDraft, setStructureDraft] = useState<LevelDraft[]>(buildDefaultStructure());

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiConstraints, setAiConstraints] = useState('');
  const [aiLanguage, setAiLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [aiDraft, setAiDraft] = useState('');
  const [aiStructure, setAiStructure] = useState<LevelDraft[]>(buildDefaultStructure());
  const [showAiJson, setShowAiJson] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiNotice, setAiNotice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAppliquering, setAiAppliquering] = useState(false);

  const [trainingSearch, setTrainingSearch] = useState('');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  const [studentSearch, setStudentSearch] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible' | 'in-progress'>('all');
  const [attendanceMin, setPresenceMin] = useState(0);
  const [attendanceMax, setPresenceMax] = useState(100);
  const [levelsMin, setLevelsMin] = useState(0);

  const [historyQuery, setHistoryQuery] = useState('');
  const [historyStatus, setHistoryStatus] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');

  const [assignQuery, setAssignQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  const [attendanceDraft, setAttendanceDraft] = useState<Record<number, PresenceStatus>>({});
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const buildSampleStructure = (topic: string): LevelDraft[] => {
    const safeTopic = topic?.trim() || 'Innovation éducative et projets technologiques';
    const levelThemes = [
      'Fondations & outils',
      'Projets guidés',
      'Innovation & collaboration',
      'Capstone & certification'
    ];
    const sessionTemplates = [
      { title: 'Découverte & objectifs', desc: 'Comprendre les enjeux, définir les objectifs et les critères de réussite.' },
      { title: 'Prise en main des outils', desc: 'Installer et configurer l’environnement, premiers exercices pratiques.' },
      { title: 'Projet technique 1', desc: 'Réaliser un mini-projet appliqué avec livrables clairs.' },
      { title: 'Projet technique 2', desc: 'Approfondir le projet et intégrer des améliorations innovantes.' },
      { title: 'Évaluation & feedback', desc: 'Auto-évaluation, feedback pair-à-pair, ajustements.' },
      { title: 'Synthèse & préparation suite', desc: 'Consolider les acquis et préparer le niveau suivant.' }
    ];

    return Array.from({ length: LEVELS_COUNT }, (_, levelIndex) => ({
      title: `Niveau ${levelIndex + 1} — ${levelThemes[levelIndex]}`,
      description: `Niveau ${levelIndex + 1} centré sur ${safeTopic.toLowerCase()}. Focus: ${levelThemes[levelIndex].toLowerCase()}.`,
      sessions: sessionTemplates.map((session, sessionIndex) => ({
        title: `Séance ${sessionIndex + 1} — ${session.title}`,
        description: session.desc
      }))
    }));
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [trainingsData, levelsData, sessionsData, studentsData, attendanceData] = await Promise.all([
        trainingService.getAll(),
        levelService.getAll(),
        sessionService.getAll(),
        studentService.getAll(),
        attendanceService.getAll()
      ]);
      setTrainings(trainingsData || []);
      setLevels(levelsData || []);
      setSessions(sessionsData || []);
      const normalizedStudents = (studentsData || []).map((student: any) => ({
        ...student,
        trainingId: getTrainingId(student)
      }));
      setStudents(normalizedStudents);
      setPresenceRecords(attendanceData || []);

      if (isAdmin) {
        const logs = await auditService.getAll();
        setAuditLogs(logs || []);
      }

      if (!selectedTrainingId && trainingsData?.length) {
        setSelectedTrainingId(trainingsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load training data', error);
      setErrorMessage('Impossible de charger les données. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('simplify-ui', simplifyMode);
    return () => {
      root.classList.remove('simplify-ui');
    };
  }, [simplifyMode]);
  const selectedTraining = useMemo(
    () => trainings.find((t) => t.id === selectedTrainingId) || null,
    [trainings, selectedTrainingId]
  );

  const trainingSessions = useMemo(() => {
    if (!selectedTrainingId) return [];
    return sessions
      .filter((session) => getTrainingId(session) === selectedTrainingId)
      .sort((a, b) => {
        const levelDiff = (a.levelNumber || 0) - (b.levelNumber || 0);
        if (levelDiff !== 0) return levelDiff;
        return (a.sessionNumber || 0) - (b.sessionNumber || 0);
      });
  }, [sessions, selectedTrainingId]);

  const trainingLevels = useMemo(() => {
    if (!selectedTrainingId) return [];
    const filtered = levels.filter((level) => getTrainingId(level) === selectedTrainingId);
    if (filtered.length > 0) return filtered;
    return Array.from({ length: LEVELS_COUNT }, (_, idx) => ({
      id: `placeholder-${idx + 1}`,
      levelNumber: idx + 1,
      title: `Niveau ${idx + 1}`
    }));
  }, [levels, selectedTrainingId]);

  useEffect(() => {
    if (trainingSessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }
    if (!selectedSessionId) {
      setSelectedSessionId(trainingSessions[0].id);
    }
  }, [trainingSessions, selectedSessionId]);

  useEffect(() => {
    const loadPresenceForSession = async () => {
      if (!selectedSessionId) {
        setAttendanceDraft({});
        return;
      }
      try {
        const records = await attendanceService.getBySession(selectedSessionId);
        const mapped: Record<number, PresenceStatus> = {};
        (records || []).forEach((record: any) => {
          const studentId = record.student?.id || record.studentId;
          if (studentId != null) mapped[Number(studentId)] = record.status;
        });
        setAttendanceDraft(mapped);
      } catch (error) {
        console.error('Failed to load session attendance', error);
        setAttendanceDraft({});
      }
    };
    loadPresenceForSession();
  }, [selectedSessionId]);

  const attendanceMap = useMemo(() => {
    const map = new Map<number, any[]>();
    (attendanceRecords || []).forEach((record: any) => {
      const studentId = record.student?.id || record.studentId;
      if (studentId == null) return;
      const existing = map.get(Number(studentId)) || [];
      existing.push(record);
      map.set(Number(studentId), existing);
    });
    return map;
  }, [attendanceRecords]);

  const studentsInTraining = useMemo(() => {
    if (!selectedTrainingId) return [];
    return students.filter((student) => student.trainingId === selectedTrainingId);
  }, [students, selectedTrainingId]);

  const filteredTrainings = useMemo(() => {
    const query = trainingSearch.trim().toLowerCase();
    return trainings.filter((training) => {
      const matchesQuery = !query || (training.name || '').toLowerCase().includes(query);
      const status = training.status || 'upcoming';
      const matchesStatus = trainingStatusFilter === 'all' || status === trainingStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [trainings, trainingSearch, trainingStatusFilter]);

  const filteredStudentsInTraining = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return studentsInTraining.filter((student) => {
      const stats = getPresenceStats(student.id, student.trainingId);
      const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const email = (student.email || '').toLowerCase();
      const matchesQuery = !query || name.includes(query) || email.includes(query);
      const matchesEligibility =
        eligibilityFilter === 'all'
          || (eligibilityFilter === 'eligible' && stats.eligible)
          || (eligibilityFilter === 'in-progress' && !stats.eligible);
      const matchesRate = stats.rate >= attendanceMin && stats.rate <= attendanceMax;
      const matchesLevel = stats.levelsValidated >= levelsMin;
      return matchesQuery && matchesEligibility && matchesRate && matchesLevel;
    });
  }, [
    studentsInTraining,
    studentSearch,
    eligibilityFilter,
    attendanceMin,
    attendanceMax,
    levelsMin
  ]);

  const filteredHistoryRecords = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return (attendanceRecords || []).filter((record: any) => {
      const student = record.student || students.find((s) => Number(s.id) === Number(record.studentId));
      const name = `${student?.firstName || ''} ${student?.lastName || ''}`.toLowerCase();
      const email = (student?.email || '').toLowerCase();
      const matchesQuery = !query || name.includes(query) || email.includes(query);
      const matchesStatus = historyStatus === 'all' || record.status === historyStatus;
      return matchesQuery && matchesStatus;
    });
  }, [attendanceRecords, historyQuery, historyStatus, students]);

  const getPresenceStats = (studentId: number, trainingId?: number | null) => {
    const records = attendanceMap.get(Number(studentId)) || [];
    const totalMarked = records.length;
    const presentCount = records.filter((record) => ['present', 'late', 'excused'].includes(record.status)).length;
    const rate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;
    const totalSessions = trainingId
      ? sessions.filter((session) => getTrainingId(session) === trainingId).length || DEFAULT_TOTAL_SESSIONS
      : DEFAULT_TOTAL_SESSIONS;
    const completed = presentCount;
    const levelsValidated = Math.min(LEVELS_COUNT, Math.floor(completed / SESSIONS_PER_LEVEL));
    const remainingSessions = Math.max(0, totalSessions - completed);
    const eligible = completed >= totalSessions && rate >= 80;
    return { totalSessions, completed, rate, levelsValidated, remainingSessions, eligible };
  };

  const buildPlanFromStructure = (structure: LevelDraft[]) => ({
    levels: structure.map((level, levelIndex) => ({
      levelNumber: levelIndex + 1,
      title: level.title.trim(),
      description: level.description.trim(),
      sessions: level.sessions.map((session, sessionIndex) => ({
        sessionIndex: sessionIndex + 1,
        title: session.title.trim(),
        description: session.description.trim(),
        objective: session.description.trim(),
        durationMin: 120,
        status: 'PLANNED'
      }))
    }))
  });

  const normalizeAiStructure = (payload: any): LevelDraft[] | null => {
    if (!payload) return null;
    let source: any = payload;
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch {
        return null;
      }
    }
    if (typeof source?.draftText === 'string') {
      try {
        source = JSON.parse(source.draftText);
      } catch {
        // keep original
      }
    }
    if (typeof source?.text === 'string') {
      try {
        source = JSON.parse(source.text);
      } catch {
        // keep original
      }
    }

    const candidate =
      source?.levels
      || source?.draftPlan?.levels
      || source?.plan?.levels
      || source?.data?.levels
      || source?.approvedPlan?.levels
      || source;

    const levels = Array.isArray(candidate) ? candidate : candidate?.levels;
    if (!Array.isArray(levels)) return null;

    return levels.map((level: any, levelIndex: number) => ({
      title: level.title || `Niveau ${level.levelNumber || levelIndex + 1}`,
      description: level.description || '',
      sessions: Array.isArray(level.sessions)
        ? level.sessions.map((session: any, sessionIndex: number) => ({
            title: session.title || `Séance ${session.sessionNumber || sessionIndex + 1}`,
            description: session.description || session.objective || session.content || ''
          }))
        : Array.from({ length: SESSIONS_PER_LEVEL }, (_, sessionIndex) => ({
            title: `Séance ${sessionIndex + 1}`,
            description: ''
          }))
    }));
  };

  const summary = useMemo(() => {
    const activeTrainings = trainings.filter((t) => t.status === 'active').length;
    const totalEleves = students.length;
    const eligibleCount = students.filter((student) => {
      const stats = getPresenceStats(student.id, student.trainingId);
      return stats.eligible;
    }).length;
    return { totalTrainings: trainings.length, activeTrainings, totalEleves, eligibleCount };
  }, [trainings, students, attendanceMap, sessions]);

  const handleCreateTraining = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!createForm.title.trim()) errors.title = 'Le titre est requis.';
    if (createForm.title.trim().length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères.';
    if (advancedCreation) {
      const missingLevel = structureDraft.some((level) => !level.title.trim());
      const missingSession = structureDraft.some((level) => level.sessions.some((session) => !session.title.trim()));
      if (missingLevel || missingSession) {
        errors.structure = 'Veuillez renseigner les titres de tous les niveaux et séances.';
      }
    }
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsCreating(true);
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        startDate: createForm.startDate || null,
        endDate: createForm.endDate || null,
        status: 'upcoming',
        creationMode: advancedCreation ? 'MANUAL' : 'AUTO',
        levelsCount: LEVELS_COUNT,
        sessionsPerLevel: SESSIONS_PER_LEVEL
      };
      const created = await trainingService.create(payload);
      if (created?.id) {
        if (advancedCreation) {
          for (let levelIndex = 0; levelIndex < structureDraft.length; levelIndex += 1) {
            const level = structureDraft[levelIndex];
            const createdLevel = await trainingService.createLevel(created.id, {
              levelIndex: levelIndex + 1,
              title: level.title.trim(),
              description: level.description.trim()
            });
            const levelId = createdLevel?.id;
            if (levelId) {
              for (let sessionIndex = 0; sessionIndex < level.sessions.length; sessionIndex += 1) {
                const session = level.sessions[sessionIndex];
                await sessionService.createForLevel(levelId, {
                  sessionIndex: sessionIndex + 1,
                  title: session.title.trim(),
                  objective: session.description.trim(),
                  status: 'PLANNED',
                  durationMin: 120
                });
              }
            }
          }
        } else {
          await trainingService.generateStructure(created.id);
        }
      }
      await loadData();
      if (created?.id) setSelectedTrainingId(created.id);
      setCreateForm({ title: '', description: '', startDate: '', endDate: '' });
      setStructureDraft(buildDefaultStructure());
      setLiveMessage('Formation créée avec succès.');
      announce('Formation créée avec succès.');
    } catch (error) {
      console.error('Failed to create training', error);
      setLiveMessage('Impossible de créer la formation.');
    } finally {
      setIsCreating(false);
    }
  };

  const applyAiStructure = async (structureToAppliquer: LevelDraft[]) => {
    if (!selectedTraining) {
      setAiError('Sélectionnez une formation d’abord.');
      return;
    }
    if (selectedTraining.creationMode && selectedTraining.creationMode !== 'AUTO') {
      setAiError('Le plan IA est disponible uniquement pour les formations en mode automatique.');
      return;
    }
    setAiAppliquering(true);
    setAiError('');
    try {
      const hasSessions = trainingSessions.length > 0;
      if (!hasSessions && selectedTraining.structureStatus !== 'GENERATED') {
        await trainingService.generateStructure(selectedTraining.id);
      }
      const approvedPlan = buildPlanFromStructure(structureToAppliquer);
      await trainingService.applyAiPlan(selectedTraining.id, approvedPlan);
      await loadData();
      setLiveMessage('Plan IA appliqué.');
      announce('Plan IA appliqué.');
    } catch (error) {
      console.error('Failed to apply AI plan', error);
      const message =
        (error as any)?.response?.data?.message
        || (error as any)?.response?.data?.error
        || (error as any)?.message
        || 'Impossible d’appliquer le plan IA.';
      setAiError(message);
    } finally {
      setAiAppliquering(false);
    }
  };

  const handleGenerateAiPlan = async (autoAppliquer = false) => {
    if (!selectedTraining) {
      setAiError('Sélectionnez une formation d’abord.');
      return;
    }
    if (!aiPrompt.trim()) {
      setAiError('Décrivez la formation pour générer un plan.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const constraints = aiConstraints.trim() ? JSON.parse(aiConstraints) : undefined;
      const response = await trainingService.requestAiPlan(selectedTraining.id, {
        promptText: aiPrompt,
        language: aiLanguage,
        constraints
      });
      setAiNotice('');
      const normalized = normalizeAiStructure(response);
      if (normalized) {
        setAiStructure(normalized);
        if (autoAppliquer) {
          await applyAiStructure(normalized);
        }
      } else {
        setAiError('Le format IA n’est pas lisible. Utilisez le brouillon ci-dessous.');
      }
      setAiDraft(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Failed to generate AI plan', error);
      const message =
        (error as any)?.response?.data?.message
        || (error as any)?.message
        || 'Impossible de générer le plan IA.';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAppliquerAiPlan = async () => {
    let structureToAppliquer = aiStructure;
    if (!structureToAppliquer || structureToAppliquer.length === 0) {
      const normalized = normalizeAiStructure(aiDraft);
      if (normalized) {
        structureToAppliquer = normalized;
        setAiStructure(normalized);
      }
    }
    if (!structureToAppliquer || structureToAppliquer.length === 0) {
      setAiError('Le brouillon IA est vide.');
      return;
    }
    await applyAiStructure(structureToAppliquer);
  };
  const filteredStudents = useMemo(() => {
    if (!assignQuery.trim()) return students;
    const query = assignQuery.toLowerCase();
    return students.filter((student) => {
      const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const email = (student.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [assignQuery, students]);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAssignStudents = async () => {
    if (!selectedTrainingId) {
      setAssignMessage('Sélectionnez une formation.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setAssignMessage('Sélectionnez au moins un élève.');
      return;
    }
    setAssigning(true);
    setAssignMessage('');
    try {
      await Promise.all(
        selectedStudentIds.map((studentId) =>
          studentService.update(studentId, { training: { id: selectedTrainingId } })
        )
      );
      await loadData();
      setSelectedStudentIds([]);
      setAssignMessage('Affectation réussie.');
      announce('Élèves affectés à la formation.');
    } catch (error) {
      console.error('Failed to assign students', error);
      setAssignMessage('Impossible d’affecter les élèves.');
    } finally {
      setAssigning(false);
    }
  };

  const handlePresenceChange = (studentId: number, status: PresenceStatus) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const handleSavePresence = async () => {
    if (!selectedSessionId) {
      setAttendanceError('Sélectionnez une séance.');
      return;
    }
    const entries = Object.entries(attendanceDraft)
      .filter(([, status]) => status !== null)
      .map(([studentId, status]) => ({ studentId: Number(studentId), status }));
    if (entries.length === 0) {
      setAttendanceError('Marquez au moins une présence.');
      return;
    }
    setAttendanceSaving(true);
    setAttendanceError('');
    try {
      const session = trainingSessions.find((s) => s.id === selectedSessionId);
      const sessionDate = session?.startAt || session?.date || '';
      await attendanceService.saveBulk({
        sessionId: selectedSessionId,
        date: sessionDate,
        records: entries
      });
      const refreshed = await attendanceService.getBySession(selectedSessionId);
      const mapped: Record<number, PresenceStatus> = {};
      (refreshed || []).forEach((record: any) => {
        const studentId = record.student?.id || record.studentId;
        if (studentId != null) mapped[Number(studentId)] = record.status;
      });
      setAttendanceDraft(mapped);
      const refreshedAll = await attendanceService.getAll();
      setPresenceRecords(refreshedAll || []);
      setLiveMessage('Présences enregistrées.');
      announce('Présences enregistrées.');
    } catch (error) {
      console.error('Failed to save attendance', error);
      setAttendanceError('Erreur lors de l’enregistrement.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
            <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin mb-3" aria-hidden="true"></i>
            <p className="text-gray-600">Chargement des formations...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Gestion des formations</h1>
          <p className="text-base text-gray-600">
            Formations continues par niveaux, suivi des présences, progression et certification.
          </p>
        </div>

        <div className="sr-only" aria-live="polite">{liveMessage}</div>
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" aria-label="Synthèse">
          <Card className="p-4">
            <p className="text-xs text-gray-500">Formations</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalTrainings}</p>
            <p className="text-xs text-gray-500">{summary.activeTrainings} actives</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Élèves suivis</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalEleves}</p>
            <p className="text-xs text-gray-500">toutes formations</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Certifications</p>
            <p className="text-2xl font-bold text-gray-900">{summary.eligibleCount}</p>
            <p className="text-xs text-gray-500">éligibles</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Niveaux</p>
            <p className="text-2xl font-bold text-gray-900">{LEVELS_COUNT}</p>
            <p className="text-xs text-gray-500">par formation</p>
          </Card>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-600">
            Astuce accessibilité: utilisez Tab pour naviguer entre les sections.
          </p>
          <button
            type="button"
            onClick={() => setSimplifyMode((prev) => !prev)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {simplifyMode ? 'Désactiver le mode simplifié' : 'Activer le mode simplifié'}
          </button>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Navigation interne">
          <a href="#formations" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Formations</a>
          {isResponsable && (
            <a href="#creation" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Créer</a>
          )}
          {isResponsable && (
            <a href="#ia" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">IA</a>
          )}
          {isFormateur && (
            <a href="#affectations" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Affectations</a>
          )}
          {isFormateur && (
            <a href="#presences" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Présences</a>
          )}
          <a href="#suivi" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Suivi</a>
          {(isResponsable || isFormateur) && (
            <a href="#historique" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Historique</a>
          )}
          {isAdmin && (
            <a href="#audit" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">Audit</a>
          )}
        </nav>
        <section id="formations" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="formations-title">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 id="formations-title" className="text-xl font-semibold text-gray-900">Formations</h2>
                <Badge variant="info">{filteredTrainings.length}</Badge>
              </div>
              <div className="space-y-3 mb-3">
                <div>
                  <label htmlFor="training-search" className="block text-xs font-medium text-gray-600 mb-1">Recherche</label>
                  <input
                    id="training-search"
                    value={trainingSearch}
                    onChange={(e) => setTrainingSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nom de formation"
                  />
                </div>
                <div>
                  <label htmlFor="training-status" className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                  <select
                    id="training-status"
                    value={trainingStatusFilter}
                    onChange={(e) => setTrainingStatusFilter(e.target.value as 'all' | 'active' | 'upcoming' | 'completed')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actives</option>
                    <option value="upcoming">À venir</option>
                    <option value="completed">Terminées</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                {filteredTrainings.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune formation disponible.</p>
                )}
                {filteredTrainings.map((training) => (
                  <button
                    key={training.id}
                    type="button"
                    onClick={() => setSelectedTrainingId(training.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      selectedTrainingId === training.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{training.name}</p>
                    <p className="text-xs text-gray-500">{training.status || 'upcoming'}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-5">
              {selectedTraining ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{selectedTraining.name}</h3>
                      <p className="text-sm text-gray-600">{selectedTraining.description || 'Aucune description.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={selectedTraining.status === 'active' ? 'success' : 'neutral'}>
                        {selectedTraining.status || 'upcoming'}
                      </Badge>
                      <Badge variant="info">{studentsInTraining.length} élèves</Badge>
                      <Badge variant="warning">{trainingSessions.length || DEFAULT_TOTAL_SESSIONS} séances</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Période</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedTraining.startDate)} ? {formatDate(selectedTraining.endDate)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Structure standard</p>
                      <p className="text-sm font-medium text-gray-900">{LEVELS_COUNT} niveaux · {SESSIONS_PER_LEVEL} séances / niveau</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {trainingLevels.map((level: any) => {
                      const levelSessions = trainingSessions.filter((session) => Number(session.levelNumber) === Number(level.levelNumber));
                      return (
                        <div key={level.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900">Niveau {level.levelNumber}</p>
                            <Badge variant="info">{levelSessions.length || SESSIONS_PER_LEVEL} séances</Badge>
                          </div>
                          <p className="text-xs text-gray-500">{level.title || 'Compétences pratiques & projets'}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Sélectionnez une formation pour afficher les détails.</p>
              )}
            </Card>
          </div>
        </section>

        {isResponsable && (
          <section id="creation" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="creation-title">
            <Card className="p-5 lg:col-span-2">
              <h2 id="creation-title" className="text-xl font-semibold text-gray-900 mb-3">Créer une formation</h2>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAdvancedCreation((prev) => !prev)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {advancedCreation ? 'Mode simple' : 'Mode avancé (niveaux & séances)'}
                </button>
                {advancedCreation && (
                  <button
                    type="button"
                    onClick={() => setStructureDraft(buildSampleStructure(createForm.title || createForm.description))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    Remplir avec contenu modèle
                  </button>
                )}
                <span className="text-xs text-gray-500">
                  {advancedCreation
                    ? 'Définissez les titres et descriptions de chaque niveau et séance.'
                    : 'Structure auto: 4 niveaux × 6 séances.'}
                </span>
              </div>
              <form onSubmit={handleCreateTraining} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="training-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Titre de la formation <span className="text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="training-title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        createErrors.title ? 'border-rose-500 bg-rose-50' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Innovation Éducative - Niveau 1"
                      required
                    />
                    {createErrors.title && <p className="mt-1 text-sm text-rose-600">{createErrors.title}</p>}
                </div>
                <div>
                  <label htmlFor="training-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    id="training-desc"
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Objectifs, projets technologiques, innovation éducative..."
                  />
                </div>
                {createErrors.structure && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
                    {createErrors.structure}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="training-start" className="block text-sm font-medium text-gray-700 mb-1.5">Début</label>
                    <input
                      id="training-start"
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="training-end" className="block text-sm font-medium text-gray-700 mb-1.5">Fin</label>
                    <input
                      id="training-end"
                      type="date"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                {!advancedCreation && (
                  <div className="rounded-lg bg-teal-50 border border-teal-100 p-4 text-sm text-teal-800">
                    Structure automatique: {LEVELS_COUNT} niveaux × {SESSIONS_PER_LEVEL} séances.
                  </div>
                )}
                {advancedCreation && (
                  <div className="space-y-4">
                    {structureDraft.map((level, levelIndex) => (
                      <div key={levelIndex} className="rounded-lg border border-gray-200 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Titre du niveau {levelIndex + 1}
                            </label>
                            <input
                              value={level.title}
                              onChange={(e) => {
                                const next = [...structureDraft];
                                next[levelIndex] = { ...next[levelIndex], title: e.target.value };
                                setStructureDraft(next);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder={`Niveau ${levelIndex + 1}`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Description du niveau
                            </label>
                            <input
                              value={level.description}
                              onChange={(e) => {
                                const next = [...structureDraft];
                                next[levelIndex] = { ...next[levelIndex], description: e.target.value };
                                setStructureDraft(next);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="Compétences, projets, livrables..."
                            />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {level.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="rounded-lg border border-gray-200 p-3">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Séance {sessionIndex + 1} - titre
                              </label>
                              <input
                                value={session.title}
                                onChange={(e) => {
                                  const next = [...structureDraft];
                                  const nextSessions = [...next[levelIndex].sessions];
                                  nextSessions[sessionIndex] = { ...nextSessions[sessionIndex], title: e.target.value };
                                  next[levelIndex] = { ...next[levelIndex], sessions: nextSessions };
                                  setStructureDraft(next);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder={`Séance ${sessionIndex + 1}`}
                              />
                              <label className="block text-xs font-medium text-gray-600 mt-2 mb-1">
                                Brève description
                              </label>
                              <input
                                value={session.description}
                                onChange={(e) => {
                                  const next = [...structureDraft];
                                  const nextSessions = [...next[levelIndex].sessions];
                                  nextSessions[sessionIndex] = { ...nextSessions[sessionIndex], description: e.target.value };
                                  next[levelIndex] = { ...next[levelIndex], sessions: nextSessions };
                                  setStructureDraft(next);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Objectif et contenu de la séance..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? 'Création...' : 'Créer la formation'}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Règles de certification</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>Validation automatique après 4 niveaux complets.</li>
                <li>Présence = 80% sur l’ensemble des séances.</li>
                <li>Certificat imprimable disponible.</li>
              </ul>
              <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/certification')}>
                Ouvrir la certification
              </Button>
            </Card>
          </section>
        )}
        {isResponsable && (
          <section id="ia" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="ia-title">
            <Card className="p-5 lg:col-span-2">
              <h2 id="ia-title" className="text-xl font-semibold text-gray-900 mb-3">Assistant IA (structure & contenu)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Utilisez l’IA pour proposer un plan de niveaux et des séances alignés sur l’apprentissage pratique et les projets.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Brief pédagogique
                  </label>
                  <textarea
                    id="ai-prompt"
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Décrire objectifs, projets technologiques, livrables..."
                  />
                </div>
                <div>
                  <label htmlFor="ai-language" className="block text-sm font-medium text-gray-700 mb-1.5">Langue</label>
                  <select
                    id="ai-language"
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value as 'fr' | 'ar' | 'en')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">Arabe</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="ai-constraints" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraintes JSON (optionnel)
                </label>
                <textarea
                  id="ai-constraints"
                  rows={2}
                  value={aiConstraints}
                  onChange={(e) => setAiConstraints(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  placeholder='{"levelsCount":4,"sessionsPerLevel":6}'
                />
              </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button type="button" variant="primary" disabled={aiLoading} onClick={() => handleGenerateAiPlan(false)}>
                    {aiLoading ? 'Génération...' : 'Générer un plan'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={aiLoading || aiAppliquering}
                    onClick={() => handleGenerateAiPlan(true)}
                  >
                    {aiLoading || aiAppliquering ? 'Génération...' : 'Générer + appliquer'}
                  </Button>
                  <Button type="button" variant="outline" disabled={aiAppliquering} onClick={handleAppliquerAiPlan}>
                    {aiAppliquering ? 'Application...' : 'Appliquer le plan'}
                  </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStructureDraft(aiStructure.map((level) => ({
                    ...level,
                    sessions: level.sessions.map((session) => ({ ...session }))
                  })))}
                >
                  Utiliser ce plan pour la création
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAiStructure(buildSampleStructure(aiPrompt || selectedTraining?.name || ''))}
                >
                  Remplir avec contenu modèle
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Brouillon lisible (modifiable) — ajustez titres et descriptions avant publication.
                </p>
                {aiStructure.map((level, levelIndex) => (
                  <div key={`ai-level-${levelIndex}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Niveau {levelIndex + 1}
                        </label>
                        <input
                          value={level.title}
                          onChange={(e) => {
                            const next = [...aiStructure];
                            next[levelIndex] = { ...next[levelIndex], title: e.target.value };
                            setAiStructure(next);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Description du niveau
                        </label>
                        <input
                          value={level.description}
                          onChange={(e) => {
                            const next = [...aiStructure];
                            next[levelIndex] = { ...next[levelIndex], description: e.target.value };
                            setAiStructure(next);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {level.sessions.map((session, sessionIndex) => (
                        <div key={`ai-session-${levelIndex}-${sessionIndex}`} className="rounded-lg border border-gray-200 p-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Séance {sessionIndex + 1} - titre
                          </label>
                          <input
                            value={session.title}
                            onChange={(e) => {
                              const next = [...aiStructure];
                              const nextSessions = [...next[levelIndex].sessions];
                              nextSessions[sessionIndex] = { ...nextSessions[sessionIndex], title: e.target.value };
                              next[levelIndex] = { ...next[levelIndex], sessions: nextSessions };
                              setAiStructure(next);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <label className="block text-xs font-medium text-gray-600 mt-2 mb-1">
                            Brève description
                          </label>
                          <input
                            value={session.description}
                            onChange={(e) => {
                              const next = [...aiStructure];
                              const nextSessions = [...next[levelIndex].sessions];
                              nextSessions[sessionIndex] = { ...nextSessions[sessionIndex], description: e.target.value };
                              next[levelIndex] = { ...next[levelIndex], sessions: nextSessions };
                              setAiStructure(next);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAiJson((prev) => !prev)}
                  className="text-xs text-gray-500 underline"
                >
                  {showAiJson ? 'Masquer le JSON technique' : 'Afficher le JSON technique'}
                </button>
                {showAiJson && (
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {aiDraft || JSON.stringify(buildPlanFromStructure(aiStructure), null, 2)}
                  </pre>
                )}
              </div>
              {aiError && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
                  {aiError}
                </div>
              )}
              {aiNotice && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800" role="status">
                  {aiNotice}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Guidelines IA</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>Inclure projets concrets et livrables par niveau.</li>
                <li>Équilibrer pratique et innovation pédagogique.</li>
                <li>Prévoir évaluations légères à chaque fin de niveau.</li>
              </ul>
            </Card>
          </section>
        )}
        {isFormateur && (
          <section id="affectations" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="affectations-title">
            <Card className="p-5 lg:col-span-2">
              <h2 id="affectations-title" className="text-xl font-semibold text-gray-900 mb-3">Affecter des élèves</h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700 mb-1.5">Recherche</label>
                  <input
                    id="assign-search"
                    value={assignQuery}
                    onChange={(e) => setAssignQuery(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nom, prénom ou email"
                  />
                </div>
                <div className="sm:w-56">
                  <label htmlFor="assign-training" className="block text-sm font-medium text-gray-700 mb-1.5">Formation</label>
                  <select
                    id="assign-training"
                    value={selectedTrainingId || ''}
                    onChange={(e) => setSelectedTrainingId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="" disabled>Choisir</option>
                    {trainings.map((training) => (
                      <option key={training.id} value={training.id}>{training.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-[360px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">Aucun élève trouvé.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      const trainingName = trainings.find((t) => t.id === student.trainingId)?.name || 'Non affecté';
                      return (
                        <li key={student.id} className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            aria-label={`Sélectionner ${student.firstName} ${student.lastName}`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                          <Badge variant="neutral">{trainingName}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" variant="primary" disabled={assigning} onClick={handleAssignStudents}>
                  {assigning ? 'Affectation...' : 'Affecter les élèves sélectionnés'}
                </Button>
                <span className="text-xs text-gray-500">{selectedStudentIds.length} sélectionné(s)</span>
                {assignMessage && <span className="text-sm text-teal-700">{assignMessage}</span>}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Règles d’affectation</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>Chaque élève appartient à une formation active.</li>
                <li>Le niveau de départ est 1 par défaut.</li>
                <li>Les transferts sont tracés dans l’audit admin.</li>
              </ul>
            </Card>
          </section>
        )}
        {isFormateur && (
          <section id="presences" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="presences-title">
            <Card className="p-5 lg:col-span-2">
              <h2 id="presences-title" className="text-xl font-semibold text-gray-900 mb-3">Présences par séance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="attendance-training" className="block text-sm font-medium text-gray-700 mb-1.5">Formation</label>
                  <select
                    id="attendance-training"
                    value={selectedTrainingId || ''}
                    onChange={(e) => setSelectedTrainingId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="" disabled>Choisir</option>
                    {trainings.map((training) => (
                      <option key={training.id} value={training.id}>{training.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="attendance-session" className="block text-sm font-medium text-gray-700 mb-1.5">Séance</label>
                  <select
                    id="attendance-session"
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {trainingSessions.length === 0 && <option value="">Aucune séance</option>}
                    {trainingSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        Niveau {session.levelNumber} · Séance {session.sessionNumber} — {formatDateTime(session.startAt || session.date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {attendanceError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
                  {attendanceError}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {studentsInTraining.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">Aucun élève dans cette formation.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {studentsInTraining.map((student) => {
                      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Élève';
                      return (
                        <li key={student.id} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                            <fieldset className="flex flex-wrap gap-3" aria-label={`Statut de présence pour ${name}`}>
                              <legend className="sr-only">Statut de présence</legend>
                              {attendanceOptions.map((option) => (
                                <label key={option.value} className="inline-flex items-center gap-1 text-xs text-gray-700">
                                  <input
                                    type="radio"
                                    name={`attendance-${student.id}`}
                                    checked={attendanceDraft[student.id] === option.value}
                                    onChange={() => handlePresenceChange(student.id, option.value)}
                                    className="text-teal-600 focus:ring-teal-500"
                                  />
                                  <span className={option.color}>{option.label}</span>
                                </label>
                              ))}
                            </fieldset>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" variant="primary" disabled={attendanceSaving} onClick={handleSavePresence}>
                  {attendanceSaving ? 'Enregistrement...' : 'Enregistrer les présences'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/attendance')}>
                  Ouvrir la page complète des présences
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Raccourcis utiles</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>Utiliser Tab pour naviguer entre élèves.</li>
                <li>Les changements sont annoncés pour les lecteurs d’écran.</li>
                <li>La page complète propose un mode rapide.</li>
              </ul>
            </Card>
          </section>
        )}
        <section id="suivi" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10" aria-labelledby="suivi-title">
          <Card className="p-5 lg:col-span-2">
            <h2 id="suivi-title" className="text-xl font-semibold text-gray-900 mb-4">Suivi pédagogique</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label htmlFor="suivi-search" className="block text-xs font-medium text-gray-600 mb-1">Élève</label>
                <input
                  id="suivi-search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nom ou email"
                />
              </div>
              <div>
                <label htmlFor="suivi-eligibility" className="block text-xs font-medium text-gray-600 mb-1">Éligibilité</label>
                <select
                  id="suivi-eligibility"
                  value={eligibilityFilter}
                  onChange={(e) => setEligibilityFilter(e.target.value as 'all' | 'eligible' | 'in-progress')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Tous</option>
                  <option value="eligible">Éligibles</option>
                  <option value="in-progress">En cours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Présence (%)</label>
                <div className="flex gap-2">
                  <input
                    id="suivi-attendance-min"
                    type="number"
                    min={0}
                    max={100}
                    value={attendanceMin}
                    onChange={(e) => setPresenceMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Présence minimum"
                  />
                  <input
                    id="suivi-attendance-max"
                    type="number"
                    min={0}
                    max={100}
                    value={attendanceMax}
                    onChange={(e) => setPresenceMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Présence maximum"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="suivi-levels" className="block text-xs font-medium text-gray-600 mb-1">Niveaux validés min</label>
                <input
                  id="suivi-levels"
                  type="number"
                  min={0}
                  max={LEVELS_COUNT}
                  value={levelsMin}
                  onChange={(e) => setLevelsMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {filteredStudentsInTraining.length === 0 ? (
              <p className="text-sm text-gray-500">Sélectionnez une formation pour voir l’avancement des élèves.</p>
            ) : (
              <div className="space-y-3">
                {filteredStudentsInTraining.map((student) => {
                  const stats = getPresenceStats(student.id, student.trainingId);
                  return (
                    <div key={student.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="info">{stats.levelsValidated} niveaux validés</Badge>
                          <Badge variant="neutral">{stats.remainingSessions} séances restantes</Badge>
                          <Badge variant={stats.eligible ? 'success' : 'warning'}>
                            {stats.eligible ? 'Éligible' : 'En cours'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-600">
                        Présence: {stats.rate}% · Séances complétées: {stats.completed}/{stats.totalSessions}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Historique rapide</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>Présences enregistrées: {attendanceRecords.length}</li>
              <li>Formations actives: {summary.activeTrainings}</li>
              <li>Certifications possibles: {summary.eligibleCount}</li>
            </ul>
            <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
              Voir les rapports
            </Button>
          </Card>
        </section>

        {(isResponsable || isFormateur) && (
          <section id="historique" className="grid grid-cols-1 gap-6 mb-10" aria-labelledby="history-title">
            <Card className="p-5">
              <h2 id="history-title" className="text-xl font-semibold text-gray-900 mb-3">Historique détaillé</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label htmlFor="history-search" className="block text-xs font-medium text-gray-600 mb-1">Élève</label>
                  <input
                    id="history-search"
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nom ou email"
                  />
                </div>
                <div>
                  <label htmlFor="history-status" className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                  <select
                    id="history-status"
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value as typeof historyStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tous</option>
                    <option value="present">Présent</option>
                    <option value="late">Retard</option>
                    <option value="excused">Excusé</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
                  <Button type="button" variant="outline" onClick={() => navigate('/reports')}>
                    Voir tous les rapports
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="py-2 pr-4">Élève</th>
                      <th className="py-2 pr-4">Formation</th>
                      <th className="py-2 pr-4">Séance</th>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistoryRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Aucun historique disponible.</td>
                      </tr>
                    )}
                    {filteredHistoryRecords.slice(0, 20).map((record: any, index: number) => {
                      const student = record.student || students.find((s) => Number(s.id) === Number(record.studentId));
                      const session = sessions.find((s) => Number(s.id) === Number(record.sessionId));
                      const training = trainings.find((t) => Number(t.id) === Number(getTrainingId(session || student)));
                      return (
                        <tr key={record.id || index}>
                          <td className="py-2 pr-4">
                            {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '—'}
                          </td>
                          <td className="py-2 pr-4">{training?.name || '—'}</td>
                          <td className="py-2 pr-4">
                            {session ? `Niveau ${session.levelNumber} · Séance ${session.sessionNumber}` : '—'}
                          </td>
                          <td className="py-2 pr-4">{formatDateTime(record.date || session?.startAt || session?.date)}</td>
                          <td className="py-2">
                            <Badge variant="info">{record.status || '—'}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {isAdmin && (
          <section id="audit" className="grid grid-cols-1 gap-6" aria-labelledby="audit-title">
            <Card className="p-5">
              <h2 id="audit-title" className="text-xl font-semibold text-gray-900 mb-3">Audit (Admin)</h2>
              <p className="text-sm text-gray-600 mb-4">Traçabilité des affectations, présences et modifications.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Entité</th>
                      <th className="py-2 pr-4">Acteur</th>
                      <th className="py-2">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Aucun log disponible.</td>
                      </tr>
                    )}
                    {auditLogs.slice(0, 10).map((log: any) => (
                      <tr key={log.id}>
                        <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td className="py-2 pr-4"><Badge variant="info">{log.action}</Badge></td>
                        <td className="py-2 pr-4">{log.entityType} #{log.entityId}</td>
                        <td className="py-2 pr-4">{log.actorEmail || '-'}</td>
                        <td className="py-2">{log.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" className="mt-4" onClick={() => navigate('/audit')}>
                Ouvrir le journal complet
              </Button>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}


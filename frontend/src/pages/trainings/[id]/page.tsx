import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import Badge from '../../../components/base/Badge';
import { trainingService } from '../../../services/training.service';
import { sessionService } from '../../../services/session.service';

type CreationMode = 'AUTO' | 'MANUAL';
type StructureStatus = 'NOT_GENERATED' | 'GENERATED';

interface SessionDetail {
  id: number;
  sessionIndex: number;
  title: string;
  startAt?: string | null;
  durationMin?: number | null;
  location?: string | null;
  status?: string | null;
}

interface LevelDetail {
  id: number;
  levelIndex: number;
  title: string;
  description?: string | null;
  sessions: SessionDetail[];
}

interface TrainingDetail {
  id: number;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  creationMode: CreationMode;
  structureStatus: StructureStatus;
  levels: LevelDetail[];
}

interface AiPlanSession {
  sessionIndex: number;
  title: string;
  objective: string;
  durationMin: number;
  startAt?: string | null;
  location?: string | null;
  modality: 'IN_PERSON';
  materials?: string[];
  accessibilityNotes: string[];
}

interface AiPlanLevel {
  levelIndex: number;
  title: string;
  outcomes: string[];
  sessions: AiPlanSession[];
}

interface AiPlan {
  version: 'v1';
  language: 'fr' | 'ar' | 'en';
  training: {
    title: string;
    description: string;
  };
  globalConstraints?: {
    levelsCount?: number;
    sessionsPerLevel?: number;
    defaultDurationMin?: number | null;
    defaultLocation?: string | null;
    startDate?: string | null;
    preferredDays?: string[] | null;
  };
  levels: AiPlanLevel[];
}

interface AiPlanConstraintsState {
  startDate: string;
  preferredDays: string[];
  defaultDurationMin: string;
  defaultLocation: string;
}

interface ScheduleDraft {
  startAt: string;
  durationMin: string;
  location: string;
  status: string;
}

const TOTAL_LEVELS = 4;
const TOTAL_SESSIONS = 6;
const PREFERRED_DAYS = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' }
];

const toInputDateTime = (value?: string | null) => {
  if (!value) return '';
  return value.length >= 16 ? value.slice(0, 16) : value;
};

const normalizeDateTime = (value: string) => {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusLabel = (status?: string | null) => {
  if (!status) return 'PLANNED';
  return status;
};

export default function TrainingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trainingId = Number(id);

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingLevel, setIsCreatingLevel] = useState(false);
  const [activeSessionCreateLevel, setActiveSessionCreateLevel] = useState<number | null>(null);

  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft | null>(null);
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  const [aiPromptText, setAiPromptText] = useState('');
  const [aiLanguage, setAiLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [aiConstraints, setAiConstraints] = useState<AiPlanConstraintsState>({
    startDate: '',
    preferredDays: [],
    defaultDurationMin: '',
    defaultLocation: ''
  });
  const [aiDraft, setAiDraft] = useState<AiPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplying, setAiApplying] = useState(false);
  const [aiPromptError, setAiPromptError] = useState<string | null>(null);
  const [aiFieldErrors, setAiFieldErrors] = useState<Record<string, string>>({});
  const [aiSummaryErrors, setAiSummaryErrors] = useState<string[]>([]);
  const [aiServerError, setAiServerError] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const handleApiError = (error: any) => {
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.message;
    if (code === 'STRUCTURE_LOCKED') {
      return 'Structure is locked because attendance already exists for this training.';
    }
    if (message) return message;
    return 'Action failed. Please try again.';
  };

  const loadTraining = useCallback(async () => {
    if (!trainingId) {
      setLoadError('Invalid training identifier.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await trainingService.getById(trainingId);
      setTraining(data);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    loadTraining();
  }, [loadTraining]);

  useEffect(() => {
    if (!isConfirmOpen) {
      lastFocusedElement.current?.focus();
      return;
    }

    const dialog = confirmDialogRef.current;
    if (!dialog) return;

    lastFocusedElement.current = document.activeElement as HTMLElement;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsConfirmOpen(false);
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isConfirmOpen]);

  const levels = (training?.levels ?? []).slice().sort((a, b) => a.levelIndex - b.levelIndex);
  const isAuto = training?.creationMode === 'AUTO';
  const isManual = training?.creationMode === 'MANUAL';

  const normalizeDraft = (plan: AiPlan): AiPlan => {
    return {
      ...plan,
      globalConstraints: plan.globalConstraints ?? {},
      levels: plan.levels.map((level) => ({
        ...level,
        outcomes: level.outcomes ?? [],
        sessions: level.sessions.map((session) => ({
          ...session,
          materials: session.materials ?? [],
          accessibilityNotes: session.accessibilityNotes ?? []
        }))
      }))
    };
  };

  const buildConstraintsPayload = () => {
    const duration = aiConstraints.defaultDurationMin.trim();
    return {
      startDate: aiConstraints.startDate || null,
      preferredDays: aiConstraints.preferredDays.length > 0 ? aiConstraints.preferredDays : null,
      defaultDurationMin: duration ? Number(duration) : null,
      defaultLocation: aiConstraints.defaultLocation.trim() || null
    };
  };

  const handleGenerateDraft = async () => {
    if (!aiPromptText.trim()) {
      setAiPromptError('Please provide a short description for the formation.');
      return;
    }
    setAiPromptError(null);
    setAiLoading(true);
    setAiServerError(null);
    setAiSummaryErrors([]);
    setAiFieldErrors({});
    try {
      const payload = {
        promptText: aiPromptText.trim(),
        language: aiLanguage,
        constraints: buildConstraintsPayload()
      };
      const response = await trainingService.requestAiPlan(trainingId, payload);
      const plan = normalizeDraft(response.draftPlan);
      setAiDraft(plan);
    } catch (error: any) {
      setAiServerError(handleApiError(error));
    } finally {
      setAiLoading(false);
    }
  };

  const handleCancelDraft = () => {
    setAiDraft(null);
    setAiFieldErrors({});
    setAiSummaryErrors([]);
    setAiServerError(null);
  };

  const validateDraft = (plan: AiPlan) => {
    const errors: Record<string, string> = {};
    const summary: string[] = [];

    if (!plan.training.title || plan.training.title.trim().length < 3) {
      errors['training.title'] = 'Title must be at least 3 characters.';
    }
    if (plan.levels.length !== TOTAL_LEVELS) {
      summary.push('The plan must contain exactly 4 levels.');
    }
    plan.levels.forEach((level) => {
      if (!level.title || level.title.trim().length < 3) {
        errors[`levels.${level.levelIndex}.title`] = 'Level title is required.';
      }
      if (level.outcomes.length < 2) {
        errors[`levels.${level.levelIndex}.outcomes`] = 'At least 2 outcomes are required.';
      }
      if (level.sessions.length !== TOTAL_SESSIONS) {
        summary.push(`Level ${level.levelIndex} must contain exactly 6 sessions.`);
      }
      level.sessions.forEach((session) => {
        if (!session.title || session.title.trim().length < 3) {
          errors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.title`] = 'Session title is required.';
        }
        if (!session.objective || session.objective.trim().length < 5) {
          errors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.objective`] = 'Objective is required.';
        }
        if (!session.durationMin || session.durationMin < 30 || session.durationMin > 240) {
          errors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.durationMin`] = 'Duration must be 30-240 minutes.';
        }
        if (!session.accessibilityNotes || session.accessibilityNotes.length < 2) {
          errors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.accessibilityNotes`] = 'Add at least 2 accessibility notes.';
        }
      });
    });

    return { errors, summary };
  };

  const handleApplyDraft = async () => {
    if (!aiDraft) return;
    const validation = validateDraft(aiDraft);
    setAiFieldErrors(validation.errors);
    setAiSummaryErrors(validation.summary);
    if (Object.keys(validation.errors).length > 0 || validation.summary.length > 0) {
      return;
    }
    setAiApplying(true);
    setAiServerError(null);
    try {
      await trainingService.applyAiPlan(trainingId, aiDraft);
      await loadTraining();
      setAiDraft(null);
      setActionMessage('AI plan applied successfully.');
    } catch (error: any) {
      setAiServerError(handleApiError(error));
    } finally {
      setAiApplying(false);
    }
  };

  const updateDraft = (updater: (draft: AiPlan) => AiPlan) => {
    setAiDraft((prev) => (prev ? updater(prev) : prev));
  };

  const updateLevel = (levelIndex: number, updater: (level: AiPlanLevel) => AiPlanLevel) => {
    updateDraft((draft) => ({
      ...draft,
      levels: draft.levels.map((level) => (level.levelIndex === levelIndex ? updater(level) : level))
    }));
  };

  const updateSession = (levelIndex: number, sessionIndex: number, updater: (session: AiPlanSession) => AiPlanSession) => {
    updateLevel(levelIndex, (level) => ({
      ...level,
      sessions: level.sessions.map((session) =>
        session.sessionIndex === sessionIndex ? updater(session) : session
      )
    }));
  };

  const existingLevelIndices = new Set(levels.map((level) => level.levelIndex));
  const missingLevelIndices = Array.from({ length: TOTAL_LEVELS }, (_, idx) => idx + 1).filter(
    (index) => !existingLevelIndices.has(index)
  );

  const getMissingSessionIndices = (level: LevelDetail) => {
    const existingSessionIndices = new Set(level.sessions.map((session) => session.sessionIndex));
    return Array.from({ length: TOTAL_SESSIONS }, (_, idx) => idx + 1).filter(
      (index) => !existingSessionIndices.has(index)
    );
  };

  const handleGenerateStructure = async () => {
    if (!training) return;
    setActionError(null);
    setActionMessage(null);
    setIsGenerating(true);
    try {
      await trainingService.generateStructure(training.id);
      await loadTraining();
      setActionMessage('Structure generated successfully.');
    } catch (error: any) {
      setActionError(handleApiError(error));
    } finally {
      setIsGenerating(false);
      setIsConfirmOpen(false);
    }
  };

  const handleCreateNextLevel = async () => {
    if (!training || missingLevelIndices.length === 0) return;
    setActionError(null);
    setActionMessage(null);
    setIsCreatingLevel(true);
    try {
      await trainingService.createLevel(training.id, { levelIndex: missingLevelIndices[0] });
      await loadTraining();
      setActionMessage('Level created successfully.');
    } catch (error: any) {
      setActionError(handleApiError(error));
    } finally {
      setIsCreatingLevel(false);
    }
  };

  const handleCreateNextSession = async (level: LevelDetail) => {
    const missingSessions = getMissingSessionIndices(level);
    if (missingSessions.length === 0) return;
    setActionError(null);
    setActionMessage(null);
    setActiveSessionCreateLevel(level.id);
    try {
      await sessionService.createForLevel(level.id, {
        sessionIndex: missingSessions[0]
      });
      await loadTraining();
      setActionMessage(`Session ${missingSessions[0]} created for Level ${level.levelIndex}.`);
    } catch (error: any) {
      setActionError(handleApiError(error));
    } finally {
      setActiveSessionCreateLevel(null);
    }
  };

  const toggleLevel = (levelId: number) => {
    setExpandedLevels((prev) => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  const startEditingSession = (session: SessionDetail) => {
    setEditingSessionId(session.id);
    setScheduleDraft({
      startAt: toInputDateTime(session.startAt),
      durationMin: `${session.durationMin ?? 120}`,
      location: session.location ?? '',
      status: session.status ?? 'PLANNED'
    });
    setScheduleErrors({});
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setScheduleDraft(null);
    setScheduleErrors({});
  };

  const handleScheduleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!scheduleDraft) return;
    const { name, value } = event.target;
    setScheduleDraft({ ...scheduleDraft, [name]: value });
    if (scheduleErrors[name]) {
      setScheduleErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleScheduleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scheduleDraft || !editingSessionId) return;

    const errors: Record<string, string> = {};
    const durationValue = Number(scheduleDraft.durationMin);
    if (!durationValue || Number.isNaN(durationValue) || durationValue <= 0) {
      errors.durationMin = 'Duration must be a positive number.';
    }
    if (!scheduleDraft.status) {
      errors.status = 'Status is required.';
    }

    if (Object.keys(errors).length > 0) {
      setScheduleErrors(errors);
      return;
    }

    setIsScheduleSaving(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await sessionService.updateSchedule(editingSessionId, {
        startAt: normalizeDateTime(scheduleDraft.startAt),
        durationMin: durationValue,
        location: scheduleDraft.location?.trim() || null,
        status: scheduleDraft.status
      });
      await loadTraining();
      setActionMessage('Session schedule updated.');
      cancelEditingSession();
    } catch (error: any) {
      setActionError(handleApiError(error));
    } finally {
      setIsScheduleSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-sm text-gray-500">Loading training details…</p>
        </main>
      </div>
    );
  }

  if (loadError || !training) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <p className="text-sm text-red-600">{loadError || 'Training not found.'}</p>
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/trainings')}>
                Back to formations
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const levelsCreated = levels.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/trainings')}>
            Back to formations
          </Button>
          <div>
            <p className="text-sm font-semibold text-teal-700 tracking-wide uppercase">Formation detail</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{training.title}</h1>
            {training.description && (
              <p className="text-gray-600 mt-2 max-w-3xl">{training.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={training.creationMode === 'AUTO' ? 'success' : 'neutral'}>
              Mode: {training.creationMode}
            </Badge>
            <Badge variant={training.structureStatus === 'GENERATED' ? 'success' : 'warning'}>
              Structure: {training.structureStatus === 'GENERATED' ? 'Generated' : 'Not generated'}
            </Badge>
            {training.status && (
              <Badge variant="info">
                Status: {training.status}
              </Badge>
            )}
          </div>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              actionError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
            role={actionError ? 'alert' : 'status'}
            aria-live="polite"
          >
            {actionError || actionMessage}
          </div>
        )}

        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-gray-500">Start</p>
              <p className="text-sm font-semibold text-gray-900">
                {training.startDate || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">End</p>
              <p className="text-sm font-semibold text-gray-900">
                {training.endDate || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Levels created</p>
              <p className="text-sm font-semibold text-gray-900">
                {levelsCreated}/{TOTAL_LEVELS}
              </p>
            </div>
          </div>
        </Card>

        {isAuto && (
          <Card>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-gray-900">AI Assist (AUTO only)</h2>
              <p className="text-sm text-gray-600">
                The assistant creates a draft plan only. You can edit it, then click Apply to write to the database.
              </p>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-800">
                  Description <span className="text-red-600">(required)</span>
                </label>
                <textarea
                  id="ai-prompt"
                  rows={4}
                  value={aiPromptText}
                  onChange={(event) => {
                    setAiPromptText(event.target.value);
                    setAiPromptError(null);
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-invalid={!!aiPromptError}
                  aria-describedby={aiPromptError ? 'ai-prompt-error' : 'ai-prompt-help'}
                />
                <p id="ai-prompt-help" className="mt-1 text-xs text-gray-500">
                  Provide goals, audience level, and any specific focus areas.
                </p>
                {aiPromptError && (
                  <p id="ai-prompt-error" className="mt-2 text-sm text-red-600" role="alert">
                    {aiPromptError}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ai-language" className="block text-sm font-medium text-gray-800">
                    Language
                  </label>
                  <select
                    id="ai-language"
                    value={aiLanguage}
                    onChange={(event) => setAiLanguage(event.target.value as 'fr' | 'ar' | 'en')}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ai-start-date" className="block text-sm font-medium text-gray-800">
                    Start date (optional)
                  </label>
                  <input
                    id="ai-start-date"
                    type="date"
                    value={aiConstraints.startDate}
                    onChange={(event) =>
                      setAiConstraints((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="ai-duration" className="block text-sm font-medium text-gray-800">
                    Default duration (minutes)
                  </label>
                  <input
                    id="ai-duration"
                    type="number"
                    min={30}
                    max={240}
                    value={aiConstraints.defaultDurationMin}
                    onChange={(event) =>
                      setAiConstraints((prev) => ({ ...prev, defaultDurationMin: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="ai-location" className="block text-sm font-medium text-gray-800">
                    Default location
                  </label>
                  <input
                    id="ai-location"
                    type="text"
                    value={aiConstraints.defaultLocation}
                    onChange={(event) =>
                      setAiConstraints((prev) => ({ ...prev, defaultLocation: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <fieldset className="rounded-lg border border-gray-200 p-4">
                <legend className="text-sm font-medium text-gray-800">Preferred days</legend>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PREFERRED_DAYS.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={aiConstraints.preferredDays.includes(day.value)}
                        onChange={(event) => {
                          setAiConstraints((prev) => {
                            const next = event.target.checked
                              ? [...prev.preferredDays, day.value]
                              : prev.preferredDays.filter((item) => item !== day.value);
                            return { ...prev, preferredDays: next };
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" onClick={handleGenerateDraft} disabled={aiLoading}>
                  {aiLoading ? 'Generating…' : 'Generate draft'}
                </Button>
                {aiDraft && (
                  <>
                    <Button type="button" variant="outline" onClick={handleGenerateDraft} disabled={aiLoading}>
                      Regenerate
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelDraft}>
                      Cancel draft
                    </Button>
                  </>
                )}
              </div>

              {aiServerError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {aiServerError}
                </div>
              )}
            </div>

            {aiDraft && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Draft plan</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Edit the draft before applying it. Changes are saved only when you click Apply.
                  </p>
                </div>

                {aiSummaryErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    <p className="font-semibold mb-1">Please fix the following issues:</p>
                    <ul className="list-disc list-inside">
                      {aiSummaryErrors.map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Card>
                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="ai-training-title" className="block text-sm font-medium text-gray-800">
                        Training title <span className="text-red-600">(required)</span>
                      </label>
                      <input
                        id="ai-training-title"
                        type="text"
                        value={aiDraft.training.title}
                        onChange={(event) =>
                          updateDraft((draft) => ({
                            ...draft,
                            training: { ...draft.training, title: event.target.value }
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-invalid={!!aiFieldErrors['training.title']}
                        aria-describedby={aiFieldErrors['training.title'] ? 'ai-training-title-error' : undefined}
                      />
                      {aiFieldErrors['training.title'] && (
                        <p id="ai-training-title-error" className="mt-2 text-sm text-red-600" role="alert">
                          {aiFieldErrors['training.title']}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="ai-training-description" className="block text-sm font-medium text-gray-800">
                        Training description
                      </label>
                      <textarea
                        id="ai-training-description"
                        rows={4}
                        value={aiDraft.training.description}
                        onChange={(event) =>
                          updateDraft((draft) => ({
                            ...draft,
                            training: { ...draft.training, description: event.target.value }
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  {aiDraft.levels.map((level) => (
                    <Card key={level.levelIndex}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">Level {level.levelIndex}</h4>
                        {aiFieldErrors[`levels.${level.levelIndex}.title`] && (
                          <span className="text-xs text-red-600" role="alert">
                            {aiFieldErrors[`levels.${level.levelIndex}.title`]}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800">
                            Level title <span className="text-red-600">(required)</span>
                          </label>
                          <input
                            type="text"
                            value={level.title}
                            onChange={(event) =>
                              updateLevel(level.levelIndex, (current) => ({ ...current, title: event.target.value }))
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-800">
                              Outcomes <span className="text-red-600">(min 2)</span>
                            </label>
                            {aiFieldErrors[`levels.${level.levelIndex}.outcomes`] && (
                              <span className="text-xs text-red-600" role="alert">
                                {aiFieldErrors[`levels.${level.levelIndex}.outcomes`]}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-2">
                            {level.outcomes.map((outcome, index) => (
                              <div key={`${level.levelIndex}-outcome-${index}`} className="flex gap-2">
                                <input
                                  type="text"
                                  value={outcome}
                                  onChange={(event) =>
                                    updateLevel(level.levelIndex, (current) => {
                                      const next = [...current.outcomes];
                                      next[index] = event.target.value;
                                      return { ...current, outcomes: next };
                                    })
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={level.outcomes.length <= 2}
                                  onClick={() =>
                                    updateLevel(level.levelIndex, (current) => ({
                                      ...current,
                                      outcomes: current.outcomes.filter((_, idx) => idx !== index)
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={level.outcomes.length >= 6}
                              onClick={() =>
                                updateLevel(level.levelIndex, (current) => ({
                                  ...current,
                                  outcomes: [...current.outcomes, '']
                                }))
                              }
                            >
                              Add outcome
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {level.sessions.map((session) => (
                            <details key={`${level.levelIndex}-${session.sessionIndex}`} className="rounded-lg border border-gray-200 p-4">
                              <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                                Session {session.sessionIndex}: {session.title || 'Untitled'}
                              </summary>
                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Title</label>
                                  <input
                                    type="text"
                                    value={session.title}
                                    onChange={(event) =>
                                      updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                        ...current,
                                        title: event.target.value
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                  {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.title`] && (
                                    <p className="mt-1 text-xs text-red-600" role="alert">
                                      {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.title`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Objective</label>
                                  <input
                                    type="text"
                                    value={session.objective}
                                    onChange={(event) =>
                                      updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                        ...current,
                                        objective: event.target.value
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                  {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.objective`] && (
                                    <p className="mt-1 text-xs text-red-600" role="alert">
                                      {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.objective`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Duration (min)</label>
                                  <input
                                    type="number"
                                    min={30}
                                    max={240}
                                    value={session.durationMin}
                                    onChange={(event) =>
                                      updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                        ...current,
                                        durationMin: Number(event.target.value)
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                  {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.durationMin`] && (
                                    <p className="mt-1 text-xs text-red-600" role="alert">
                                      {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.durationMin`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Start date/time</label>
                                  <input
                                    type="datetime-local"
                                    value={toInputDateTime(session.startAt || '')}
                                    onChange={(event) =>
                                      updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                        ...current,
                                        startAt: normalizeDateTime(event.target.value)
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Location</label>
                                  <input
                                    type="text"
                                    value={session.location || ''}
                                    onChange={(event) =>
                                      updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                        ...current,
                                        location: event.target.value
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Modality</label>
                                  <p className="mt-2 text-sm text-gray-600">IN_PERSON</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700">
                                    Accessibility notes <span className="text-red-600">(min 2)</span>
                                  </label>
                                  <div className="mt-2 space-y-2">
                                    {session.accessibilityNotes.map((note, noteIndex) => (
                                      <div key={`note-${level.levelIndex}-${session.sessionIndex}-${noteIndex}`} className="flex gap-2">
                                        <input
                                          type="text"
                                          value={note}
                                          onChange={(event) =>
                                            updateSession(level.levelIndex, session.sessionIndex, (current) => {
                                              const next = [...current.accessibilityNotes];
                                              next[noteIndex] = event.target.value;
                                              return { ...current, accessibilityNotes: next };
                                            })
                                          }
                                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={session.accessibilityNotes.length <= 2}
                                          onClick={() =>
                                            updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                              ...current,
                                              accessibilityNotes: current.accessibilityNotes.filter((_, idx) => idx !== noteIndex)
                                            }))
                                          }
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.accessibilityNotes`] && (
                                    <p className="mt-1 text-xs text-red-600" role="alert">
                                      {aiFieldErrors[`levels.${level.levelIndex}.sessions.${session.sessionIndex}.accessibilityNotes`]}
                                    </p>
                                  )}
                                  <div className="mt-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={session.accessibilityNotes.length >= 8}
                                      onClick={() =>
                                        updateSession(level.levelIndex, session.sessionIndex, (current) => ({
                                          ...current,
                                          accessibilityNotes: [...current.accessibilityNotes, '']
                                        }))
                                      }
                                    >
                                      Add note
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" onClick={handleApplyDraft} disabled={aiApplying}>
                    {aiApplying ? 'Applying…' : 'Apply'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelDraft}>
                    Cancel draft
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {isAuto && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AUTO structure</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Generate 4 levels and 6 sessions per level. This writes to the database only after confirmation.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={training.structureStatus === 'GENERATED' || isGenerating}
                aria-haspopup="dialog"
              >
                {training.structureStatus === 'GENERATED' ? 'Structure already generated' : 'Generate structure'}
              </Button>
            </div>
          </Card>
        )}

        {isManual && (
          <div className="space-y-4">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Step A: Create levels</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Progress: {levelsCreated}/{TOTAL_LEVELS} levels created.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateNextLevel}
                  disabled={missingLevelIndices.length === 0 || isCreatingLevel}
                >
                  {missingLevelIndices.length === 0 ? 'All levels created' : `Create level ${missingLevelIndices[0]}`}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: TOTAL_LEVELS }, (_, idx) => idx + 1).map((levelIndex) => {
                  const level = levels.find((item) => item.levelIndex === levelIndex);
                  return (
                    <div
                      key={levelIndex}
                      className={`rounded-lg border px-4 py-3 text-sm ${
                        level ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">Level {levelIndex}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {level ? 'Created' : 'Not created yet'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Step B: Create sessions per level</h2>
                <p className="text-sm text-gray-600">
                  Create sessions level by level. Each level requires 6 sessions.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {levels.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Create at least one level to start adding sessions.
                  </p>
                )}
                {levels.map((level) => {
                  const missingSessions = getMissingSessionIndices(level);
                  const createdCount = TOTAL_SESSIONS - missingSessions.length;
                  return (
                    <div key={level.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Level {level.levelIndex}: {createdCount}/{TOTAL_SESSIONS} sessions created
                          </p>
                          <p className="text-xs text-gray-500">
                            Next missing session: {missingSessions[0] ? `#${missingSessions[0]}` : 'None'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateNextSession(level)}
                          disabled={missingSessions.length === 0 || activeSessionCreateLevel === level.id}
                        >
                          {missingSessions.length === 0
                            ? 'All sessions created'
                            : `Create session ${missingSessions[0]}`}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Levels & sessions</h2>
            <p className="text-xs text-gray-500">Accordion view with schedule editing</p>
          </div>
          <div className="mt-4 space-y-3">
            {levels.length === 0 && (
              <p className="text-sm text-gray-500">No levels yet.</p>
            )}
            {levels.map((level) => {
              const isExpanded = expandedLevels[level.id] ?? false;
              const missingSessions = getMissingSessionIndices(level);
              return (
                <div key={level.id} className="rounded-lg border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleLevel(level.id)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-expanded={isExpanded}
                    aria-controls={`level-panel-${level.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Level {level.levelIndex}</p>
                      <p className="text-xs text-gray-500">{level.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={missingSessions.length === 0 ? 'success' : 'warning'} size="sm">
                        {level.sessions.length}/{TOTAL_SESSIONS}
                      </Badge>
                      <i
                        className={`ri-arrow-down-s-line text-xl text-gray-500 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      ></i>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      id={`level-panel-${level.id}`}
                      role="region"
                      aria-label={`Sessions for level ${level.levelIndex}`}
                      className="border-t border-gray-200 px-4 py-4 space-y-3"
                    >
                      {isManual && missingSessions.length > 0 && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <span>Missing sessions: {missingSessions.join(', ')}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateNextSession(level)}
                            disabled={activeSessionCreateLevel === level.id}
                          >
                            Create session {missingSessions[0]}
                          </Button>
                        </div>
                      )}

                      {level.sessions.length === 0 && (
                        <p className="text-sm text-gray-500">No sessions yet for this level.</p>
                      )}

                      {level.sessions.map((session) => {
                        const isEditing = editingSessionId === session.id;
                        return (
                          <div key={session.id} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  Session {session.sessionIndex}: {session.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Status: {getStatusLabel(session.status)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Start: {formatDateTime(session.startAt)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Duration: {session.durationMin ?? 120} min
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Location: {session.location || 'Not set'}
                                </p>
                              </div>
                              {!isEditing && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditingSession(session)}
                                >
                                  Edit schedule
                                </Button>
                              )}
                            </div>

                            {isEditing && scheduleDraft && (
                              <form
                                onSubmit={handleScheduleSubmit}
                                className="mt-4 grid gap-4 sm:grid-cols-2"
                              >
                                <div>
                                  <label htmlFor={`startAt-${session.id}`} className="block text-xs font-medium text-gray-700">
                                    Start date/time
                                  </label>
                                  <input
                                    id={`startAt-${session.id}`}
                                    type="datetime-local"
                                    name="startAt"
                                    value={scheduleDraft.startAt}
                                    onChange={handleScheduleChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`durationMin-${session.id}`} className="block text-xs font-medium text-gray-700">
                                    Duration (minutes)
                                  </label>
                                  <input
                                    id={`durationMin-${session.id}`}
                                    type="number"
                                    name="durationMin"
                                    min={30}
                                    value={scheduleDraft.durationMin}
                                    onChange={handleScheduleChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    aria-invalid={!!scheduleErrors.durationMin}
                                    aria-describedby={scheduleErrors.durationMin ? `duration-error-${session.id}` : undefined}
                                  />
                                  {scheduleErrors.durationMin && (
                                    <p id={`duration-error-${session.id}`} className="mt-1 text-xs text-red-600" role="alert">
                                      {scheduleErrors.durationMin}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label htmlFor={`location-${session.id}`} className="block text-xs font-medium text-gray-700">
                                    Location
                                  </label>
                                  <input
                                    id={`location-${session.id}`}
                                    type="text"
                                    name="location"
                                    value={scheduleDraft.location}
                                    onChange={handleScheduleChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`status-${session.id}`} className="block text-xs font-medium text-gray-700">
                                    Status <span className="text-red-600">(required)</span>
                                  </label>
                                  <select
                                    id={`status-${session.id}`}
                                    name="status"
                                    value={scheduleDraft.status}
                                    onChange={handleScheduleChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    aria-invalid={!!scheduleErrors.status}
                                    aria-describedby={scheduleErrors.status ? `status-error-${session.id}` : undefined}
                                  >
                                    <option value="PLANNED">PLANNED</option>
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                  {scheduleErrors.status && (
                                    <p id={`status-error-${session.id}`} className="mt-1 text-xs text-red-600" role="alert">
                                      {scheduleErrors.status}
                                    </p>
                                  )}
                                </div>
                                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                                  <Button type="button" variant="outline" onClick={cancelEditingSession}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isScheduleSaving}>
                                    {isScheduleSaving ? 'Saving…' : 'Save schedule'}
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </main>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true"></div>
          <div ref={confirmDialogRef} className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">Generate structure?</h2>
            <p className="text-sm text-gray-600 mt-2">
              This will create 4 levels and 6 sessions per level. It writes to the database only when you confirm.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleGenerateStructure} disabled={isGenerating}>
                {isGenerating ? 'Generating…' : 'Confirm and generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

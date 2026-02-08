import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import StatCard from '../../components/feature/StatCard';
import Card from '../../components/base/Card';
import Badge from '../../components/base/Badge';
import Button from '../../components/base/Button';
import { authService } from '../../services/auth.service';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';
import { userService } from '../../services/user.service';
import { sessionService } from '../../services/session.service';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [students, setEleves] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [pendingEleves, setPendingEleves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [summaryLoading, setResumeLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState('');
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'FORMATEUR'
  });
  const [trainerErrors, setTrainerErrors] = useState<Record<string, string>>({});
  const [isTrainerSubmitting, setIsTrainerSubmitting] = useState(false);
  const [trainerSuccess, setTrainerSuccess] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState('');
  const trainerModalRef = useRef<HTMLDivElement>(null);
  const trainerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  const profile = authService.getUserProfile();
  const userRole = profile?.role || '';
  const userEmail = profile?.email || 'Utilisateur';
  const userName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
    (userEmail ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : 'Utilisateur');

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    FORMATEUR: 'Formateur',
    RESPONSABLE: 'Responsable',
    ELEVE: 'Élève'
  };
  const roleLabel = roleLabels[userRole] || 'Utilisateur';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setResumeLoading(true);
      try {
        const [studentsData, trainingsData, sessionsData] = await Promise.all([
          studentService.getProgressAll(),
          trainingService.getAll(),
          sessionService.getAll()
        ]);
        setEleves(studentsData || []);
        setTrainings(trainingsData || []);
        setSessions(sessionsData || []);

        if (userRole === 'ADMIN') {
          const [pendingData, usersData] = await Promise.all([
            studentService.getPending(),
            userService.getAll()
          ]);
          setPendingEleves(pendingData || []);
          setUsers(usersData || []);
        } else {
          setPendingEleves([]);
          setUsers([]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setResumeLoading(false);
        setLiveMessage('Tableau de bord mis à jour.');
      }
    };

    loadData();
  }, [userRole]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const periodLabel = selectedPeriod === 'week' ? 'Semaine' : selectedPeriod === 'month' ? 'Mois' : 'Année';

  const formatSessionDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const formatSessionTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const normalizeStudent = (student: any) => {
    const trainingId = student.training?.id || student.trainingId || null;
    const totalSessions = student.totalSessions || 24;
    const completedSessions = student.completedSessions || 0;
    const attendanceRate = student.attendanceRate || (totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0);
    const eligibleForCertification = student.eligibleForCertification || (completedSessions >= totalSessions && attendanceRate >= 80);
    return {
      ...student,
      trainingId,
      totalSessions,
      completedSessions,
      attendanceRate,
      eligibleForCertification
    };
  };

  const normalizedEleves = students.map(normalizeStudent);
  const totalEleves = normalizedEleves.length;
  const pendingStudentCount = pendingEleves.length;
  const staffCount = users.length;
  const statusValue = (status: any) => (status ? String(status) : '').toLowerCase();
  const activeTrainings = trainings.filter(t => statusValue(t.status) === 'active').length;
  const upcomingTrainings = trainings.filter(t => statusValue(t.status) === 'upcoming').length;
  const completedTrainings = trainings.filter(t => statusValue(t.status) === 'completed').length;
  const eligibleForCert = normalizedEleves.filter(s => s.eligibleForCertification).length;
  const avgPresenceRate = totalEleves > 0
    ? Math.round(normalizedEleves.reduce((sum, student) => sum + (student.attendanceRate || 0), 0) / totalEleves)
    : 0;

  const atRiskEleves = normalizedEleves.filter(s => (s.attendanceRate || 0) < 80);
  const watchEleves = normalizedEleves.filter(s => (s.attendanceRate || 0) >= 80 && (s.attendanceRate || 0) < 90);
  const criticalEleves = normalizedEleves.filter(s => (s.attendanceRate || 0) < 60);

  const sessionsWithDate = sessions
    .map((session) => ({
      ...session,
      startDate: session.startAt ? new Date(session.startAt) : null
    }))
    .filter((session) => session.startDate && !Number.isNaN(session.startDate.getTime()));

  const upcomingSessions = sessionsWithDate
    .filter((session) => session.startDate >= new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const todaySessions = sessionsWithDate.filter((session) => isSameDay(session.startDate, new Date()));
  const upcomingSessionsPreview = upcomingSessions.slice(0, 5);
  const todaySessionsPreview = todaySessions.slice(0, 4);
  const sessionsWithoutDate = sessions.filter((session) => !session.startAt).length;

  const pendingPreview = pendingEleves.slice(0, 5);

  const aiInsights = [
    pendingStudentCount > 0 ? `${pendingStudentCount} inscription(s) élève en attente de validation.` : null,
    avgPresenceRate < 80 ? `Taux moyen de présence à ${avgPresenceRate}%. Prévoir un rappel collectif.` : null,
    criticalEleves.length > 0 ? `${criticalEleves.length} élève(s) en risque critique (< 60%).` : null,
    watchEleves.length > 0 ? `${watchEleves.length} élève(s) à surveiller (80-90%).` : null,
    sessionsWithoutDate > 0 ? `${sessionsWithoutDate} séance(s) n'ont pas encore de date planifiée.` : null,
    activeTrainings === 0 ? 'Aucune formation active. Pensez à activer un parcours.' : null,
    eligibleForCert > 0 ? `${eligibleForCert} élève(s) éligibles à la certification.` : null,
    completedTrainings > 0 ? `${completedTrainings} formation(s) terminée(s) ce cycle.` : null
  ].filter(Boolean);

  if (aiInsights.length === 0) {
    aiInsights.push('Tous les indicateurs sont stables.');
  }

  const headerKpis = userRole === 'ADMIN'
    ? [
        { label: 'Sessions aujourd\'hui', value: todaySessions.length, helper: 'Planifiées' },
        { label: 'Liste d\'attente', value: pendingStudentCount, helper: 'Inscriptions' },
        { label: 'Formations actives', value: activeTrainings, helper: 'En cours' },
        { label: 'Présence moyenne', value: `${avgPresenceRate}%`, helper: 'Global' }
      ]
    : [
        { label: 'Sessions aujourd\'hui', value: todaySessions.length, helper: 'Planifiées' },
        { label: 'Formations actives', value: activeTrainings, helper: 'En cours' },
        { label: 'Élèves suivis', value: totalEleves, helper: 'Actifs' },
        { label: 'Présence moyenne', value: `${avgPresenceRate}%`, helper: 'Global' }
      ];

  const statCards = [
    {
      title: 'Élèves actifs',
      value: totalEleves,
      icon: 'ri-user-line',
      iconColor: 'bg-teal-600',
      description: 'Inscrits suivis'
    },
    {
      title: 'Présence moyenne',
      value: `${avgPresenceRate}%`,
      icon: 'ri-pulse-line',
      iconColor: 'bg-emerald-600',
      description: `Vue ${periodLabel.toLowerCase()}`
    },
    {
      title: 'Formations actives',
      value: activeTrainings,
      icon: 'ri-book-open-line',
      iconColor: 'bg-amber-600',
      description: `${upcomingTrainings} à venir`
    },
    {
      title: 'Éligibles certification',
      value: eligibleForCert,
      icon: 'ri-award-line',
      iconColor: 'bg-indigo-600',
      description: 'Prêts à certifier'
    }
  ];

  if (userRole === 'ADMIN') {
    statCards.push(
      {
        title: 'Liste d\'attente',
        value: pendingStudentCount,
        icon: 'ri-timer-line',
        iconColor: 'bg-rose-600',
        description: 'Inscriptions en attente'
      },
      {
        title: 'Membres staff',
        value: staffCount,
        icon: 'ri-team-line',
        iconColor: 'bg-slate-600',
        description: 'Comptes actifs'
      },
      {
        title: 'Sessions planifiées',
        value: sessionsWithDate.length,
        icon: 'ri-calendar-2-line',
        iconColor: 'bg-cyan-600',
        description: `${sessionsWithoutDate} sans date`
      }
    );
  }

  const resetTrainerForm = () => {
    setTrainerForm({ firstName: '', lastName: '', email: '', role: 'FORMATEUR' });
    setTrainerErrors({});
    setTrainerSuccess(false);
    setCreatedPassword('');
    setEmailSent(null);
    setEmailError('');
  };

  const handleOpenTrainerModal = () => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    resetTrainerForm();
    setIsTrainerModalOpen(true);
  };

  const handleCloseTrainerModal = () => {
    setIsTrainerModalOpen(false);
    resetTrainerForm();
    const activeElement = lastActiveElementRef.current;
    if (activeElement) {
      activeElement.focus();
    }
  };

  const validateTrainerForm = () => {
    const errors: Record<string, string> = {};
    if (!trainerForm.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }
    if (!trainerForm.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }
    if (!trainerForm.email.trim()) {
      errors.email = "L'email est requis";
    }
    setTrainerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTrainerForm()) return;

    setIsTrainerSubmitting(true);
    try {
      const response = await userService.createTrainer(trainerForm);
      setEmailSent(Boolean(response?.emailSent));
      setEmailError(response?.emailError || '');
      if (!response?.emailSent && response?.temporaryPassword) {
        setCreatedPassword(response.temporaryPassword);
      }
      setTrainerSuccess(true);
      setTimeout(() => {
        handleCloseTrainerModal();
      }, 1500);
    } catch (error) {
      console.error('Failed to create user account', error);
      setTrainerErrors({ form: "Impossible d'ajouter le compte. Vérifiez les informations." });
    } finally {
      setIsTrainerSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isTrainerModalOpen) return;
    const dialog = trainerModalRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseTrainerModal();
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
    if (trainerCloseButtonRef.current) {
      trainerCloseButtonRef.current.focus();
    } else {
      first?.focus();
    }

    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isTrainerModalOpen]);

  const sessionsDisplay = todaySessionsPreview.length > 0 ? todaySessionsPreview : upcomingSessionsPreview;
  const sessionsTitle = todaySessionsPreview.length > 0 ? 'Sessions du jour' : 'Prochaines sessions';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        aria-busy={summaryLoading}
      >
        <div className="sr-only" aria-live="polite">
          {summaryLoading ? 'Chargement du tableau de bord...' : liveMessage}
        </div>

        <div className="mb-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-teal-100 font-semibold">Tableau de bord {roleLabel}</p>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" tabIndex={-1}>
                  {getGreeting()}, {userName}
                </h1>
                <p className="text-teal-100">
                  Vue {periodLabel.toLowerCase()} · {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {headerKpis.map((kpi) => (
                  <div key={kpi.label} className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                    <p className="text-xs text-teal-100">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-[11px] text-teal-100">{kpi.helper}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              description={stat.description}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2" aria-labelledby="attendance-overview">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 id="attendance-overview" className="text-xl font-semibold text-gray-900">Aperçu des présences</h2>
                <p className="text-sm text-gray-600">Analyse rapide des indicateurs clés</p>
              </div>
              <div className="flex gap-2" role="tablist" aria-label="Sélection de période">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${
                      selectedPeriod === period
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    role="tab"
                    aria-selected={selectedPeriod === period}
                  >
                    {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4" aria-live="polite">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-600 rounded-lg">
                    <i className="ri-pulse-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Présence moyenne</p>
                    <p className="text-2xl font-bold text-gray-900">{avgPresenceRate}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Basé sur {totalEleves} élève(s)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-amber-600 rounded-lg">
                      <i className="ri-alarm-warning-line text-xl text-white" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Élèves à surveiller</p>
                      <p className="text-2xl font-bold text-gray-900">{watchEleves.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-lg">
                      <i className="ri-alert-line text-xl text-white" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Élèves à risque</p>
                      <p className="text-2xl font-bold text-gray-900">{atRiskEleves.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg">
                    <i className="ri-award-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Certification prête</p>
                    <p className="text-2xl font-bold text-gray-900">{eligibleForCert}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Seuil 80% + sessions complètes</p>
                </div>
              </div>
            </div>
          </Card>

          <Card aria-labelledby="sessions-title">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 id="sessions-title" className="text-xl font-semibold text-gray-900">{sessionsTitle}</h2>
              
            </div>
            <div className="space-y-3">
              {sessionsDisplay.length > 0 ? (
                sessionsDisplay.map((session, index) => {
                  const trainingName = session.training?.name || session.trainingName || session.title || 'Formation';
                  const levelLabel = session.levelNumber ? `Niveau ${session.levelNumber}` : session.level?.levelNumber ? `Niveau ${session.level.levelNumber}` : null;
                  const sessionLabel = session.sessionNumber ? `Séance ${session.sessionNumber}` : null;
                  const startDate = session.startDate as Date;
                  const timeLabel = startDate ? formatSessionTime(startDate) : 'À planifier';
                  const dateLabel = startDate ? formatSessionDate(startDate) : 'Date non planifiée';
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{trainingName}</p>
                          <p className="text-sm text-gray-600">
                            {[levelLabel, sessionLabel].filter(Boolean).join(' · ') || 'Séance en préparation'}
                          </p>
                        </div>
                        <Badge variant="info" size="sm">{timeLabel}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="ri-calendar-2-line" aria-hidden="true"></i>
                        <span>{dateLabel}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <i className="ri-calendar-off-line text-4xl text-gray-300 mb-2" aria-hidden="true"></i>
                  <p className="text-sm text-gray-600">Aucune séance planifiée pour le moment.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className={`grid grid-cols-1 gap-6 ${userRole === 'ADMIN' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <Card aria-labelledby="ai-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="ai-title" className="text-xl font-semibold text-gray-900">Synthèse IA</h2>
              <Badge variant="info" size="sm">Auto</Badge>
            </div>
            <ul className="space-y-3" role="list" aria-label="Recommandations">
              {aiInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" aria-hidden="true"></span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>

          {userRole === 'ADMIN' && (
            <Card aria-labelledby="pending-title">
              <div className="flex items-center justify-between mb-4">
                <h2 id="pending-title" className="text-xl font-semibold text-gray-900">Inscriptions en attente</h2>
                <Badge variant="warning" size="sm">{pendingStudentCount}</Badge>
              </div>
              {pendingPreview.length > 0 ? (
                <div className="space-y-3">
                  {pendingPreview.map((student) => (
                    <div key={student.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="warning" size="sm">En attente</Badge>
                        {student.phone && (
                          <span className="text-xs text-gray-500">{student.phone}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/admin/applications"
                    className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Gérer la liste d'attente
                    <i className="ri-arrow-right-line" aria-hidden="true"></i>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <i className="ri-checkbox-circle-line text-4xl text-green-600 mb-2" aria-hidden="true"></i>
                  <p className="text-sm text-gray-600">Aucune inscription en attente.</p>
                </div>
              )}
            </Card>
          )}

          <Card aria-labelledby="risk-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="risk-title" className="text-xl font-semibold text-gray-900">Élèves à risque</h2>
              <Badge variant="danger" size="sm">{atRiskEleves.length}</Badge>
            </div>
            <div className="space-y-3">
              {atRiskEleves.length > 0 ? (
                atRiskEleves.slice(0, 4).map((student) => (
                  <Link
                    key={student.id}
                    to={`/students/${student.id}`}
                    className="block p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
                      <Badge variant="danger" size="sm">{student.attendanceRate}%</Badge>
                    </div>
                    <p className="text-xs text-gray-600">{student.trainingName || 'Formation en cours'}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-600">Aucun élève à risque pour le moment.</p>
              )}
            </div>
          </Card>

          <Card aria-labelledby="access-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="access-title" className="text-xl font-semibold text-gray-900">Accessibilité & navigation</h2>
              <Badge variant="neutral" size="sm">Aide</Badge>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Navigation clavier: Tab pour avancer, Maj+Tab pour revenir, Entrée/Espace pour activer.</p>
              <p>Commandes rapides: Ctrl+K ouvre la palette de navigation globale.</p>
              <p>Lecture vocale: chaque section possède un titre et des étiquettes lisibles par lecteur d'écran.</p>
            </div>
          </Card>
        </div>
      </main>
      {isTrainerModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainer-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseTrainerModal}
            aria-hidden="true"
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div ref={trainerModalRef} className="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 id="trainer-modal-title" className="text-xl font-semibold text-gray-900">
                  Ajouter un compte
                </h2>
                <button
                  ref={trainerCloseButtonRef}
                  onClick={handleCloseTrainerModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                  aria-label="Fermer la fenêtre"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              <form onSubmit={handleTrainerSubmit} noValidate>
                <div className="px-6 py-5 space-y-5">
                  {trainerErrors.form && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {trainerErrors.form}
                    </div>
                  )}

                  {trainerSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
                      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                        <i className="ri-check-line text-3xl text-green-600" aria-hidden="true"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Compte ajouté</h3>
                      <p className="text-sm text-gray-600">
                        {emailSent
                          ? 'Email envoyé au nouvel utilisateur.'
                          : `Email non envoyé (${emailError || 'vérifiez SMTP'}).`}
                      </p>
                      {createdPassword && !emailSent && (
                        <div className="mt-4 w-full bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                          <div className="font-medium mb-1">Mot de passe temporaire</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm break-all">{createdPassword}</span>
                            <Button type="button" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(createdPassword)}>
                              Copier
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="trainer-firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Prénom <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <input
                            type="text"
                            id="trainer-firstName"
                            name="firstName"
                            value={trainerForm.firstName}
                            onChange={(e) => setTrainerForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${trainerErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          />
                          {trainerErrors.firstName && (
                            <p className="mt-1.5 text-sm text-red-600">{trainerErrors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="trainer-lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nom <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <input
                            type="text"
                            id="trainer-lastName"
                            name="lastName"
                            value={trainerForm.lastName}
                            onChange={(e) => setTrainerForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${trainerErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          />
                          {trainerErrors.lastName && (
                            <p className="mt-1.5 text-sm text-red-600">{trainerErrors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="trainer-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input
                          type="email"
                          id="trainer-email"
                          name="email"
                          value={trainerForm.email}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${trainerErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                        {trainerErrors.email && (
                          <p className="mt-1.5 text-sm text-red-600">{trainerErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="trainer-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Rôle <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <select
                          id="trainer-role"
                          name="role"
                          value={trainerForm.role}
                          onChange={(e) => setTrainerForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors bg-white cursor-pointer"
                        >
                          <option value="FORMATEUR">Formateur</option>
                          <option value="RESPONSABLE">Responsable formation</option>
                        </select>
                      </div>

                      <div className="text-xs text-gray-500">
                        Un mot de passe sera généré automatiquement et envoyé par email.
                      </div>
                    </>
                  )}
                </div>

                {!trainerSuccess && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button type="button" variant="outline" onClick={handleCloseTrainerModal}>
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isTrainerSubmitting}
                      icon={isTrainerSubmitting ? (
                        <i className="ri-loader-4-line animate-spin text-xl" aria-hidden="true"></i>
                      ) : (
                        <i className="ri-user-add-line text-xl" aria-hidden="true"></i>
                      )}
                    >
                      {isTrainerSubmitting ? 'Ajout en cours...' : 'Ajouter'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

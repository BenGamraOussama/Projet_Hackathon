import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import CalendarView from './components/CalendarView';
import { trainingService } from '../../services/training.service';
import { studentService } from '../../services/student.service';
import { attendanceService } from '../../services/attendance.service';
import { levelService } from '../../services/level.service';
import { sessionService } from '../../services/session.service';

type ViewTab = 'list' | 'calendar';

export default function Trainings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [trainings, setTrainings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<number | null>(null);

  const loadTrainings = useCallback(async () => {
    try {
      const data = await trainingService.getAll();
      setTrainings(data);
      if (!selectedTraining && data.length > 0) {
        setSelectedTraining(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load trainings", error);
    }
  }, [selectedTraining]);

  const loadLevels = useCallback(async () => {
    try {
      const data = await levelService.getAll();
      setLevels(data);
    } catch (error) {
      console.error("Failed to load levels", error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentService.getAll();
        const normalized = data.map((student) => {
          const trainingId = student.training?.id ?? student.trainingId ?? null;
          const totalSessions = student.totalSessions ?? 24;
          const completedSessions = student.completedSessions ?? 0;
          const attendanceRate = student.attendanceRate ?? (totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0);
          const eligibleForCertification = student.eligibleForCertification ?? (completedSessions >= totalSessions && attendanceRate >= 80);
          return {
            ...student,
            trainingId,
            currentLevel: student.currentLevel ?? 1,
            status: student.status ?? 'active',
            totalSessions,
            completedSessions,
            attendanceRate,
            eligibleForCertification
          };
      });
      setStudents(normalized);
    } catch (error) {
      console.error("Failed to load students", error);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      const data = await attendanceService.getAll();
      setAttendanceRecords(data);
    } catch (error) {
      console.error("Failed to load attendance", error);
    }
  }, []);
  useEffect(() => {
    loadTrainings();
    loadStudents();
    loadAttendance();
    loadLevels();
    loadSessions();
  }, [loadTrainings, loadStudents, loadAttendance, loadLevels, loadSessions]);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [sessionStatuses, setSessionStatuses] = useState<Record<number, boolean>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    creationMode: 'AUTO'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editSubmitSuccess, setEditSubmitSuccess] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [assignSubmitSuccess, setAssignSubmitSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const assignModalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const editFirstInputRef = useRef<HTMLInputElement>(null);
  const assignSearchRef = useRef<HTMLInputElement>(null);

  const training = selectedTraining ? trainings.find(t => t.id === selectedTraining) : null;
  const levelsForTraining = training
    ? levels
        .filter((level) => (level.training?.id ?? level.trainingId) === training.id)
        .sort((a, b) => Number(a.levelNumber ?? 0) - Number(b.levelNumber ?? 0))
    : [];

  const toggleLevelSessions = (levelId: number) => {
    setExpandedLevels(prev => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  // Initialize session statuses based on dates
  useEffect(() => {
    const initialStatuses: Record<number, boolean> = {};
    const today = new Date();
    sessions.forEach(session => {
      const rawDate = session.startAt ?? session.date;
      const sessionDate = rawDate ? new Date(rawDate) : null;
      initialStatuses[session.id] = sessionDate ? sessionDate < today : false;
    });
    setSessionStatuses(initialStatuses);
  }, [sessions]);

  const toggleSessionStatus = (sessionId: number) => {
    setSessionStatuses(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));

    // Show success toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const getSessionsForLevel = (trainingId: number, levelNumber: number) => {
    return sessions.filter(s => {
      const sessionTrainingId = s.training?.id ?? s.trainingId;
      return sessionTrainingId === trainingId && Number(s.levelNumber) === Number(levelNumber);
    });
  };

  const getCompletedCount = (trainingId: number, levelNumber: number) => {
    const levelSessions = sessions.filter(s => {
      const sessionTrainingId = s.training?.id ?? s.trainingId;
      return sessionTrainingId === trainingId && Number(s.levelNumber) === Number(levelNumber);
    });
    return levelSessions.filter(s => sessionStatuses[s.id]).length;
  };

  const getAttendanceStats = (studentId: number, trainingId?: number | null) => {
    const records = attendanceRecords.filter((record) => {
      const recordStudentId = record.student?.id ?? record.studentId;
      return Number(recordStudentId) === Number(studentId);
    });
    const total = records.length;
    const presentCount = records.filter((record) => record.status === 'present' || record.status === 'late').length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    const trainingSessions = trainingId
      ? sessions.filter((session) => (session.training?.id ?? session.trainingId) === trainingId).length
      : 0;
    const totalSessions = trainingSessions > 0 ? trainingSessions : 24;
    return { total, rate, totalSessions };
  };

  const getTrainingEnrolledCount = (trainingId: number) => {
    return students.filter(s => s.trainingId === trainingId).length;
  };

  const getTrainingCompletedCount = (trainingId: number) => {
    return students
      .filter(s => s.trainingId === trainingId)
      .filter(s => {
        const stats = getAttendanceStats(s.id, trainingId);
        return stats.total >= stats.totalSessions && stats.rate >= 80;
      }).length;
  };

  // Focus management for create modal
  useEffect(() => {
    if (isModalOpen) {
      firstInputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else if (!isEditModalOpen) {
      document.body.style.overflow = 'unset';
    }

    return () => {
      if (!isEditModalOpen) document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isEditModalOpen]);

  // Focus management for edit modal
  useEffect(() => {
    if (isEditModalOpen) {
      setTimeout(() => editFirstInputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else if (!isModalOpen) {
      document.body.style.overflow = 'unset';
    }

    return () => {
      if (!isModalOpen) document.body.style.overflow = 'unset';
    };
  }, [isEditModalOpen, isModalOpen]);

  // Focus management for assign modal
  useEffect(() => {
    if (isAssignModalOpen) {
      setTimeout(() => assignSearchRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else if (!isModalOpen && !isEditModalOpen) {
      document.body.style.overflow = 'unset';
    }

    return () => {
      if (!isModalOpen && !isEditModalOpen) document.body.style.overflow = 'unset';
    };
  }, [isAssignModalOpen, isModalOpen, isEditModalOpen]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAssignModalOpen) handleCloseAssignModal();
        else if (isEditModalOpen) handleCloseEditModal();
        else if (isModalOpen) handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isEditModalOpen, isAssignModalOpen]);

  // Trap focus within create modal
  useEffect(() => {
    if (!isModalOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isModalOpen]);

  // Trap focus within edit modal
  useEffect(() => {
    if (!isEditModalOpen) return;

    const modal = editModalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isEditModalOpen]);

  // Trap focus within assign modal
  useEffect(() => {
    if (!isAssignModalOpen) return;

    const modal = assignModalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isAssignModalOpen]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'upcoming',
      creationMode: 'AUTO'
    });
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const handleOpenEditModal = () => {
    if (!training) return;
    setEditFormData({
      name: training.name,
      description: training.description,
      startDate: training.startDate,
      endDate: training.endDate,
      status: training.status
    });
    setEditFormErrors({});
    setEditSubmitSuccess(false);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'upcoming'
    });
    setEditFormErrors({});
    setEditSubmitSuccess(false);
  };

  const handleOpenAssignModal = () => {
    if (!training) return;
    // Pre-select students already enrolled in this training
    const enrolledStudentIds = students
      .filter(s => s.trainingId === training.id)
      .map(s => s.id);
    setSelectedStudents(enrolledStudentIds);
    setAssignSearchQuery('');
    setAssignSubmitSuccess(false);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedStudents([]);
    setAssignSearchQuery('');
    setAssignSubmitSuccess(false);
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleAssignSubmit = async () => {
    setIsAssignSubmitting(true);

    try {
      if (training) {
        await Promise.all(
          selectedStudents.map((studentId) =>
            studentService.update(studentId, { training: { id: training.id } })
          )
        );
        await loadStudents();
      }
    } catch (error) {
      console.error("Failed to assign students", error);
    }

    setIsAssignSubmitting(false);
    setAssignSubmitSuccess(true);

    // Close modal after success message
    setTimeout(() => {
      handleCloseAssignModal();
    }, 2000);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const searchLower = assignSearchQuery.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  // Get students already enrolled in current training
  const getEnrolledStatus = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !training) return null;
    if (student.trainingId === training.id) return 'enrolled';
    if (student.trainingId) return 'other';
    return null;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Training name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Training name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      errors.name = 'Training name is required';
    } else if (editFormData.name.trim().length < 3) {
      errors.name = 'Training name must be at least 3 characters';
    }

    if (!editFormData.description.trim()) {
      errors.description = 'Description is required';
    } else if (editFormData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!editFormData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!editFormData.endDate) {
      errors.endDate = 'End date is required';
    } else if (editFormData.startDate && new Date(editFormData.endDate) <= new Date(editFormData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.name,
        description: formData.description,
        creationMode: formData.creationMode,
        levelsCount: 4,
        sessionsPerLevel: 6,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status
      };
      await trainingService.create(payload);
      await loadTrainings();
      await loadLevels();
      await loadSessions();
    } catch (error) {
      console.error("Failed to create training", error);
    }

    setIsSubmitting(false);
    setSubmitSuccess(true);

    // Close modal after success message
    setTimeout(() => {
      handleCloseModal();
    }, 2000);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    setIsEditSubmitting(true);

    try {
      if (training) {
        await trainingService.update(training.id, editFormData);
        await loadTrainings();
        await loadLevels();
        await loadSessions();
      }
    } catch (error) {
      console.error("Failed to update training", error);
    }

    setIsEditSubmitting(false);
    setEditSubmitSuccess(true);

    // Close modal after success message
    setTimeout(() => {
      handleCloseEditModal();
    }, 2000);
  };

  const handleGenerateStructure = async () => {
    if (!training) return;
    try {
      await trainingService.generateStructure(training.id);
      await loadLevels();
      await loadSessions();
      await loadTrainings();
    } catch (error) {
      console.error("Failed to generate structure", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          className="fixed top-4 right-4 z-50 animate-slide-in-right"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 flex items-center gap-3 min-w-[300px]">
            <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full flex-shrink-0">
              <i className="ri-check-line text-xl text-green-600" aria-hidden="true"></i>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Statut mis à jour</p>
              <p className="text-xs text-gray-600">Le statut de la session a été modifié</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Fermer la notification"
            >
              <i className="ri-close-line text-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Formations</h1>
            <p className="text-base text-gray-600">Créez et gérez les programmes de formation</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/trainings/new')}
            >
              Nouveau parcours
            </Button>
            <Button
              variant="primary"
              icon={<i className="ri-add-line text-xl" aria-hidden="true"></i>}
              onClick={handleOpenModal}
              aria-haspopup="dialog"
            >
              Créer une formation
            </Button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'list'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <i className="ri-list-check text-lg" aria-hidden="true"></i>
            Liste des formations
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'calendar'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <i className="ri-calendar-line text-lg" aria-hidden="true"></i>
            Vue calendrier
          </button>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <CalendarView trainings={trainings} sessions={sessions} />
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Toutes les formations</h2>
                <div className="space-y-2">
                  {trainings.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTraining(t.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${selectedTraining === t.id
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                        <Badge
                          variant={t.status === 'active' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {t.status === 'active' ? 'Actif' : 'À venir'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{t.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <i className="ri-user-line" aria-hidden="true"></i>
                          {getTrainingEnrolledCount(t.id)}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
                          {getTrainingCompletedCount(t.id)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {training ? (
                <div className="space-y-6">
                  <Card>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{training.name}</h2>
                        <p className="text-base text-gray-600 mb-4">{training.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <i className="ri-calendar-line" aria-hidden="true"></i>
                            {new Date(training.startDate).toLocaleDateString('fr-FR')} - {new Date(training.endDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-2">
                            <i className="ri-settings-3-line" aria-hidden="true"></i>
                            {training.creationMode === 'AUTO' ? 'Auto' : 'Manual'}
                          </span>
                          <span className="flex items-center gap-2">
                            <i className="ri-user-line" aria-hidden="true"></i>
                            {getTrainingEnrolledCount(training.id)} inscrits
                          </span>
                          <span className="flex items-center gap-2">
                            <i className="ri-award-line" aria-hidden="true"></i>
                            {getTrainingCompletedCount(training.id)} terminés
                          </span>
                        </div>
                      </div>
                      <Badge variant={training.status === 'active' ? 'success' : 'neutral'}>
                        {training.status === 'active' ? 'Actif' : 'À venir'}
                      </Badge>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/trainings/${training.id}`)}
                      >
                        <i className="ri-external-link-line" aria-hidden="true"></i>
                        Voir la fiche
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenEditModal}
                        aria-haspopup="dialog"
                      >
                        <i className="ri-edit-line" aria-hidden="true"></i>
                        Modifier
                      </Button>
                      {training.creationMode === 'AUTO' && (training.structureStatus !== 'GENERATED') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateStructure}
                        >
                          <i className="ri-magic-line" aria-hidden="true"></i>
                          Generer la structure
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAssignModal}
                        aria-haspopup="dialog"
                      >
                        <i className="ri-user-add-line" aria-hidden="true"></i>
                        Assigner des élèves
                      </Button>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Niveaux de formation</h3>
                    <div className="space-y-4">
                      {levelsForTraining.map((level) => {
                        const levelSessions = getSessionsForLevel(training.id, level.levelNumber)
                          .sort((a: any, b: any) => Number(a.sessionNumber ?? 0) - Number(b.sessionNumber ?? 0));
                        const completedCount = getCompletedCount(training.id, level.levelNumber);
                        const totalSessions = levelSessions.length > 0 ? levelSessions.length : 6;
                        const progressPercent = totalSessions > 0
                          ? Math.round((completedCount / totalSessions) * 100)
                          : 0;
                        const isExpanded = expandedLevels[level.id] || false;

                        return (
                          <div
                            key={level.id}
                            className="p-6 bg-gradient-to-r from-teal-50 to-white rounded-lg border-2 border-teal-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-lg font-bold text-lg">
                                  {level.levelNumber}
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{level.name}</h4>
                                  <p className="text-sm text-gray-600">{level.description}</p>
                                </div>
                              </div>
                              <Badge variant="info" size="sm">
                                {totalSessions} sessions
                              </Badge>
                            </div>

                            <div className="mt-4 pt-4 border-t border-teal-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progression des sessions</span>
                                <span className="font-medium text-gray-900">{completedCount}/{totalSessions} terminées</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercent}%` }}
                                  role="progressbar"
                                  aria-valuenow={progressPercent}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`Progression niveau ${level.levelNumber}`}
                                ></div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                fullWidth
                                onClick={() => toggleLevelSessions(level.id)}
                                aria-expanded={isExpanded}
                                aria-controls={`sessions-panel-${level.id}`}
                              >
                                <i className={`${isExpanded ? 'ri-arrow-up-s-line' : 'ri-list-check'} mr-1`} aria-hidden="true"></i>
                                {isExpanded ? 'Masquer les sessions' : 'Voir les sessions'}
                              </Button>
                            </div>

                            {isExpanded && (
                              <div
                                id={`sessions-panel-${level.id}`}
                                className="mt-4 pt-4 border-t border-teal-200"
                                role="region"
                                aria-label={`Sessions du Niveau ${level.levelNumber} - ${level.name}`}
                              >
                                <div className="space-y-2">
                                  {levelSessions.map((session) => {
                                    const rawDate = session.startAt ?? session.date;
                                    const sessionDate = rawDate ? new Date(rawDate) : null;
                                    const isPast = sessionDate ? sessionDate < new Date() : false;
                                    const isCompleted = sessionStatuses[session.id];

                                    return (
                                      <div
                                        key={session.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isCompleted
                                            ? 'bg-green-50 border-green-200'
                                            : isPast
                                              ? 'bg-amber-50 border-amber-200'
                                              : 'bg-white border-gray-200'
                                          }`}
                                      >
                                        <button
                                          onClick={() => toggleSessionStatus(session.id)}
                                          className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 ${isCompleted
                                              ? 'bg-green-600 text-white hover:bg-green-700'
                                              : isPast
                                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                            }`}
                                          aria-label={`Marquer la session ${session.sessionNumber} comme ${isCompleted ? 'non terminée' : 'terminée'}`}
                                          title={`Cliquer pour marquer comme ${isCompleted ? 'non terminée' : 'terminée'}`}
                                        >
                                          {isCompleted ? (
                                            <i className="ri-check-line text-sm" aria-hidden="true"></i>
                                          ) : (
                                            <span className="text-xs font-bold">{session.sessionNumber}</span>
                                          )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {session.title}
                                          </p>
                                          <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <i className="ri-calendar-line" aria-hidden="true"></i>
                                              {sessionDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <i className="ri-time-line" aria-hidden="true"></i>
                                              {session.durationMin ?? session.duration ?? 120} min
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                          {isCompleted ? (
                                            <Badge variant="success" size="sm">
                                              <i className="ri-check-line mr-1" aria-hidden="true"></i>
                                              Terminée
                                            </Badge>
                                          ) : isPast ? (
                                            <Badge variant="warning" size="sm">
                                              <i className="ri-error-warning-line mr-1" aria-hidden="true"></i>
                                              Manquée
                                            </Badge>
                                          ) : (
                                            <Badge variant="neutral" size="sm">
                                              <i className="ri-calendar-event-line mr-1" aria-hidden="true"></i>
                                              À venir
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-3 p-3 bg-teal-50/50 rounded-lg flex items-center justify-between text-xs text-gray-600">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
                                      Terminées: {levelSessions.filter(s => sessionStatuses[s.id]).length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                      Manquées: {levelSessions.filter(s => !sessionStatuses[s.id] && new Date(s.date) < new Date()).length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block"></span>
                                      À venir: {levelSessions.filter(s => !sessionStatuses[s.id] && new Date(s.date) >= new Date()).length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card>
                  <div className="text-center py-16">
                    <i className="ri-book-open-line text-6xl text-gray-300 mb-4" aria-hidden="true"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une formation</h3>
                    <p className="text-sm text-gray-600">Choisissez une formation dans la liste pour voir les détails et gérer les niveaux</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Training Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseModal}
            aria-hidden="true"
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              className="relative w-full max-w-xl bg-white rounded-xl shadow-xl transform transition-all"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  Create New Training
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {submitSuccess ? (
                    <div
                      className="flex flex-col items-center justify-center py-8"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                        <i className="ri-check-line text-3xl text-green-600" aria-hidden="true"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Training Created Successfully!</h3>
                      <p className="text-sm text-gray-600">The new training program has been added.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Training Name <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input
                          ref={firstInputRef}
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          aria-required="true"
                          aria-invalid={!!formErrors.name}
                          aria-describedby={formErrors.name ? 'name-error' : undefined}
                          placeholder="e.g., Advanced Web Development"
                        />
                        {formErrors.name && (
                          <p id="name-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Description <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          maxLength={500}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors resize-none ${formErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          aria-required="true"
                          aria-invalid={!!formErrors.description}
                          aria-describedby={formErrors.description ? 'description-error' : 'description-hint'}
                          placeholder="Describe the training program objectives and content..."
                        />
                        <p id="description-hint" className="mt-1 text-xs text-gray-500">
                          {formData.description.length}/500 characters
                        </p>
                        {formErrors.description && (
                          <p id="description-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {formErrors.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            Start Date <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                            <input
                              type="date"
                              id="startDate"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              aria-required="true"
                              aria-invalid={!!formErrors.startDate}
                              aria-describedby={formErrors.startDate ? 'startDate-error' : undefined}
                            />
                          </div>
                          {formErrors.startDate && (
                            <p id="startDate-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {formErrors.startDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            End Date <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                            <input
                              type="date"
                              id="endDate"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              min={formData.startDate || undefined}
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              aria-required="true"
                              aria-invalid={!!formErrors.endDate}
                              aria-describedby={formErrors.endDate ? 'endDate-error' : undefined}
                            />
                          </div>
                          {formErrors.endDate && (
                            <p id="endDate-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {formErrors.endDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="creationMode"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Creation Mode
                        </label>
                        <div className="relative">
                          <i className="ri-settings-3-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <select
                            id="creationMode"
                            name="creationMode"
                            value={formData.creationMode}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white cursor-pointer"
                          >
                            <option value="AUTO">Auto (generate structure)</option>
                            <option value="MANUAL">Manual (create levels/sessions)</option>
                          </select>
                          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"></i>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="status"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Initial Status
                        </label>
                        <div className="relative">
                          <i className="ri-flag-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white cursor-pointer"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                          </select>
                          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"></i>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg">
                        <i className="ri-information-line text-teal-600 text-xl flex-shrink-0 mt-0.5" aria-hidden="true"></i>
                        <div className="text-sm text-teal-800">
                          <p className="font-medium mb-1">Training Structure</p>
                          <p>Auto mode uses the structure generator (4 levels, 6 sessions per level). Manual mode lets you create levels and sessions yourself.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!submitSuccess && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      icon={isSubmitting ? (
                        <i className="ri-loader-4-line animate-spin text-xl" aria-hidden="true"></i>
                      ) : (
                        <i className="ri-add-line text-xl" aria-hidden="true"></i>
                      )}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Training'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Training Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseEditModal}
            aria-hidden="true"
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={editModalRef}
              className="relative w-full max-w-xl bg-white rounded-xl shadow-xl transform transition-all"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-teal-100 rounded-lg">
                    <i className="ri-edit-line text-lg text-teal-600" aria-hidden="true"></i>
                  </div>
                  <h2 id="edit-modal-title" className="text-xl font-semibold text-gray-900">
                    Edit Training
                  </h2>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {editSubmitSuccess ? (
                    <div
                      className="flex flex-col items-center justify-center py-8"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                        <i className="ri-check-line text-3xl text-green-600" aria-hidden="true"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Training Updated Successfully!</h3>
                      <p className="text-sm text-gray-600">Your changes have been saved.</p>
                    </div>
                  ) : (
                    <>
                      {/* Training Name */}
                      <div>
                        <label
                          htmlFor="edit-name"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Training Name <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input
                          ref={editFirstInputRef}
                          type="text"
                          id="edit-name"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${editFormErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          aria-required="true"
                          aria-invalid={!!editFormErrors.name}
                          aria-describedby={editFormErrors.name ? 'edit-name-error' : undefined}
                          placeholder="e.g., Advanced Web Development"
                        />
                        {editFormErrors.name && (
                          <p id="edit-name-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {editFormErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          htmlFor="edit-description"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Description <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <textarea
                          id="edit-description"
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditInputChange}
                          rows={3}
                          maxLength={500}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors resize-none ${editFormErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          aria-required="true"
                          aria-invalid={!!editFormErrors.description}
                          aria-describedby={editFormErrors.description ? 'edit-description-error' : 'edit-description-hint'}
                          placeholder="Describe the training program objectives and content..."
                        />
                        <p id="edit-description-hint" className="mt-1 text-xs text-gray-500">
                          {editFormData.description.length}/500 characters
                        </p>
                        {editFormErrors.description && (
                          <p id="edit-description-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {editFormErrors.description}
                          </p>
                        )}
                      </div>

                      {/* Date Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="edit-startDate"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            Start Date <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                            <input
                              type="date"
                              id="edit-startDate"
                              name="startDate"
                              value={editFormData.startDate}
                              onChange={handleEditInputChange}
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${editFormErrors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              aria-required="true"
                              aria-invalid={!!editFormErrors.startDate}
                              aria-describedby={editFormErrors.startDate ? 'edit-startDate-error' : undefined}
                            />
                          </div>
                          {editFormErrors.startDate && (
                            <p id="edit-startDate-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {editFormErrors.startDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="edit-endDate"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            End Date <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                            <input
                              type="date"
                              id="edit-endDate"
                              name="endDate"
                              value={editFormData.endDate}
                              onChange={handleEditInputChange}
                              min={editFormData.startDate || undefined}
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${editFormErrors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              aria-required="true"
                              aria-invalid={!!editFormErrors.endDate}
                              aria-describedby={editFormErrors.endDate ? 'edit-endDate-error' : undefined}
                            />
                          </div>
                          {editFormErrors.endDate && (
                            <p id="edit-endDate-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {editFormErrors.endDate}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Selection */}
                      <div>
                        <label
                          htmlFor="edit-status"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Status
                        </label>
                        <div className="relative">
                          <i className="ri-flag-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <select
                            id="edit-status"
                            name="status"
                            value={editFormData.status}
                            onChange={handleEditInputChange}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white cursor-pointer"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"></i>
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <i className="ri-alert-line text-amber-600 text-xl flex-shrink-0 mt-0.5" aria-hidden="true"></i>
                        <div className="text-sm text-amber-800">
                          <p className="font-medium mb-1">Important</p>
                          <p>Changing the status or dates may affect enrolled students and scheduled sessions. Please review before saving.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                {!editSubmitSuccess && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseEditModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isEditSubmitting}
                      icon={isEditSubmitting ? (
                        <i className="ri-loader-4-line animate-spin text-xl" aria-hidden="true"></i>
                      ) : (
                        <i className="ri-save-line text-xl" aria-hidden="true"></i>
                      )}
                    >
                      {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {isAssignModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseAssignModal}
            aria-hidden="true"
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={assignModalRef}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl transform transition-all"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-teal-100 rounded-lg">
                    <i className="ri-user-add-line text-lg text-teal-600" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h2 id="assign-modal-title" className="text-xl font-semibold text-gray-900">
                      Assign Students
                    </h2>
                    <p className="text-sm text-gray-500">{training?.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAssignModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5">
                {assignSubmitSuccess ? (
                  <div
                    className="flex flex-col items-center justify-center py-8"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                      <i className="ri-check-line text-3xl text-green-600" aria-hidden="true"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Students Assigned Successfully!</h3>
                    <p className="text-sm text-gray-600">{selectedStudents.length} student(s) have been assigned to this training.</p>
                  </div>
                ) : (
                  <>
                    {/* Search and Select All */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                        <input
                          ref={assignSearchRef}
                          type="text"
                          placeholder="Search students by name or email..."
                          value={assignSearchQuery}
                          onChange={(e) => setAssignSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                          aria-label="Search students"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex-shrink-0"
                      >
                        <i className={`${filteredStudents.every(s => selectedStudents.includes(s.id)) ? 'ri-checkbox-line' : 'ri-checkbox-blank-line'} mr-1`} aria-hidden="true"></i>
                        {filteredStudents.every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    {/* Selected Count */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm text-gray-600">
                        {filteredStudents.length} student(s) found
                      </span>
                      <span className="text-sm font-medium text-teal-600">
                        {selectedStudents.length} selected
                      </span>
                    </div>

                    {/* Student List */}
                    <div className="max-h-[320px] overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <i className="ri-user-search-line text-4xl mb-2" aria-hidden="true"></i>
                          <p className="text-sm">No students found matching your search</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {filteredStudents.map((student) => {
                            const isSelected = selectedStudents.includes(student.id);
                            const enrolledStatus = getEnrolledStatus(student.id);
                            const enrolledTraining = student.trainingId
                              ? trainings.find(t => t.id === student.trainingId)
                              : null;

                            return (
                              <label
                                key={student.id}
                                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-teal-50' : ''
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                  aria-label={`Select ${student.firstName} ${student.lastName}`}
                                />

                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full font-semibold text-sm flex-shrink-0">
                                  {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    {enrolledStatus === 'enrolled' && (
                                      <Badge variant="success" size="sm">
                                        <i className="ri-check-line mr-0.5" aria-hidden="true"></i>
                                        Enrolled
                                      </Badge>
                                    )}
                                    {enrolledStatus === 'other' && (
                                      <Badge variant="warning" size="sm">
                                        <i className="ri-information-line mr-0.5" aria-hidden="true"></i>
                                        In Other
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                  {enrolledStatus === 'other' && enrolledTraining && (
                                    <p className="text-xs text-amber-600 mt-0.5">
                                      Currently in: {enrolledTraining.name}
                                    </p>
                                  )}
                                </div>

                                <div className="flex-shrink-0 text-right hidden sm:block">
                                  <p className="text-xs text-gray-500">Level {student.currentLevel}</p>
                                  <p className="text-xs text-gray-400">
                                    {getAttendanceStats(student.id, student.trainingId).rate}% attendance
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg mt-4">
                      <i className="ri-information-line text-teal-600 text-xl flex-shrink-0 mt-0.5" aria-hidden="true"></i>
                      <div className="text-sm text-teal-800">
                        <p className="font-medium mb-1">Assignment Notes</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li>Students already enrolled in this training are pre-selected</li>
                          <li>Students in other trainings will be transferred when assigned</li>
                          <li>New students will start at Level 1, Session 1</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              {!assignSubmitSuccess && (
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAssignModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isAssignSubmitting || selectedStudents.length === 0}
                    onClick={handleAssignSubmit}
                    icon={isAssignSubmitting ? (
                      <i className="ri-loader-4-line animate-spin text-xl" aria-hidden="true"></i>
                    ) : (
                      <i className="ri-user-add-line text-xl" aria-hidden="true"></i>
                    )}
                  >
                    {isAssignSubmitting ? 'Assigning...' : `Assign ${selectedStudents.length} Student(s)`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

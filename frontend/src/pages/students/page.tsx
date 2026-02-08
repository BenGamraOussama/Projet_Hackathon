import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    trainingId: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);

  useEffect(() => {
    loadStudents();
    loadTrainings();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await studentService.getProgressAll();
      const normalized = data.map((student) => ({
        id: student.studentId || student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        enrollmentDate: student.enrollmentDate,
        status: (student.status || 'APPROVED').toUpperCase(),
        currentLevel: student.currentLevel || 1,
        studentCode: student.studentCode || '',
        trainingId: student.trainingId || null,
        trainingName: student.trainingName || '',
        totalSessions: student.totalSessions || 0,
        completedSessions: student.completedSessions || 0,
        attendanceRate: student.attendanceRate || 0,
        eligibleForCertification: student.eligibleForCertification || false
      }));
      setStudents(normalized);
    } catch (error) {
      console.error("Failed to fetch students", error);
    }
  };

  const loadTrainings = async () => {
    try {
      const data = await trainingService.getAll();
      setTrainings(data);
    } catch (error) {
      console.error("Failed to fetch trainings", error);
    }
  };

  const getPresenceStats = (student: any) => {
    const completedSessions = student.completedSessions || 0;
    const totalSessions = student.totalSessions || 0;
    const rate = student.attendanceRate || 0;
    return { total: completedSessions, rate, completedSessions, totalSessions };
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getTrainingName = (trainingId: number) => {
    return trainings.find(t => t.id === trainingId)?.name || 'Inconnu';
  };

  // Focus management for modal
  useEffect(() => {
    if (isModalOpen) {
      firstInputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  // Trap focus within modal
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      trainingId: ''
    });
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le t?l?phone est requis';
    }

    if (!formData.trainingId) {
      errors.trainingId = 'Please select a training program';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      const payload = {
        ...formData,
        training: formData.trainingId ? { id: Number(formData.trainingId) } : null
      };
      await studentService.create(payload);
      loadStudents();
      setSubmitSuccess(true);
      // Fermer la fen?tre after success message
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (error) {
      console.error("Failed to create student", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Student Management</h1>
            <p className="text-base text-gray-600">Manage student records and track progress</p>
          </div>
          
        </div>

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search-students" className="sr-only">Rechercher des Eleves</label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" aria-hidden="true"></i>
                <input
                  id="search-students"
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  aria-label="Rechercher des Eleves par nom ou email"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${filterStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${filterStatus === 'APPROVED' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Approuves
              </button>
            </div>
          </div>
        </Card>

        <div className="hidden lg:block">
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Liste des Eleves">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Training</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Presence</th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold">
                            {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-500">ID: {student.studentCode || student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{student.email}</p>
                        <p className="text-sm text-gray-500">{student.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{student.trainingName || getTrainingName(student.trainingId)}</p>
                        <p className="text-sm text-gray-500">Level {student.currentLevel}</p>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const stats = getPresenceStats(student);
                          const progress = stats.totalSessions > 0
                            ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                            : 0;
                          return (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                  role="progressbar"
                                  aria-valuenow={progress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`Progress: ${stats.completedSessions} of ${stats.totalSessions} sessions completed`}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-600">{stats.completedSessions}/{stats.totalSessions} sessions</p>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const stats = getPresenceStats(student);
                          return (
                            <Badge variant={stats.rate >= 90 ? 'success' : stats.rate >= 75 ? 'warning' : 'danger'}>
                              {stats.rate}%
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const stats = getPresenceStats(student);
                          const isEligible = stats.completedSessions >= stats.totalSessions && stats.rate >= 80;
                          return isEligible ? (
                            <Badge variant="success">
                              <i className="ri-award-line mr-1" aria-hidden="true"></i>
                              ?ligible
                            </Badge>
                          ) : (
                            <Badge variant="info">In Progress</Badge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/students/${student.id}`}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 rounded cursor-pointer whitespace-nowrap"
                        >
                          View Details
                          <i className="ri-arrow-right-line" aria-hidden="true"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:hidden space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} hover>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold text-lg">
                  {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{student.firstName} {student.lastName}</h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-500">{student.phone}</p>
                </div>
                {(() => {
                  const stats = getPresenceStats(student);
                  const isEligible = stats.completedSessions >= stats.totalSessions && stats.rate >= 80;
                  return isEligible ? (
                    <Badge variant="success" size="sm">
                      <i className="ri-award-line" aria-hidden="true"></i>
                    </Badge>
                  ) : null;
                })()}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Training</p>
                  <p className="text-sm font-medium text-gray-900">{student.trainingName || getTrainingName(student.trainingId)} - Level {student.currentLevel}</p>
                </div>

                <div>
                  {(() => {
                    const stats = getPresenceStats(student);
                    const progress = stats.totalSessions > 0
                      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                      : 0;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-500">Progress</p>
                          <p className="text-xs text-gray-600">{stats.completedSessions}/{stats.totalSessions}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progress: ${stats.completedSessions} of ${stats.totalSessions} sessions completed`}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Taux de pr?sence</p>
                  {(() => {
                    const stats = getPresenceStats(student);
                    return (
                      <Badge variant={stats.rate >= 90 ? 'success' : stats.rate >= 75 ? 'warning' : 'danger'} size="sm">
                        {stats.rate}%
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              <Link to={`/students/${student.id}`}>
                <Button variant="outline" fullWidth size="sm">
                  View Details
                  <i className="ri-arrow-right-line ml-2" aria-hidden="true"></i>
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <i className="ri-user-search-line text-6xl text-gray-300 mb-4" aria-hidden="true"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-sm text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </Card>
        )}
      </main>

      {/* Ajouter un Eleve */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseModal}
            aria-hidden="true"
          ></div>

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  Add New Student
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={handleCloseModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                  aria-label="Fermer la fen?tre"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="px-6 py-5 space-y-5">
                  {submitSuccess ? (
                    <div
                      className="flex flex-col items-center justify-center py-8"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                        <i className="ri-check-line text-3xl text-green-600" aria-hidden="true"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Student Added Successfully!</h3>
                      <p className="text-sm text-gray-600">The new student has been enrolled.</p>
                    </div>
                  ) : (
                    <>
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            First Name <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={firstInputRef}
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.firstName}
                            aria-describedby={formErrors.firstName ? 'firstName-error' : undefined}
                            placeholder="Enter first name"
                          />
                          {formErrors.firstName && (
                            <p id="firstName-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {formErrors.firstName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            Last Name <span className="text-red-500" aria-hidden="true">*</span>
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.lastName}
                            aria-describedby={formErrors.lastName ? 'lastName-error' : undefined}
                            placeholder="Enter last name"
                          />
                          {formErrors.lastName && (
                            <p id="lastName-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <i className="ri-error-warning-line" aria-hidden="true"></i>
                              {formErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Email Address <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <div className="relative">
                          <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? 'email-error' : undefined}
                            placeholder="student@example.com"
                          />
                        </div>
                        {formErrors.email && (
                          <p id="email-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <div className="relative">
                          <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.phone}
                            aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                            placeholder="+1 555-0100"
                          />
                        </div>
                        {formErrors.phone && (
                          <p id="phone-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {formErrors.phone}
                          </p>
                        )}
                      </div>

                      {/* Training Selection */}
                      <div>
                        <label
                          htmlFor="trainingId"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Assign to Training <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <div className="relative">
                          <i className="ri-book-open-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                          <select
                            id="trainingId"
                            name="trainingId"
                            value={formData.trainingId}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors appearance-none bg-white cursor-pointer ${formErrors.trainingId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            aria-required="true"
                            aria-invalid={!!formErrors.trainingId}
                            aria-describedby={formErrors.trainingId ? 'trainingId-error' : undefined}
                          >
                            <option value="">Select a training program</option>
                            {trainings.filter(t => t.status === 'active' || t.status === 'upcoming').map(training => (
                              <option key={training.id} value={training.id}>
                                {training.name} ({training.status === 'upcoming' ? '? venir' : 'Actif'})
                              </option>
                            ))}
                          </select>
                          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"></i>
                        </div>
                        {formErrors.trainingId && (
                          <p id="trainingId-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <i className="ri-error-warning-line" aria-hidden="true"></i>
                            {formErrors.trainingId}
                          </p>
                        )}
                      </div>

                      {/* Info Note */}
                      <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg">
                        <i className="ri-information-line text-teal-600 text-xl flex-shrink-0 mt-0.5" aria-hidden="true"></i>
                        <p className="text-sm text-teal-800">
                          The student will be enrolled at Level 1, Session 1 of the selected training program. You can adjust their progress en retardr from their profile.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                {!submitSuccess && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      icon={isSubmitting ? (
                        <i className="ri-loader-4-line animate-spin text-xl" aria-hidden="true"></i>
                      ) : (
                        <i className="ri-user-add-line text-xl" aria-hidden="true"></i>
                      )}
                    >
                      {isSubmitting ? 'Ajout de l?Eleve...' : 'Ajouter un Eleve'}
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

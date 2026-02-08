import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';
import { sessionService } from '../../services/session.service';
import { certificateService } from '../../services/certificate.service';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  status: string;
  trainingId: number;
  currentLevel: number;
  completedSessions: number;
  totalSessions: number;
  attendanceRate: number;
  eligibleForCertification: boolean;
  blockReason?: string;
  trainingName?: string;
}

export default function Certification() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('info');
  const [isDownloading, setIsDownloading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, trainingsData, sessionsData, certificatesData] = await Promise.all([
          studentService.getProgressAll(),
          trainingService.getAll(),
          sessionService.getAll(),
          certificateService.getAll()
        ]);

        const normalized = studentsData.map((student) => ({
          id: student.studentId ?? student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          enrollmentDate: student.enrollmentDate,
          status: student.status,
          trainingId: student.trainingId ?? null,
          currentLevel: student.currentLevel ?? 1,
          totalSessions: student.totalSessions ?? 0,
          completedSessions: student.completedSessions ?? 0,
          attendanceRate: student.attendanceRate ?? 0,
          eligibleForCertification: student.eligibleForCertification ?? false,
          blockReason: student.blockReason,
          trainingName: student.trainingName
        }));
        setStudents(normalized);
        setTrainings(trainingsData);
        setSessions(sessionsData);
        setCertificates(certificatesData);
      } catch (error) {
        console.error("Impossible de charger les donn?es de certification", error);
      }
    };

    loadData();
  }, []);

  const eligibleStudents = students.filter(s => s.eligibleForCertification);
  const blockedStudents = students.filter(s => !s.eligibleForCertification && s.currentLevel === 4);
  
  const getTrainingName = (trainingId: number) => {
    return trainings.find(t => t.id === trainingId)?.name
      || students.find(s => s.trainingId === trainingId)?.trainingName
      || 'Inconnu';
  };

  const getTrainingSessions = (trainingId: number) => {
    return sessions.filter((session) => (session.training?.id ?? session.trainingId) === trainingId);
  };

  const getTotalLevelsForTraining = (trainingId: number) => {
    const levels = new Set(
      getTrainingSessions(trainingId)
        .map((session) => Number(session.levelNumber))
        .filter((n) => Number.isFinite(n))
    );
    return levels.size > 0 ? levels.size : 4;
  };

  const getBlockedReason = (student: Student) => {
    if (student.blockReason && student.blockReason.trim() !== '') {
      return student.blockReason;
    }
    if (student.completedSessions < student.totalSessions) {
      return `Manque ${student.totalSessions - student.completedSessions} s?ances`;
    }
    if (student.attendanceRate < 80) {
      return `Taux de pr?sence inf?rieur ? 80 % (${student.attendanceRate}%)`;
    }
    return 'Crit?res non atteints';
  };
  
  const handleGenerateCertificate = (student: Student, event?: React.MouseEvent<HTMLButtonElement>) => {
    lastActiveElementRef.current = (event?.currentTarget ? document.activeElement : null) as HTMLElement | null;
    setSelectedStudent(student);
    const existing = certificates.find(
      (certificate) =>
        (certificate.student?.id ?? certificate.studentId) === student.id &&
        (certificate.training?.id ?? certificate.trainingId) === student.trainingId
    );
    if (existing?.certificateId) {
      setCertificateId(existing.certificateId);
      setGenerationSuccess(true);
    } else {
      setCertificateId('');
      setGenerationSuccess(false);
    }
    setShowGenerateModal(true);
  };
  
  const handleConfirmGenerate = async () => {
    if (!selectedStudent) {
      return;
    }
    setIsGenerating(true);
    try {
      const response = await certificateService.create({
        studentId: selectedStudent.id,
        trainingId: selectedStudent.trainingId
      });
      setCertificateId(response.certificateId);
      setGenerationSuccess(true);
      setCertificates((prev) => {
        const exists = prev.find((certificate) => certificate.id === response.id);
        if (exists) {
          return prev.map((certificate) => certificate.id === response.id ? response : certificate);
        }
        return [...prev, response];
      });
    } catch (error: any) {
      setToastMessage(error?.response?.data || 'Impossible de g?n?rer le certificat');
      setToastType('info');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    
    // Simulate PDF generation and download
    setTimeout(() => {
      const totalLevels = selectedStudent ? getTotalLevelsForTraining(selectedStudent.trainingId) : 4;
      const sessionsAttended = selectedStudent?.completedSessions ?? 0;
      // Create a simulated PDF download
      const certificateContent = `
ASTBA - Certificat de r?ussite
=====================================

This certifies that

${selectedStudent?.firstName} ${selectedStudent?.lastName}

has successfully completed

${getTrainingName(selectedStudent?.trainingId || 0)}

Completion Details:
- Levels Completed: ${totalLevels}
- Sessions Attended: ${sessionsAttended}
- Taux de pr?sence: ${selectedStudent?.attendanceRate}%

ID du certificat: ${certificateId}
Issue Date: ${new Date().toLocaleDateString()}

=====================================
ASTBA Training Academy
      `;
      
      const blob = new Blob([certificateContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${selectedStudent?.firstName}_${selectedStudent?.lastName}_${certificateId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsDownloading(false);
      setToastMessage('Certificat t?l?charg? avec succ?s !');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1500);
  };
  
  const handlePreviewDownloadPDF = () => {
    setToastMessage('Please select a student and generate their certificate first to download.');
    setToastType('info');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };
  
  const handlePreviewPrint = () => {
    setToastMessage('Please select a student and generate their certificate first to print.');
    setToastType('info');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const closeModal = useCallback(() => {
    setShowGenerateModal(false);
    setSelectedStudent(null);
    setGenerationSuccess(false);
    const activeElement = lastActiveElementRef.current;
    if (activeElement) {
      activeElement.focus();
    }
  }, []);

  const previewName = selectedStudent
    ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
    : 'Student Name';
  const previewTrainingName = selectedStudent
    ? getTrainingName(selectedStudent.trainingId)
    : 'Training Program Name';
  const previewLevels = selectedStudent
    ? getTotalLevelsForTraining(selectedStudent.trainingId)
    : 4;
  const previewSessions = selectedStudent?.totalSessions ?? 24;
  
  // Focus trap and keyboard handling
  useEffect(() => {
    if (!showGenerateModal) return;
    const dialog = modalRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
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
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else {
      first?.focus();
    }
    
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [showGenerateModal, closeModal]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Toast Notification */}
      {showToast && (
        <div
          className="fixed top-4 right-4 z-50 animate-fade-in"
          role={toastType === 'success' ? 'status' : 'alert'}
          aria-live={toastType === 'success' ? 'polite' : 'assertive'}
          aria-atomic="true"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toastType === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 text-white'
          }`}>
            <i className={`${toastType === 'success' ? 'ri-check-circle-line' : 'ri-information-line'} text-xl`} aria-hidden="true"></i>
            <p className="text-sm font-medium">{toastMessage}</p>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-2 w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors cursor-pointer"
              aria-label="Fermer la notification"
            >
              <i className="ri-close-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      )}
      
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Certification Management</h1>
          <p className="text-base text-gray-600">G?n?rez et g?rez les certificats de formation</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center bg-green-600 rounded-lg">
                <i className="ri-award-line text-3xl text-white" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Eleves ?ligibles</p>
                <p className="text-3xl font-bold text-gray-900">{eligibleStudents.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center bg-amber-600 rounded-lg">
                <i className="ri-alert-line text-3xl text-white" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Eleves bloqu?s</p>
                <p className="text-3xl font-bold text-gray-900">{blockedStudents.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center bg-teal-600 rounded-lg">
                <i className="ri-file-text-line text-3xl text-white" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Certificats ?mis</p>
                <p className="text-3xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">?ligible ? la certification</h2>
              <Badge variant="success">{eligibleStudents.length}</Badge>
            </div>
            
            {eligibleStudents.length > 0 ? (
              <div className="space-y-4">
                {eligibleStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="p-4 bg-green-50 rounded-lg border-2 border-green-200"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-green-600 text-white rounded-full font-semibold text-lg">
                        {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{student.firstName} {student.lastName}</h3>
                        <p className="text-sm text-gray-600">{getTrainingName(student.trainingId)}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <i className="ri-checkbox-circle-line text-green-600" aria-hidden="true"></i>
                            All s?ances completed
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-bar-chart-line text-green-600" aria-hidden="true"></i>
                            {student.attendanceRate}% attendance
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm" 
                        fullWidth
                        onClick={(event) => handleGenerateCertificate(student, event)}
                      >
                        <i className="ri-file-download-line" aria-hidden="true"></i>
                        G?n?rer le certificat
                      </Button>
                      <Button variant="outline" size="sm">
                        <i className="ri-eye-line" aria-hidden="true"></i>
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="ri-award-line text-6xl text-gray-300 mb-4" aria-hidden="true"></i>
                <p className="text-sm text-gray-600">No students eligible for certification yet</p>
              </div>
            )}
          </Card>
          
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bloqu? pour la certification</h2>
              <Badge variant="warning">{blockedStudents.length}</Badge>
            </div>
            
            {blockedStudents.length > 0 ? (
              <div className="space-y-4">
                {blockedStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-amber-600 text-white rounded-full font-semibold text-lg">
                        {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{student.firstName} {student.lastName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{getTrainingName(student.trainingId)}</p>
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-amber-300">
                          <i className="ri-information-line text-amber-600 text-lg mt-0.5" aria-hidden="true"></i>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Why certification is blocked:</p>
                            <p className="text-sm text-gray-700">{getBlockedReason(student)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-white rounded border border-amber-200">
                        <p className="text-xs text-gray-600 mb-1">Progress</p>
                        <p className="font-semibold text-gray-900">{student.completedSessions}/{student.totalSessions}</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-amber-200">
                        <p className="text-xs text-gray-600 mb-1">Presence</p>
                        <p className="font-semibold text-gray-900">{student.attendanceRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="ri-checkbox-circle-line text-6xl text-green-300 mb-4" aria-hidden="true"></i>
                <p className="text-sm text-gray-600">All Level 4 students are eligible</p>
              </div>
            )}
          </Card>
        </div>
        
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Aper?u du certificat</h2>
          <div className="bg-white border-4 border-teal-600 rounded-lg p-12 text-center max-w-3xl mx-auto">
            <div className="mb-6">
              <img 
                src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png" 
                alt="ASTBA Logo" 
                className="h-16 w-auto mx-auto mb-4"
              />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Certificat de r?ussite</h3>
              <p className="text-base text-gray-600">This certifies that</p>
            </div>
            
            <div className="my-8">
              <p className="text-4xl font-bold text-teal-600 mb-4">{previewName}</p>
              <p className="text-lg text-gray-700 mb-2">has successfully completed</p>
              <p className="text-2xl font-semibold text-gray-900 mb-6">{previewTrainingName}</p>
              <p className="text-base text-gray-600">Completed all {previewLevels} levels with {previewSessions} s?ances</p>
            </div>
            
            <div className="flex justify-between items-end pt-8 border-t-2 border-gray-300">
              <div className="text-left">
                <div className="border-t-2 border-gray-900 pt-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">Instructor Signature</p>
                </div>
                <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="text-right">
                <div className="border-t-2 border-gray-900 pt-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">Director Signature</p>
                </div>
                <p className="text-xs text-gray-600">ID du certificat: {certificateId || 'ASTBA-XXXX-0000'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="primary" onClick={handlePreviewPrint}>
              <i className="ri-printer-line" aria-hidden="true"></i>
              Imprimer le certificat
            </Button>
            <Button variant="outline" onClick={handlePreviewDownloadPDF}>
              <i className="ri-download-line" aria-hidden="true"></i>
              Download PDF
            </Button>
          </div>
        </Card>
      </main>
      
      {/* G?n?rer le certificat Modal */}
      {showGenerateModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-certificate-title"
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 id="generate-certificate-title" className="text-xl font-semibold text-gray-900">
                  {generationSuccess ? 'Certificat g?n?r? !' : 'G?n?rer le certificat'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {generationSuccess 
                    ? 'The certificate is ready for download or printing'
                    : `For ${selectedStudent.firstName} ${selectedStudent.lastName}`
                  }
                </p>
              </div>
              <button
                ref={closeButtonRef}
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Fermer la fen?tre"
              >
                <i className="ri-close-line text-xl text-gray-500" aria-hidden="true"></i>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* Success Banner */}
              {generationSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full">
                    <i className="ri-check-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Certificat g?n?r? avec succ?s</p>
                    <p className="text-sm text-green-700">ID du certificat: {certificateId}</p>
                  </div>
                </div>
              )}
              
              {/* Aper?u du certificat */}
              <div className="bg-white border-4 border-teal-600 rounded-lg p-8 md:p-12 text-center print:border-2">
                <div className="mb-6">
                  <img 
                    src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png" 
                    alt="ASTBA Logo" 
                    className="h-14 w-auto mx-auto mb-4"
                  />
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Certificat de r?ussite</h3>
                  <p className="text-base text-gray-600">This certifies that</p>
                </div>
                
                <div className="my-6 md:my-8">
                  <p className="text-3xl md:text-4xl font-bold text-teal-600 mb-4">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-lg text-gray-700 mb-2">has successfully completed</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                    {getTrainingName(selectedStudent.trainingId)}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <i className="ri-stack-line text-teal-600" aria-hidden="true"></i>
                      {getTotalLevelsForTraining(selectedStudent.trainingId)} Levels Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-check-line text-teal-600" aria-hidden="true"></i>
                      {selectedStudent.completedSessions} Sessions Attended
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-bar-chart-line text-teal-600" aria-hidden="true"></i>
                      {selectedStudent.attendanceRate}% Presence
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-end pt-6 md:pt-8 border-t-2 border-gray-300 gap-6">
                  <div className="text-left">
                    <div className="border-t-2 border-gray-900 pt-2 mb-1 min-w-[150px]">
                      <p className="text-sm font-semibold text-gray-900">Instructor Signature</p>
                    </div>
                    <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <i className="ri-award-fill text-5xl text-teal-600" aria-hidden="true"></i>
                    </div>
                    <p className="text-xs text-gray-600">Official Seal</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="border-t-2 border-gray-900 pt-2 mb-1 min-w-[150px]">
                      <p className="text-sm font-semibold text-gray-900">Director Signature</p>
                    </div>
                    <p className="text-xs text-gray-600">ID du certificat: {certificateId}</p>
                  </div>
                </div>
              </div>
              
              {/* Resume des d?tails ?tudiant */}
              {!generationSuccess && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Student Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date d'inscription</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sessions Completed</p>
                      <p className="font-medium text-gray-900">
                        {selectedStudent.completedSessions}/{selectedStudent.totalSessions}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Taux de pr?sence</p>
                      <p className="font-medium text-gray-900">{selectedStudent.attendanceRate}%</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Info Note */}
              {!generationSuccess && (
                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-start gap-3">
                  <i className="ri-information-line text-teal-600 text-lg mt-0.5" aria-hidden="true"></i>
                  <div className="text-sm text-teal-800">
                    <p className="font-medium mb-1">G?n?ration du certificat</p>
                    <p>Once generated, this certificate will be recorded in the system and can be downloaded or printed at any time. The certificate ID will be unique and verifiable.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              {generationSuccess ? (
                <>
                  <Button variant="outline" onClick={handlePrint}>
                    <i className="ri-printer-line" aria-hidden="true"></i>
                    Imprimer le certificat
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="ri-download-line" aria-hidden="true"></i>
                        Download PDF
                      </>
                    )}
                  </Button>
                  <Button variant="success" onClick={closeModal}>
                    <i className="ri-check-line" aria-hidden="true"></i>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={closeModal}>
                    Annuler
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={handleConfirmGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="ri-file-download-line" aria-hidden="true"></i>
                        G?n?rer le certificat
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

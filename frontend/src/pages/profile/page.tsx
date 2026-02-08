import { useState, useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import ProfileHeader from './components/ProfileHeader';
import PersonalInfo from './components/PersonalInfo';
import NotificationsPanel from './components/NotificationsPanel';
import QuickLinks from './components/QuickLinks';
import EditProfileModal, { ProfileFormData } from './components/EditProfileModal';
import { userService } from '../../services/user.service';
import { studentService } from '../../services/student.service';
import { trainingService } from '../../services/training.service';
import { authService } from '../../services/auth.service';

export default function Profile() {
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Formateur',
    organization: 'ASTBA',
    bio: '',
    address: '',
    joinDate: '2020-03-15',
    language: 'Français',
    timezone: 'Africa/Tunis (UTC+1)',
    notifications: {
      email: true,
      sms: false,
      attendance: true,
      certification: true,
      weekly: false
    }
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    studentsManaged: 0,
    trainingsActive: 0,
    sessionsCompleted: 0
  });

  const decodeEscapes = (value: string) => {
    if (!value) return '';
    return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
  };

  const resolveRoleLabel = (role?: string) => {
    if (!role) return 'Formateur';
    if (role === 'ADMIN') return 'Administrateur';
    if (role === 'RESPONSABLE') return 'Responsable formation';
    if (role === 'FORMATEUR') return 'Formateur';
    return role;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await userService.getMe();
        setProfileId(me.id || null);
        setProfile(prev => ({
          ...prev,
          firstName: decodeEscapes(me.firstName || prev.firstName),
          lastName: decodeEscapes(me.lastName || prev.lastName),
          email: me.email || prev.email,
          phone: decodeEscapes(me.phone || prev.phone),
          address: decodeEscapes(me.address || prev.address),
          bio: decodeEscapes(me.careerDescription || prev.bio),
          role: resolveRoleLabel(me.role)
        }));
      } catch (error: any) {
        console.error('Failed to load profile', error);
        const cached = authService.getUserProfile();
        if (cached?.email) {
          setProfile(prev => ({
            ...prev,
            firstName: decodeEscapes(cached.firstName || prev.firstName),
            lastName: decodeEscapes(cached.lastName || prev.lastName),
            email: cached.email || prev.email,
            role: resolveRoleLabel(cached.role)
          }));
        }
        const message = error?.response?.data?.message || error?.response?.data || 'Impossible de charger le profil.';
        setErrorMessage(typeof message === 'string' ? message : 'Impossible de charger le profil.');
      }
    };

    const loadStats = async () => {
      try {
        const [students, trainings] = await Promise.all([
          studentService.getAll(),
          trainingService.getAll()
        ]);
        const normalizedStudents = students.map((student) => {
          const totalSessions = student.totalSessions || 24;
          const completedSessions = student.completedSessions || 0;
          return { totalSessions, completedSessions };
        });
        setStats({
          studentsManaged: students.length,
          trainingsActive: trainings.filter(t => t.status === 'active').length,
          sessionsCompleted: normalizedStudents.reduce((sum, s) => sum + s.completedSessions, 0)
        });
      } catch (error) {
        console.error('Failed to load profile stats', error);
      }
    };

    loadProfile();
    loadStats();
  }, []);

  const handleSave = async (data: ProfileFormData) => {
    if (!profileId) {
      setErrorMessage('Impossible de modifier le profil: identifiant manquant.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      const updated = await userService.updateUser(profileId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        careerDescription: data.bio
      });
      const user = updated?.user || updated;
      setProfile(prev => ({
        ...prev,
        firstName: decodeEscapes(user.firstName || data.firstName),
        lastName: decodeEscapes(user.lastName || data.lastName),
        email: user.email || data.email,
        phone: decodeEscapes(user.phone || data.phone),
        address: decodeEscapes(user.address || data.address),
        bio: decodeEscapes(user.careerDescription || data.bio),
        language: data.language
      }));
      setShowEditModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data || 'Erreur lors de la mise à jour.';
      setErrorMessage(typeof message === 'string' ? message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (key: keyof typeof profile.notifications) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {showToast && (
        <div className="fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg bg-green-600 text-white flex items-center gap-3 animate-fade-in">
          <i className="ri-check-circle-line text-xl" aria-hidden="true"></i>
          <span className="font-medium text-sm">Profil mis à jour avec succès !</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 left-4 z-50 px-6 py-4 rounded-lg shadow-lg bg-red-600 text-white flex items-center gap-3 animate-fade-in">
          <i className="ri-error-warning-line text-xl" aria-hidden="true"></i>
          <span className="font-medium text-sm">{errorMessage}</span>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Fil d'ariane">
          <a href="/dashboard" className="hover:text-teal-600 transition-colors cursor-pointer">Tableau de bord</a>
          <i className="ri-arrow-right-s-line text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Mon Profil</span>
        </nav>

        <div className="mb-8">
          <ProfileHeader
            firstName={profile.firstName}
            lastName={profile.lastName}
            email={profile.email}
            role={profile.role}
            organization={profile.organization}
            joinDate={profile.joinDate}
            onEditClick={() => setShowEditModal(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfo
              bio={profile.bio}
              phone={profile.phone}
              email={profile.email}
              address={profile.address}
              language={profile.language}
              timezone={profile.timezone}
            />
            <NotificationsPanel
              notifications={profile.notifications}
              onToggle={handleNotificationToggle}
            />
          </div>

          <div>
            <QuickLinks stats={stats} />
          </div>
        </div>
      </main>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        initialData={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          address: profile.address,
          language: profile.language
        }}
        saving={saving}
      />
    </div>
  );
}


import { useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import ProfileHeader from './components/ProfileHeader';
import PersonalInfo from './components/PersonalInfo';
import NotificationsPanel from './components/NotificationsPanel';
import QuickLinks from './components/QuickLinks';
import EditProfileModal, { ProfileFormData } from './components/EditProfileModal';
import { userProfileData } from '../../mocks/userProfile';
import { studentsData } from '../../mocks/students';
import { trainingsData } from '../../mocks/trainings';

export default function Profile() {
  const [profile, setProfile] = useState(userProfileData);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const stats = {
    studentsManaged: studentsData.length,
    trainingsActive: trainingsData.filter(t => t.status === 'active').length,
    sessionsCompleted: studentsData.reduce((sum, s) => sum + s.completedSessions, 0)
  };

  const handleSave = (data: ProfileFormData) => {
    setProfile(prev => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      address: data.address,
      language: data.language
    }));
    setShowEditModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg bg-green-600 text-white flex items-center gap-3 animate-fade-in">
          <i className="ri-check-circle-line text-xl" aria-hidden="true"></i>
          <span className="font-medium text-sm">Profil mis à jour avec succès !</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Fil d'ariane">
          <a href="/dashboard" className="hover:text-teal-600 transition-colors cursor-pointer">Tableau de bord</a>
          <i className="ri-arrow-right-s-line text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Mon Profil</span>
        </nav>

        {/* Header */}
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
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

          {/* Right Column */}
          <div>
            <QuickLinks stats={stats} />
          </div>
        </div>
      </main>

      {/* Edit Modal */}
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
      />
    </div>
  );
}

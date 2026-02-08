import Card from '../../../components/base/Card';
import Badge from '../../../components/base/Badge';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organization: string;
  joinDate: string;
  onEditClick: () => void;
}

export default function ProfileHeader({
  firstName,
  lastName,
  email,
  role,
  organization,
  joinDate,
  onEditClick
}: ProfileHeaderProps) {
  const initials = `${firstName?.[0] || '?'}${lastName?.[0] || ''}`;
  const formattedDate = new Date(joinDate).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative h-40 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-12 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-white/15" />
          <div className="absolute top-8 left-1/3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <button
          onClick={onEditClick}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
        >
          <i className="ri-pencil-line" aria-hidden="true"></i>
          Modifier le profil
        </button>
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
          <div className="w-24 h-24 flex items-center justify-center bg-teal-700 text-white text-3xl font-bold rounded-2xl border-4 border-white shadow-lg">
            {initials}
          </div>
          <div className="flex-1 sm:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" tabIndex={-1}>{firstName} {lastName}</h1>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="md">{role}</Badge>
                <Badge variant="neutral" size="sm">{organization}</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <i className="ri-calendar-line mr-1" aria-hidden="true"></i>
              Membre depuis {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}


import Card from '../../../components/base/Card';

interface PersonalInfoProps {
  bio: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  timezone: string;
}

export default function PersonalInfo({
  bio,
  phone,
  email,
  address,
  language,
  timezone
}: PersonalInfoProps) {
  const infoItems = [
    { icon: 'ri-mail-line', label: 'Email', value: email, color: 'bg-teal-100 text-teal-600' },
    { icon: 'ri-phone-line', label: 'T\u00e9l\u00e9phone', value: phone, color: 'bg-emerald-100 text-emerald-600' },
    { icon: 'ri-map-pin-line', label: 'Adresse', value: address, color: 'bg-amber-100 text-amber-600' },
    { icon: 'ri-translate-2', label: 'Langue', value: language, color: 'bg-sky-100 text-sky-600' },
    { icon: 'ri-time-line', label: 'Fuseau horaire', value: timezone, color: 'bg-rose-100 text-rose-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Bio */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-lg">
            <i className="ri-user-heart-line text-xl text-teal-600" aria-hidden="true"></i>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">\u00c0 propos</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{bio}</p>
      </Card>

      {/* Contact Info */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-lg">
            <i className="ri-contacts-line text-xl text-emerald-600" aria-hidden="true"></i>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Informations de Contact</h2>
        </div>
        <div className="space-y-3">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${item.color}`}>
                <i className={`${item.icon} text-lg`} aria-hidden="true"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

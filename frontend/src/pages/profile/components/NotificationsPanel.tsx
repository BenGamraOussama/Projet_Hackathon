import Card from '../../../components/base/Card';

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  attendance: boolean;
  certification: boolean;
  weekly: boolean;
}

interface NotificationsPanelProps {
  notifications: NotificationSettings;
  onToggle: (key: keyof NotificationSettings) => void;
}

const notificationItems: { key: keyof NotificationSettings; label: string; desc: string; icon: string; color: string }[] = [
  { key: 'email', label: 'Notifications par email', desc: 'Recevoir les alertes par email', icon: 'ri-mail-send-line', color: 'bg-teal-100 text-teal-600' },
  { key: 'sms', label: 'Notifications SMS', desc: 'Recevoir les alertes par SMS', icon: 'ri-message-2-line', color: 'bg-emerald-100 text-emerald-600' },
  { key: 'attendance', label: 'Alertes de présence', desc: 'Notifié des absences et retards', icon: 'ri-checkbox-circle-line', color: 'bg-amber-100 text-amber-600' },
  { key: 'certification', label: 'Certifications', desc: 'Éligibilité et rappels de certification', icon: 'ri-award-line', color: 'bg-rose-100 text-rose-600' },
  { key: 'weekly', label: 'Résumé hebdomadaire', desc: 'Rapport d’activité chaque lundi', icon: 'ri-bar-chart-box-line', color: 'bg-sky-100 text-sky-600' }
];

export default function NotificationsPanel({ notifications, onToggle }: NotificationsPanelProps) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
          <i className="ri-notification-3-line text-xl text-amber-600" aria-hidden="true"></i>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-500">Gérez vos préférences de notification</p>
        </div>
      </div>

      <div className="space-y-3">
        {notificationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${item.color}`}>
                <i className={`${item.icon} text-lg`} aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <button
              onClick={() => onToggle(item.key)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                notifications[item.key] ? 'bg-teal-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={notifications[item.key]}
              aria-label={item.label}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

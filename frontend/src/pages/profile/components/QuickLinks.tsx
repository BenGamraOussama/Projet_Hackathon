
import Card from '../../../components/base/Card';
import Badge from '../../../components/base/Badge';
import { Link } from 'react-router-dom';

interface QuickLinksProps {
  stats: {
    studentsManaged: number;
    trainingsActive: number;
    sessionsCompleted: number;
  };
}

export default function QuickLinks({ stats }: QuickLinksProps) {
  const links = [
    { label: 'Tableau de bord', icon: 'ri-dashboard-line', path: '/dashboard', color: 'bg-teal-100 text-teal-600' },
    { label: 'Mes \u00e9l\u00e8ves', icon: 'ri-user-line', path: '/students', color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Formations', icon: 'ri-book-open-line', path: '/trainings', color: 'bg-amber-100 text-amber-600' },
    { label: 'Accessibilit\u00e9', icon: 'ri-settings-line', path: '/accessibility', color: 'bg-sky-100 text-sky-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon Activit\u00e9</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-teal-600 rounded-lg">
                <i className="ri-user-line text-lg text-white" aria-hidden="true"></i>
              </div>
              <span className="text-sm text-gray-700">\u00c9l\u00e8ves g\u00e9r\u00e9s</span>
            </div>
            <span className="text-lg font-bold text-teal-700">{stats.studentsManaged}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-amber-600 rounded-lg">
                <i className="ri-book-open-line text-lg text-white" aria-hidden="true"></i>
              </div>
              <span className="text-sm text-gray-700">Formations actives</span>
            </div>
            <span className="text-lg font-bold text-amber-700">{stats.trainingsActive}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-emerald-600 rounded-lg">
                <i className="ri-checkbox-circle-line text-lg text-white" aria-hidden="true"></i>
              </div>
              <span className="text-sm text-gray-700">Sessions termin\u00e9es</span>
            </div>
            <span className="text-lg font-bold text-emerald-700">{stats.sessionsCompleted}</span>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acc\u00e8s Rapide</h3>
        <div className="space-y-2">
          {links.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${link.color}`}>
                <i className={`${link.icon} text-lg`} aria-hidden="true"></i>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{link.label}</span>
              <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-gray-600" aria-hidden="true"></i>
            </Link>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-rose-100 rounded-lg">
            <i className="ri-shield-check-line text-xl text-rose-600" aria-hidden="true"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">S\u00e9curit\u00e9</h3>
            <p className="text-xs text-gray-500">Prot\u00e9gez votre compte</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="ri-lock-line text-gray-500" aria-hidden="true"></i>
              <span className="text-sm text-gray-700">Mot de passe</span>
            </div>
            <Badge variant="success" size="sm">S\u00e9curis\u00e9</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="ri-smartphone-line text-gray-500" aria-hidden="true"></i>
              <span className="text-sm text-gray-700">Double authentification</span>
            </div>
            <Badge variant="warning" size="sm">D\u00e9sactiv\u00e9</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="ri-history-line text-gray-500" aria-hidden="true"></i>
              <span className="text-sm text-gray-700">Derni\u00e8re connexion</span>
            </div>
            <span className="text-xs text-gray-500">Aujourd\u0027hui, 09:15</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

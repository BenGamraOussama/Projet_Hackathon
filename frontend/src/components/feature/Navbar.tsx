
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { messageService } from '../../services/message.service';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const profile = authService.getUserProfile();
  const userRole = profile?.role || '';
  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Utilisateur';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const messages = await messageService.getAll();
        const currentUserEmail = authService.getCurrentUser();
        const total = messages.filter((msg) => {
          const isRead = msg.read ?? msg.isRead ?? false;
          return !isRead && msg.recipientId === currentUserEmail;
        }).length;
        setUnreadCount(total);
      } catch (error) {
        console.error("Failed to load unread messages", error);
      }
    };

    if (authService.isAuthenticated()) {
      loadUnreadCount();
    }
  }, []);

  const navLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'ri-dashboard-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'] },
    { path: '/students', label: 'Eleves', icon: 'ri-user-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'] },
    { path: '/trainings', label: 'Formations', icon: 'ri-book-line', roles: ['ADMIN', 'RESPONSABLE'] },
    { path: '/attendance', label: 'Presences', icon: 'ri-calendar-check-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'] },
    { path: '/certification', label: 'Certifications', icon: 'ri-award-line', roles: ['ADMIN', 'RESPONSABLE'] },
    { path: '/reports', label: 'Rapports', icon: 'ri-bar-chart-2-line', roles: ['ADMIN', 'RESPONSABLE'] },
    { path: '/users', label: 'Utilisateurs', icon: 'ri-team-line', roles: ['ADMIN'] },
    { path: '/audit-logs', label: 'Audit', icon: 'ri-shield-check-line', roles: ['ADMIN'] },
    { path: '/messages', label: 'Messages', icon: 'ri-message-3-line', badge: unreadCount, roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'] },
  ];

  const visibleLinks = userRole
    ? navLinks.filter((link) => !link.roles || link.roles.includes(userRole))
    : navLinks;

  const isAccountActive = location.pathname === '/profile' || location.pathname === '/accessibility';

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png"
              alt="ASTBA Logo"
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-gray-900">ASTBA</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  isActive(link.path)
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${link.icon} text-lg`} aria-hidden="true"></i>
                <span>{link.label}</span>
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-teal-500 text-white text-xs font-bold rounded-full">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Account Dropdown */}
            <div className="relative ml-2" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  isAccountActive
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                  <i className="ri-user-3-line text-white text-sm" aria-hidden="true"></i>
                </div>
                <span>Compte</span>
                <i className={`ri-arrow-down-s-line text-base transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-500">
                      {userRole === 'ADMIN' ? 'Administrateur' : userRole === 'RESPONSABLE' ? 'Responsable formation' : 'Formateur'}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        isActive('/profile') ? 'bg-teal-50 text-teal-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-user-settings-line text-lg" aria-hidden="true"></i>
                      </div>
                      <span>Mon Profil</span>
                    </Link>

                    <Link
                      to="/accessibility"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        isActive('/accessibility') ? 'bg-teal-50 text-teal-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-accessibility-line text-lg" aria-hidden="true"></i>
                      </div>
                      <span>Accessibilité</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer w-full whitespace-nowrap"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-logout-box-r-line text-lg" aria-hidden="true"></i>
                      </div>
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

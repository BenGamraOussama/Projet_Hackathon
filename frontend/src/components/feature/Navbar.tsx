
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { conversations } from '../../mocks/messages';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

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

  const navLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'ri-dashboard-line' },
    { path: '/students', label: 'Élèves', icon: 'ri-user-line' },
    { path: '/trainings', label: 'Formations', icon: 'ri-book-line' },
    { path: '/attendance', label: 'Présences', icon: 'ri-calendar-check-line' },
    { path: '/certification', label: 'Certifications', icon: 'ri-award-line' },
    { path: '/messages', label: 'Messages', icon: 'ri-message-3-line', badge: totalUnreadMessages },
  ];

  const isAccountActive = location.pathname === '/profile' || location.pathname === '/accessibility';

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
              <i className="ri-graduation-cap-line text-2xl text-white" aria-hidden="true"></i>
            </div>
            <span className="text-xl font-bold text-gray-900">ASTBA</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
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
                    <p className="text-sm font-semibold text-gray-900">Mohamed Ben Ali</p>
                    <p className="text-xs text-gray-500">Formateur principal</p>
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

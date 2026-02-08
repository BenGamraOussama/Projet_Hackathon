
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { messageService } from '../../services/message.service';
import { getNavLinks } from '../../config/navLinks';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profile = authService.getUserProfile();
  const userRole = profile?.role || '';
  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Utilisateur';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar');
  }, []);


  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const messages = await messageService.getAll();
        const currentUserEmail = authService.getCurrentUser();
        const total = messages.filter((msg) => {
          const isRead = msg.read || msg.isRead || false;
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

  const navLinks = getNavLinks(unreadCount);

  const visibleLinks = userRole
    ? navLinks.filter((link) => !link.roles || link.roles.includes(userRole))
    : navLinks;

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await authService.logout();
    navigate('/login');
  };


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png"
            alt="ASTBA Logo"
            className="h-9 w-auto"
          />
          <span className="text-lg font-bold text-gray-900">ASTBA</span>
        </Link>
      </div>

      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">Navigation</p>
        <ul className="flex flex-col gap-1" aria-label="Navigation principale">
          {visibleLinks.map((link) => (
            <li key={link.path} className="relative">
              <Link
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                  isActive(link.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${link.icon} text-lg`} aria-hidden="true"></i>
                <span>{link.label}</span>
                {link.badge && link.badge > 0 && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center bg-teal-500 text-white text-xs font-bold rounded-full">
                    <span className="sr-only">{link.badge} notifications non lues</span>
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
            <i className="ri-user-3-line text-white text-base" aria-hidden="true"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500">
              {userRole === 'ADMIN' ? 'Administrateur' : userRole === 'RESPONSABLE' ? 'Responsable formation' : 'Formateur'}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              isActive('/profile') ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-settings-line text-lg" aria-hidden="true"></i>
            </div>
            <span>Mon Profil</span>
          </Link>

          <Link
            to="/accessibility"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              isActive('/accessibility') ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-accessibility-line text-lg" aria-hidden="true"></i>
            </div>
            <span>Accessibilité</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-r-line text-lg" aria-hidden="true"></i>
            </div>
            <span>Se déconnecter</span>
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40" aria-label="Navigation principale">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer">
              <img
                src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png"
                alt="ASTBA Logo"
                className="h-9 w-auto"
              />
              <span className="text-lg font-bold text-gray-900">ASTBA</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-sidebar"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <i className={`ri-menu-3-line text-xl ${isMobileMenuOpen ? 'hidden' : 'block'}`} aria-hidden="true"></i>
              <i className={`ri-close-line text-xl ${isMobileMenuOpen ? 'block' : 'hidden'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {isMobileMenuOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 md:hidden"
          aria-label="Navigation latérale"
          id="mobile-sidebar"
        >
          {sidebarContent}
        </aside>
      )}

      <aside
        className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200"
        aria-label="Navigation latérale"
      >
        {sidebarContent}
      </aside>
    </>
  );
}





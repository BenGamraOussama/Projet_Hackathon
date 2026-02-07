
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import { authService } from '../../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Connexion via API
    try {
      if (formData.email && formData.password) {
        await authService.login(formData.email, formData.password);
        navigate('/');
      } else {
        setError('Veuillez remplir tous les champs');
      }
    } catch (err) {
      setError('Email ou mot de passe incorrect');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://readdy.ai/api/search-image?query=Modern%20educational%20technology%20classroom%20with%20students%20learning%20robotics%20and%20programming%20bright%20clean%20environment%20with%20computers%20and%20electronic%20components%20warm%20lighting%20professional%20atmosphere%20minimalist%20design&width=800&height=1000&seq=login-bg-1&orientation=portrait)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/70 to-teal-900/80" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <img
                src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png"
                alt="ASTBA Logo"
                className="h-16 w-auto bg-white rounded-xl p-2"
              />
              <div>
                <h1 className="text-2xl font-bold">ASTBA</h1>
                <p className="text-teal-200 text-sm">Sciences & Technology Ben Arous</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Plateforme de Gestion<br />des Formations
              </h2>
              <p className="text-teal-100 text-lg leading-relaxed">
                Gérez efficacement vos élèves, suivez les présences et délivrez des certifications en toute simplicité.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 flex items-center justify-center bg-teal-500 rounded-lg mb-3">
                  <i className="ri-user-line text-xl text-white" aria-hidden="true"></i>
                </div>
                <p className="text-2xl font-bold">150+</p>
                <p className="text-teal-200 text-sm">Élèves accompagnés</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 flex items-center justify-center bg-amber-500 rounded-lg mb-3">
                  <i className="ri-book-line text-xl text-white" aria-hidden="true"></i>
                </div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-teal-200 text-sm">Formations actives</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-lg mb-3">
                  <i className="ri-award-line text-xl text-white" aria-hidden="true"></i>
                </div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-teal-200 text-sm">Taux de certification</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 flex items-center justify-center bg-rose-500 rounded-lg mb-3">
                  <i className="ri-calendar-line text-xl text-white" aria-hidden="true"></i>
                </div>
                <p className="text-2xl font-bold">2018</p>
                <p className="text-teal-200 text-sm">Depuis</p>
              </div>
            </div>
          </div>

          <p className="text-teal-300 text-sm">
            © 2024 Association Sciences and Technology Ben Arous
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img
              src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png"
              alt="ASTBA Logo"
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ASTBA</h1>
              <p className="text-xs text-gray-500">Training & Attendance</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue</h2>
              <p className="text-gray-600">Connectez-vous à votre compte</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <i className="ri-error-warning-line text-xl text-red-600" aria-hidden="true"></i>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-gray-400" aria-hidden="true"></i>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400" aria-hidden="true"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={isLoading}
                icon={isLoading ? <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i> : <i className="ri-login-box-line" aria-hidden="true"></i>}
              >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                Accès rapide pour la démonstration
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ email: 'formateur@astba.tn', password: 'demo123', rememberMe: false });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-user-star-line text-teal-600" aria-hidden="true"></i>
                  Formateur
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ email: 'admin@astba.tn', password: 'demo123', rememberMe: false });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-admin-line text-amber-600" aria-hidden="true"></i>
                  Admin
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Besoin d'aide ? <a href="mailto:contact@astba.tn" className="text-teal-600 hover:text-teal-700 font-medium cursor-pointer">Contactez-nous</a>
          </p>
        </div>
      </div>
    </div>
  );
}

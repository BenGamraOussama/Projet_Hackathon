import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import api from '../../services/api';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.post('/auth/password/reset', { token, newPassword: password });
      setStatus('success');
    } catch (err) {
      setError("Le lien n'est pas valide ou a expiré.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <main id="main-content" tabIndex={-1} className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" tabIndex={-1}>Nouveau mot de passe</h1>
        <p className="text-sm text-gray-600 mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Votre mot de passe a été mis à jour.
            </div>
            <Button type="button" fullWidth onClick={() => navigate('/login')}>
              Se connecter
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button type="submit" fullWidth disabled={status === 'loading' || !token}>
              {status === 'loading' ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => navigate('/login')}>
              Retour à la connexion
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

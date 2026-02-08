import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.post('/auth/password/forgot', { email });
      setStatus('sent');
    } catch (err) {
      setError("Impossible d'envoyer le lien. Réessayez.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <main id="main-content" tabIndex={-1} className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" tabIndex={-1}>Réinitialiser le mot de passe</h1>
        <p className="text-sm text-gray-600 mb-6">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {status === 'sent' ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
            Si l'email existe, un lien a été envoyé.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button type="submit" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Envoi...' : 'Envoyer le lien'}
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

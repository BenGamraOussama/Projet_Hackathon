import { useEffect, useState } from 'react';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import { jobApplicationService, JobApplicationMatch } from '../../../services/job-application.service';

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplicationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [criteria, setCriteria] = useState('');
  const [role, setRole] = useState('FORMATEUR');
  const [minScore, setMinScore] = useState(0.3);
  const [actionId, setActionId] = useState<number | null>(null);

  const toErrorMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') {
        return data.message;
      }
      try {
        return JSON.stringify(data);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await jobApplicationService.filter({
        role: role === 'ALL' ? undefined : role,
        adminChoice: criteria,
        minScore,
      });
      setApplications(data || []);
    } catch (err: any) {
      setError(toErrorMessage(err, "Impossible de charger les demandes."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (id: number) => {
    setActionId(id);
    setError('');
    setMessage('');
    try {
      const response = await jobApplicationService.approve(id);
      const messageText = response?.message || "Demande approuvée.";
      setMessage(messageText);
      await loadApplications();
    } catch (err: any) {
      setError(toErrorMessage(err, "Erreur lors de l'approbation."));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    setError('');
    setMessage('');
    try {
      const response = await jobApplicationService.reject(id);
      const messageText = response?.message || "Demande rejetée.";
      setMessage(messageText);
      await loadApplications();
    } catch (err: any) {
      setError(toErrorMessage(err, "Erreur lors du rejet."));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Demandes de travail</h1>
          <p className="text-sm text-gray-600">
            Filtrez les demandes par profil et compatibilité IA, puis acceptez ou rejetez.
          </p>
        </div>

        <Card className="mb-6">
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            onSubmit={(event) => {
              event.preventDefault();
              loadApplications();
            }}
          >
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Rôle</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tous</option>
                <option value="FORMATEUR">Formateur</option>
                <option value="RESPONSABLE">Responsable</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Critères admin (mots-clés)</span>
              <input
                value={criteria}
                onChange={(event) => setCriteria(event.target.value)}
                placeholder="Ex: robotique, pédagogie, gestion..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Score minimum</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={minScore}
                onChange={(event) => setMinScore(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
            <div className="md:col-span-4">
              <Button type="submit" variant="outline">Appliquer le filtre IA</Button>
            </div>
          </form>
        </Card>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <div className="py-10 text-center text-gray-600">Chargement...</div>
          </Card>
        ) : applications.length === 0 ? (
          <Card>
            <div className="py-10 text-center text-gray-600">Aucune demande compatible.</div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Candidat</th>
                    <th className="text-left px-4 py-3 font-semibold">Rôle</th>
                    <th className="text-left px-4 py-3 font-semibold">Score IA</th>
                    <th className="text-left px-4 py-3 font-semibold">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold">Description carrière</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t border-gray-200">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{app.firstName} {app.lastName}</div>
                        <div className="text-gray-600">{app.email}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{app.role}</td>
                      <td className="px-4 py-4 text-gray-700">{app.score.toFixed(2)}</td>
                      <td className="px-4 py-4 text-gray-700">
                        <div>{app.phone || '-'}</div>
                        <div>{app.address || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 max-w-xs">
                        <div className="break-words">{app.careerDescription || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            disabled={actionId === app.id}
                            onClick={() => handleApprove(app.id)}
                          >
                            Accepter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionId === app.id}
                            onClick={() => handleReject(app.id)}
                          >
                            Rejeter
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}


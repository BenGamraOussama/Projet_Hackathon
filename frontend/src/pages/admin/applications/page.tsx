import { useEffect, useState } from 'react';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import { studentService } from '../../../services/student.service';

type PendingStudent = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
};

export default function PendingApplications() {
  const [pendingEleves, setPendingEleves] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadPending = async (search?: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getPending(search);
      setPendingEleves(data || []);
    } catch (err) {
      setError('Impossible de charger les inscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDecision = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setMessage('');
    setError('');
    try {
      await studentService.updateStatus(id, status);
      setMessage(status === 'APPROVED' ? 'Inscription approuv?e.' : 'Inscription rejet?e.');
      await loadPending(query);
    } catch (err: any) {
      const apiMessage = err?.response?.data;
      if (apiMessage === 'MAX_STUDENTS_REACHED') {
        setError("Capacit? maximale atteinte. Impossible d'approuver cet Eleve.");
      } else {
        setError('Erreur lors de la mise ? jour.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Inscriptions Eleves en attente</h1>
          <p className="text-sm text-gray-600">
            Validez ou rejetez les demandes d'inscription des Eleves.
          </p>
        </div>

        <form
          className="mb-4 flex flex-col sm:flex-row gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            loadPending(query);
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Rechercher un Eleve</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </label>
          <Button type="submit" variant="outline">Filtrer</Button>
        </form>

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
        ) : pendingEleves.length === 0 ? (
          <Card>
            <div className="py-10 text-center text-gray-600">Aucune inscription en attente.</div>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingEleves.map((student) => (
              <Card key={student.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div><span className="font-medium">T?l?phone:</span> {student.phone || '-'}</div>
                    <div><span className="font-medium">Adresse:</span> {student.address || '-'}</div>
                    <div><span className="font-medium">Genre:</span> {student.gender || '-'}</div>
                    <div><span className="font-medium">Naissance:</span> {student.birthDate || '-'}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="primary" onClick={() => handleDecision(student.id, 'APPROVED')}>
                      Approuver
                    </Button>
                    <Button variant="outline" onClick={() => handleDecision(student.id, 'REJECTED')}>
                      Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

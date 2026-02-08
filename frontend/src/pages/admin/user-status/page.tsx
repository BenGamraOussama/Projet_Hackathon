import { useEffect, useState } from 'react';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import { userService } from '../../../services/user.service';

type UserStatus = {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  careerDescription?: string;
};

const statusTabs = [
  { key: 'APPROVED', label: 'Approuves' },
  { key: 'REJECTED', label: 'Rejetes' }
] as const;

export default function UserStatusPage() {
  const [status, setStatus] = useState<typeof statusTabs[number]['key']>('APPROVED');
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getByStatus(nextStatus);
      setUsers(data || []);
    } catch (err) {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>
            Historique des decisions
          </h1>
          <p className="text-sm text-gray-600">
            Consultez les comptes approuves ou rejetes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filtres de statut">
          {statusTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={status === tab.key ? 'primary' : 'outline'}
              onClick={() => setStatus(tab.key)}
              aria-pressed={status === tab.key}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <div className="py-10 text-center text-gray-600">Chargement...</div>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <div className="py-10 text-center text-gray-600">
              Aucun utilisateur pour ce statut.
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                        {user.role}
                      </span>
                      <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${
                        user.status === 'APPROVED'
                          ? 'text-green-700 bg-green-50'
                          : 'text-red-700 bg-red-50'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div><span className="font-medium">Telephone:</span> {user.phone || '-'}</div>
                    <div><span className="font-medium">Adresse:</span> {user.address || '-'}</div>
                    <div><span className="font-medium">Genre:</span> {user.gender || '-'}</div>
                    <div><span className="font-medium">Naissance:</span> {user.birthDate || '-'}</div>
                  </div>

                  {user.careerDescription && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Description carriere:</span> {user.careerDescription}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

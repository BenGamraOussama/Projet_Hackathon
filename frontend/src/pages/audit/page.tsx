import { useEffect, useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Badge from '../../components/base/Badge';
import { auditService } from '../../services/audit.service';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const data = await auditService.getAll();
        setLogs(data || []);
      } catch (error) {
        console.error('Failed to load audit logs', error);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit & Traçabilite</h1>
          <p className="text-base text-gray-600">Dernieres actions sensibles dans le systeme</p>
        </div>

        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin mb-3" aria-hidden="true"></i>
              <p className="text-gray-600">Chargement des logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Action</th>
                    <th className="py-3 pr-4">Entite</th>
                    <th className="py-3 pr-4">Acteur</th>
                    <th className="py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        Aucun log disponible.
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => (
                    <tr key={log.id} className="text-sm text-gray-700">
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="info">{log.action}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-3 pr-4">{log.actorEmail || '-'}</td>
                      <td className="py-3">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

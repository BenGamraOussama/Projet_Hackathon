import { useEffect, useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { reportService } from '../../services/report.service';

export default function Reports() {
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const data = await reportService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to load report summary', error);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Rapports & Indicateurs</h1>
            <p className="text-base text-gray-600">Vue globale de l'avancement et des alertes</p>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <i className="ri-printer-line" aria-hidden="true"></i>
            Imprimer
          </Button>
        </div>

        {isLoading && (
          <Card>
            <div className="text-center py-12">
              <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin mb-4" aria-hidden="true"></i>
              <p className="text-gray-600">Chargement des indicateurs...</p>
            </div>
          </Card>
        )}

        {!isLoading && summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-teal-600 rounded-lg">
                    <i className="ri-user-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Eleves</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalEleves || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-amber-600 rounded-lg">
                    <i className="ri-book-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Formations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalTrainings || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-sky-50 to-white border-sky-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-sky-600 rounded-lg">
                    <i className="ri-calendar-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Séances</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalSessions || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-green-600 rounded-lg">
                    <i className="ri-checkbox-circle-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Presences</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalPresenceRecords || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-purple-600 rounded-lg">
                    <i className="ri-award-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Certificats</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.certificatesIssued || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-rose-600 rounded-lg">
                    <i className="ri-medal-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Formations termin?es</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.trainingsCompleted || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-alert-line text-amber-600" aria-hidden="true"></i>
                  Eleves ? risque
                </h2>
                <Badge variant="warning">{summary.atRiskEleves?.length || 0}</Badge>
              </div>

              {summary.atRiskEleves && summary.atRiskEleves.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                        <th className="py-3 pr-4">Eleve</th>
                        <th className="py-3 pr-4">Formation</th>
                        <th className="py-3 pr-4">Assiduit?</th>
                        <th className="py-3 pr-4">Absences</th>
                        <th className="py-3">S?ances manquantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.atRiskEleves.map((student: any) => (
                        <tr key={student.studentId} className="text-sm text-gray-700">
                          <td className="py-3 pr-4 font-medium text-gray-900">{student.name}</td>
                          <td className="py-3 pr-4">{student.trainingName || '-'}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={student.attendanceRate >= 80 ? 'success' : student.attendanceRate >= 60 ? 'warning' : 'danger'}>
                              {student.attendanceRate || 0}%
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">{student.absentCount || 0}</td>
                          <td className="py-3">{student.missingSessions || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-gray-600">
                  Aucun Eleve en alerte pour le moment.
                </div>
              )}
            </Card>
          </>
        )}

        {!isLoading && !summary && (
          <Card>
            <div className="text-center py-12">
              <i className="ri-error-warning-line text-4xl text-gray-400 mb-3" aria-hidden="true"></i>
              <p className="text-gray-600">Impossible de charger les rapports.</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

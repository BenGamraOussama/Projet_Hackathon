
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import StatCard from '../../components/feature/StatCard';
import Card from '../../components/base/Card';
import Badge from '../../components/base/Badge';
import Button from '../../components/base/Button';
import { studentsData } from '../../mocks/students';
import { trainingsData } from '../../mocks/trainings';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const userEmail = localStorage.getItem('userEmail') || 'Utilisateur';
  const userName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };
  
  const totalStudents = studentsData.length;
  const activeTrainings = trainingsData.filter(t => t.status === 'active').length;
  const eligibleForCert = studentsData.filter(s => s.eligibleForCertification).length;
  const completedFormations = trainingsData.reduce((sum, t) => sum + t.completedStudents, 0);
  
  const atRiskStudents = studentsData.filter(s => s.attendanceRate < 85);
  const recentActivity = [
    { student: 'Michael Chen', action: 'A complété le Niveau 4', time: 'Il y a 2 heures', type: 'success' },
    { student: 'Emma Johnson', action: 'Marqué présent - Session 12', time: 'Il y a 3 heures', type: 'info' },
    { student: 'Olivia Brown', action: 'Session 5 manquée', time: 'Il y a 5 heures', type: 'warning' },
    { student: 'Sarah Williams', action: 'A complété le Niveau 3', time: 'Hier', type: 'success' }
  ];

  const quickActions = [
    { label: 'Nouvel élève', icon: 'ri-user-add-line', path: '/students', color: 'bg-teal-600' },
    { label: 'Prendre présences', icon: 'ri-checkbox-line', path: '/attendance', color: 'bg-amber-600' },
    { label: 'Voir formations', icon: 'ri-book-open-line', path: '/trainings', color: 'bg-indigo-600' },
    { label: 'Certifications', icon: 'ri-award-line', path: '/certification', color: 'bg-green-600' }
  ];

  const upcomingSessions = [
    { training: 'Robotique', level: 2, session: 4, time: '14:00', students: 12 },
    { training: 'Programmation', level: 3, session: 2, time: '16:00', students: 8 },
    { training: 'Électronique', level: 1, session: 6, time: '18:00', students: 15 }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{getGreeting()}, {userName} 👋</h1>
                <p className="text-teal-100">
                  {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-xs text-teal-100">Sessions aujourd'hui</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all duration-200 cursor-pointer group"
                >
                  <div className={`w-10 h-10 flex items-center justify-center ${action.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <i className={`${action.icon} text-xl text-white`} aria-hidden="true"></i>
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Élèves"
            value={totalStudents}
            icon="ri-user-line"
            iconColor="bg-teal-600"
            trend={{ value: '+12%', isPositive: true }}
            description="Apprenants actifs"
          />
          <StatCard
            title="Formations Actives"
            value={activeTrainings}
            icon="ri-book-open-line"
            iconColor="bg-amber-600"
            description="En cours"
          />
          <StatCard
            title="Formations Terminées"
            value={completedFormations}
            icon="ri-checkbox-circle-line"
            iconColor="bg-green-600"
            trend={{ value: '+3', isPositive: true }}
            description="Ce mois"
          />
          <StatCard
            title="Éligibles Certification"
            value={eligibleForCert}
            icon="ri-award-line"
            iconColor="bg-indigo-600"
            description="Prêts à certifier"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Overview */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Aperçu des Présences</h2>
              <div className="flex gap-2" role="tablist" aria-label="Sélection de période">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${
                      selectedPeriod === period
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    role="tab"
                    aria-selected={selectedPeriod === period}
                  >
                    {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-lg">
                    <i className="ri-checkbox-circle-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Présents</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">85% du total</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-amber-600 rounded-lg">
                    <i className="ri-time-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">En retard</p>
                    <p className="text-2xl font-bold text-gray-900">18</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">10% du total</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-lg">
                    <i className="ri-close-circle-line text-xl text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absents</p>
                    <p className="text-2xl font-bold text-gray-900">9</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">5% du total</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Upcoming Sessions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Sessions du jour</h2>
              <Link to="/trainings" className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{session.training}</p>
                      <p className="text-sm text-gray-600">Niveau {session.level} - Session {session.session}</p>
                    </div>
                    <Badge variant="info" size="sm">{session.time}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <i className="ri-user-line" aria-hidden="true"></i>
                    <span>{session.students} élèves</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students at Risk */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Élèves à risque</h2>
              <Badge variant="danger" size="sm">{atRiskStudents.length}</Badge>
            </div>
            <div className="space-y-4">
              {atRiskStudents.length > 0 ? (
                atRiskStudents.slice(0, 3).map((student) => (
                  <Link 
                    key={student.id} 
                    to={`/students/${student.id}`}
                    className="block p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                      <Badge variant="danger" size="sm">{student.attendanceRate}%</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Absences fréquentes détectées</p>
                    <p className="text-xs text-gray-500 mt-1">Niveau {student.currentLevel} - {student.completedSessions}/{student.totalSessions} sessions</p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="ri-checkbox-circle-line text-4xl text-green-600 mb-2" aria-hidden="true"></i>
                  <p className="text-sm text-gray-600">Tous les élèves sont sur la bonne voie</p>
                </div>
              )}
              {atRiskStudents.length > 3 && (
                <Link 
                  to="/students" 
                  className="block text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-2 cursor-pointer"
                >
                  Voir {atRiskStudents.length - 3} autres élèves
                </Link>
              )}
            </div>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Activité récente</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    activity.type === 'success' ? 'bg-green-600' :
                    activity.type === 'warning' ? 'bg-amber-600' :
                    'bg-teal-600'
                  }`}>
                    <i className={`${
                      activity.type === 'success' ? 'ri-checkbox-circle-line' :
                      activity.type === 'warning' ? 'ri-alert-line' :
                      'ri-information-line'
                    } text-xl text-white`} aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.student}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.action}</p>
                  </div>
                  <p className="text-sm text-gray-500 whitespace-nowrap">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}


import { useState, useMemo } from 'react';
import Badge from '../../../components/base/Badge';
import Button from '../../../components/base/Button';
import { sessionsData, trainingsData } from '../../../mocks/trainings';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarSession {
  id: number;
  trainingId: number;
  level: number;
  sessionNumber: number;
  title: string;
  date: string;
  duration: number;
  completed: boolean;
  trainingName: string;
  trainingColor: string;
}

const trainingColors: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-teal-100', border: 'border-l-teal-600', text: 'text-teal-700' },
  2: { bg: 'bg-amber-100', border: 'border-l-amber-600', text: 'text-amber-700' },
  3: { bg: 'bg-rose-100', border: 'border-l-rose-600', text: 'text-rose-700' },
  4: { bg: 'bg-indigo-100', border: 'border-l-indigo-600', text: 'text-indigo-700' },
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1)); // February 2024
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [filterTraining, setFilterTraining] = useState<number | null>(null);

  const allSessions: CalendarSession[] = useMemo(() => {
    return sessionsData.map(session => {
      const training = trainingsData.find(t => t.id === session.trainingId);
      return {
        ...session,
        trainingName: training?.name || 'Unknown Training',
        trainingColor: trainingColors[session.trainingId]?.bg || 'bg-gray-100',
      };
    });
  }, []);

  const filteredSessions = useMemo(() => {
    if (filterTraining === null) return allSessions;
    return allSessions.filter(s => s.trainingId === filterTraining);
  }, [allSessions, filterTraining]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredSessions.filter(s => s.date === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date: Date) => {
    const weekDays = getWeekDays(date);
    const start = weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const end = weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date(2024, 1, 15)); // Mock "today" for demo
  };

  const isToday = (date: Date) => {
    const today = new Date(2024, 1, 15); // Mock today
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8h to 20h

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {dayNames.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const sessions = getSessionsForDate(day.date);
            const displaySessions = sessions.slice(0, 3);
            const remainingSessions = sessions.length - 3;
            
            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-100 p-1.5 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isToday(day.date) ? 'bg-teal-50/50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday(day.date) 
                    ? 'bg-teal-600 text-white' 
                    : day.isCurrentMonth 
                      ? 'text-gray-900' 
                      : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {displaySessions.map(session => {
                    const colors = trainingColors[session.trainingId] || { bg: 'bg-gray-100', border: 'border-l-gray-400', text: 'text-gray-700' };
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left px-2 py-1 rounded text-xs truncate border-l-4 ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity cursor-pointer`}
                        title={session.title}
                      >
                        <span className="font-medium">{session.title}</span>
                      </button>
                    );
                  })}
                  {remainingSessions > 0 && (
                    <button
                      onClick={() => {
                        setViewMode('day');
                        setCurrentDate(day.date);
                      }}
                      className="w-full text-left px-2 py-0.5 text-xs text-gray-500 hover:text-teal-600 cursor-pointer"
                    >
                      +{remainingSessions} autre{remainingSessions > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
          <div className="py-3 px-2 text-center text-xs font-semibold text-gray-400 border-r border-gray-200">
            Heure
          </div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={`py-3 text-center border-r border-gray-200 last:border-r-0 ${
                isToday(day) ? 'bg-teal-50' : ''
              }`}
            >
              <div className="text-xs font-semibold text-gray-600 uppercase">
                {dayNames[day.getDay()]}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                isToday(day) ? 'text-teal-600' : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="py-4 px-2 text-xs text-gray-500 text-right border-r border-gray-200 bg-gray-50">
                {hour}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const sessions = getSessionsForDate(day);
                const hourSessions = sessions.filter(s => {
                  // Simulate session times based on session number
                  const sessionHour = 8 + (s.sessionNumber - 1) * 2;
                  return sessionHour === hour;
                });
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`py-1 px-1 border-r border-gray-100 last:border-r-0 min-h-[60px] ${
                      isToday(day) ? 'bg-teal-50/30' : ''
                    }`}
                  >
                    {hourSessions.map(session => {
                      const colors = trainingColors[session.trainingId] || { bg: 'bg-gray-100', border: 'border-l-gray-400', text: 'text-gray-700' };
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`w-full text-left p-2 rounded text-xs border-l-4 ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity cursor-pointer mb-1`}
                        >
                          <div className="font-semibold truncate">{session.title}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">{session.duration} min</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const sessions = getSessionsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day header */}
        <div className={`py-4 px-6 border-b border-gray-200 ${isToday(currentDate) ? 'bg-teal-50' : 'bg-gray-50'}`}>
          <div className="text-sm font-semibold text-gray-600 uppercase">
            {dayNames[currentDate.getDay()]}
          </div>
          <div className={`text-3xl font-bold ${isToday(currentDate) ? 'text-teal-600' : 'text-gray-900'}`}>
            {currentDate.getDate()}
          </div>
          <div className="text-sm text-gray-500">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        {/* Sessions list */}
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="py-16 text-center">
              <i className="ri-calendar-line text-5xl text-gray-300 mb-3" aria-hidden="true"></i>
              <p className="text-gray-500">Aucune session planifiée ce jour</p>
            </div>
          ) : (
            sessions.map(session => {
              const colors = trainingColors[session.trainingId] || { bg: 'bg-gray-100', border: 'border-l-gray-400', text: 'text-gray-700' };
              const sessionHour = 8 + (session.sessionNumber - 1) * 2;
              
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-4`}
                >
                  <div className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">
                    {sessionHour}:00
                  </div>
                  <div className={`flex-1 p-4 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-semibold ${colors.text}`}>{session.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{session.trainingName}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <i className="ri-time-line" aria-hidden="true"></i>
                            {session.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-stack-line" aria-hidden="true"></i>
                            Niveau {session.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="ri-hashtag" aria-hidden="true"></i>
                            Session {session.sessionNumber}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={session.completed ? 'success' : 'neutral'} 
                        size="sm"
                      >
                        {session.completed ? 'Terminée' : 'À venir'}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const now = new Date(2024, 1, 15);
    const thisMonth = filteredSessions.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    const completed = thisMonth.filter(s => s.completed).length;
    const upcoming = thisMonth.filter(s => new Date(s.date) >= now && !s.completed).length;
    
    return { total: thisMonth.length, completed, upcoming };
  }, [filteredSessions, currentDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendrier des Sessions</h2>
          <p className="text-sm text-gray-600 mt-1">Visualisez toutes les sessions planifiées</p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Training filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterTraining(null)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
              filterTraining === null
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            Toutes
          </button>
          {trainingsData.map(training => {
            const colors = trainingColors[training.id];
            return (
              <button
                key={training.id}
                onClick={() => setFilterTraining(training.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  filterTraining === training.id
                    ? `${colors.bg} ${colors.text} border-current`
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colors.border.replace('border-l-', 'bg-')}`}></span>
                <span className="hidden sm:inline">{training.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="sm:hidden">{training.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Précédent"
            >
              <i className="ri-arrow-left-s-line text-xl" aria-hidden="true"></i>
            </button>
            <div className="px-4 py-2 min-w-[200px] text-center">
              <span className="font-semibold text-gray-900">
                {viewMode === 'month' && formatDate(currentDate)}
                {viewMode === 'week' && formatWeekRange(currentDate)}
                {viewMode === 'day' && currentDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <button
              onClick={navigateNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Suivant"
            >
              <i className="ri-arrow-right-s-line text-xl" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-lg">
              <i className="ri-calendar-check-line text-xl text-teal-600" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Sessions ce mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
              <i className="ri-check-double-line text-xl text-green-600" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500">Terminées</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
              <i className="ri-time-line text-xl text-amber-600" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
              <p className="text-xs text-gray-500">À venir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-500 font-medium">Légende :</span>
        {trainingsData.map(training => {
          const colors = trainingColors[training.id];
          return (
            <div key={training.id} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${colors.border.replace('border-l-', 'bg-')}`}></span>
              <span className="text-gray-600">{training.name.split(' ').slice(0, 2).join(' ')}</span>
            </div>
          );
        })}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-modal-title"
        >
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSelectedSession(null)}
            aria-hidden="true"
          ></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
              {/* Color bar */}
              <div className={`h-2 rounded-t-xl ${trainingColors[selectedSession.trainingId]?.border.replace('border-l-', 'bg-') || 'bg-gray-400'}`}></div>
              
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 id="session-modal-title" className="text-xl font-semibold text-gray-900">
                    {selectedSession.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedSession.trainingName}</p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i className="ri-calendar-line text-xl text-gray-400" aria-hidden="true"></i>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedSession.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i className="ri-time-line text-xl text-gray-400" aria-hidden="true"></i>
                    <div>
                      <p className="text-xs text-gray-500">Durée</p>
                      <p className="text-sm font-medium text-gray-900">{selectedSession.duration} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i className="ri-stack-line text-xl text-gray-400" aria-hidden="true"></i>
                    <div>
                      <p className="text-xs text-gray-500">Niveau</p>
                      <p className="text-sm font-medium text-gray-900">Niveau {selectedSession.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i className="ri-hashtag text-xl text-gray-400" aria-hidden="true"></i>
                    <div>
                      <p className="text-xs text-gray-500">Session</p>
                      <p className="text-sm font-medium text-gray-900">Session {selectedSession.sessionNumber}/6</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Statut</span>
                  <Badge variant={selectedSession.completed ? 'success' : 'neutral'}>
                    {selectedSession.completed ? 'Terminée' : 'À venir'}
                  </Badge>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Fermer
                </Button>
                <Button variant="primary">
                  <i className="ri-eye-line mr-1" aria-hidden="true"></i>
                  Voir la formation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

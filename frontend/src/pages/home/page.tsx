import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VoiceToText from './components/VoiceToText';

// Stats data
const platformStats = [
  { value: '150+', label: '??l??ves accompagn??s', icon: 'ri-user-line' },
  { value: '4', label: 'Formations actives', icon: 'ri-book-open-line' },
  { value: '24', label: 'Sessions par formation', icon: 'ri-calendar-line' },
  { value: '98%', label: 'Taux de satisfaction', icon: 'ri-star-line' }
];

const features = [
  {
    icon: 'ri-user-add-line',
    title: 'Gestion des élèves',
    description: 'Créez et consultez les fiches élèves avec toutes les informations personnelles et le suivi de progression.',
    color: 'bg-teal-50 text-teal-600'
  },
  {
    icon: 'ri-calendar-schedule-line',
    title: 'Suivi des formations',
    description: 'Organisez vos formations par niveaux (4 niveaux) avec 6 séances par niveau. Vue calendrier intégrée.',
    color: 'bg-amber-50 text-amber-600'
  },
  {
    icon: 'ri-checkbox-circle-line',
    title: 'Gestion des présences',
    description: 'Enregistrez les présences séance par séance. Visualisez clairement les séances manquées.',
    color: 'bg-rose-50 text-rose-600'
  },
  {
    icon: 'ri-award-line',
    title: 'Certification automatique',
    description: 'Validation automatique après complétion des 4 niveaux. Génération et impression des certificats.',
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    icon: 'ri-bar-chart-box-line',
    title: 'Tableau de bord',
    description: 'Vue globale de l\'avancement par élève : niveaux validés, séances restantes, formations terminées.',
    color: 'bg-sky-50 text-sky-600'
  },
  {
    icon: 'ri-history-line',
    title: 'Historique complet',
    description: 'Consultez l\'historique des présences et des formations suivies par chaque élève.',
    color: 'bg-violet-50 text-violet-600'
  }
];

const problems = [
  {
    before: 'Listes papier et suivi manuel',
    after: 'Système numérique centralisé',
    icon: 'ri-file-paper-line'
  },
  {
    before: 'Erreurs et perte de temps',
    after: 'Données fiables et automatisées',
    icon: 'ri-error-warning-line'
  },
  {
    before: 'Manque de visibilité globale',
    after: 'Tableaux de bord en temps réel',
    icon: 'ri-eye-off-line'
  },
  {
    before: 'Validation manuelle des certifications',
    after: 'Certification automatique',
    icon: 'ri-medal-line'
  }
];

const userTypes = [
  {
    title: 'Formateurs',
    description: 'Gérez vos séances, prenez les présences et suivez la progression de vos élèves en temps réel.',
    icon: 'ri-presentation-line',
    tasks: ['Prendre les présences', 'Voir les séances du jour', 'Suivre les élèves']
  },
  {
    title: 'Responsables de formation',
    description: 'Supervisez l\'ensemble des formations, validez les passages de niveau et générez les certificats.',
    icon: 'ri-admin-line',
    tasks: ['Créer des formations', 'Valider les niveaux', 'Générer les certificats']
  },
  {
    title: 'Membres administratifs',
    description: 'Accédez aux statistiques globales et aux rapports pour piloter l\'activité de l\'association.',
    icon: 'ri-building-line',
    tasks: ['Consulter les statistiques', 'Exporter les rapports', 'Gérer les élèves']
  }
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png" 
                alt="ASTBA Logo" 
                className="h-10 w-auto"
              />
              <span className={`font-bold text-xl ${isScrolled ? 'text-gray-900' : 'text-white'}`}>ASTBA</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium hover:text-teal-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}>Fonctionnalités</a>
              <a href="#problems" className={`text-sm font-medium hover:text-teal-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}>Problèmes résolus</a>
              <a href="#voice-to-text" className={`text-sm font-medium hover:text-teal-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}>Voix → Texte</a>
              <a href="#users" className={`text-sm font-medium hover:text-teal-600 transition-colors ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}>Utilisateurs</a>
            </div>
            <Link 
              to="/login" 
              className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://readdy.ai/api/search-image?query=Modern%20educational%20classroom%20with%20students%20learning%20technology%20and%20science%20projects%20with%20computers%20and%20robotics%20equipment%20bright%20natural%20lighting%20contemporary%20learning%20environment%20warm%20atmosphere%20professional%20educational%20setting&width=1920&height=1080&seq=hero001&orientation=landscape"
            alt="ASTBA Formation"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <i className="ri-verified-badge-line text-teal-400"></i>
              <span className="text-white/90 text-sm">Association Sciences and Technology Ben Arous</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Plateforme de suivi des <span className="text-teal-400">formations</span> et <span className="text-teal-400">présences</span>
            </h1>
            
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Centralisez la gestion de vos élèves, suivez les présences séance par séance, 
              et automatisez la certification. Une solution simple et claire pour un usage quotidien.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Accéder à la plateforme
                <i className="ri-arrow-right-line"></i>
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-play-circle-line"></i>
                Découvrir les fonctionnalités
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platformStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className={`${stat.icon} text-teal-600 text-2xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is ASTBA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">À propos de la plateforme</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Qu'est-ce que ASTBA Training Tracker ?
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                L'Association Sciences and Technology Ben Arous œuvre depuis <strong>2018</strong> pour le 
                développement des compétences scientifiques et technologiques des élèves.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Cette plateforme est conçue pour <strong>centraliser et simplifier</strong> la gestion pédagogique : 
                suivi des formations structurées par niveaux, enregistrement des présences, 
                et validation automatique des certifications.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-lightbulb-line text-teal-600 text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Apprentissage pratique</h4>
                    <p className="text-sm text-gray-600">Formations axées sur la pratique et les projets technologiques</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-rocket-line text-amber-600 text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Innovation éducative</h4>
                    <p className="text-sm text-gray-600">Méthodes pédagogiques modernes et innovantes</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-team-line text-emerald-600 text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Accompagnement personnalisé</h4>
                    <p className="text-sm text-gray-600">150 élèves encadrés par une équipe de 6 membres dévoués</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8">
                <img 
                  src="https://readdy.ai/api/search-image?query=Students%20working%20on%20robotics%20and%20technology%20projects%20in%20modern%20classroom%20with%20computers%20and%20electronic%20components%20collaborative%20learning%20environment%20bright%20lighting%20educational%20workshop%20setting&width=600&height=500&seq=about001&orientation=portrait"
                  alt="Élèves en formation"
                  className="w-full h-80 object-cover object-top rounded-xl shadow-lg"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                    <i className="ri-calendar-line text-white text-xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">Depuis 2018</div>
                    <div className="text-sm text-gray-600">Au service de l'éducation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour gérer vos formations, suivre les présences et délivrer les certifications.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                  <i className={`${feature.icon} text-2xl`}></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Solved Section */}
      <section id="problems" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">Problèmes résolus</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Avant vs Après ASTBA
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez comment notre plateforme transforme la gestion quotidienne de vos formations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((problem, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${problem.icon} text-gray-500 text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">Avant</span>
                      <span className="text-gray-600 text-sm">{problem.before}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-teal-600 text-sm font-medium bg-teal-50 px-3 py-1 rounded-full">Après</span>
                      <span className="text-gray-900 font-medium text-sm">{problem.after}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-teal-600 text-lg"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-200 font-semibold text-sm uppercase tracking-wider mb-4">Comment ça marche</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Structure des formations
            </h2>
            <p className="text-teal-100 max-w-2xl mx-auto">
              Chaque formation est organisée en 4 niveaux progressifs, avec 6 séances par niveau.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((level) => (
              <div key={level} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-teal-600">{level}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Niveau {level}</h3>
                <p className="text-teal-100 text-sm mb-4">6 séances de formation</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5, 6].map((session) => (
                    <div key={session} className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">{session}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 border border-white/20">
              <i className="ri-award-line text-3xl text-amber-400"></i>
              <div className="text-left">
                <div className="text-white font-semibold">Certification automatique</div>
                <div className="text-teal-100 text-sm">Après validation des 24 séances (4 niveaux × 6 séances)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section id="users" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">Utilisateurs cibles</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pour qui est cette plateforme ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conçue pour une utilisation quotidienne par tous les acteurs de la formation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((user, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center mb-6">
                  <i className={`${user.icon} text-teal-600 text-3xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{user.title}</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{user.description}</p>
                <div className="space-y-2">
                  {user.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center gap-2 text-sm text-gray-700">
                      <i className="ri-check-line text-teal-600"></i>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gray-50 rounded-2xl p-6">
                <img 
                  src="https://readdy.ai/api/search-image?query=Modern%20dashboard%20interface%20showing%20attendance%20tracking%20system%20with%20charts%20and%20student%20progress%20data%20clean%20minimal%20design%20professional%20educational%20software%20interface%20light%20background&width=600&height=450&seq=dashboard001&orientation=landscape"
                  alt="Interface de la plateforme"
                  className="w-full h-72 object-cover object-top rounded-xl shadow-lg"
                />
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">Avantages</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Pourquoi utiliser ASTBA ?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-time-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Gain de temps</h4>
                    <p className="text-sm text-gray-600">Fini les listes papier et le suivi manuel. Tout est automatisé et centralisé.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-shield-check-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Fiabilité des données</h4>
                    <p className="text-sm text-gray-600">Éliminez les erreurs de saisie et assurez l'intégrité de vos données.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-eye-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Visibilité complète</h4>
                    <p className="text-sm text-gray-600">Suivez l'avancement de chaque élève en temps réel avec des indicateurs clairs.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-smartphone-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Accessible partout</h4>
                    <p className="text-sm text-gray-600">Application web responsive, accessible depuis PC et tablette.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice to Text Section */}
      <VoiceToText />

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <i className="ri-rocket-2-line text-white text-4xl"></i>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à simplifier votre gestion pédagogique ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Rejoignez l'équipe ASTBA et découvrez une nouvelle façon de gérer vos formations, 
            suivre les présences et délivrer les certifications.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Commencer maintenant
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://static.readdy.ai/image/bf4e711212c75bfc790e10d1f48c04b1/405300009b422c3bf3fc7c3883a1975c.png" 
                  alt="ASTBA Logo" 
                  className="h-10 w-auto"
                />
                <span className="font-bold text-xl text-gray-900">ASTBA</span>
              </div>
              <p className="text-gray-600 text-sm mb-4 max-w-md">
                Association Sciences and Technology Ben Arous - Plateforme de suivi des formations 
                et présences pour le développement des compétences scientifiques et technologiques.
              </p>
              <p className="text-gray-500 text-sm">
                Depuis 2018 au service de l'éducation
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/students" className="text-gray-600 text-sm hover:text-teal-600 transition-colors cursor-pointer">Élèves</Link></li>
                <li><Link to="/trainings" className="text-gray-600 text-sm hover:text-teal-600 transition-colors cursor-pointer">Formations</Link></li>
                <li><Link to="/attendance" className="text-gray-600 text-sm hover:text-teal-600 transition-colors cursor-pointer">Présences</Link></li>
                <li><Link to="/certification" className="text-gray-600 text-sm hover:text-teal-600 transition-colors cursor-pointer">Certifications</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600 text-sm">
                  <i className="ri-map-pin-line text-teal-600"></i>
                  Ben Arous, Tunisie
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-sm">
                  <i className="ri-mail-line text-teal-600"></i>
                  contact@astba.tn
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 ASTBA. Tous droits réservés.
            </p>
            <a 
              href="https://readdy.ai/?ref=logo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 text-sm hover:text-teal-600 transition-colors cursor-pointer"
            >
              Powered by Readdy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

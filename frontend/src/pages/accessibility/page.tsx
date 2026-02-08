
import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { studentsData } from '../../mocks/students';
import { preferenceService } from '../../services/preference.service';
import { useAnnouncer } from '../../components/a11y/Announcer';
import {
  applyAccessibilitySettings,
  defaultAccessibilitySettings,
  type AccessibilitySettings
} from '../../components/a11y/accessibilitySettings';

interface StudentAccommodation {
  studentId: number;
  visualImpairment: boolean;
  hearingImpairment: boolean;
  motorImpairment: boolean;
  cognitiveSupport: boolean;
  notes: string;
}

export default function Accessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultAccessibilitySettings);
  const [savedSettings, setSavedSettings] = useState<AccessibilitySettings>(defaultAccessibilitySettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [screenReaderTestMessage, setScreenReaderTestMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState({
    arabic: false,
    arabicFemale: false,
    frenchFemale: false
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePrefs, setVoicePrefs] = useState({
    fr: '',
    ar: '',
    en: ''
  });
  const { announce } = useAnnouncer();
  
  // Student accommodations
  const [accommodations, setAccommodations] = useState<StudentAccommodation[]>([]);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [accommodationForm, setAccommodationForm] = useState<Omit<StudentAccommodation, 'studentId'>>({
    visualImpairment: false,
    hearingImpairment: false,
    motorImpairment: false,
    cognitiveSupport: false,
    notes: ''
  });
  const accommodationModalRef = useRef<HTMLDivElement>(null);
  const accommodationCloseButtonRef = useRef<HTMLButtonElement>(null);
  const lastActifElementRef = useRef<HTMLElement | null>(null);
  
  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);

  const applySettingsToDOM = useCallback((s: AccessibilitySettings) => {
    applyAccessibilitySettings(s);
  }, []);

  const toPreferencePayload = (s: AccessibilitySettings) => {
    const { speechFeedback, ...payload } = s;
    return payload;
  };

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      let initialSettings = defaultAccessibilitySettings;
      let loadedFromRemote = false;

      try {
        const remote = await preferenceService.get();
        if (remote) {
          initialSettings = { ...defaultAccessibilitySettings, ...remote };
          loadedFromRemote = true;
        }
      } catch (error) {
        console.error('Failed to load preferences', error);
      }

      if (!loadedFromRemote) {
        const stored = localStorage.getItem('accessibilitySettings');
        if (stored) {
          initialSettings = { ...defaultAccessibilitySettings, ...JSON.parse(stored) };
        }
      } else {
        const stored = localStorage.getItem('accessibilitySettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed?.speechFeedback === 'boolean') {
            initialSettings = { ...initialSettings, speechFeedback: parsed.speechFeedback };
          }
        }
      }

      setSettings(initialSettings);
      setSavedSettings(initialSettings);
      applySettingsToDOM(initialSettings);

      const storedAccommodations = localStorage.getItem('studentAccommodations');
      if (storedAccommodations) {
        setAccommodations(JSON.parse(storedAccommodations));
      }
    };

    loadSettings();
  }, [applySettingsToDOM]);

  // Check for changes
  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(savedSettings));
  }, [settings, savedSettings]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveSettings = async () => {
    try {
      await preferenceService.update(toPreferencePayload(settings));
      localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
      setSavedSettings(settings);
      applySettingsToDOM(settings);
      setPreviewMode(false);
      showNotification('Param?tres sauvegard?s avec succ?s !');
    } catch (error) {
      console.error('Failed to save preferences', error);
      showNotification('Echec de sauvegarde des param?tres', 'info');
    }
  };

  const handleResetSettings = async () => {
    try {
      await preferenceService.update(toPreferencePayload(defaultAccessibilitySettings));
    } catch (error) {
      console.error('Failed to reset preferences', error);
    }
    setSettings(defaultAccessibilitySettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(defaultAccessibilitySettings));
    setSavedSettings(defaultAccessibilitySettings);
    applySettingsToDOM(defaultAccessibilitySettings);
    setPreviewMode(false);
    showNotification('Param?tres r?initialis?s par d?faut', 'info');
  };

  const handlePreviewToggle = () => {
    if (previewMode) {
      // Revert to saved settings
      applySettingsToDOM(savedSettings);
      setPreviewMode(false);
    } else {
      // Appliquer current settings for preview
      applySettingsToDOM(settings);
      setPreviewMode(true);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (previewMode) {
      applySettingsToDOM({ ...settings, [key]: value });
    }
    if (key === 'speechFeedback' && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('accessibilitySettings');
        const base = raw ? JSON.parse(raw) : { ...defaultAccessibilitySettings };
        window.localStorage.setItem('accessibilitySettings', JSON.stringify({ ...base, speechFeedback: value }));
        window.sessionStorage.setItem('astba_speech_session', value ? 'on' : 'off');
      } catch (error) {
        console.error('Failed to persist speech feedback setting', error);
      }
    }
  };

  const handleVoicePreferenceChange = (langKey: 'fr' | 'ar' | 'en', voiceUri: string) => {
    const next = { ...voicePrefs, [langKey]: voiceUri };
    setVoicePrefs(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('astba_voice_prefs', JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save voice preferences', error);
      }
    }
  };

  const voiceOptionsFor = (prefix: 'fr' | 'ar' | 'en') => {
    return voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  };

  const handleScreenReaderTest = () => {
    const timestamp = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const message = `Test lecteur d'ecran reussi. Heure ${timestamp}.`;
    setScreenReaderTestMessage(message);
    announce(message);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const voices = synth.getVoices();
      setVoices(voices);
      const isArabic = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().startsWith('ar');
      const isFrench = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().startsWith('fr');
      const isFemale = (voice: SpeechSynthesisVoice) => /female|woman|femme|zira|susan|samantha|helena|karen|amelie|amélie|julie|audrey|marie|lea|léa|lucie|celine|céline|hortense|denise|claire|brigitte|elodie|élodie|sylvie|nathalie|hoda|amira|salma|sara|leila|noura|mariam|maja|laila|layla/i.test(voice.name);

      setVoiceStatus({
        arabic: voices.some(isArabic),
        arabicFemale: voices.some((voice) => isArabic(voice) && isFemale(voice)),
        frenchFemale: voices.some((voice) => isFrench(voice) && isFemale(voice))
      });
    };
    updateVoices();
    synth.onvoiceschanged = updateVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('astba_voice_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setVoicePrefs({
          fr: parsed?.fr || '',
          ar: parsed?.ar || '',
          en: parsed?.en || ''
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Student accommodation functions
  const openAccommodationModal = (studentId: number) => {
    lastActifElementRef.current = document.activeElement as HTMLElement | null;
    setSelectedStudent(studentId);
    const existing = accommodations.find(a => a.studentId === studentId);
    if (existing) {
      setAccommodationForm({
        visualImpairment: existing.visualImpairment,
        hearingImpairment: existing.hearingImpairment,
        motorImpairment: existing.motorImpairment,
        cognitiveSupport: existing.cognitiveSupport,
        notes: existing.notes
      });
    } else {
      setAccommodationForm({
        visualImpairment: false,
        hearingImpairment: false,
        motorImpairment: false,
        cognitiveSupport: false,
        notes: ''
      });
    }
    setShowAccommodationModal(true);
  };

  const closeAccommodationModal = useCallback(() => {
    setShowAccommodationModal(false);
    const activeElement = lastActifElementRef.current;
    if (activeElement) {
      activeElement.focus();
    }
  }, []);

  useEffect(() => {
    if (!showAccommodationModal) return;
    const dialog = accommodationModalRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAccommodationModal();
        return;
      }
      if (event.key !== 'Tab') return;
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    if (accommodationCloseButtonRef.current) {
      accommodationCloseButtonRef.current.focus();
    } else {
      first?.focus();
    }

    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [showAccommodationModal, closeAccommodationModal]);

  const saveAccommodation = () => {
    if (selectedStudent === null) return;
    
    const newAccommodation: StudentAccommodation = {
      studentId: selectedStudent,
      ...accommodationForm
    };
    
    const updated = accommodations.filter(a => a.studentId !== selectedStudent);
    updated.push(newAccommodation);
    
    setAccommodations(updated);
    localStorage.setItem('studentAccommodations', JSON.stringify(updated));
    setShowAccommodationModal(false);
    showNotification('Aménagements enregistrés pour l\'étudiant');
  };

  const getStudentAccommodation = (studentId: number) => {
    return accommodations.find(a => a.studentId === studentId);
  };

  const getAccommodationCount = (studentId: number) => {
    const acc = getStudentAccommodation(studentId);
    if (!acc) return 0;
    return [acc.visualImpairment, acc.hearingImpairment, acc.motorImpairment, acc.cognitiveSupport].filter(Boolean).length;
  };

  const student = selectedStudent ? studentsData.find(s => s.id === selectedStudent) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ${
          toastType === 'success' ? 'bg-green-600 text-white' : 'bg-teal-600 text-white'
        }`}>
          <i className={`${toastType === 'success' ? 'ri-check-circle-line' : 'ri-information-line'} text-xl`} aria-hidden="true"></i>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
      
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Paramètres d'Accessibilité</h1>
            <p className="text-base text-gray-600">Personnalisez votre expérience pour une meilleure accessibilité</p>
          </div>
          
          {hasChanges && (
            <Badge variant="warning" size="md">
              <i className="ri-error-warning-line mr-1" aria-hidden="true"></i>
              Modifications non sauvegardées
            </Badge>
          )}
        </div>
        
      <Card className="mb-6 border-teal-200 bg-teal-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Tester le lecteur d?cran</h2>
            <p className="text-sm text-gray-700">
              Cliquez pour entendre une annonce via le lecteur d?cran. Activez aussi "Voix int?gr?e" pour des annonces vocales dans toute l'application.
            </p>
            <p className="text-xs text-gray-600 mt-2">Raccourci global : Alt + Shift + V</p>
            <p className="text-xs text-gray-600 mt-1">La voix lit aussi les champs pendant la saisie (fran?ais, arabe, anglais).</p>
            {!speechSupported && (
              <p className="text-xs text-amber-700 mt-2">
                La lecture vocale du navigateur n'est pas disponible sur cet appareil.
              </p>
            )}
            {speechSupported && !voiceStatus.arabic && (
              <p className="text-xs text-amber-700 mt-2">
                Voix arabe non d?tect?e par Chrome. Red?marrez Chrome apr?s l'installation.
              </p>
            )}
            {speechSupported && voiceStatus.arabic && !voiceStatus.arabicFemale && (
              <p className="text-xs text-amber-700 mt-2">
                Voix arabe trouv?e, mais pas de voix f?minine. La meilleure voix disponible sera utilis?e.
              </p>
            )}
            {speechSupported && !voiceStatus.frenchFemale && (
              <p className="text-xs text-amber-700 mt-2">
                Aucune voix f?minine fran?aise d?tect?e. Une voix f?minine proche sera utilis?e.
              </p>
            )}
            {screenReaderTestMessage && (
              <p className="text-xs text-gray-600 mt-2">Dernier test : {screenReaderTestMessage}</p>
            )}
          </div>
          <Button type="button" variant="primary" onClick={handleScreenReaderTest}>
            <i className="ri-sound-module-line" aria-hidden="true"></i>
            Lancer le test
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choisir la voix</h2>
        <p className="text-sm text-gray-600 mb-4">
          S?lectionnez une voix pr?f?r?e pour chaque langue (ou laissez sur Auto).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="voice-fr" className="block text-sm font-medium text-gray-700 mb-1.5">Fran?ais</label>
            <select
              id="voice-fr"
              value={voicePrefs.fr}
              onChange={(e) => handleVoicePreferenceChange('fr', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Auto (voix f?minine)</option>
              {voiceOptionsFor('fr').map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="voice-ar" className="block text-sm font-medium text-gray-700 mb-1.5">Arabe</label>
            <select
              id="voice-ar"
              value={voicePrefs.ar}
              onChange={(e) => handleVoicePreferenceChange('ar', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Auto (arabe)</option>
              {voiceOptionsFor('ar').map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
              ))}
            </select>
            {voiceOptionsFor('ar').length === 0 && (
              <p className="text-xs text-amber-700 mt-1">Aucune voix arabe d?tect?e par Chrome.</p>
            )}
          </div>
          <div>
            <label htmlFor="voice-en" className="block text-sm font-medium text-gray-700 mb-1.5">Anglais</label>
            <select
              id="voice-en"
              value={voicePrefs.en}
              onChange={(e) => handleVoicePreferenceChange('en', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Auto (anglais)</option>
              {voiceOptionsFor('en').map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Size */}
            <Card>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center bg-teal-100 rounded-lg">
                  <i className="ri-text text-2xl text-teal-600" aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Taille du Texte</h2>
                  <p className="text-sm text-gray-600 mb-4">Ajustez la taille du texte dans toute l'application</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'small', label: 'Petit', size: 'text-sm' },
                      { value: 'medium', label: 'Moyen', size: 'text-base' },
                      { value: 'large', label: 'Grand', size: 'text-lg' },
                      { value: 'xlarge', label: 'Très Grand', size: 'text-xl' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('fontSize', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                          settings.fontSize === option.value
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                        aria-pressed={settings.fontSize === option.value}
                      >
                        <p className={`font-medium ${option.size}`}>Aa</p>
                        <p className="text-xs text-gray-600 mt-1">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Line Spacing */}
            <Card>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center bg-sky-100 rounded-lg">
                  <i className="ri-line-height text-2xl text-sky-600" aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Espacement des Lignes</h2>
                  <p className="text-sm text-gray-600 mb-4">Ajustez l'espace entre les lignes de texte</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'compact', label: 'Compact', preview: 'leading-tight' },
                      { value: 'normal', label: 'Normal', preview: 'leading-normal' },
                      { value: 'relaxed', label: 'Aéré', preview: 'leading-relaxed' },
                      { value: 'loose', label: 'Large', preview: 'leading-loose' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('lineSpacing', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                          settings.lineSpacing === option.value
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                        aria-pressed={settings.lineSpacing === option.value}
                      >
                        <div className={`text-xs text-gray-700 ${option.preview}`}>
                          <p>Ligne 1</p>
                          <p>Ligne 2</p>
                          <p>Ligne 3</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Contrast Mode */}
            <Card>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-lg">
                  <i className="ri-contrast-2-line text-2xl text-indigo-600" aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Mode Contraste</h2>
                  <p className="text-sm text-gray-600 mb-4">Augmentez le contraste pour une meilleure visibilité</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => updateSetting('contrast', 'normal')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                        settings.contrast === 'normal'
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                      aria-pressed={settings.contrast === 'normal'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-300 rounded"></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Contraste Normal</p>
                          <p className="text-xs text-gray-600">Couleurs standard</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateSetting('contrast', 'high')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                        settings.contrast === 'high'
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                      aria-pressed={settings.contrast === 'high'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded"></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Contraste Élevé</p>
                          <p className="text-xs text-gray-600">Visibilité améliorée</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Color Blind Mode */}
            <Card>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center bg-rose-100 rounded-lg">
                  <i className="ri-eye-line text-2xl text-rose-600" aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Mode Daltonien</h2>
                  <p className="text-sm text-gray-600 mb-4">Adaptez les couleurs selon votre type de daltonisme</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'none', label: 'Aucun', colors: ['bg-red-500', 'bg-green-500', 'bg-blue-500'] },
                      { value: 'protanopia', label: 'Protanopie', colors: ['bg-yellow-600', 'bg-yellow-400', 'bg-blue-500'] },
                      { value: 'deuteranopia', label: 'Deutéranopie', colors: ['bg-amber-600', 'bg-amber-400', 'bg-blue-500'] },
                      { value: 'tritanopia', label: 'Tritanopie', colors: ['bg-red-500', 'bg-green-500', 'bg-pink-400'] }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('colorBlindMode', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                          settings.colorBlindMode === option.value
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                        aria-pressed={settings.colorBlindMode === option.value}
                      >
                        <div className="flex gap-1 mb-2 justify-center">
                          {option.colors.map((color, i) => (
                            <div key={i} className={`w-5 h-5 rounded-full ${color}`}></div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Toggle Settings */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Options Supplémentaires</h2>
              
              <div className="space-y-4">
                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                      <i className="ri-movie-line text-xl text-purple-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Animations</p>
                      <p className="text-sm text-gray-600">Désactivez pour réduire les mouvements</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('animations', !settings.animations)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.animations ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.animations}
                    aria-label="Actifr les animations"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.animations ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>
                
                {/* Screen Reader Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                      <i className="ri-volume-up-line text-xl text-green-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Support Lecteur d'Écran</p>
                      <p className="text-sm text-gray-600">Labels ARIA et descriptions améliorés</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('screenReader', !settings.screenReader)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.screenReader ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.screenReader}
                    aria-label="Actifr le support lecteur d'écran"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.screenReader ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>
                
                {/* Speech Feedback Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-sky-100 rounded-lg">
                      <i className="ri-sound-module-line text-xl text-sky-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Voix int?gr?e</p>
                      <p className="text-sm text-gray-600">Annonce vocale via le navigateur</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('speechFeedback', !settings.speechFeedback)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.speechFeedback ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.speechFeedback}
                    aria-label="Activer la voix int?gr?e"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.speechFeedback ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Focus Highlight Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
                      <i className="ri-focus-3-line text-xl text-amber-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Surbrillance du Focus</p>
                      <p className="text-sm text-gray-600">Indicateurs de focus plus visibles</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('focusHighlight', !settings.focusHighlight)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.focusHighlight ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.focusHighlight}
                    aria-label="Actifr la surbrillance du focus"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.focusHighlight ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>
                
                {/* Simplify UI Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg">
                      <i className="ri-layout-3-line text-xl text-slate-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Interface Simplifiee</p>
                      <p className="text-sm text-gray-600">Masquer les elements visuels non essentiels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('simplifyUi', !settings.simplifyUi)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.simplifyUi ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.simplifyUi}
                    aria-label="Activer l'interface simplifi?e"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.simplifyUi ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Large Cursor Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-cyan-100 rounded-lg">
                      <i className="ri-cursor-line text-xl text-cyan-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Grand Curseur</p>
                      <p className="text-sm text-gray-600">Augmentez la taille du curseur</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('cursorSize', settings.cursorSize === 'normal' ? 'large' : 'normal')}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      settings.cursorSize === 'large' ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={settings.cursorSize === 'large'}
                    aria-label="Actifr le grand curseur"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        settings.cursorSize === 'large' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            </Card>
            
            {/* Keyboard Navigation */}
            <Card>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-lg">
                  <i className="ri-keyboard-line text-2xl text-amber-600" aria-hidden="true"></i>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Navigation au Clavier</h2>
                  <p className="text-sm text-gray-600 mb-4">Raccourcis pour naviguer avec le clavier</p>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'Tab', desc: 'Naviguer entre les éléments interactifs' },
                      { key: 'Shift + Tab', desc: 'Naviguer en arrière' },
                      { key: 'Enter', desc: 'Actifr les boutons et liens' },
                      { key: 'Esc', desc: 'Fermer les dialogues et menus' },
                      { key: 'Space', desc: 'Basculer les cases à cocher et interrupteurs' },
                      { key: '↑ ↓', desc: 'Naviguer dans les listes et menus' },
                      { key: 'Alt + Shift + A', desc: 'Aller à la page Présences' },
                      { key: 'Alt + Shift + S', desc: 'Aller à la page Élèves' },
                      { key: 'Alt + Shift + T', desc: 'Aller à la page Formations' },
                      { key: 'Ctrl + K', desc: 'Ouvrir les commandes rapides' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-mono min-w-[80px] text-center">
                          {item.key}
                        </kbd>
                        <p className="text-sm text-gray-700">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={handleSaveSettings}
                  disabled={!hasChanges}
                >
                  <i className="ri-save-line" aria-hidden="true"></i>
                  Sauvegarder
                </Button>
                
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={handlePreviewToggle}
                  disabled={!hasChanges}
                >
                  <i className={previewMode ? 'ri-eye-off-line' : 'ri-eye-line'} aria-hidden="true"></i>
                  {previewMode ? 'Arrêter Aperçu' : 'Aperçu'}
                </Button>
                
                <Button variant="outline" fullWidth onClick={handleResetSettings}>
                  <i className="ri-refresh-line" aria-hidden="true"></i>
                  Réinitialiser
                </Button>
              </div>
              
              {previewMode && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <i className="ri-information-line" aria-hidden="true"></i>
                    Mode aperçu actif. Sauvegardez pour conserver les changements.
                  </p>
                </div>
              )}
            </Card>
            
            {/* Resume des param?tres */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des Paramètres</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Taille du texte</span>
                  <Badge variant="info" size="sm">{settings.fontSize}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Contraste</span>
                  <Badge variant={settings.contrast === 'high' ? 'warning' : 'neutral'} size="sm">
                    {settings.contrast === 'high' ? 'Élevé' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Animations</span>
                  <Badge variant={settings.animations ? 'success' : 'neutral'} size="sm">
                    {settings.animations ? 'Activées' : 'Désactivées'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Espacement</span>
                  <Badge variant="info" size="sm">{settings.lineSpacing}</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Mode daltonien</span>
                  <Badge variant={settings.colorBlindMode !== 'none' ? 'warning' : 'neutral'} size="sm">
                    {settings.colorBlindMode === 'none' ? 'Aucun' : settings.colorBlindMode}
                  </Badge>
                </div>
              </div>
            </Card>
            
            {/* Student Accommodations */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Aménagements Étudiants</h3>
                <Badge variant="info" size="sm">
                  {accommodations.length} configuré{accommodations.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Configurez les besoins d'accessibilité spécifiques pour chaque étudiant.
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {studentsData.map((s) => {
                  const accCount = getAccommodationCount(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => openAccommodationModal(s.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-full text-xs font-bold">
                        {(s.firstName?.[0] || '?')}{(s.lastName?.[0] || '')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500">Niveau {s.currentLevel}</p>
                        </div>
                      </div>
                      {accCount > 0 ? (
                        <Badge variant="success" size="sm">
                          {accCount} aménagement{accCount > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <i className="ri-add-circle-line text-gray-400 text-lg" aria-hidden="true"></i>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Student Accommodation Modal */}
      {showAccommodationModal && student && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeAccommodationModal}
        >
          <div 
            ref={accommodationModalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accommodation-modal-title"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-full font-bold">
                    {(student.firstName?.[0] || '?')}{(student.lastName?.[0] || '')}
                  </div>
                  <div>
                    <h2 id="accommodation-modal-title" className="text-xl font-bold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
                <button
                  ref={accommodationCloseButtonRef}
                  onClick={closeAccommodationModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <i className="ri-close-line text-xl text-gray-500" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Besoins d'Accessibilité</h3>
              
              <div className="space-y-4">
                {/* Visual Impairment */}
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-rose-100 rounded-lg">
                      <i className="ri-eye-close-line text-xl text-rose-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Déficience Visuelle</p>
                      <p className="text-xs text-gray-600">Texte agrandi, contraste élevé</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accommodationForm.visualImpairment}
                    onChange={(e) => setAccommodationForm(prev => ({ ...prev, visualImpairment: e.target.checked }))}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                
                {/* Hearing Impairment */}
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
                      <i className="ri-ear-off-line text-xl text-amber-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Déficience Auditive</p>
                      <p className="text-xs text-gray-600">Sous-titres, alertes visuelles</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accommodationForm.hearingImpairment}
                    onChange={(e) => setAccommodationForm(prev => ({ ...prev, hearingImpairment: e.target.checked }))}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                
                {/* Motor Impairment */}
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-sky-100 rounded-lg">
                      <i className="ri-hand-coin-line text-xl text-sky-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Déficience Motrice</p>
                      <p className="text-xs text-gray-600">Navigation clavier, zones cliquables agrandies</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accommodationForm.motorImpairment}
                    onChange={(e) => setAccommodationForm(prev => ({ ...prev, motorImpairment: e.target.checked }))}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                
                {/* Cognitive Support */}
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                      <i className="ri-brain-line text-xl text-purple-600" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Support Cognitif</p>
                      <p className="text-xs text-gray-600">Interface simplifiée, temps supplémentaire</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accommodationForm.cognitiveSupport}
                    onChange={(e) => setAccommodationForm(prev => ({ ...prev, cognitiveSupport: e.target.checked }))}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
              </div>
              
              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes Supplémentaires
                </label>
                <textarea
                  value={accommodationForm.notes}
                  onChange={(e) => setAccommodationForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ajoutez des notes spécifiques sur les besoins de l'étudiant..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{accommodationForm.notes.length}/500</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button variant="outline" fullWidth onClick={closeAccommodationModal}>
                Annuler
              </Button>
              <Button variant="primary" fullWidth onClick={saveAccommodation}>
                <i className="ri-save-line" aria-hidden="true"></i>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

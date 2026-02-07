
import { useState, useRef, useCallback, useEffect } from 'react';

interface TranscriptEntry {
  id: number;
  text: string;
  timestamp: string;
}

export default function VoiceToText() {
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef<any>(null);
  const entryIdRef = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
    { code: 'ar-TN', label: 'العربية', flag: '🇹🇳' },
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
  ];

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const startListening = useCallback(() => {
    setError('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fixed string escaping
      setError(
        "La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome ou Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setPulse(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        entryIdRef.current += 1;
        const newEntry: TranscriptEntry = {
          id: entryIdRef.current,
          text: finalTranscript.trim(),
          timestamp: getTimestamp(),
        };
        setEntries((prev) => [...prev, newEntry]);
        setCurrentText('');
      } else {
        setCurrentText(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setError('Aucune voix détectée. Parlez plus fort ou rapprochez-vous du micro.');
      } else if (event.error === 'not-allowed') {
        // Fixed string escaping
        setError(
          "Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres du navigateur."
        );
      } else {
        setError('Erreur de reconnaissance vocale. Veuillez réessayer.');
      }
      setIsListening(false);
      setPulse(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setPulse(false);
      setCurrentText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setPulse(false);
    setCurrentText('');
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearBoard = () => {
    setEntries([]);
    setCurrentText('');
    setError('');
  };

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const copyAll = () => {
    const allText = entries.map((e) => e.text).join('\n');
    if (allText) {
      navigator.clipboard.writeText(allText).catch(() => {});
    }
  };

  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollTop = boardRef.current.scrollHeight;
    }
  }, [entries, currentText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <section className="py-20 bg-white" id="voice-to-text">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">
            Outil interactif
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Voix vers Texte</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Cliquez sur le microphone, parlez, et votre discours s&apos;affiche instantanément sur le
            tableau. Idéal pour la prise de notes rapide en formation.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        if (!isListening) setLanguage(lang.code);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        language === lang.code
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isListening}
                    >
                      <span>{lang.flag}</span>
                      <span className="hidden sm:inline">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyAll}
                  disabled={entries.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Copier tout le texte"
                >
                  <i className="ri-file-copy-line"></i>
                  <span className="hidden sm:inline">Copier</span>
                </button>
                <button
                  onClick={clearBoard}
                  disabled={entries.length === 0 && !currentText}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Effacer le tableau"
                >
                  <i className="ri-delete-bin-line"></i>
                  <span className="hidden sm:inline">Effacer</span>
                </button>
              </div>
            </div>

            {/* Board */}
            <div
              ref={boardRef}
              className="min-h-[280px] max-h-[400px] overflow-y-auto px-6 py-5 space-y-3"
            >
              {entries.length === 0 && !currentText && !error && (
                <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                    <i className="ri-mic-line text-3xl"></i>
                  </div>
                  <p className="text-sm font-medium">Appuyez sur le microphone pour commencer</p>
                  <p className="text-xs mt-1">Votre texte apparaîtra ici</p>
                </div>
              )}

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 flex items-center justify-center bg-teal-50 rounded-full">
                      <i className="ri-chat-voice-line text-teal-600 text-sm"></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm leading-relaxed">{entry.text}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{entry.timestamp}</span>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              ))}

              {currentText && (
                <div className="flex items-start gap-3 bg-teal-50/50 rounded-xl px-4 py-3 border border-teal-100 animate-pulse">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 flex items-center justify-center bg-teal-100 rounded-full">
                      <i className="ri-loader-4-line text-teal-600 text-sm animate-spin"></i>
                    </div>
                  </div>
                  <p className="text-teal-700 text-sm leading-relaxed italic">{currentText}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                  <div className="w-7 h-7 flex items-center justify-center bg-red-100 rounded-full flex-shrink-0">
                    <i className="ri-error-warning-line text-red-500 text-sm"></i>
                  </div>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Mic Button Area */}
            <div className="flex flex-col items-center gap-3 px-6 py-6 bg-white border-t border-gray-200">
              <button
                onClick={toggleListening}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200'
                }`}
                // Fixed string escaping
                aria-label={isListening ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"}
              >
                {pulse && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></span>
                    <span className="absolute -inset-2 rounded-full border-2 border-red-300 animate-pulse opacity-50"></span>
                  </>
                )}
                <i
                  className={`${
                    isListening ? 'ri-stop-fill' : 'ri-mic-fill'
                  } text-white text-2xl relative z-10`}
                ></i>
              </button>
              <span className={`text-sm font-medium ${isListening ? 'text-red-500' : 'text-gray-500'}`}>
                {isListening ? "Écoute en cours... Cliquez pour arrêter" : 'Cliquez pour parler'}
              </span>
              {entries.length > 0 && (
                <span className="text-xs text-gray-400">
                  {entries.length} {entries.length === 1 ? 'entrée' : 'entrées'} enregistrée
                  {entries.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

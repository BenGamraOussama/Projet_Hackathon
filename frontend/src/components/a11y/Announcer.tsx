import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type AnnouncerContextValue = {
  announce: (message: string) => void;
  speak: (message: string) => void;
};

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

const SESSION_KEY = 'astba_speech_session';

const readSpeechSetting = () => {
  if (typeof window === 'undefined') return false;
  try {
    const sessionValue = window.sessionStorage.getItem(SESSION_KEY);
    if (sessionValue === 'on') return true;
    if (sessionValue === 'off') return false;
    const raw = window.localStorage.getItem('accessibilitySettings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.speechFeedback === 'boolean') {
      return parsed.speechFeedback;
    }
    return true;
  } catch {
    return false;
  }
};

const writeSpeechSetting = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem('accessibilitySettings');
    const parsed = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem('accessibilitySettings', JSON.stringify({ ...parsed, speechFeedback: enabled }));
    window.sessionStorage.setItem(SESSION_KEY, enabled ? 'on' : 'off');
  } catch {
    // ignore
  }
};

const ensureSpeechSettingInitialized = () => {
  if (typeof window === 'undefined') return;
  try {
    const sessionValue = window.sessionStorage.getItem(SESSION_KEY);
    if (!sessionValue) {
      window.sessionStorage.setItem(SESSION_KEY, 'on');
    }
    const raw = window.localStorage.getItem('accessibilitySettings');
    if (!raw) {
      window.localStorage.setItem('accessibilitySettings', JSON.stringify({ speechFeedback: true }));
      return;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.speechFeedback !== 'boolean') {
      window.localStorage.setItem('accessibilitySettings', JSON.stringify({ ...parsed, speechFeedback: true }));
    }
  } catch {
    // ignore
  }
};

const countMatches = (message: string, pattern: RegExp) => {
  const matches = message.match(pattern);
  return matches ? matches.length : 0;
};

const shouldUseArabic = (message: string) => {
  const arabicCount = countMatches(message, /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0660-\u0669]/g);
  const latinCount = countMatches(message, /[A-Za-z]/g);
  return arabicCount >= 2 && arabicCount >= latinCount;
};

const detectLang = (message: string) => {
  const htmlLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
  const fallback = htmlLang || (typeof navigator !== 'undefined' ? navigator.language : '') || 'fr-FR';
  const latinPattern = /[A-Za-z]/;
  const englishHint = /\b(the|and|or|is|are|to|from|for|with|save|saved|failed|please|mark)\b/i;
  if (shouldUseArabic(message)) return 'ar-SA';
  if (latinPattern.test(message) && (htmlLang.startsWith('en') || englishHint.test(message))) return 'en-US';
  return fallback || 'fr-FR';
};

const voiceCache = new Map<string, string>();
const VOICE_PREF_KEY = 'astba_voice_prefs';

const readVoicePrefs = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(VOICE_PREF_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

const pickVoice = (lang: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return undefined;
  const langPrefix = lang.split('-')[0];
  const prefs = readVoicePrefs();
  const preferredUri = prefs?.[langPrefix];
  if (preferredUri) {
    const preferred = voices.find((voice) => voice.voiceURI === preferredUri);
    if (preferred) return preferred;
  }
  const cachedUri = voiceCache.get(lang);
  if (cachedUri) {
    const cachedVoice = voices.find((voice) => voice.voiceURI === cachedUri);
    if (cachedVoice) return cachedVoice;
  }
  const femaleHints = [
    'female', 'woman', 'femme',
    'zira', 'susan', 'samantha', 'helena', 'karen',
    'amelie', 'amélie', 'julie', 'audrey', 'marie', 'lea', 'léa', 'lucie', 'celine', 'céline',
    'hortense', 'denise', 'claire', 'brigitte', 'elodie', 'élodie', 'sylvie', 'nathalie',
    'hoda', 'amira', 'salma', 'sara', 'leila', 'noura', 'mariam', 'maja', 'laila', 'layla'
  ];
  const maleHints = ['male', 'man', 'homme', 'david', 'paul', 'mark', 'alex', 'george', 'thomas', 'yann'];
  const matchesLang = (voice: SpeechSynthesisVoice) => voice.lang === lang || voice.lang.startsWith(langPrefix);
  const isFemale = (voice: SpeechSynthesisVoice) => femaleHints.some((hint) => voice.name.toLowerCase().includes(hint));
  const isMale = (voice: SpeechSynthesisVoice) => maleHints.some((hint) => voice.name.toLowerCase().includes(hint));

  const langVoices = voices.filter(matchesLang);
  const preferredPool = langVoices.length > 0 ? langVoices : voices;
  const anyFemale = voices.find(isFemale);
  const isArabic = langPrefix === 'ar';

  let picked: SpeechSynthesisVoice | undefined;
  if (isArabic && langVoices.length > 0) {
    picked = langVoices.find(isFemale) || langVoices[0];
  } else {
    picked = preferredPool.find(isFemale)
      || (anyFemale && !preferredPool.find((voice) => !isMale(voice)) ? anyFemale : undefined)
      || preferredPool.find((voice) => !isMale(voice))
      || preferredPool[0];
  }
  if (picked) {
    voiceCache.set(lang, picked.voiceURI);
  }
  return picked;
};

const speakMessage = (message: string) => {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length === 0) {
    const handler = () => {
      synth.onvoiceschanged = null;
      speakMessage(message);
    };
    synth.onvoiceschanged = handler;
    synth.getVoices();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(message);
  const lang = detectLang(message);
  const voice = pickVoice(lang);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang;
  }
  synth.cancel();
  synth.speak(utterance);
};

const getLabelFromIds = (ids: string) => {
  if (!ids) return '';
  return ids
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
};

const getElementLabel = (element: HTMLElement) => {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelledText = getLabelFromIds(ariaLabelledBy);
    if (labelledText) return labelledText;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement | null;
      if (label?.textContent) return label.textContent.trim();
    }
  }

  const closestLabel = element.closest('label');
  if (closestLabel?.textContent) return closestLabel.textContent.trim();

  const title = element.getAttribute('title')?.trim();
  if (title) return title;

  if (element instanceof HTMLInputElement) {
    const value = element.value?.trim();
    if (value && (element.type === 'button' || element.type === 'submit')) {
      return value;
    }
    const placeholder = element.getAttribute('placeholder')?.trim();
    if (placeholder) return placeholder;
  }

  const text = element.textContent?.trim();
  if (text) return text;

  return '';
};

const getTableContext = (element: HTMLElement) => {
  const explicitColumn = element.getAttribute('data-colheader')?.trim();
  const cellContainer = element.closest('[role="cell"], [role="gridcell"], td, th') as HTMLElement | null;
  const cell = cellContainer || element.closest('button, input, select, textarea') as HTMLElement | null;
  if (!cell) return '';
  let row = cell.closest('[role="row"], tr') as HTMLElement | null;
  if (!row) return '';
  const table = cell.closest('[role="table"], table');
  const rowHeader = row.querySelector('th, [data-announcer-label]');
  const rowHeaderText = rowHeader?.textContent?.trim() || '';
  const rowCells = Array.from(row.children).filter((child) => child instanceof HTMLElement);
  const cellIndex = rowCells.indexOf((cellContainer || cell) as HTMLElement);
  let columnHeaderText = '';
  if (explicitColumn) {
    columnHeaderText = explicitColumn;
  } else if (table) {
    const headerRow = table.querySelector('thead tr') || table.querySelector('[role="row"][data-header="true"]');
    if (headerRow && cellIndex >= 0) {
      const headerCell = headerRow.children[cellIndex] as HTMLElement | undefined;
      columnHeaderText = headerCell?.textContent?.trim() || '';
    }
  }
  if (!rowHeaderText) {
    const firstCell = row.querySelector('th, td, [role="cell"], [role="gridcell"], [data-announcer-label]');
    if (firstCell && firstCell !== cell) {
      const firstText = firstCell.textContent?.trim();
      if (firstText) {
        return [firstText, columnHeaderText].filter(Boolean).join(', ').trim();
      }
    }
  }
  return [rowHeaderText, columnHeaderText].filter(Boolean).join(', ').trim();
};

const shouldIgnoreValue = (element: HTMLElement) => {
  if (element instanceof HTMLInputElement && element.type === 'password') return true;
  if (element.getAttribute('aria-live')) return true;
  return false;
};

const getElementState = (element: HTMLElement) => {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked ? 'activé' : 'désactivé';
    }
  }
  const role = element.getAttribute('role');
  if (role === 'switch') {
    return element.getAttribute('aria-checked') === 'true' ? 'activé' : 'désactivé';
  }
  if (role === 'tab') {
    return element.getAttribute('aria-selected') === 'true' ? 'sélectionné' : 'non sélectionné';
  }
  return '';
};

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const lastSpokenRef = useRef<{ text: string; time: number } | null>(null);
  const inputTimeoutsRef = useRef<Map<HTMLElement, number>>(new Map());

  useEffect(() => {
    ensureSpeechSettingInitialized();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => synth.getVoices();
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const notify = useCallback((nextMessage: string, forceSpeak = false) => {
    setMessage('');
    window.requestAnimationFrame(() => setMessage(nextMessage));
    if (forceSpeak || readSpeechSetting()) {
      speakMessage(nextMessage);
    }
  }, []);

  const announce = useCallback((nextMessage: string) => {
    notify(nextMessage);
  }, [notify]);

  const speak = useCallback((nextMessage: string) => {
    if (readSpeechSetting()) {
      speakMessage(nextMessage);
    }
  }, []);

  useEffect(() => {
    (window as any).ASTBA_ANNOUNCE = announce;
    (window as any).ASTBA_SPEAK = speak;
    return () => {
      delete (window as any).ASTBA_ANNOUNCE;
      delete (window as any).ASTBA_SPEAK;
    };
  }, [announce, speak]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === 'KeyV') {
        event.preventDefault();
        const nextEnabled = !readSpeechSetting();
        writeSpeechSetting(nextEnabled);
        notify(nextEnabled ? 'Voix int?gr?e activ?e' : 'Voix int?gr?e d?sactiv?e', true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notify]);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (!readSpeechSetting()) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.getAttribute('aria-hidden') === 'true') return;
      if (target.dataset?.skipAnnounce === 'true') return;

      const label = getElementLabel(target);
      if (!label) return;
      const state = getElementState(target);
      const tableContext = getTableContext(target);
      const output = [label, state, tableContext].filter(Boolean).join(', ');

      const now = Date.now();
      if (lastSpokenRef.current?.text === output && now - lastSpokenRef.current.time < 800) {
        return;
      }

      lastSpokenRef.current = { text: output, time: now };
      speakMessage(output);
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  useEffect(() => {
    const handleInput = (event: Event) => {
      if (!readSpeechSetting()) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }

      const label = getElementLabel(target);
      const state = getElementState(target);

      let valueAnnouncement = '';
      if (target instanceof HTMLSelectElement) {
        valueAnnouncement = target.selectedOptions?.[0]?.textContent?.trim() || target.value;
      } else if (target instanceof HTMLInputElement) {
        if (target.type === 'password') {
          valueAnnouncement = 'caract?re saisi';
        } else if (target.type === 'checkbox' || target.type === 'radio') {
          valueAnnouncement = state || '';
        } else {
          valueAnnouncement = target.value?.trim();
        }
      } else {
        valueAnnouncement = target.value?.trim();
      }

      const combined = [label, valueAnnouncement].filter(Boolean).join(', ');
      if (!combined) return;

      const existingTimeout = inputTimeoutsRef.current.get(target);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        if (valueAnnouncement && shouldUseArabic(valueAnnouncement) && label && !shouldUseArabic(label)) {
          speakMessage(label);
          window.setTimeout(() => speakMessage(valueAnnouncement), 120);
        } else {
          speakMessage(combined);
        }
        inputTimeoutsRef.current.delete(target);
      }, 350);

      inputTimeoutsRef.current.set(target, timeoutId);
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!readSpeechSetting()) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (shouldIgnoreValue(target)) return;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }
      if (target instanceof HTMLInputElement && target.type === 'password') return;

      const label = getElementLabel(target);
      const value = target instanceof HTMLSelectElement
        ? target.selectedOptions?.[0]?.textContent?.trim() || target.value
        : target.value?.trim();
      if (!label && !value) return;
      const combined = [label, value].filter(Boolean).join(', ');
      speakMessage(combined);
    };

    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleInput);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('change', handleInput);
      document.removeEventListener('focusin', handleFocusIn);
      inputTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      inputTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleValidation = (event: Event) => {
      if (!readSpeechSetting()) return;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!target) return;
      const error = target.validationMessage?.trim();
      if (!error) return;
      const label = getElementLabel(target);
      const output = label ? `${label}: ${error}` : error;
      speakMessage(output);
    };
    document.addEventListener('invalid', handleValidation, true);
    return () => document.removeEventListener('invalid', handleValidation, true);
  }, []);

  useEffect(() => {
    const handleMutation = (mutations: MutationRecord[]) => {
      if (!readSpeechSetting()) return;
      const announcements: string[] = [];
      mutations.forEach((mutation) => {
        const rawTarget = mutation.target;
        if (!rawTarget) return;
        const elementTarget =
          rawTarget instanceof HTMLElement ? rawTarget : rawTarget.parentElement;
        if (!elementTarget) return;
        const role = elementTarget.getAttribute?.('role');
        if (elementTarget.getAttribute?.('aria-live') || role === 'status' || role === 'alert') {
          const text = elementTarget.textContent?.trim();
          if (text) announcements.push(text);
        }
      });
      announcements.forEach((text) => speakMessage(text));
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce, speak }}>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {message}
      </div>
      {children}
    </AnnouncerContext.Provider>
  );
}

export const useAnnouncer = () => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    return {
      announce: (message: string) => (window as any)?.ASTBA_ANNOUNCE?.(message),
      speak: (message: string) => (window as any)?.ASTBA_SPEAK?.(message)
    };
  }
  return context;
};

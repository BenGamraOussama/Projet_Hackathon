import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/student.service';

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  to: string;
  keywords?: string;
};

const baseCommands: CommandItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', description: 'Accueil', to: '/dashboard', keywords: 'home accueil' },
  { id: 'students', label: 'Eleves', description: 'Gestion des Eleves', to: '/students', keywords: 'students Eleves' },
  { id: 'trainings', label: 'Formations', description: 'Gestion des formations', to: '/trainings', keywords: 'trainings formations' },
  { id: 'attendance', label: 'Presences', description: 'Feuille de pr?sence', to: '/attendance', keywords: 'attendance pr?sences' },
  { id: 'certification', label: 'Certifications', description: 'Certificats', to: '/certification', keywords: 'certification' },
  { id: 'reports', label: 'Rapports', description: 'Indicateurs', to: '/reports', keywords: 'reports rapports' },
  { id: 'messages', label: 'Messages', description: 'Messagerie', to: '/messages', keywords: 'messages' },
  { id: 'admin-apps', label: 'Inscriptions', description: 'Inscriptions Eleves en attente', to: '/admin/applications', keywords: 'admin inscriptions Eleves pending' },
  { id: 'admin-decisions', label: 'D?cisions', description: 'Historique des d?cisions', to: '/admin/user-status', keywords: 'admin d?cisions statut' },
  { id: 'student-space', label: 'Espace étudiant', description: 'Portail étudiant', to: '/student-space', keywords: 'etudiant Eleve' },
  { id: 'profile', label: 'Profil', description: 'Mon profil', to: '/profile', keywords: 'profil' },
  { id: 'accessibility', label: 'Accessibilit?', description: 'Param?tres', to: '/accessibility', keywords: 'a11y accessibilite' }
];

const filterCommands = (commands: CommandItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((cmd) => {
    const haystack = `${cmd.label} ${cmd.description || ''} ${cmd.keywords || ''}`.toLowerCase();
    return haystack.includes(q);
  });
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [students, setStudents] = useState<any[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const studentCommands = useMemo<CommandItem[]>(() => {
    return students.map((student) => {
      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || `Eleve ${student.id}`;
      return {
        id: `student-${student.id}`,
        label: name,
        description: 'Fiche Eleve',
        to: `/students/${student.id}`,
        keywords: `${name} student Eleve`
      };
    });
  }, [students]);

  const allCommands = useMemo(() => [...baseCommands, ...studentCommands], [studentCommands]);
  const filtered = useMemo(() => filterCommands(allCommands, query), [allCommands, query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isEditableTarget(event.target)) {
          setIsOpen(true);
          return;
        }
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    studentService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setStudents(data || []);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (event: KeyboardEvent) => {
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

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const closePalette = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
    if (lastActiveRef.current) {
      lastActiveRef.current.focus();
    }
  };

  const handleSelect = (command: CommandItem) => {
    closePalette();
    navigate(command.to);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault();
      handleSelect(filtered[activeIndex]);
    }
  };

  if (!isOpen) return null;

  const activeId = filtered[activeIndex]?.id ? `command-${filtered[activeIndex]?.id}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-16" aria-hidden={!isOpen}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Commandes rapides"
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <i className="ri-command-line text-lg" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <label htmlFor="command-search" className="sr-only">Rechercher une commande</label>
            <input
              id="command-search"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Rechercher une page ou un Eleve..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={activeId}
            />
          </div>
          <button
            type="button"
            onClick={closePalette}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <ul id="command-list" role="listbox" className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-500">Aucun resultat</li>
            )}
            {filtered.map((cmd, index) => (
              <li
                key={cmd.id}
                id={`command-${cmd.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? 'bg-teal-50' : ''}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(cmd)}
                  className="w-full px-4 py-3 text-left hover:bg-teal-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-gray-500">{cmd.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">Entrer</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          <span>Raccourci: Ctrl + K</span>
          <span>Navigation: Fleches, Entrer, Echap</span>
        </div>
      </div>
    </div>
  );
}

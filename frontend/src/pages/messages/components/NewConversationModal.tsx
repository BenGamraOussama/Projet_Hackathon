import { useState, useEffect, useRef } from 'react';
import { userService } from '../../../services/user.service';

interface Trainer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrainer: (trainerId: string) => void;
}

export default function NewConversationModal({ isOpen, onClose, onSelectTrainer }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActifElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const [formateurs, responsables] = await Promise.all([
          userService.getByRole('FORMATEUR'),
          userService.getByRole('RESPONSABLE')
        ]);
        const users = [...formateurs, ...responsables];
        const mapped = users.map((user) => {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim() || (user.email ? user.email[0]?.toUpperCase() : 'U');
          return {
            id: user.email || String(user.id),
            name: `${firstName} ${lastName}`.trim() || user.email,
            role: user.role === 'RESPONSABLE' ? 'Responsable formation' : 'Formateur',
            avatar: initials.toUpperCase(),
            isOnline: false
          };
        });
        setTrainers(mapped);
      } catch (error) {
        console.error("Failed to load trainers", error);
        setTrainers([]);
      }
    };

    if (isOpen) {
      loadTrainers();
    }
  }, [isOpen]);

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      lastActifElementRef.current = document.activeElement as HTMLElement | null;
    } else if (lastActifElementRef.current) {
      lastActifElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = modalRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
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
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else {
      first?.focus();
    }

    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTrainer = (trainerId: string) => {
    onSelectTrainer(trainerId);
    onClose();
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="new-conversation-title" className="text-2xl font-bold text-gray-900">Nouvelle conversation</h2>
            <p className="text-sm text-gray-600 mt-1">Sélectionnez un utilisateur pour démarrer une conversation</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
            aria-label="Fermer la fen?tre"
          >
            <i className="ri-close-line text-2xl" aria-hidden="true"></i>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <label htmlFor="trainer-search" className="sr-only">Rechercher un utilisateur</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400" aria-hidden="true"></i>
            </div>
            <input
              type="text"
              id="trainer-search"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Trainers List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-user-search-line text-3xl text-gray-400" aria-hidden="true"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-gray-600">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTrainers.map((trainer) => (
                <button
                  key={trainer.id}
                  onClick={() => handleSelectTrainer(trainer.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer text-left"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-full text-white font-semibold">
                      {trainer.avatar}
                    </div>
                    {trainer.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 flex items-center justify-center bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
                    <p className="text-sm text-gray-600">{trainer.role}</p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {trainer.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <span className="w-1.5 h-1.5 flex items-center justify-center bg-green-500 rounded-full"></span>
                        En ligne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Hors ligne
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredTrainers.length} utilisateur{filteredTrainers.length > 1 ? 's' : ''} disponible{filteredTrainers.length > 1 ? 's' : ''}</span>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium cursor-pointer whitespace-nowrap"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

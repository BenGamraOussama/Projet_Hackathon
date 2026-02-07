
import { useState } from 'react';
import Button from '../../../components/base/Button';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileFormData) => void;
  initialData: ProfileFormData;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  address: string;
  language: string;
}

export default function EditProfileModal({ isOpen, onClose, onSave, initialData }: EditProfileModalProps) {
  const [form, setForm] = useState<ProfileFormData>(initialData);

  if (!isOpen) return null;

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const fields: { key: keyof ProfileFormData; label: string; type: string; placeholder: string; rows?: number }[] = [
    { key: 'firstName', label: 'Pr\u00e9nom', type: 'text', placeholder: 'Votre pr\u00e9nom' },
    { key: 'lastName', label: 'Nom', type: 'text', placeholder: 'Votre nom' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'votre@email.com' },
    { key: 'phone', label: 'T\u00e9l\u00e9phone', type: 'tel', placeholder: '+216 XX XXX XXX' },
    { key: 'address', label: 'Adresse', type: 'text', placeholder: 'Votre adresse' },
    { key: 'language', label: 'Langue', type: 'text', placeholder: 'Fran\u00e7ais' },
    { key: 'bio', label: '\u00c0 propos', type: 'textarea', placeholder: 'Parlez-nous de vous...', rows: 4 }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="edit-profile-title" className="text-xl font-bold text-gray-900">Modifier le Profil</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <i className="ri-close-line text-xl text-gray-500" aria-hidden="true"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.filter(f => f.key !== 'bio').map((field) => (
              <div key={field.key} className={field.key === 'address' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Bio textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">\u00c0 propos</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Parlez-nous de vous..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{form.bio.length}/500</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={onClose} type="button">
              Annuler
            </Button>
            <Button variant="primary" fullWidth type="submit">
              <i className="ri-save-line" aria-hidden="true"></i>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Badge from '../../components/base/Badge';
import { userService } from '../../services/user.service';

type RoleFilter = 'all' | 'FORMATEUR' | 'RESPONSABLE';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'FORMATEUR'
  });
  const [resetPassword, setResetPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
      setUsers([]);
    }
  };

  const filteredUsers = useMemo(() => {
    const scoped = users.filter((user) => user.role === 'FORMATEUR' || user.role === 'RESPONSABLE');
    if (filterRole === 'all') return scoped;
    return scoped.filter((user) => user.role === filterRole);
  }, [users, filterRole]);

  const openCreateModal = (event?: React.MouseEvent<HTMLButtonElement>) => {
    lastActiveElementRef.current = (event?.currentTarget ? document.activeElement : null) as HTMLElement | null;
    setFormData({ firstName: '', lastName: '', email: '', role: 'FORMATEUR' });
    setFormError('');
    setSuccessMessage('');
    setTemporaryPassword('');
    setEmailSent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user, event?: React.MouseEvent<HTMLButtonElement>) => {
    lastActiveElementRef.current = (event?.currentTarget ? document.activeElement : null) as HTMLElement | null;
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'FORMATEUR'
    });
    setResetPassword(false);
    setFormError('');
    setSuccessMessage('');
    setTemporaryPassword('');
    setEmailSent(null);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setResetPassword(false);
    setTemporaryPassword('');
    setEmailSent(null);
    const activeElement = lastActiveElementRef.current;
    if (activeElement) {
      activeElement.focus();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      const response = await userService.createUser(formData);
      setEmailSent(Boolean(response?.emailSent));
      if (!response?.emailSent && response?.temporaryPassword) {
        setTemporaryPassword(response.temporaryPassword);
      }
      const statusText = response?.emailSent
        ? 'Email envoy?.'
        : `Email non envoy? (${response?.emailError || 'v?rifiez SMTP'}).`;
      setSuccessMessage(`Compte cree. ${statusText}`);
      await loadUsers();
    } catch (error: any) {
      setFormError(error?.response?.data || "Impossible de cr?er l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        generatePassword: resetPassword,
        sendEmail: resetPassword
      };
      const response = await userService.updateUser(selectedUser.id, payload);
      setEmailSent(Boolean(response?.emailSent));
      if (resetPassword && response?.temporaryPassword) {
        setTemporaryPassword(response.temporaryPassword);
      }
      const statusText = response?.emailSent
        ? 'Email envoy?.'
        : resetPassword
          ? `Email non envoy? (${response?.emailError || 'v?rifiez SMTP'}).`
          : '';
      setSuccessMessage(`Compte mis a jour. ${statusText}`.trim());
      await loadUsers();
    } catch (error: any) {
      setFormError(error?.response?.data || "Impossible de mettre ? jour l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const ok = window.confirm(`Supprimer le compte de ${user.firstName || ''} ${user.lastName || ''} ?`);
    if (!ok) return;
    try {
      await userService.deleteUser(user.id);
      await loadUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const roleLabel = (role: string) => {
    return role === 'RESPONSABLE' ? 'Responsable formation' : 'Formateur';
  };

  useEffect(() => {
    if (!isModalOpen && !isEditModalOpen) return;
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
        closeModal();
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
  }, [isModalOpen, isEditModalOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Gestion des utilisateurs</h1>
            <p className="text-base text-gray-600">Formateurs et responsables formation</p>
          </div>
          <Button variant="primary" onClick={(event) => openCreateModal(event)}>
            <i className="ri-user-add-line" aria-hidden="true"></i>
            Ajouter un compte
          </Button>
        </div>

        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${
                filterRole === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterRole('FORMATEUR')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${
                filterRole === 'FORMATEUR' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Formateurs
            </button>
            <button
              onClick={() => setFilterRole('RESPONSABLE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer whitespace-nowrap ${
                filterRole === 'RESPONSABLE' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Responsables
            </button>
          </div>
        </Card>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Liste des utilisateurs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-semibold">
                          {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'RESPONSABLE' ? 'warning' : 'info'}>
                        {roleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={(event) => openEditModal(user, event)}>
                          <i className="ri-edit-line" aria-hidden="true"></i>
                          Modifier
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(user)}>
                          <i className="ri-delete-bin-line" aria-hidden="true"></i>
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                      Aucun utilisateur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} aria-hidden="true"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div ref={modalRef} className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 id="user-modal-title" className="text-xl font-semibold text-gray-900">
                  {isEditModalOpen ? 'Modifier le compte' : 'Ajouter un compte'}
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={closeModal}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Fermer la fen?tre"
                >
                  <i className="ri-close-line text-2xl" aria-hidden="true"></i>
                </button>
              </div>

              <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} noValidate>
                <div className="px-6 py-5 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      {successMessage}
                    </div>
                  )}
                  {temporaryPassword && emailSent === false && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <div className="font-medium mb-1">Mot de passe temporaire</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm break-all">{temporaryPassword}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(temporaryPassword)}
                        >
                          Copier
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prenom</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="FORMATEUR">Formateur</option>
                      <option value="RESPONSABLE">Responsable formation</option>
                    </select>
                  </div>

                  {isEditModalOpen && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetPassword}
                        onChange={(e) => setResetPassword(e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      Regenerer le mot de passe et envoy?r par email
                    </label>
                  )}

                  {!isEditModalOpen && (
                    <div className="text-xs text-gray-500">
                      Un mot de passe sera genere automatiquement et envoy? par email.
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Sauvegarde...' : isEditModalOpen ? 'Mettre ? jour' : 'Cr?er'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

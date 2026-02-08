import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import { trainingService } from '../../../services/training.service';

type CreationMode = 'AUTO' | 'MANUAL';

interface TrainingFormState {
  title: string;
  description: string;
  creationMode: CreationMode;
  startDate: string;
  endDate: string;
}

const initialFormState: TrainingFormState = {
  title: '',
  description: '',
  creationMode: 'AUTO',
  startDate: '',
  endDate: ''
};

export default function TrainingCreatePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<TrainingFormState>(initialFormState);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRangeFromDates = (dates: string[]) => {
    if (!dates.length) {
      setFormState((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }
    const sorted = [...dates].sort();
    setFormState((prev) => ({
      ...prev,
      startDate: sorted[0],
      endDate: sorted[sorted.length - 1]
    }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formState.title.trim()) {
      errors.title = 'A title is required.';
    }
    if (!formState.startDate) {
      errors.startDate = 'La date de d?but est requise.';
    }
    if (!formState.endDate) {
      errors.endDate = 'La date de fin est requise.';
    } else if (formState.startDate && formState.endDate <= formState.startDate) {
      errors.endDate = 'La date de fin doit ?tre apr?s la date de d?but.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'startDate' && next.endDate && value && next.endDate <= value) {
        next.endDate = '';
      }
      return next;
    });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddDate = () => {
    if (!dateInput) return;
    if (selectedDates.includes(dateInput)) return;
    const next = [...selectedDates, dateInput];
    setSelectedDates(next);
    updateRangeFromDates(next);
    setDateInput('');
    if (formErrors.startDate || formErrors.endDate) {
      setFormErrors((prev) => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const handleRemoveDate = (date: string) => {
    const next = selectedDates.filter((item) => item !== date);
    setSelectedDates(next);
    updateRangeFromDates(next);
  };

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      creationMode: event.target.value as CreationMode
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || null,
        creationMode: formState.creationMode,
        levelsCount: 4,
        sessionsPerLevel: 6,
        startDate: formState.startDate || null,
        endDate: formState.endDate || null
      };
      const created = await trainingService.create(payload);
      navigate(`/trainings/${created.id}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to create the training.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-teal-700 tracking-wide uppercase">Responsable</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2" tabIndex={-1}>Create a formation</h1>
          <p className="text-gray-600 mt-2">
            Define the training mode first. AUTO generates the full structure, MANUAL lets you build it step by step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="sr-only">Détails de la formation</h2>
          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Informations générales</h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-800">
                  Title <span className="text-red-600">(required)</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-required="true"
                  aria-invalid={!!formErrors.title}
                  aria-describedby={formErrors.title ? 'title-error' : 'title-help'}
                />
                <p id="title-help" className="mt-1 text-xs text-gray-500">
                  Use a short, descriptive title.
                </p>
                {formErrors.title && (
                  <p id="title-error" className="mt-2 text-sm text-red-600" role="alert">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-800">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add objectives, expected outcomes, or any context for the formation.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800">Dates spécifiques</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Ajoutez les dates de formation. Le début et la fin seront calculés automatiquement.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(event) => setDateInput(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Button type="button" variant="outline" onClick={handleAddDate}>
                    Ajouter
                  </Button>
                </div>
                {selectedDates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDates
                      .sort()
                      .map((date) => (
                        <span
                          key={date}
                          className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700"
                        >
                          {date}
                          <button type="button" onClick={() => handleRemoveDate(date)}>
                            <i className="ri-close-line" aria-hidden="true"></i>
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-800">
                    Start date (computed) <span className="text-red-600">(required)</span>
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="text"
                    value={formState.startDate}
                    onChange={handleChange}
                    readOnly
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-invalid={!!formErrors.startDate}
                  />
                  {formErrors.startDate && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                      {formErrors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-800">
                    End date (computed) <span className="text-red-600">(required)</span>
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="text"
                    value={formState.endDate}
                    onChange={handleChange}
                    readOnly
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-invalid={!!formErrors.endDate}
                  />
                  {formErrors.endDate && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Mode de création</h3>
            <fieldset className="space-y-4">
              <legend className="sr-only">Mode de création</legend>
              <p id="creation-mode-help" className="text-xs text-gray-500">
                AUTO creates all levels and sessions in one action. MANUAL lets you build levels and sessions step by step.
              </p>

              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby="creation-mode-help">
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer focus-within:ring-2 focus-within:ring-teal-500">
                  <input
                    type="radio"
                    name="creationMode"
                    value="AUTO"
                    checked={formState.creationMode === 'AUTO'}
                    onChange={handleModeChange}
                    className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">AUTO (recommended)</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Generate the full 4 × 6 structure at once, then schedule sessions.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer focus-within:ring-2 focus-within:ring-teal-500">
                  <input
                    type="radio"
                    name="creationMode"
                    value="MANUAL"
                    checked={formState.creationMode === 'MANUAL'}
                    onChange={handleModeChange}
                    className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">MANUAL</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Create levels and sessions one by one with explicit validation.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Structure</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Structure size</p>
                <p className="text-xs text-gray-500 mt-1">This project uses fixed counts.</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="rounded-lg border border-gray-200 px-4 py-2">
                  <span className="block text-xs text-gray-500">Levels</span>
                  <span className="block text-base font-semibold text-gray-900">4</span>
                </div>
                <div className="rounded-lg border border-gray-200 px-4 py-2">
                  <span className="block text-xs text-gray-500">Sessions per level</span>
                  <span className="block text-base font-semibold text-gray-900">6</span>
                </div>
              </div>
            </div>
          </Card>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {submitError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/trainings')}>
              Back to formations
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Cr?er une formation'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

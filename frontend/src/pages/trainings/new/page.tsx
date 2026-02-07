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
}

const initialFormState: TrainingFormState = {
  title: '',
  description: '',
  creationMode: 'AUTO'
};

export default function TrainingCreatePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<TrainingFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formState.title.trim()) {
      errors.title = 'A title is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
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
        sessionsPerLevel: 6
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-teal-700 tracking-wide uppercase">Responsable</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Create a formation</h1>
          <p className="text-gray-600 mt-2">
            Define the training mode first. AUTO generates the full structure, MANUAL lets you build it step by step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
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
            </div>
          </Card>

          <Card>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-gray-800">Creation mode</legend>
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
              {isSubmitting ? 'Creating…' : 'Create formation'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

import Navbar from '../../components/feature/Navbar';

export default function StudentSpace() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" tabIndex={-1}>Espace Étudiant</h1>
        <p className="text-base text-gray-600">
          Consultez vos sessions, votre progression et vos certificats.
        </p>
      </main>
    </div>
  );
}

export default function SkipLink() {
  const handleClick = () => {
    const target = document.getElementById('main-content');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus();
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      data-skip-announce="true"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-teal-600"
    >
      Aller au contenu principal
    </a>
  );
}

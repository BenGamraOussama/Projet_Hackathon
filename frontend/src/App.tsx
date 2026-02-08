import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
import i18n from "./i18n";
import { AnnouncerProvider } from "./components/a11y/Announcer";
import { applyAccessibilitySettings, readAccessibilitySettings } from "./components/a11y/accessibilitySettings";
import CommandPalette from "./components/a11y/CommandPalette";


function App() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = "fr";
      applyAccessibilitySettings(readAccessibilitySettings());
      const handleStorage = (event: StorageEvent) => {
        if (event.key === "accessibilitySettings") {
          applyAccessibilitySettings(readAccessibilitySettings());
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AnnouncerProvider>
        <BrowserRouter>
          <a href="#main-content" className="skip-link">
            Aller au contenu principal
          </a>
          <CommandPalette />
          <AppRoutes />
        </BrowserRouter>
      </AnnouncerProvider>
    </I18nextProvider>
  );
}

export default App;

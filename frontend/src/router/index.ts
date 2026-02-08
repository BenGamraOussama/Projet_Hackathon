import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  });
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey) return;
      if (isEditableTarget(event.target)) return;
      switch (event.code) {
        case 'KeyA':
          event.preventDefault();
          navigate('/attendance');
          break;
        case 'KeyS':
          event.preventDefault();
          {
            const skipLink = document.getElementById('skip-link') as HTMLElement | null;
            if (skipLink) {
              skipLink.focus();
              skipLink.click();
            } else {
              const main = document.getElementById('main-content') as HTMLElement | null;
              if (main) {
                if (!main.hasAttribute('tabindex')) {
                  main.setAttribute('tabindex', '-1');
                }
                main.focus();
              }
            }
          }
          break;
        case 'KeyT':
          event.preventDefault();
          navigate('/trainings');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  useEffect(() => {
    const focusHeading = () => {
      const heading = document.querySelector("main h1, h1") as HTMLElement | null;
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) {
        heading.setAttribute("tabindex", "-1");
      }
      heading.focus();
    };
    requestAnimationFrame(focusHeading);
  }, [location.pathname]);
  return element;
}

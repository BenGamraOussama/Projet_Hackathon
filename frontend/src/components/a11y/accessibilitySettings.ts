export interface AccessibilitySettings {
  fontSize: string;
  contrast: string;
  animations: boolean;
  screenReader: boolean;
  speechFeedback: boolean;
  focusHighlight: boolean;
  lineSpacing: string;
  cursorSize: string;
  colorBlindMode: string;
  simplifyUi: boolean;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: 'medium',
  contrast: 'normal',
  animations: true,
  screenReader: true,
  speechFeedback: true,
  focusHighlight: true,
  lineSpacing: 'normal',
  cursorSize: 'normal',
  colorBlindMode: 'none',
  simplifyUi: false
};

export const readAccessibilitySettings = (): AccessibilitySettings => {
  if (typeof window === 'undefined') return defaultAccessibilitySettings;
  try {
    const stored = window.localStorage.getItem('accessibilitySettings');
    if (!stored) return defaultAccessibilitySettings;
    const parsed = JSON.parse(stored);
    return { ...defaultAccessibilitySettings, ...parsed };
  } catch {
    return defaultAccessibilitySettings;
  }
};

export const applyAccessibilitySettings = (s: AccessibilitySettings) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Font size
  const fontSizes: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px'
  };
  root.style.fontSize = fontSizes[s.fontSize] || '16px';

  // Contrast
  root.classList.toggle('high-contrast', s.contrast === 'high');

  // Animations
  if (!s.animations) {
    root.style.setProperty('--animation-duration', '0s');
    root.classList.add('reduce-motion');
  } else {
    root.style.removeProperty('--animation-duration');
    root.classList.remove('reduce-motion');
  }

  // Focus highlight
  root.classList.toggle('enhanced-focus', s.focusHighlight);

  // Line spacing
  const lineSpacings: Record<string, string> = {
    compact: '1.4',
    normal: '1.6',
    relaxed: '1.8',
    loose: '2'
  };
  root.style.lineHeight = lineSpacings[s.lineSpacing] || '1.6';

  // Cursor size
  if (s.cursorSize === 'large') {
    root.classList.add('large-cursor');
  } else {
    root.classList.remove('large-cursor');
  }

  // Color blind mode
  root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
  if (s.colorBlindMode !== 'none') {
    root.classList.add(s.colorBlindMode);
  }

  // Simplify UI
  root.classList.toggle('simplify-ui', s.simplifyUi);
};

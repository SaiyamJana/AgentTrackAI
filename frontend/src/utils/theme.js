export const ACCENT_COLORS = {
  blue:    { primary: "#2563eb", hover: "#1d4ed8", light: "#eff6ff", label: "Blue" },
  teal:    { primary: "#0d9488", hover: "#0f766e", light: "#f0fdfa", label: "Teal" },
  purple:  { primary: "#9333ea", hover: "#7e22ce", light: "#faf5ff", label: "Purple" },
  slate:   { primary: "#334155", hover: "#1e293b", light: "#f1f5f9", label: "Slate" },
};

const STORAGE_KEY = "accentColor";

export function applyAccentColor(key) {
  const accent = ACCENT_COLORS[key] ?? ACCENT_COLORS.blue;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", accent.primary);
  root.style.setProperty("--color-primary-hover", accent.hover);
  root.style.setProperty("--color-primary-light", accent.light);
  localStorage.setItem(STORAGE_KEY, key);
}

export function getStoredAccentColor() {
  return localStorage.getItem(STORAGE_KEY) || "blue";
}

export function initAccentColor() {
  applyAccentColor(getStoredAccentColor());
}
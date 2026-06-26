'use client';

export function CookieSettingsButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
    >
      🍪 Setări cookies
    </button>
  );
}

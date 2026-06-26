'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart2, Megaphone } from 'lucide-react';

const STORAGE_KEY = 'rl_cookie_consent';

interface Preferences {
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setShow(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setShowModal(true);
      setShow(false);
    };
    window.addEventListener('open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('open-cookie-preferences', handleOpen);
  }, []);

  function saveConsent(prefs: Preferences, status: 'accepted_all' | 'accepted_essential' | 'customized') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      essential: true,
      ...prefs,
      status,
      timestamp: new Date().toISOString(),
    }));
    window.dispatchEvent(new CustomEvent('consentUpdated'));
    setShow(false);
    setShowModal(false);
  }

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true }, 'accepted_all');
  }

  function rejectAll() {
    saveConsent({ analytics: false, marketing: false }, 'accepted_essential');
  }

  function saveSelected() {
    const isAll = preferences.analytics && preferences.marketing;
    const isNone = !preferences.analytics && !preferences.marketing;
    saveConsent(preferences, isAll ? 'accepted_all' : isNone ? 'accepted_essential' : 'customized');
  }

  if (!show && !showModal) return null;

  return (
    <>
      {/* Banner */}
      {show && !showModal && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
          style={{ background: 'linear-gradient(to top, rgba(15,15,15,0.98) 80%, transparent)' }}
        >
          <div className="mx-auto max-w-4xl bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl px-5 py-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie className="h-5 w-5 text-[#C9A84C] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F0EDE6] mb-0.5">
                  🍪 Respectăm confidențialitatea ta
                </p>
                <p className="text-xs text-[#9A9490] leading-relaxed">
                  Folosim cookie-uri esențiale pentru funcționarea site-ului și, cu acordul tău, cookie-uri de analiză și marketing.{' '}
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-[#C9A84C] hover:underline underline-offset-2"
                  >
                    Personalizează preferințele
                  </button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={rejectAll}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-[#9A9490] border border-[#2E2E2E] hover:border-[#3E3E3E] hover:text-[#F0EDE6] transition-colors"
              >
                Doar esențiale
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-[#C9A84C] text-[#0F0F0F] hover:bg-[#B8963E] transition-colors"
              >
                Acceptă toate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E2E]">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#C9A84C]" />
                <span className="text-sm font-semibold text-[#F0EDE6]">Preferințe cookie-uri</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#9A9490] hover:text-[#F0EDE6] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cookie categories */}
            <div className="px-5 py-4 space-y-4">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-[#4ADE80] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#F0EDE6]">Esențiale</p>
                    <p className="text-xs text-[#9A9490] mt-0.5 leading-relaxed">
                      Necesare pentru funcționarea site-ului. Autentificare, coș, preferințe temă.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="text-xs text-[#4ADE80] font-medium px-2 py-0.5 bg-green-500/10 rounded-full">
                    Mereu active
                  </span>
                </div>
              </div>

              <div className="border-t border-[#2E2E2E]" />

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <BarChart2 className="h-4 w-4 text-[#60A5FA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#F0EDE6]">Analiză</p>
                    <p className="text-xs text-[#9A9490] mt-0.5 leading-relaxed">
                      Ne ajută să înțelegem cum folosești site-ul pentru a-l îmbunătăți.
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={preferences.analytics}
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`shrink-0 w-10 h-5.5 rounded-full transition-colors relative mt-0.5 ${
                    preferences.analytics ? 'bg-[#C9A84C]' : 'bg-[#2E2E2E]'
                  }`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white transition-transform"
                    style={{
                      width: 18,
                      height: 18,
                      left: 2,
                      transform: preferences.analytics ? 'translateX(18px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>

              <div className="border-t border-[#2E2E2E]" />

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="h-4 w-4 text-[#A78BFA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#F0EDE6]">Marketing</p>
                    <p className="text-xs text-[#9A9490] mt-0.5 leading-relaxed">
                      Publicitate relevantă și integrare cu platforme sociale (Facebook, etc.).
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={preferences.marketing}
                  onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                  className={`shrink-0 rounded-full transition-colors relative mt-0.5 ${
                    preferences.marketing ? 'bg-[#C9A84C]' : 'bg-[#2E2E2E]'
                  }`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white transition-transform"
                    style={{
                      width: 18,
                      height: 18,
                      left: 2,
                      transform: preferences.marketing ? 'translateX(18px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-[#2E2E2E]">
              <button
                onClick={rejectAll}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-medium text-[#9A9490] border border-[#2E2E2E] hover:border-[#3E3E3E] hover:text-[#F0EDE6] transition-colors"
              >
                Doar esențiale
              </button>
              <button
                onClick={saveSelected}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-medium text-[#F0EDE6] border border-[#C9A84C44] hover:bg-[#C9A84C11] transition-colors"
              >
                Salvează selecția
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#C9A84C] text-[#0F0F0F] hover:bg-[#B8963E] transition-colors"
              >
                Acceptă toate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface MaintenanceDisplayProps {
  title: string;
  message: string;
}

export function MaintenanceDisplay({ title, message }: MaintenanceDisplayProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F0F0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        overflow: 'hidden',
        position: 'relative',
        padding: '24px',
      }}
    >
      <style>{`
        @keyframes rl-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes rl-float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes rl-wrench {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(25deg); }
        }
        @keyframes rl-type {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes rl-zzz {
          0% { opacity: 0; transform: translateY(0px) scale(0.5); }
          40% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-28px) scale(1.1); }
        }
        @keyframes rl-particle {
          0% { opacity: 0; transform: translateY(0px) scale(0.8); }
          20% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(-90px) scale(1.2); }
        }
        @keyframes rl-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0px); }
        }
        @keyframes rl-shimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes rl-blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .rl-gold-text {
          background: linear-gradient(90deg, #8B6914 0%, #C9A84C 25%, #F5D98B 50%, #C9A84C 75%, #8B6914 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rl-shimmer 5s linear infinite;
        }
      `}</style>

      {/* Floating golden particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: i % 4 === 0 ? 7 : i % 3 === 0 ? 5 : 4,
            height: i % 4 === 0 ? 7 : i % 3 === 0 ? 5 : 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#C9A84C' : '#8B6914',
            opacity: 0,
            left: `${4 + (i * 7) % 92}%`,
            bottom: `${8 + (i * 11) % 65}%`,
            animation: `rl-particle ${2.5 + (i % 4) * 0.7}s ease-in ${i * 0.35}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo / brand */}
      <div
        style={{
          marginBottom: 52,
          textAlign: 'center',
          animation: 'rl-fadein 0.7s ease both',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.35em',
            color: '#C9A84C',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
            margin: 0,
          }}
        >
          ── River&apos;s Lounge ──
        </p>
      </div>

      {/* Animals scene */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'flex-end',
          marginBottom: 60,
          animation: 'rl-fadein 0.7s ease 0.15s both',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* Cat with wrench */}
        <div
          style={{
            animation: 'rl-float 3s ease-in-out infinite',
            textAlign: 'center',
          }}
        >
          <svg width="96" height="110" viewBox="0 0 96 110" fill="none">
            {/* Tail */}
            <path d="M 70 76 Q 88 65 82 50" stroke="#A07830" strokeWidth="6" strokeLinecap="round" />
            {/* Body */}
            <ellipse cx="48" cy="70" rx="25" ry="21" fill="#C9A84C" />
            {/* Head */}
            <circle cx="48" cy="36" r="20" fill="#C9A84C" />
            {/* Ears */}
            <polygon points="32,21 26,6 41,19" fill="#C9A84C" />
            <polygon points="64,21 70,6 55,19" fill="#C9A84C" />
            <polygon points="33,19 29,10 40,18" fill="#8B5E3C" opacity="0.45" />
            <polygon points="63,19 67,10 56,18" fill="#8B5E3C" opacity="0.45" />
            {/* Eyes */}
            <ellipse cx="41" cy="34" rx="4" ry="4.5" fill="#1a1a1a" />
            <ellipse cx="55" cy="34" rx="4" ry="4.5" fill="#1a1a1a" />
            <circle cx="43" cy="32" r="1.5" fill="white" opacity="0.75" />
            <circle cx="57" cy="32" r="1.5" fill="white" opacity="0.75" />
            {/* Nose */}
            <ellipse cx="48" cy="40" rx="2" ry="1.5" fill="#8B3A3A" />
            {/* Mouth */}
            <path d="M 46 41 Q 48 44 50 41" stroke="#8B3A3A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Whiskers */}
            <line x1="26" y1="39" x2="42" y2="41" stroke="#3a3a3a" strokeWidth="1" opacity="0.6" />
            <line x1="26" y1="42" x2="42" y2="43" stroke="#3a3a3a" strokeWidth="1" opacity="0.6" />
            <line x1="54" y1="41" x2="70" y2="39" stroke="#3a3a3a" strokeWidth="1" opacity="0.6" />
            <line x1="54" y1="43" x2="70" y2="42" stroke="#3a3a3a" strokeWidth="1" opacity="0.6" />
            {/* Left arm */}
            <path d="M 26 63 Q 16 70 20 80" stroke="#A07830" strokeWidth="7" strokeLinecap="round" />
            {/* Right arm */}
            <path d="M 70 63 Q 80 68 78 78" stroke="#A07830" strokeWidth="7" strokeLinecap="round" />
            {/* Wrench (animated on right arm) */}
            <g style={{ transformOrigin: '80px 74px', animation: 'rl-wrench 1.6s ease-in-out infinite' }}>
              <rect x="77" y="66" width="5" height="22" rx="2.5" fill="#888" />
              <circle cx="79.5" cy="62" r="7" stroke="#888" strokeWidth="3.5" fill="none" />
              <line x1="75" y1="58" x2="84" y2="66" stroke="#888" strokeWidth="3" />
            </g>
            {/* Legs */}
            <path d="M 34 88 L 28 107" stroke="#A07830" strokeWidth="7" strokeLinecap="round" />
            <path d="M 62 88 L 68 107" stroke="#A07830" strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="26" cy="107" rx="8" ry="4" fill="#A07830" />
            <ellipse cx="70" cy="107" rx="8" ry="4" fill="#A07830" />
          </svg>
          <p
            style={{
              fontSize: 10,
              color: '#6B6560',
              marginTop: 6,
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            Mița Mecanică
          </p>
        </div>

        {/* Dog with laptop */}
        <div
          style={{
            animation: 'rl-float2 2.8s ease-in-out 0.4s infinite',
            textAlign: 'center',
          }}
        >
          <svg width="112" height="122" viewBox="0 0 112 122" fill="none">
            {/* Tail */}
            <path d="M 80 74 Q 97 54 90 40" stroke="#8B6914" strokeWidth="7" strokeLinecap="round" />
            {/* Body */}
            <ellipse cx="52" cy="76" rx="30" ry="24" fill="#E8C55F" />
            {/* Head */}
            <circle cx="52" cy="40" r="22" fill="#E8C55F" />
            {/* Floppy ears */}
            <ellipse cx="30" cy="36" rx="10" ry="17" fill="#C9A84C" transform="rotate(-15 30 36)" />
            <ellipse cx="74" cy="36" rx="10" ry="17" fill="#C9A84C" transform="rotate(15 74 36)" />
            {/* Snout */}
            <ellipse cx="52" cy="47" rx="12" ry="9" fill="#D4AD4A" opacity="0.6" />
            {/* Nose */}
            <ellipse cx="52" cy="42" rx="5" ry="4" fill="#2E1E10" />
            <circle cx="50" cy="41" r="1.5" fill="white" opacity="0.5" />
            {/* Mouth */}
            <path d="M 47 49 Q 52 54 57 49" stroke="#2E1E10" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Eyes */}
            <circle cx="43" cy="35" r="5" fill="#1a1a1a" />
            <circle cx="61" cy="35" r="5" fill="#1a1a1a" />
            <circle cx="45" cy="33" r="2" fill="white" opacity="0.75" />
            <circle cx="63" cy="33" r="2" fill="white" opacity="0.75" />
            {/* Left paw (typing, animated) */}
            <g style={{ animation: 'rl-type 0.55s ease-in-out infinite' }}>
              <path d="M 26 70 Q 17 82 24 93" stroke="#C9A84C" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="22" cy="94" rx="8" ry="5" fill="#C9A84C" />
            </g>
            {/* Right paw (typing, offset) */}
            <g style={{ animation: 'rl-type 0.55s ease-in-out 0.275s infinite' }}>
              <path d="M 78 70 Q 87 82 80 93" stroke="#C9A84C" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="82" cy="94" rx="8" ry="5" fill="#C9A84C" />
            </g>
            {/* Laptop base */}
            <rect x="14" y="93" width="80" height="18" rx="3" fill="#252525" />
            {/* Laptop screen */}
            <rect x="16" y="78" width="78" height="16" rx="2" fill="#181818" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="19" y="80" width="72" height="12" rx="1" fill="#0a0a0a" />
            {/* Code on screen */}
            <rect x="22" y="82" width="22" height="2" rx="1" fill="#C9A84C" opacity="0.85" />
            <rect x="22" y="86" width="16" height="2" rx="1" fill="#555" opacity="0.7" />
            <rect x="48" y="82" width="9" height="2" rx="1" fill="#4ADE80" opacity="0.85" />
            <rect x="48" y="86" width="14" height="2" rx="1" fill="#555" opacity="0.7" />
            {/* Cursor blink */}
            <rect
              x="64"
              y="82"
              width="2"
              height="6"
              rx="1"
              fill="#C9A84C"
              style={{ animation: 'rl-blink 1s ease-in-out infinite' }}
            />
            {/* Legs */}
            <path d="M 34 96 L 28 118" stroke="#C9A84C" strokeWidth="8" strokeLinecap="round" />
            <path d="M 70 96 L 76 118" stroke="#C9A84C" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="26" cy="118" rx="10" ry="5" fill="#C9A84C" />
            <ellipse cx="78" cy="118" rx="10" ry="5" fill="#C9A84C" />
          </svg>
          <p
            style={{
              fontSize: 10,
              color: '#6B6560',
              marginTop: 4,
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            Câinele Developer
          </p>
        </div>

        {/* Cat sleeping on server */}
        <div style={{ textAlign: 'center' }}>
          {/* ZZZ floating above */}
          <div style={{ position: 'relative', height: 48, marginBottom: -4 }}>
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: 16,
                color: '#C9A84C',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'sans-serif',
                animation: 'rl-zzz 2.2s ease-in-out 0s infinite',
              }}
            >
              z
            </span>
            <span
              style={{
                position: 'absolute',
                right: 4,
                top: 8,
                color: '#C9A84C',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'sans-serif',
                animation: 'rl-zzz 2.2s ease-in-out 0.55s infinite',
              }}
            >
              z
            </span>
            <span
              style={{
                position: 'absolute',
                right: -10,
                top: 0,
                color: '#C9A84C',
                fontSize: 28,
                fontWeight: 700,
                fontFamily: 'sans-serif',
                animation: 'rl-zzz 2.2s ease-in-out 1.1s infinite',
              }}
            >
              Z
            </span>
          </div>
          <svg width="124" height="104" viewBox="0 0 124 104" fill="none">
            {/* Server rack */}
            <rect x="8" y="56" width="108" height="46" rx="4" fill="#181818" stroke="#2a2a2a" strokeWidth="1" />
            <rect x="12" y="59" width="100" height="9" rx="2" fill="#0F0F0F" stroke="#222" strokeWidth="1" />
            <rect x="12" y="71" width="100" height="9" rx="2" fill="#0F0F0F" stroke="#222" strokeWidth="1" />
            <rect x="12" y="83" width="100" height="9" rx="2" fill="#0F0F0F" stroke="#222" strokeWidth="1" />
            {/* LEDs */}
            <circle cx="104" cy="63.5" r="2.5" fill="#4ADE80" />
            <circle cx="111" cy="63.5" r="2.5" fill="#4ADE80" />
            <circle cx="104" cy="75.5" r="2.5" fill="#4ADE80" />
            <circle
              cx="111"
              cy="75.5"
              r="2.5"
              fill="#F59E0B"
              style={{ animation: 'rl-blink 1.3s ease-in-out infinite' }}
            />
            <circle cx="104" cy="87.5" r="2.5" fill="#4ADE80" />
            <circle cx="111" cy="87.5" r="2.5" fill="#4ADE80" />
            {/* Sleeping cat curled on server top */}
            {/* Tail wrapped around front */}
            <path d="M 24 52 Q 14 62 22 66 Q 32 70 38 62" stroke="#A07830" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Body curled */}
            <ellipse cx="62" cy="54" rx="36" ry="16" fill="#C9A84C" />
            {/* Head resting */}
            <circle cx="84" cy="47" r="15" fill="#C9A84C" />
            {/* Ears */}
            <polygon points="76,35 71,22 82,33" fill="#C9A84C" />
            <polygon points="92,35 97,22 86,33" fill="#C9A84C" />
            <polygon points="77,34 73,25 81,32" fill="#8B5E3C" opacity="0.45" />
            <polygon points="91,34 95,25 87,32" fill="#8B5E3C" opacity="0.45" />
            {/* Closed eyes (sleeping arcs) */}
            <path d="M 77 47 Q 80 44.5 83 47" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 85 47 Q 88 44.5 91 47" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <ellipse cx="84" cy="51" rx="2" ry="1.5" fill="#8B3A3A" />
            {/* Paws tucked in */}
            <ellipse cx="50" cy="57" rx="12" ry="7" fill="#A07830" opacity="0.8" />
          </svg>
          <p
            style={{
              fontSize: 10,
              color: '#6B6560',
              marginTop: 4,
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            Pisica Serverului
          </p>
        </div>
      </div>

      {/* Title */}
      <h1
        className="rl-gold-text"
        style={{
          fontSize: 'clamp(26px, 5vw, 46px)',
          fontWeight: 700,
          marginBottom: 18,
          textAlign: 'center',
          lineHeight: 1.2,
          animation: 'rl-fadein 0.7s ease 0.3s both',
        }}
      >
        {title}
      </h1>

      {/* Message */}
      <p
        style={{
          color: '#8A8480',
          fontSize: 16,
          lineHeight: 1.75,
          maxWidth: 520,
          textAlign: 'center',
          fontFamily: 'sans-serif',
          animation: 'rl-fadein 0.7s ease 0.5s both',
          margin: 0,
        }}
      >
        {message}
      </p>

      {/* Gold divider */}
      <div
        style={{
          width: 56,
          height: 1,
          background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
          margin: '32px auto',
          animation: 'rl-fadein 0.7s ease 0.7s both',
        }}
      />

      {/* Footer */}
      <p
        style={{
          fontSize: 11,
          color: '#3a3a3a',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
          animation: 'rl-fadein 0.7s ease 0.9s both',
          margin: 0,
        }}
      >
        © {new Date().getFullYear()} River&apos;s Lounge
      </p>
    </div>
  );
}

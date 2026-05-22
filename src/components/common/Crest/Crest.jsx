// The campaign crest: a heraldic shield with an upright sword, used as the
// app's emblem in the header.
const Crest = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 74"
    role="img"
    aria-label="Campaign crest"
  >
    <defs>
      <linearGradient id="crest-field" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--lod-crimson-bright)" />
        <stop offset="1" stopColor="var(--lod-crimson-ink)" />
      </linearGradient>
      <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--lod-gold-hi)" />
        <stop offset="0.55" stopColor="var(--lod-gold-bright)" />
        <stop offset="1" stopColor="var(--lod-gold)" />
      </linearGradient>
    </defs>

    {/* shield body */}
    <path
      d="M6 8 L32 4 L58 8 L58 36 C58 52 47 64 32 71 C17 64 6 52 6 36 Z"
      fill="url(#crest-field)"
      stroke="url(#crest-gold)"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M11 12 L32 9 L53 12 L53 36 C53 49 44 59 32 65 C20 59 11 49 11 36 Z"
      fill="none"
      stroke="var(--lod-gold)"
      strokeWidth="1"
      opacity="0.7"
    />

    {/* sword */}
    <g fill="url(#crest-gold)" stroke="var(--lod-crimson-ink)" strokeWidth="0.6">
      <path d="M32 16 L34.3 21 L34.3 44 L29.7 44 L29.7 21 Z" />
      <rect x="23" y="44" width="18" height="3.4" rx="1.6" />
      <rect x="30.6" y="47.4" width="2.8" height="8" />
      <circle cx="32" cy="57.6" r="3" />
    </g>

    {/* mullets (heraldic stars) */}
    <g fill="var(--lod-gold-hi)">
      <path d="M19 20 l1.3 2.7 2.9.4-2.1 2 .5 2.9L19 29l-2.6 1.4.5-2.9-2.1-2 2.9-.4Z" />
      <path d="M45 20 l1.3 2.7 2.9.4-2.1 2 .5 2.9L45 29l-2.6 1.4.5-2.9-2.1-2 2.9-.4Z" />
    </g>
  </svg>
);

export default Crest;

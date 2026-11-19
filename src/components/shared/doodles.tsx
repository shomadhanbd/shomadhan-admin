/** Hand-drawn marks for sign-in, empty states and the dashboard hero, tinted from `--primary`. */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} aria-hidden>
      <path {...stroke} d="M2 14c8-11 16 9 24-1S42 2 50 12s16 10 24 1 16-9 24 1 16 8 20 3" />
    </svg>
  );
}

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        {...stroke}
        d="M20 3.5c1.5 8.5 7 14.5 16 16-9 1.8-14.4 7.4-16 17-1.4-9.4-7-15-16-17 9.2-1.7 14.6-7.4 16-16Z"
      />
    </svg>
  );
}

function Circle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      {/* Overshoots where it closes, the way a pen does. A perfect circle
          reads as a border-radius, not as something drawn by hand. */}
      <path {...stroke} d="M31 5c14 0 25 11 25 25S45 56 30 55 4 44 5 29 17 5 31 5c9 0 17 4 21 11" />
    </svg>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <path {...stroke} d="M4 6c22 2 40 14 52 34" />
      <path {...stroke} d="M60 24c-2 8-3 13-4 17-5-1-10-2-16-2" />
    </svg>
  );
}

function Spiral({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden>
      <path {...stroke} d="M28 28c0-4 3-7 7-7s8 3 8 8-4 10-10 10-13-5-13-13 6-16 15-16 19 8 19 19" />
    </svg>
  );
}

export function Underline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 16" className={className} aria-hidden preserveAspectRatio="none">
      <path {...stroke} strokeWidth={3} d="M3 10c34-6 70-8 106-6 30 1 55 4 88 8" />
    </svg>
  );
}

/** The sign-in backdrop: the rail colour with a faint dot grid. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--sidebar)" }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "#fff",
          opacity: 0.05,
        }}
      />

      <Star className="absolute top-[8%] left-[6%] h-14 w-14 text-white/25" />
      <Squiggle className="absolute top-[16%] right-[8%] h-8 w-40 text-white/20" />
      <Spiral className="absolute bottom-[10%] left-[9%] h-20 w-20 text-white/15" />
      <Arrow className="absolute right-[12%] bottom-[14%] h-16 w-24 -rotate-12 text-white/20" />
      <Circle className="absolute -top-16 -right-16 h-64 w-64 text-white/10" />
      <Star className="absolute bottom-[30%] left-[3%] h-7 w-7 text-white/20" />
    </div>
  );
}

/** The marks inside the card's brand half. */
export function CardDoodles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Circle className="absolute -top-14 -left-14 h-48 w-48 text-white/[0.07]" />
      <Star className="absolute top-[8%] right-[8%] h-7 w-7 text-white/25" />
      <Squiggle className="absolute top-[30%] right-[6%] h-6 w-24 text-white/15" />
      <Spiral className="absolute top-[52%] right-[4%] h-9 w-9 text-white/10" />
    </div>
  );
}

/** A studious owl in the doodles' line style; re-tints with the theme. */
export function Mascot({ className = "" }: { className?: string }) {
  const line = { ...stroke, strokeWidth: 4 } as const;
  return (
    <svg viewBox="0 0 200 210" className={className} aria-hidden>
      {/* body */}
      <path
        {...line}
        fill="currentColor"
        fillOpacity={0.12}
        d="M100 62c33 0 56 25 56 60s-23 60-56 60-56-25-56-60 23-60 56-60Z"
      />
      {/* wings */}
      <path {...line} d="M47 118c-11 13-10 33 2 45" />
      <path {...line} d="M153 118c11 13 10 33-2 45" />
      {/* eyes */}
      <circle {...line} fill="currentColor" fillOpacity={0.15} cx="78" cy="108" r="19" />
      <circle {...line} fill="currentColor" fillOpacity={0.15} cx="122" cy="108" r="19" />
      <circle cx="82" cy="110" r="6.5" fill="currentColor" />
      <circle cx="126" cy="110" r="6.5" fill="currentColor" />
      {/* beak */}
      <path {...line} fill="currentColor" fillOpacity={0.25} d="M100 126l-9 13h18l-9-13Z" />
      {/* feet */}
      <path {...line} d="M86 182v9M78 191h16M114 182v9M106 191h16" />
      {/* mortarboard, slightly askew so it looks worn rather than placed */}
      <path {...line} fill="currentColor" fillOpacity={0.2} d="M100 20 162 44 100 68 38 44 100 20Z" />
      <path {...line} d="M72 55v14c0 9 13 15 28 15s28-6 28-15V55" />
      <path {...line} d="M155 48v22c0 7-5 11-11 11" />
      <circle cx="144" cy="84" r="5" fill="currentColor" />
    </svg>
  );
}

/** A faint scatter behind empty states, quiet enough to read as texture. */
export function EmptyDoodles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Circle className="absolute -top-10 -left-8 h-32 w-32 text-primary/[0.06]" />
      <Spiral className="absolute -right-6 -bottom-8 h-28 w-28 text-primary/[0.06]" />
      <Star className="absolute top-[18%] right-[16%] h-6 w-6 text-primary/[0.12]" />
      <Squiggle className="absolute bottom-[22%] left-[14%] h-5 w-24 text-primary/[0.10]" />
    </div>
  );
}

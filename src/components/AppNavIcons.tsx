type AppNavIconProps = {
  className?: string;
  strokeWidth?: number;
};

const base = {
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// ─── Home ─────────────────────────────────────────────────────────────────────
// Clean house silhouette, bold roof + door cutout
export function HomeArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Roof fill */}
      <path
        d="M3.5 10.5 12 3l8.5 7.5"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
      {/* Roof outline */}
      <path d="M3.5 10.5 12 3l8.5 7.5" strokeWidth={strokeWidth} />
      {/* Left wall */}
      <path d="M5 9.5V20h14V9.5" strokeWidth={strokeWidth} />
      {/* Door */}
      <path
        d="M9.5 20v-5.5a2.5 2.5 0 0 1 5 0V20"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ─── Copa / Trophy ────────────────────────────────────────────────────────────
// Elegant cup with handles and a star accent on the body
export function CupTrophyIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Cup body fill */}
      <path
        d="M7.5 5h9v5a4.5 4.5 0 0 1-9 0V5Z"
        fill="currentColor"
        fillOpacity="0.13"
        stroke="none"
      />
      {/* Cup body outline */}
      <path d="M7.5 5h9v5a4.5 4.5 0 0 1-9 0V5Z" strokeWidth={strokeWidth} />
      {/* Left handle */}
      <path
        d="M7.5 7H5.5a2 2 0 0 0 0 4h2"
        strokeWidth={strokeWidth}
      />
      {/* Right handle */}
      <path
        d="M16.5 7h2a2 2 0 0 1 0 4h-2"
        strokeWidth={strokeWidth}
      />
      {/* Stem */}
      <path d="M12 14.5v3.5" strokeWidth={strokeWidth} />
      {/* Base */}
      <path d="M8.5 18h7" strokeWidth={strokeWidth} />
    </svg>
  );
}

// ─── Championships / Shield ───────────────────────────────────────────────────
// Shield with a lightning bolt inside — authority + energy
export function ChampionshipBadgeIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Shield fill */}
      <path
        d="M12 3 4.5 6v5.5C4.5 15.97 7.8 19.6 12 21c4.2-1.4 7.5-5.03 7.5-9.5V6L12 3Z"
        fill="currentColor"
        fillOpacity="0.13"
        stroke="none"
      />
      {/* Shield outline */}
      <path
        d="M12 3 4.5 6v5.5C4.5 15.97 7.8 19.6 12 21c4.2-1.4 7.5-5.03 7.5-9.5V6L12 3Z"
        strokeWidth={strokeWidth}
      />
      {/* Lightning bolt */}
      <path
        d="M13.5 8.5 10.5 12.5h3L10.5 16"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ─── Groups / Community ───────────────────────────────────────────────────────
// Two overlapping person silhouettes — social & team
export function GroupsArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Back person head fill */}
      <circle cx="15.5" cy="8" r="2.5" fill="currentColor" fillOpacity="0.12" stroke="none" />
      {/* Back person head */}
      <circle cx="15.5" cy="8" r="2.5" strokeWidth={strokeWidth} />
      {/* Back person body */}
      <path
        d="M12.5 20c.3-2.8 1.8-4.5 3-4.5 1.5 0 3.2 1.4 3.5 4.5"
        strokeWidth={strokeWidth}
      />
      {/* Front person head fill */}
      <circle cx="9" cy="9" r="3" fill="currentColor" fillOpacity="0.13" stroke="none" />
      {/* Front person head */}
      <circle cx="9" cy="9" r="3" strokeWidth={strokeWidth} />
      {/* Front person body */}
      <path
        d="M3.5 20c.4-3.2 2.1-5 5.5-5s5.1 1.8 5.5 5"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ─── Menu / Hamburger ─────────────────────────────────────────────────────────
// Refined 3-bar menu with staggered lengths for visual interest
export function MenuArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 6h16" strokeWidth={strokeWidth} />
      <path d="M4 12h11" strokeWidth={strokeWidth} />
      <path d="M4 18h13" strokeWidth={strokeWidth} />
    </svg>
  );
}

// ─── News / Feed ──────────────────────────────────────────────────────────────
// Newspaper-style icon with content lines and a corner fold
export function NewsPulseIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Card fill */}
      <path
        d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        fill="currentColor"
        fillOpacity="0.10"
        stroke="none"
      />
      {/* Card outline */}
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={strokeWidth} />
      {/* Headline bar */}
      <path d="M7 9.5h10" strokeWidth={strokeWidth} />
      {/* Body lines */}
      <path d="M7 12.5h7" strokeWidth={Math.max(strokeWidth - 0.3, 1.4)} />
      <path d="M7 15h5" strokeWidth={Math.max(strokeWidth - 0.3, 1.4)} />
    </svg>
  );
}

// ─── Bolão (FAB) ──────────────────────────────────────────────────────────────
// A more stylistic trophy for the main action button
export function BolaoArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path
        d="M6 9a6 6 0 0 1 12 0v1a6 6 0 0 1-12 0V9Z"
        fill="currentColor"
        fillOpacity="0.13"
        stroke="none"
      />
      <path d="M6 9a6 6 0 0 1 12 0v1a6 6 0 0 1-12 0V9Z" strokeWidth={strokeWidth} />
      <path d="M6 7H4a2 2 0 0 0 0 4h2M18 7h2a2 2 0 0 1 0 4h-2" strokeWidth={strokeWidth} />
      <path d="M12 16v3M9 20h6" strokeWidth={strokeWidth} />
    </svg>
  );
}

// ─── Arena / Discover ────────────────────────────────────────────────────────
// A dynamic lightning/spark icon for the "Arena" hub
export function ArenaPulseIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path
        d="M13 3 4 14h9l-1 7 9-11h-9l1-7Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="none"
      />
      <path d="M13 3 4 14h9l-1 7 9-11h-9l1-7Z" strokeWidth={strokeWidth} />
    </svg>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
// Clean user silhouette with stylized shoulders
export function ProfileArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.13" stroke="none" />
      <circle cx="12" cy="7" r="4" strokeWidth={strokeWidth} />
      <path
        d="M5.5 20c.5-3.5 2.5-5.5 6.5-5.5s6 2 6.5 5.5"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ─── Ranking / Podium ────────────────────────────────────────────────────────
// Three ascending bars — leaderboard / podium
export function RankingArenaIcon({ className, strokeWidth = 2 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {/* Left bar fill */}
      <rect x="3" y="13" width="4.5" height="8" rx="1.5" fill="currentColor" fillOpacity="0.10" stroke="none" />
      {/* Left bar */}
      <rect x="3" y="13" width="4.5" height="8" rx="1.5" strokeWidth={strokeWidth} />
      {/* Center bar fill (tallest = gold) */}
      <rect x="9.75" y="7" width="4.5" height="14" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="none" />
      {/* Center bar */}
      <rect x="9.75" y="7" width="4.5" height="14" rx="1.5" strokeWidth={strokeWidth} />
      {/* Right bar fill */}
      <rect x="16.5" y="10.5" width="4.5" height="10.5" rx="1.5" fill="currentColor" fillOpacity="0.10" stroke="none" />
      {/* Right bar */}
      <rect x="16.5" y="10.5" width="4.5" height="10.5" rx="1.5" strokeWidth={strokeWidth} />
      {/* Star on top of center bar */}
      <path d="M12 3.5l.6 1.4h1.5l-1.2.9.5 1.4L12 6.4l-1.4.8.5-1.4L9.9 4.9h1.5z" fill="currentColor" strokeWidth={0} fillOpacity="0.7" />
    </svg>
  );
}

export type { AppNavIconProps };

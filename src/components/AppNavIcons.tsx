type AppNavIconProps = {
  className?: string;
  strokeWidth?: number;
};

const svgProps = {
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeArenaIcon({ className, strokeWidth = 1.9 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      <path
        d="M4.9 18.1h14.2"
        strokeWidth={strokeWidth}
      />
      <path
        d="M5.8 17.95V10.4c0-1.08.47-2.08 1.29-2.76l2.9-2.38c1.17-.96 2.84-.96 4.01 0l2.9 2.38c.82.68 1.29 1.68 1.29 2.76v7.55"
        strokeWidth={strokeWidth}
      />
      <path
        d="M8.65 10.7h6.7"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9.2 18.1v-3.15c0-1.11.89-2 2-2h1.6c1.11 0 2 .89 2 2v3.15"
        strokeWidth={strokeWidth}
      />
      <path
        d="M10.05 9.05v1.65M13.95 9.05v1.65"
        strokeWidth={Math.max(strokeWidth - 0.15, 1.15)}
      />
      <path
        d="M7.35 6.95 12 4.2l4.65 2.75"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
}

export function CupTrophyIcon({ className, strokeWidth = 1.9 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      <path
        d="M8 5.25h8v2.4c0 2.85-1.66 5.37-4 6.73-2.34-1.36-4-3.88-4-6.73v-2.4Z"
        strokeWidth={strokeWidth}
      />
      <path
        d="M8 7.55H5.95c-.97 0-1.75.78-1.75 1.75 0 1.73 1.35 3.15 3.07 3.23"
        strokeWidth={strokeWidth}
      />
      <path
        d="M16 7.55h2.05c.97 0 1.75.78 1.75 1.75 0 1.73-1.35 3.15-3.07 3.23"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 14.3v2.4"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9.35 19.2h5.3"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9.6 6.5c.55.62 1.35.93 2.4.93s1.85-.31 2.4-.93"
        strokeWidth={Math.max(strokeWidth - 0.25, 1.1)}
      />
      <path
        d="M8.95 17.55c.93-.35 1.95-.52 3.05-.52s2.12.17 3.05.52"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
}

export function ChampionshipBadgeIcon({ className, strokeWidth = 1.9 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      <path
        d="M12 4.45 17.6 6.8v4.45c0 3.37-2.12 6.3-5.6 8.1-3.48-1.8-5.6-4.73-5.6-8.1V6.8L12 4.45Z"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9.2 8.95c.55 3.42 1.44 5.79 2.8 7.1 1.36-1.31 2.25-3.68 2.8-7.1"
        strokeWidth={Math.max(strokeWidth - 0.05, 1.2)}
      />
      <path
        d="M8.75 12.55h6.5"
        strokeWidth={Math.max(strokeWidth - 0.25, 1.05)}
      />
      <path
        d="M10.4 10.1 12 8.45l1.6 1.65L12 11.7l-1.6-1.6Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
      <path
        d="M8.65 7.6c1.04.63 2.16.95 3.35.95s2.31-.32 3.35-.95"
        strokeWidth={Math.max(strokeWidth - 0.35, 1.05)}
      />
    </svg>
  );
}

export function NewsPulseIcon({ className, strokeWidth = 1.9 }: AppNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      <path
        d="M7.1 6.7h8.75c1.68 0 3.05 1.37 3.05 3.05v5.15c0 1.68-1.37 3.05-3.05 3.05H8.95c-1.58 0-2.85-1.28-2.85-2.85V7.7c0-.55.45-1 1-1Z"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9 10.15h4.55M9 12.45h6.05M9 14.75h4.2"
        strokeWidth={Math.max(strokeWidth - 0.2, 1.15)}
      />
      <path
        d="M15.95 10.45 17 11.5l-1.05 1.05"
        strokeWidth={Math.max(strokeWidth - 0.05, 1.25)}
      />
      <path
        d="M15.25 8.25h2.05"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
}

export type { AppNavIconProps };

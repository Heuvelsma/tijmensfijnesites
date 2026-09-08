type P = { size?: number; stroke?: number };

const base = (size = 16, stroke = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: stroke,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconSearch = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconPlus = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrowUpRight = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const IconArrowRight = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconArrowUp = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const IconRefresh = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const IconUpload = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

export const IconX = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconCheck = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const IconSun = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)} className="theme__sun">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const IconMoon = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)} className="theme__moon">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

export const IconPencil = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 6.5 3 3" />
  </svg>
);

export const IconLock = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconLogout = ({ size, stroke }: P) => (
  <svg {...base(size, stroke)}>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </svg>
);

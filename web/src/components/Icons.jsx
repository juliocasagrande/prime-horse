const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M3 8 12 3l9 5v11.5A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </>
  ),
  movements: (
    <>
      <path d="M4 8h12m-4-4 4 4-4 4M20 16H8m4 4-4-4 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0v4l1.5 3h-15L6 14Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c0-3 2.3-5 5-5s5 2 5 5" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.2 19c0-2.4 1-4.1 2.8-4.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3m0 13v3M2.5 12h3m13 0h3M5 5l2.1 2.1m9.8 9.8L19 19M5 19l2.1-2.1m9.8-9.8L19 5" />
    </>
  ),
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  edit: <><path d="m4 16-.7 4.7L8 20l11-11-4-4Z" /><path d="m13 7 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  logout: <><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="M15 12h6m-3-3 3 3-3 3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowLeft: <path d="m15 18-6-6 6-6" />,
  arrowRight: <path d="m9 18 6-6-6-6" />,
  refresh: <><path d="M20 7v5h-5" /><path d="M18.2 16A8 8 0 1 1 20 12" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  alert: <><path d="M12 3 2.8 20h18.4Z" /><path d="M12 9v5m0 3h.01" /></>,
  negative: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
  inbox: <><path d="M4 4h16v16H4Z" /><path d="M4 14h4l2 3h4l2-3h4" /></>,
};

export function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function HorseIcon({ size = 28, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 19 3-8 3-6c1 0 2 1 2 2l1 3 4 1 3 3-2 1-2-1-2 3 1 5" />
      <path d="M6 19h4" />
    </svg>
  );
}

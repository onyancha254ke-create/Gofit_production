const paths = {
  dumbbell: <path d="M6 8v8M4 10v4M18 8v8M20 10v4M9 12h6" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".5" fill="currentColor" /></>,
  heart: <path d="M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />,
  apple: <path d="M12 8c-3 0-5 2.5-5 6s2.5 6.5 4.5 6.5c1 0 1.3-.5 2-.5s1 .5 2 .5C17.5 20.5 20 17 20 14c0-2-1-3.5-2.5-4a3 3 0 0 0-3-2.8c-.6 0-1.2.2-1.7.5C12.6 6.7 12.3 6 12 6" />,
  monitor: <><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></>,
  pin: <><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  shield: <path d="M12 3l7 3v6c0 5-3.5 7.7-7 9-3.5-1.3-7-4-7-9V6l7-3Z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  people: <><circle cx="8.5" cy="8" r="3" /><circle cx="16.5" cy="9" r="2.5" /><path d="M2.5 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M14.5 20c0-2.4 1.9-4.5 4.3-4.9" /></>,
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
};

export default function Icon({ name, size = 22, color = 'currentColor', fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
}

export function Star({ filled, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f0b24b' : 'none'} stroke="#f0b24b" strokeWidth="1.3">
      <path d="M12 2.5l2.9 6.1 6.6.9-4.9 4.7 1.2 6.6L12 17.6l-5.8 3.2 1.2-6.6-4.9-4.7 6.6-.9L12 2.5Z" />
    </svg>
  );
}

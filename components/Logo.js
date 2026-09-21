export default function Logo({ dark }) {
  const textColor = dark ? '#fff' : 'var(--text)';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
        <path d="M4 32L16 8L22 20L14 32H4Z" fill="var(--accent)" />
        <path d="M20 32L28 16L36 32H20Z" fill={dark ? '#fff' : 'var(--text)'} />
      </svg>
      <span style={{ lineHeight: 1 }}>
        <span style={{ display: 'block', fontSize: 19, fontWeight: 900, letterSpacing: -0.5, color: textColor }}>GOFIT</span>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)' }}>TRAINING</span>
      </span>
    </span>
  );
}

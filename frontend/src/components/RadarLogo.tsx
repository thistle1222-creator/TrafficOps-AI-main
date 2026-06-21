export function RadarLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="TrafficOps radar mark">
      <defs>
        <radialGradient id="rl-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF3D3D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF3D3D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" stroke="#00D4FF" strokeOpacity="0.4" strokeWidth="1" />
      <circle cx="32" cy="32" r="20" stroke="#00D4FF" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="32" cy="32" r="12" stroke="#00D4FF" strokeOpacity="0.25" strokeWidth="1" />
      <line x1="32" y1="4" x2="32" y2="60" stroke="#00D4FF" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="4" y1="32" x2="60" y2="32" stroke="#00D4FF" strokeOpacity="0.2" strokeWidth="1" />
      <circle cx="32" cy="32" r="10" fill="url(#rl-grad)" />
      <circle cx="32" cy="32" r="3" fill="#FF3D3D" className="pulse-dot" />
    </svg>
  );
}
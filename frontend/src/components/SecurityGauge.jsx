// Signature element: composite "National Energy Security Index" radial gauge.
// Blends reserve coverage, import dependency, and logistics disruption signals into one score.
export default function SecurityGauge({ score = 0, size = 76 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? 'var(--status-ok)' : pct >= 45 ? 'var(--status-warning)' : 'var(--status-critical)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize="18" fontWeight="600" fill="var(--text-primary)">
          {Math.round(pct)}
        </text>
      </svg>
      <div>
        <div className="eyebrow">National Energy<br />Security Index</div>
      </div>
    </div>
  );
}

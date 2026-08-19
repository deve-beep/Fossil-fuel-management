export default function StatCard({ eyebrow, value, unit, delta, deltaGood, accent, sub }) {
  return (
    <div className="card" style={{ padding: '18px 20px', minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: accent || 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      {(delta !== undefined || sub) && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: delta !== undefined ? (deltaGood ? 'var(--status-ok)' : 'var(--status-critical)') : 'var(--text-muted)' }}>
          {delta !== undefined ? `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}% ${sub || 'vs. prior period'}` : sub}
        </div>
      )}
    </div>
  );
}

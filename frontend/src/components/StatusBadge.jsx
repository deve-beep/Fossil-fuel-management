const MAP = {
  critical: 'badge-critical', low: 'badge-warning', delayed: 'badge-warning',
  disrupted: 'badge-critical', maintenance: 'badge-warning', shortfall: 'badge-warning',
  adequate: 'badge-ok', on_schedule: 'badge-ok', compliant: 'badge-ok',
  active: 'badge-ok', mitigated: 'badge-ok', closed: 'badge-neutral',
  surplus: 'badge-info', open: 'badge-critical', monitoring: 'badge-warning',
  pending_approval: 'badge-info', draft: 'badge-neutral', under_review: 'badge-warning',
  terminated: 'badge-neutral', expired: 'badge-neutral', cancelled: 'badge-neutral'
};

export default function StatusBadge({ status }) {
  const cls = MAP[status] || 'badge-neutral';
  const label = (status || '').replace(/_/g, ' ');
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

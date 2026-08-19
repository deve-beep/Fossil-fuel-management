import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['price_volatility', 'supply_shock', 'geopolitical', 'infrastructure_failure', 'natural_disaster', 'other'];
const SEVERITIES = ['low', 'moderate', 'high', 'critical'];
const emptyForm = {
  title: '', category: 'price_volatility', fuelType: 'crude_oil', severity: 'moderate',
  affectedRegions: '', description: '', impactSummary: '', mitigationActions: ''
};

const SEVERITY_COLOR = { low: 'var(--status-info)', moderate: 'var(--status-warning)', high: '#9C4A22', critical: 'var(--status-critical)' };

export default function Crisis() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canWrite = ['government_admin', 'energy_analyst'].includes(user?.role);

  const load = async () => {
    const { data } = await api.get('/crisis', { params: statusFilter ? { status: statusFilter } : {} });
    setRecords(data.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/crisis', {
        ...form,
        affectedRegions: form.affectedRegions.split(',').map((s) => s.trim()).filter(Boolean),
        mitigationActions: form.mitigationActions.split(',').map((s) => s.trim()).filter(Boolean)
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to file report.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/crisis/${id}`, { status });
    load();
  };

  const open = records.filter((r) => r.status === 'open').length;
  const critical = records.filter((r) => r.severity === 'critical').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 21, marginBottom: 4 }}>Policy &amp; Crisis Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Price volatility alerts, supply shocks and disruption response tracking.</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ File report'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Open reports</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6, color: open ? 'var(--status-critical)' : 'var(--text-primary)' }}>{open}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Critical severity</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6, color: critical ? 'var(--status-critical)' : 'var(--text-primary)' }}>{critical}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Total on record</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6 }}>{records.length}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Severity</label>
            <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Fuel type</label>
            <select className="input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
              {['coal', 'crude_oil', 'natural_gas', 'multiple'].map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Affected regions (comma separated)</label>
            <input className="input" value={form.affectedRegions} onChange={(e) => setForm({ ...form, affectedRegions: e.target.value })} placeholder="Gujarat, Maharashtra" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Description</label>
            <textarea className="input" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Impact summary</label>
            <input className="input" value={form.impactSummary} onChange={(e) => setForm({ ...form, impactSummary: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Mitigation actions (comma separated)</label>
            <input className="input" value={form.mitigationActions} onChange={(e) => setForm({ ...form, mitigationActions: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {formError && <span style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{formError}</span>}
            <button className="btn btn-primary" disabled={submitting} style={{ marginLeft: 'auto' }}>
              {submitting ? 'Filing…' : 'File report'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {['', 'open', 'monitoring', 'mitigated', 'closed'].map((s) => (
          <button
            key={s || 'all'}
            className="btn"
            onClick={() => setStatusFilter(s)}
            style={{ padding: '6px 12px', fontSize: 12, background: statusFilter === s ? 'var(--surface-hover)' : 'var(--surface-raised)' }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {records.map((r) => (
          <div key={r._id} className="card" style={{ padding: 18, borderLeft: `3px solid ${SEVERITY_COLOR[r.severity]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span className="eyebrow">{r.category.replace(/_/g, ' ')}</span>
                  <StatusBadge status={r.status} />
                  <span className="badge" style={{ color: SEVERITY_COLOR[r.severity], borderColor: SEVERITY_COLOR[r.severity] }}>{r.severity}</span>
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>{r.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 700 }}>{r.description}</p>
                {r.impactSummary && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Impact:</strong> {r.impactSummary}</p>}
                {r.mitigationActions?.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {r.mitigationActions.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </div>
              {canWrite && r.status !== 'closed' && (
                <select className="input" style={{ width: 140 }} value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}>
                  {['open', 'monitoring', 'mitigated', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
        {records.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No reports match this filter.</p>}
      </div>
    </div>
  );
}

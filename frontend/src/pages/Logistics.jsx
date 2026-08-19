import { useEffect, useState } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const MODES = ['rail_rake', 'pipeline', 'coastal_shipping', 'road'];
const emptyForm = {
  mode: 'rail_rake', fuelType: 'coal', routeName: '', origin: '', destination: '',
  rakesPlanned: '', rakesDispatched: '', pipelineCapacity: '', pipelineThroughput: '', status: 'on_schedule', delayReason: ''
};

export default function Logistics() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [modeFilter, setModeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canWrite = ['government_admin', 'energy_analyst'].includes(user?.role);

  const load = async () => {
    const { data } = await api.get('/logistics', { params: modeFilter ? { mode: modeFilter } : {} });
    setRecords(data.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [modeFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = { ...form };
      ['rakesPlanned', 'rakesDispatched', 'pipelineCapacity', 'pipelineThroughput'].forEach((k) => {
        payload[k] = payload[k] === '' ? 0 : parseFloat(payload[k]);
      });
      await api.post('/logistics', payload);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to log movement.');
    } finally {
      setSubmitting(false);
    }
  };

  const railRakes = records.filter((r) => r.mode === 'rail_rake');
  const pipelines = records.filter((r) => r.mode === 'pipeline');
  const disrupted = records.filter((r) => ['delayed', 'disrupted'].includes(r.status));

  const gaugeData = pipelines.slice(0, 6).map((p, i) => ({
    name: p.routeName, value: p.utilizationPct || 0,
    fill: ['#8B5A2E', '#4B7F6F', '#7A4A1F', '#6B5842', '#3F7A4E', '#4A4640'][i % 6]
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 21, marginBottom: 4 }}>Logistics &amp; Distribution Monitor</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Rail rake dispatch performance and pipeline throughput across national corridors.</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Log movement'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label className="field-label">Mode</label>
            <select className="input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Fuel type</label>
            <select className="input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
              {['coal', 'crude_oil', 'natural_gas', 'petroleum_products'].map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Route name</label>
            <input className="input" required value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['on_schedule', 'delayed', 'disrupted', 'maintenance'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Origin</label>
            <input className="input" required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Destination</label>
            <input className="input" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          {form.mode === 'rail_rake' ? (
            <>
              <div>
                <label className="field-label">Rakes planned</label>
                <input className="input" type="number" value={form.rakesPlanned} onChange={(e) => setForm({ ...form, rakesPlanned: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Rakes dispatched</label>
                <input className="input" type="number" value={form.rakesDispatched} onChange={(e) => setForm({ ...form, rakesDispatched: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="field-label">Capacity</label>
                <input className="input" type="number" value={form.pipelineCapacity} onChange={(e) => setForm({ ...form, pipelineCapacity: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Throughput</label>
                <input className="input" type="number" value={form.pipelineThroughput} onChange={(e) => setForm({ ...form, pipelineThroughput: e.target.value })} />
              </div>
            </>
          )}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Delay / disruption reason (optional)</label>
            <input className="input" value={form.delayReason} onChange={(e) => setForm({ ...form, delayReason: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {formError && <span style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{formError}</span>}
            <button className="btn btn-primary" disabled={submitting} style={{ marginLeft: 'auto' }}>
              {submitting ? 'Saving…' : 'Save record'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Rail rake corridors</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6 }}>{railRakes.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>tracked routes</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Pipeline routes</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6 }}>{pipelines.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>tracked routes</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Active disruptions</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6, color: disrupted.length ? 'var(--status-critical)' : 'var(--status-ok)' }}>{disrupted.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>delayed or disrupted</div>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Pipeline utilization</div>
        <ResponsiveContainer width="100%" height={280}>
          <RadialBarChart innerRadius="20%" outerRadius="90%" data={gaugeData} startAngle={90} endAngle={-270}>
            <RadialBar background dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: '#211C13', fontSize: 11 }} />
            <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11.5 }} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5 }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow">All movements</div>
          <select className="input" style={{ width: 200 }} value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            <option value="">All modes</option>
            {MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Route</th><th>Mode</th><th>Fuel</th><th>Utilization</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td className="emph">{r.routeName}<div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{r.origin} → {r.destination}</div></td>
                <td style={{ textTransform: 'capitalize' }}>{r.mode.replace('_', ' ')}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.fuelType.replace('_', ' ')}</td>
                <td className="mono">{r.utilizationPct ?? '—'}%</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

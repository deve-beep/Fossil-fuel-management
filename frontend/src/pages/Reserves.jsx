import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const STATUS_HEX = { critical: '#B23B33', low: '#A8751F', adequate: '#3F7A4E', surplus: '#6B5842' };
const FUEL_OPTIONS = ['coal', 'crude_oil', 'natural_gas'];

const emptyForm = { fuelType: 'coal', facilityName: '', location: '', capacity: '', currentStock: '', unit: '', daysOfCoverEstimate: '', notes: '' };

export default function Reserves() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [fuelFilter, setFuelFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canWrite = user?.role === 'government_admin';

  const load = async () => {
    const { data } = await api.get('/reserves', { params: fuelFilter ? { fuelType: fuelFilter } : {} });
    setRecords(data.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fuelFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/reserves', {
        ...form,
        capacity: parseFloat(form.capacity),
        currentStock: parseFloat(form.currentStock),
        daysOfCoverEstimate: form.daysOfCoverEstimate ? parseFloat(form.daysOfCoverEstimate) : undefined
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create facility record.');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = records.map((r) => ({
    name: r.facilityName.length > 18 ? r.facilityName.slice(0, 16) + '…' : r.facilityName,
    pct: +(r.capacity ? (r.currentStock / r.capacity) * 100 : 0).toFixed(1),
    status: r.status
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 21, marginBottom: 4 }}>Strategic Reserves Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Crude oil SPR facilities, coal pithead/pooled stocks, and gas buffer storage with live coverage status.
          </p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Log facility'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <label className="field-label">Fuel type</label>
            <select className="input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
              {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Facility name</label>
            <input className="input" required value={form.facilityName} onChange={(e) => setForm({ ...form, facilityName: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Location</label>
            <input className="input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Capacity</label>
            <input className="input" type="number" step="any" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Current stock</label>
            <input className="input" type="number" step="any" required value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <input className="input" required placeholder="MT / million barrels / BCM" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Days of cover (est.)</label>
            <input className="input" type="number" value={form.daysOfCoverEstimate} onChange={(e) => setForm({ ...form, daysOfCoverEstimate: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Notes</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {formError && <span style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{formError}</span>}
            <button className="btn btn-primary" disabled={submitting} style={{ marginLeft: 'auto' }}>
              {submitting ? 'Saving…' : 'Save facility'}
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Stock as % of rated capacity</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10.5 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} angle={-18} textAnchor="end" height={60} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5 }} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={STATUS_HEX[d.status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow">All facilities</div>
          <select className="input" style={{ width: 180 }} value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}>
            <option value="">All fuel types</option>
            {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Facility</th><th>Fuel</th><th>Location</th><th>Stock / Capacity</th><th>Days cover</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td className="emph">{r.facilityName}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.fuelType.replace('_', ' ')}</td>
                <td>{r.location}</td>
                <td className="mono">{r.currentStock} / {r.capacity} {r.unit}</td>
                <td className="mono">{r.daysOfCoverEstimate ?? '—'}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

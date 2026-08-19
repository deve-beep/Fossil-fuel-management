import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const SECTORS = ['power', 'steel', 'cement', 'fertilizer', 'city_gas', 'refining', 'other'];
const emptyForm = {
  agreementCode: '', fuelType: 'coal', supplier: '', consumer: '', consumerSector: 'power',
  annualContractedQuantity: '', unit: '', tenureStart: '', tenureEnd: ''
};

export default function FSA() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canPropose = ['government_admin', 'industrial_stakeholder'].includes(user?.role);
  const canApprove = user?.role === 'government_admin';

  const load = async () => {
    const { data } = await api.get('/fsa');
    setRecords(data.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/fsa', { ...form, annualContractedQuantity: parseFloat(form.annualContractedQuantity) });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id) => {
    await api.patch(`/fsa/${id}/approve`);
    load();
  };

  const active = records.filter((r) => r.status === 'active').length;
  const pending = records.filter((r) => r.status === 'pending_approval').length;
  const shortfall = records.filter((r) => r.complianceStatus === 'shortfall').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 21, marginBottom: 4 }}>Fuel Supply Agreements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {user?.role === 'industrial_stakeholder'
              ? `Agreements linked to ${user.organization}.`
              : 'All national Fuel Supply Agreements across coal, crude oil and natural gas.'}
          </p>
        </div>
        {canPropose && (
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Propose agreement'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Active agreements</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6 }}>{active}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Pending approval</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6, color: pending ? 'var(--status-warning)' : 'var(--text-primary)' }}>{pending}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Compliance shortfalls</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginTop: 6, color: shortfall ? 'var(--status-critical)' : 'var(--text-primary)' }}>{shortfall}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label className="field-label">Agreement code</label>
            <input className="input" required value={form.agreementCode} onChange={(e) => setForm({ ...form, agreementCode: e.target.value })} placeholder="FSA-XXX-YYYY-###" />
          </div>
          <div>
            <label className="field-label">Fuel type</label>
            <select className="input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
              {['coal', 'crude_oil', 'natural_gas'].map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Supplier</label>
            <input className="input" required value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. Coal India Ltd" />
          </div>
          <div>
            <label className="field-label">Consumer sector</label>
            <select className="input" value={form.consumerSector} onChange={(e) => setForm({ ...form, consumerSector: e.target.value })}>
              {SECTORS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          {user?.role !== 'industrial_stakeholder' && (
            <div>
              <label className="field-label">Consumer organization</label>
              <input className="input" required value={form.consumer} onChange={(e) => setForm({ ...form, consumer: e.target.value })} />
            </div>
          )}
          <div>
            <label className="field-label">Annual contracted quantity</label>
            <input className="input" type="number" step="any" required value={form.annualContractedQuantity} onChange={(e) => setForm({ ...form, annualContractedQuantity: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <input className="input" required placeholder="MT / MMT / BCM" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Tenure start</label>
            <input className="input" type="date" required value={form.tenureStart} onChange={(e) => setForm({ ...form, tenureStart: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Tenure end</label>
            <input className="input" type="date" required value={form.tenureEnd} onChange={(e) => setForm({ ...form, tenureEnd: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {formError && <span style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{formError}</span>}
            <button className="btn btn-primary" disabled={submitting} style={{ marginLeft: 'auto' }}>
              {submitting ? 'Submitting…' : (user?.role === 'industrial_stakeholder' ? 'Submit for approval' : 'Create agreement')}
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>Agreement</th><th>Supplier → Consumer</th><th>Sector</th><th>Fulfilment</th><th>Compliance</th><th>Status</th>{canApprove && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td className="emph mono" style={{ fontSize: 12 }}>{r.agreementCode}</td>
                <td>{r.supplier} → {r.consumer}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.consumerSector.replace('_', ' ')}</td>
                <td className="mono">{r.fulfilmentPct}% <span style={{ color: 'var(--text-muted)' }}>({r.suppliedTillDate}/{r.annualContractedQuantity} {r.unit})</span></td>
                <td><StatusBadge status={r.complianceStatus} /></td>
                <td><StatusBadge status={r.status} /></td>
                {canApprove && (
                  <td>
                    {r.status === 'pending_approval' && (
                      <button className="btn" style={{ padding: '5px 10px', fontSize: 11.5 }} onClick={() => approve(r._id)}>Approve</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

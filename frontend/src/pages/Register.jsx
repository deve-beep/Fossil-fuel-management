import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '', designation: '' });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const ok = await register(form);
    if (ok) navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 36 }}>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Request industrial stakeholder access</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 22 }}>
          Government administrator and energy analyst accounts are provisioned internally by the Ministry.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="field-label">Full name</label>
            <input className="input" required value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="field-label">Work email</label>
            <input className="input" type="email" required value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label className="field-label">Organization</label>
            <input className="input" required value={form.organization} onChange={update('organization')} placeholder="e.g. Tata Power Ltd" />
          </div>
          <div>
            <label className="field-label">Designation</label>
            <input className="input" value={form.designation} onChange={update('designation')} placeholder="e.g. Fuel Procurement Manager" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="input" type="password" required minLength={8} value={form.password} onChange={update('password')} />
          </div>
          {error && <div style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{error}</div>}
          <button className="btn btn-primary" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Submitting…' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--signal)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

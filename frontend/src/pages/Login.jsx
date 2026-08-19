import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Government Admin', email: 'admin@ffrscm.gov.in', password: 'Admin@12345' },
  { role: 'Energy Analyst', email: 'analyst@ffrscm.gov.in', password: 'Analyst@12345' },
  { role: 'Industrial Stakeholder', email: 'stakeholder@tatapower.com', password: 'Stake@12345' }
];

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 920, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{
          padding: 44, background: 'linear-gradient(160deg, var(--surface-raised), var(--bg))',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, var(--signal), var(--crude))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FBF3E7', fontSize: 18, marginBottom: 22
            }}>F</div>
            <h1 style={{ fontSize: 26, lineHeight: 1.25, marginBottom: 12 }}>
              National Fossil Fuel Resource &amp; Supply Chain Management Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>
              Coal, crude oil and natural gas production, strategic reserves, rail &amp; pipeline
              logistics, Fuel Supply Agreements, and crisis response — in one operational view.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 30 }}>
            <div><div className="eyebrow">Fuels tracked</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginTop: 4 }}>03</div></div>
            <div><div className="eyebrow">Core modules</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginTop: 4 }}>04</div></div>
            <div><div className="eyebrow">Access tiers</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginTop: 4 }}>03</div></div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 22 }}>Authorized personnel and registered stakeholders only.</p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">Email address</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.in" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <div style={{ color: 'var(--status-critical)', fontSize: 12.5 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Demo credentials</div>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', fontSize: 12, padding: '5px 0', cursor: 'pointer', fontFamily: 'var(--font-mono)'
                }}
              >
                {acc.role}: <span style={{ color: 'var(--text-muted)' }}>{acc.email}</span>
              </button>
            ))}
          </div>

          <p style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
            New industrial stakeholder? <Link to="/register" style={{ color: 'var(--signal)' }}>Request access</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

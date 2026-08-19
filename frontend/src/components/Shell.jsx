import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import SecurityGauge from './SecurityGauge';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const NAV = [
  { to: '/', label: 'Overview', icon: '◇', end: true },
  { to: '/reserves', label: 'Strategic Reserves', icon: '⛁' },
  { to: '/logistics', label: 'Logistics & Distribution', icon: '⇄' },
  { to: '/fsa', label: 'Fuel Supply Agreements', icon: '⎘' },
  { to: '/crisis', label: 'Policy & Crisis', icon: '⚠' }
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function computeIndex() {
      try {
        const [reserves, logistics] = await Promise.all([
          api.get('/reserves'), api.get('/logistics')
        ]);
        const facilities = reserves.data.data || [];
        const moves = logistics.data.data || [];
        const coverageScore = facilities.length
          ? facilities.reduce((acc, f) => acc + Math.min(100, (f.currentStock / f.capacity) * 100), 0) / facilities.length
          : 50;
        const disruptions = moves.filter((m) => ['delayed', 'disrupted'].includes(m.status)).length;
        const disruptionPenalty = Math.min(30, disruptions * 8);
        const composite = Math.max(0, Math.min(100, coverageScore - disruptionPenalty));
        if (!cancelled) setScore(composite);
      } catch {
        if (!cancelled) setScore(null);
      }
    }
    computeIndex();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 248, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, var(--signal), var(--crude))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FBF3E7', fontSize: 15
          }}>F</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, lineHeight: 1.1 }}>FFRSCM</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Government of India</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface-raised)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--signal)' : '2px solid transparent'
              })}
            >
              <span aria-hidden style={{ width: 16, textAlign: 'center', color: 'var(--text-muted)' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '4px 8px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[user?.role]}</div>
            {user?.organization && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.organization}</div>}
          </div>
          <button className="btn" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 66, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 26px', background: 'rgba(247,243,234,0.72)', backdropFilter: 'blur(6px)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div className="eyebrow">National Fossil Fuel Resource &amp; Supply Chain Management Dashboard</div>
          {score !== null && <SecurityGauge score={score} />}
        </header>
        <main style={{ padding: '26px 28px', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

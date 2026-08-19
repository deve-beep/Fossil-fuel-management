import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const FUELS = [
  { key: 'coal', label: 'Coal', color: 'var(--coal)', hex: '#4A4640' },
  { key: 'crude_oil', label: 'Crude Oil', color: 'var(--crude)', hex: '#8B5A2E' },
  { key: 'natural_gas', label: 'Natural Gas', color: 'var(--gas)', hex: '#4B7F6F' }
];

export default function Dashboard() {
  const [byFuel, setByFuel] = useState({});
  const [summary, setSummary] = useState({});
  const [reserves, setReserves] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [crisis, setCrisis] = useState([]);
  const [activeFuel, setActiveFuel] = useState('coal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [coal, crude, gas, summaryRes, reservesRes, logisticsRes, crisisRes] = await Promise.all([
          api.get('/production', { params: { fuelType: 'coal', state: 'National' } }),
          api.get('/production', { params: { fuelType: 'crude_oil', state: 'National' } }),
          api.get('/production', { params: { fuelType: 'natural_gas', state: 'National' } }),
          api.get('/production/summary'),
          api.get('/reserves'),
          api.get('/logistics/disruptions'),
          api.get('/crisis', { params: { status: 'open' } })
        ]);
        if (cancelled) return;
        setByFuel({ coal: coal.data.data, crude_oil: crude.data.data, natural_gas: gas.data.data });
        setSummary(summaryRes.data.data);
        setReserves(reservesRes.data.data);
        setDisruptions(logisticsRes.data.data);
        setCrisis(crisisRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const chartData = byFuel[activeFuel] || [];
  const fuelMeta = FUELS.find((f) => f.key === activeFuel);

  const importPieData = useMemo(() => {
    return FUELS.map((f) => {
      const rows = byFuel[f.key] || [];
      const latest = rows[rows.length - 1];
      return { name: f.label, value: latest ? latest.importDependencyPct : 0, hex: f.hex };
    });
  }, [byFuel]);

  const criticalReserves = reserves.filter((r) => ['critical', 'low'].includes(r.status));

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 21, marginBottom: 4 }}>National Supply Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Production against target, consumption trend and import dependency for coal, crude oil and natural gas.
        </p>
      </div>

      {/* KPI cards per fuel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {FUELS.map((f) => {
          const rec = summary[f.key];
          if (!rec) return null;
          const gapPct = rec.productionTarget ? ((rec.productionActual - rec.productionTarget) / rec.productionTarget) * 100 : 0;
          return (
            <StatCard
              key={f.key}
              eyebrow={`${f.label} · latest month production`}
              value={rec.productionActual}
              unit={rec.unit}
              accent={f.hex}
              delta={+gapPct.toFixed(1)}
              deltaGood={gapPct >= 0}
              sub="vs. national target"
            />
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch' }}>
        {/* Trend chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Production vs. target vs. consumption</div>
              <h3 style={{ fontSize: 15, marginTop: 4 }}>{fuelMeta.label} — 6 month trend</h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FUELS.map((f) => (
                <button
                  key={f.key}
                  className="btn"
                  onClick={() => setActiveFuel(f.key)}
                  style={{
                    padding: '6px 12px', fontSize: 12,
                    borderColor: activeFuel === f.key ? f.hex : 'var(--border-strong)',
                    background: activeFuel === f.key ? 'var(--surface-hover)' : 'var(--surface-raised)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="consumption" name="Consumption" fill={fuelMeta.hex} fillOpacity={0.12} stroke={fuelMeta.hex} strokeOpacity={0.4} />
              <Bar dataKey="productionActual" name="Production (actual)" fill={fuelMeta.hex} radius={[4, 4, 0, 0]} barSize={22} />
              <Line type="monotone" dataKey="productionTarget" name="Production target" stroke="var(--signal)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Import dependency donut */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">Import dependency</div>
          <h3 style={{ fontSize: 15, marginTop: 4, marginBottom: 6 }}>Latest reporting period</h3>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={importPieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                {importPieData.map((d) => <Cell key={d.name} fill={d.hex} stroke="var(--surface)" strokeWidth={2} />)}
              </Pie>
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {importPieData.map((d) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.hex, display: 'inline-block' }} />
                  {d.name}
                </span>
                <span className="mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Reserve alerts */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="eyebrow">Strategic reserves</div>
              <h3 style={{ fontSize: 15, marginTop: 4 }}>Facilities requiring attention</h3>
            </div>
            <span className="mono" style={{ fontSize: 20, color: criticalReserves.length ? 'var(--status-critical)' : 'var(--status-ok)' }}>
              {criticalReserves.length}
            </span>
          </div>
          {criticalReserves.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>All facilities at adequate or surplus coverage.</p>}
          {criticalReserves.map((r) => (
            <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.facilityName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.location} · {r.daysOfCoverEstimate} days cover est.</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>

        {/* Logistics disruptions + open crisis */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="eyebrow">Logistics &amp; crisis</div>
              <h3 style={{ fontSize: 15, marginTop: 4 }}>Active disruptions</h3>
            </div>
            <span className="mono" style={{ fontSize: 20, color: (disruptions.length + crisis.length) ? 'var(--status-warning)' : 'var(--status-ok)' }}>
              {disruptions.length + crisis.length}
            </span>
          </div>
          {disruptions.map((d) => (
            <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.routeName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.delayReason || 'Route disruption reported'}</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
          {crisis.map((c) => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.category.replace(/_/g, ' ')}</div>
              </div>
              <StatusBadge status={c.severity === 'critical' || c.severity === 'high' ? 'open' : 'monitoring'} />
            </div>
          ))}
          {disruptions.length === 0 && crisis.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active disruptions or open crisis reports.</p>}
        </div>
      </div>
    </div>
  );
}

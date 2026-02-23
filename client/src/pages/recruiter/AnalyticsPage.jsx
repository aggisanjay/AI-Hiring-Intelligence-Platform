import { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, Target, AlertCircle } from 'lucide-react';
import { analyticsAPI } from '../../api/axios.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'#94a3b8', marginBottom:4 }}>{label}</p>
      <p style={{ color:'#f1f5f9', fontWeight:700 }}>{payload[0].value}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [stats,   setStats]   = useState(null);
  const [funnel,  setFunnel]  = useState([]);
  const [distrib, setDistrib] = useState([]);
  const [appTime, setAppTime] = useState([]);
  const [gaps,    setGaps]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f, d, t, g] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.funnel(),
          analyticsAPI.scoreDistrib(),
          analyticsAPI.appOverTime(),
          analyticsAPI.skillGaps(),
        ]);
        setStats(s.data.stats);
        setFunnel(f.data.funnel);
        setDistrib(d.data.distribution);
        setAppTime(t.data.data);
        setGaps(g.data.gaps);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const KPI = ({ label, value, sub, icon, color }) => (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, background: color + '15', color }}>{icon}</div>
      <div style={styles.kpiVal}>{loading ? <div className="skeleton" style={{ width:60, height:32, borderRadius:6 }} /> : value}</div>
      <div style={styles.kpiLabel}>{label}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
    </div>
  );

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics</h1>
        <p style={styles.sub}>Track your hiring performance and AI insights</p>
      </div>

      {/* KPI row */}
      <div style={styles.kpiGrid}>
        <KPI label="Total Applications" value={stats?.totalApplications} icon={<Users size={20} />} color="#3b82f6" sub={`${stats?.activeJobs} active jobs`} />
        <KPI label="Shortlisted"        value={stats?.shortlisted}       icon={<Target size={20} />} color="#f59e0b" />
        <KPI label="In Interview"       value={stats?.interviews}        icon={<Zap size={20} />}    color="#8b5cf6" />
        <KPI label="Offers Extended"    value={stats?.offers}            icon={<TrendingUp size={20} />} color="#10b981" sub={`${stats?.conversionRate}% conversion`} />
      </div>

      <div style={styles.grid2}>
        {/* Hiring Funnel */}
        <div style={styles.card}>
          <div style={styles.cardHead}><span style={styles.cardTitle}>Hiring Funnel</span></div>
          {!loading && funnel.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnel} margin={{ top:8, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="status" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            : <div className="skeleton" style={{ height:220, borderRadius:8 }} />}
        </div>

        {/* AI Score Distribution */}
        <div style={styles.card}>
          <div style={styles.cardHead}><span style={styles.cardTitle}>AI Score Distribution</span></div>
          {!loading && distrib.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distrib} margin={{ top:8, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="range" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            : <div style={styles.chartEmpty}>
                <AlertCircle size={24} color="#334155" />
                <p style={{ color:'#475569', fontSize:13, marginTop:8 }}>No AI scores yet</p>
              </div>}
        </div>
      </div>

      {/* Applications over time */}
      <div style={styles.card}>
        <div style={styles.cardHead}><span style={styles.cardTitle}>Applications (Last 30 Days)</span></div>
        {!loading && appTime.length > 0
          ? <ResponsiveContainer width="100%" height={200}>
              <LineChart data={appTime} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill:'#3b82f6', r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          : <div style={styles.chartEmpty}>
              <p style={{ color:'#475569', fontSize:13 }}>No application data in the last 30 days</p>
            </div>}
      </div>

      {/* Skill Gaps */}
      <div style={styles.card}>
        <div style={styles.cardHead}><span style={styles.cardTitle}>Top Skill Gaps</span></div>
        {!loading
          ? gaps.length > 0
            ? <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {gaps.map((g, i) => (
                  <div key={i} style={styles.gapRow}>
                    <span style={styles.gapSkill}>{g._id}</span>
                    <div style={{ flex:1, background:'rgba(255,255,255,0.05)', borderRadius:4, height:8, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, (g.count / (gaps[0]?.count || 1)) * 100)}%`, background:'linear-gradient(90deg,#ef4444,#f59e0b)', borderRadius:4 }} />
                    </div>
                    <span style={styles.gapCount}>{g.count} candidates</span>
                  </div>
                ))}
              </div>
            : <div style={styles.chartEmpty}><p style={{ color:'#475569', fontSize:13 }}>No skill gap data yet</p></div>
          : Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:28, borderRadius:6, marginBottom:8 }} />)
        }
      </div>
    </div>
  );
}

const styles = {
  page:      { display:'flex', flexDirection:'column', gap:24, maxWidth:1200 },
  header:    { },
  title:     { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:       { color:'#64748b', fontSize:14 },
  kpiGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  kpiCard:   { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
  kpiIcon:   { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 },
  kpiVal:    { fontFamily:'Syne,sans-serif', fontSize:30, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  kpiLabel:  { fontSize:13, color:'#64748b', fontWeight:500, marginBottom:2 },
  kpiSub:    { fontSize:11, color:'#475569' },
  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  card:      { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
  cardHead:  { marginBottom:16 },
  cardTitle: { fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:600, color:'#f1f5f9' },
  chartEmpty:{ height:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  gapRow:    { display:'flex', alignItems:'center', gap:14 },
  gapSkill:  { width:140, fontSize:13, color:'#94a3b8', fontWeight:500 },
  gapCount:  { fontSize:12, color:'#475569', width:90, textAlign:'right' },
};
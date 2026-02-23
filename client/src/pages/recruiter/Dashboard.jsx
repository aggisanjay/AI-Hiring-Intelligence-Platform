import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, TrendingUp, Target, Zap,
  ArrowRight, Clock, CheckCircle, AlertCircle,
  Star, ChevronRight, Activity, Award
} from 'lucide-react';
import { analyticsAPI, jobsAPI } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [jobs,   setJobs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f, j] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.funnel(),
          jobsAPI.getMyJobs(),
        ]);
        setStats(s.data.stats);
        setFunnel(f.data.funnel);
        setJobs(j.data.jobs.slice(0, 5));
      } catch { /* use fallback */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const FUNNEL_COLORS = ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444'];

  const statCards = stats ? [
    { label:'Active Jobs',       value: stats.activeJobs,        icon:<Briefcase size={20} />,  color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
    { label:'Total Applications',value: stats.totalApplications, icon:<Users size={20} />,      color:'#8b5cf6', bg:'rgba(139,92,246,0.1)' },
    { label:'In Interview',      value: stats.interviews,        icon:<Activity size={20} />,   color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
    { label:'Offers Extended',   value: stats.offers,            icon:<Award size={20} />,      color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  ] : [];

  return (
    <div style={styles.page} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={styles.sub}>{user?.organization} · Recruiter Dashboard</p>
        </div>
        <Link to="/recruiter/jobs" style={styles.newJobBtn}>
          <Zap size={15} /> Post New Job
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:110, borderRadius:12 }} />)
          : statCards.map((s, i) => (
            <div key={i} style={{ ...styles.statCard, animationDelay: `${i * 0.05}s` }} className="fade-in">
              <div style={{ ...styles.statIcon, background: s.bg, color: s.color }}>{s.icon}</div>
              <div style={styles.statVal}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))
        }
      </div>

      <div style={styles.grid2}>
        {/* Hiring Funnel Chart */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.cardTitle}>Hiring Funnel</span>
            <Activity size={16} color="#475569" />
          </div>
          {funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel} margin={{ top:8, right:0, left:-20, bottom:0 }}>
                <XAxis dataKey="status" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:12 }}
                  cursor={{ fill:'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {funnel.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>No data yet. Post jobs to see your funnel.</div>
          )}
        </div>

        {/* Recent Jobs */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.cardTitle}>Active Jobs</span>
            <Link to="/recruiter/jobs" style={styles.seeAll}>See all <ArrowRight size={12} /></Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:56, borderRadius:8 }} />)
              : jobs.length === 0
              ? <div style={styles.empty}>No jobs posted yet.</div>
              : jobs.map(job => (
                <Link key={job._id} to={`/recruiter/pipeline/${job._id}`} style={styles.jobRow}>
                  <div style={styles.jobDot} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={styles.jobTitle}>{job.title}</div>
                    <div style={styles.jobMeta}>{job.department} · {job.applicantsCount} applicants</div>
                  </div>
                  <div style={{ ...styles.statusBadge, background: job.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: job.status === 'Active' ? '#10b981' : '#f59e0b' }}>
                    {job.status}
                  </div>
                  <ChevronRight size={14} color="#475569" />
                </Link>
              ))
            }
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Quick Actions</span>
        </div>
        <div style={styles.actionsGrid}>
          {[
            { label:'Post New Job',     icon:<Briefcase size={18} />, to:'/recruiter/jobs',      color:'#3b82f6', desc:'Create a job posting' },
            { label:'Browse Candidates',icon:<Users size={18} />,     to:'/recruiter/candidates',color:'#8b5cf6', desc:'Search talent pool' },
            { label:'View Analytics',   icon:<TrendingUp size={18} />,to:'/recruiter/analytics', color:'#f59e0b', desc:'Track hiring metrics' },
          ].map((a, i) => (
            <Link key={i} to={a.to} style={{ ...styles.actionCard, borderColor: a.color + '25' }}>
              <div style={{ ...styles.actionIcon, background: a.color + '15', color: a.color }}>{a.icon}</div>
              <div>
                <div style={styles.actionLabel}>{a.label}</div>
                <div style={styles.actionDesc}>{a.desc}</div>
              </div>
              <ArrowRight size={16} color={a.color} style={{ marginLeft:'auto', flexShrink:0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:       { display:'flex', flexDirection:'column', gap:24, maxWidth:1200 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:      { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:        { color:'#64748b', fontSize:14 },
  newJobBtn:  { display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', padding:'10px 20px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600, boxShadow:'0 0 20px rgba(59,130,246,0.3)' },
  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statCard:   { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:8 },
  statIcon:   { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  statVal:    { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#f1f5f9' },
  statLabel:  { fontSize:12, color:'#64748b', fontWeight:500 },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  card:       { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
  cardHead:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  cardTitle:  { fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:600, color:'#f1f5f9' },
  seeAll:     { display:'flex', alignItems:'center', gap:4, color:'#3b82f6', textDecoration:'none', fontSize:12, fontWeight:500 },
  emptyChart: { height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:13 },
  empty:      { color:'#475569', fontSize:13, padding:'16px 0' },
  jobRow:     { display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, textDecoration:'none', transition:'background 0.15s', cursor:'pointer' },
  jobDot:     { width:8, height:8, borderRadius:'50%', background:'#3b82f6', flexShrink:0 },
  jobTitle:   { fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:2 },
  jobMeta:    { fontSize:11, color:'#475569' },
  statusBadge:{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600 },
  actionsGrid:{ display:'flex', flexDirection:'column', gap:10 },
  actionCard: { display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid', borderRadius:10, textDecoration:'none', transition:'background 0.15s' },
  actionIcon: { width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  actionLabel:{ fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom:2 },
  actionDesc: { fontSize:12, color:'#475569' },
};
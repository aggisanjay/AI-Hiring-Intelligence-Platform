import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, Search, TrendingUp, ArrowRight, CheckCircle, Brain, Sparkles, Award } from 'lucide-react';
import { analyticsAPI, interviewsAPI } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_COLOR = { Applied:'#3b82f6', Shortlisted:'#f59e0b', Interview:'#8b5cf6', Offer:'#10b981', Rejected:'#ef4444' };

export default function CandidateDashboard() {
  const { user }     = useAuth();
  const [stats,      setStats]      = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, i] = await Promise.all([analyticsAPI.candidateStats(), interviewsAPI.getMyAll()]);
        setStats(s.data.stats);
        setInterviews(i.data.interviews.slice(0, 4));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = stats ? [
    { label: 'Applied',     value: stats.totalApplications, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: <FileText size={20} /> },
    { label: 'Shortlisted', value: stats.shortlisted,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <TrendingUp size={20} /> },
    { label: 'Interviews',  value: stats.interviews,         color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  icon: <Video size={20} /> },
    { label: 'Offers',      value: stats.offers,             color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={20} /> },
  ] : [];

  return (
    <div style={S.page} className="fade-in">
      {/* Banner */}
      <div style={S.banner}>
        <div style={S.bannerGlow} />
        <div style={{ position:'relative' }}>
          <div style={S.bannerBadge}><Sparkles size={11} /> AI-Powered Platform</div>
          <h1 style={S.bannerTitle}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={S.bannerSub}>Practice interviews, track applications, and land your dream job.</p>
          <div style={S.bannerBtns}>
            <Link to="/candidate/jobs"      style={S.bannerBtn}>Browse Jobs <ArrowRight size={14} /></Link>
            <Link to="/candidate/interview" style={S.bannerOutline}>AI Interview</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsGrid}>
        {loading
          ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:100, borderRadius:12 }} />)
          : statCards.map((s,i) => (
            <div key={i} style={S.statCard}>
              <div style={{ ...S.statIcon, background: s.bg, color: s.color }}>{s.icon}</div>
              <div style={S.statVal}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))
        }
      </div>

      <div style={S.grid2}>
        {/* Actions */}
        <div style={S.card}>
          <p style={S.cardTitle}>Quick Actions</p>
          {[
            { label:'Browse Jobs',       to:'/candidate/jobs',         color:'#3b82f6', icon:<Search size={16} />,    desc:'Find matching roles' },
            { label:'AI Mock Interview', to:'/candidate/interview',    color:'#8b5cf6', icon:<Video size={16} />,     desc:'Practice with AI interviewer' },
            { label:'My Applications',   to:'/candidate/applications', color:'#f59e0b', icon:<FileText size={16} />,  desc:'Track your progress' },
            { label:'Update Profile',    to:'/candidate/profile',      color:'#10b981', icon:<Brain size={16} />,     desc:'Add skills & experience' },
          ].map((a,i) => (
            <Link key={i} to={a.to} style={{ ...S.actionRow, borderColor: a.color + '25' }}>
              <div style={{ ...S.actionIcon, background: a.color + '15', color: a.color }}>{a.icon}</div>
              <div>
                <div style={S.actionLabel}>{a.label}</div>
                <div style={S.actionDesc}>{a.desc}</div>
              </div>
              <ArrowRight size={14} color={a.color} style={{ marginLeft:'auto' }} />
            </Link>
          ))}
        </div>

        {/* Interview history */}
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={S.cardTitle}>AI Interview History</p>
            <Link to="/candidate/interview" style={S.seeAll}>+ New <ArrowRight size={12} /></Link>
          </div>
          {loading
            ? Array(3).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:60, borderRadius:8, marginBottom:8 }} />)
            : interviews.length === 0
            ? (
              <div style={S.empty}>
                <Video size={32} color="#1e293b" />
                <p style={{ color:'#475569', fontSize:13, marginTop:8 }}>No interviews yet</p>
                <Link to="/candidate/interview" style={{ color:'#8b5cf6', fontSize:13, marginTop:6, textDecoration:'none' }}>Start your first mock interview →</Link>
              </div>
            )
            : interviews.map(iv => (
              <div key={iv._id} style={S.interviewRow}>
                <div style={{ ...S.ivDot, background: iv.status === 'evaluated' ? '#10b981' : iv.status === 'completed' ? '#f59e0b' : '#3b82f6' }} />
                <div style={{ flex:1 }}>
                  <div style={S.ivRole}>{iv.jobRole}</div>
                  <div style={S.ivDate}>{new Date(iv.createdAt).toLocaleDateString()}</div>
                </div>
                {iv.evaluation?.overallScore != null && (
                  <div style={{ ...S.ivScore, color: iv.evaluation.overallScore >= 80 ? '#10b981' : '#f59e0b' }}>
                    {iv.evaluation.overallScore}/100
                  </div>
                )}
                <span style={{ ...S.ivStatus, background: iv.status === 'evaluated' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: iv.status === 'evaluated' ? '#10b981' : '#f59e0b' }}>
                  {iv.status}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* AI score banner */}
      {stats?.avgAIScore > 0 && (
        <div style={S.scoreBanner}>
          <Award size={24} color="#f59e0b" />
          <div>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#f1f5f9' }}>Your Average AI Resume Score: {stats.avgAIScore}/100</p>
            <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Complete more applications to improve your score ranking</p>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:        { display:'flex', flexDirection:'column', gap:24, maxWidth:1100 },
  banner:      { background:'linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(99,102,241,0.08) 100%)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:16, padding:32, position:'relative', overflow:'hidden' },
  bannerGlow:  { position:'absolute', top:-40, right:-40, width:200, height:200, background:'radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)', pointerEvents:'none' },
  bannerBadge: { display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:'#60a5fa', background:'rgba(59,130,246,0.1)', padding:'4px 10px', borderRadius:20, marginBottom:12 },
  bannerTitle: { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#f1f5f9', marginBottom:8 },
  bannerSub:   { fontSize:14, color:'#64748b', marginBottom:20 },
  bannerBtns:  { display:'flex', gap:12 },
  bannerBtn:   { display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', padding:'10px 20px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 },
  bannerOutline:{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', color:'#a78bfa', padding:'10px 20px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 },
  statsGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statCard:    { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:18, display:'flex', flexDirection:'column', gap:8 },
  statIcon:    { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  statVal:     { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#f1f5f9' },
  statLabel:   { fontSize:12, color:'#64748b', fontWeight:500 },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  card:        { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
  cardTitle:   { fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:600, color:'#f1f5f9', marginBottom:14 },
  actionRow:   { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid', borderRadius:10, textDecoration:'none', marginBottom:8, transition:'background 0.15s' },
  actionIcon:  { width:36, height:36, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  actionLabel: { fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom:2 },
  actionDesc:  { fontSize:12, color:'#475569' },
  seeAll:      { display:'flex', alignItems:'center', gap:4, color:'#8b5cf6', textDecoration:'none', fontSize:12, fontWeight:500 },
  empty:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px' },
  interviewRow:{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  ivDot:       { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  ivRole:      { fontSize:13, fontWeight:600, color:'#f1f5f9', marginBottom:2 },
  ivDate:      { fontSize:11, color:'#475569' },
  ivScore:     { fontSize:15, fontWeight:700, fontFamily:'Syne,sans-serif' },
  ivStatus:    { fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10 },
  scoreBanner: { display:'flex', alignItems:'center', gap:16, padding:'20px 24px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:12 },
};
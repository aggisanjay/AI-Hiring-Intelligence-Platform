import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Star, Brain, MapPin, TrendingUp } from 'lucide-react';
import { candidatesAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Applied:     { color:'#3b82f6', bg:'rgba(59,130,246,0.1)',  icon:<Clock size={12} /> },
  Shortlisted: { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  icon:<Star size={12} /> },
  Interview:   { color:'#8b5cf6', bg:'rgba(139,92,246,0.1)',  icon:<TrendingUp size={12} /> },
  Offer:       { color:'#10b981', bg:'rgba(16,185,129,0.1)',  icon:<CheckCircle size={12} /> },
  Rejected:    { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   icon:<XCircle size={12} /> },
};

export default function ApplicationsPage() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [expanded,setExpanded]= useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await candidatesAPI.getMyApplications();
        setApps(res.data.applications);
      } catch { toast.error('Failed to load applications'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  const counts   = Object.keys(STATUS_CONFIG).reduce((acc, s) => { acc[s] = apps.filter(a => a.status === s).length; return acc; }, {});

  return (
    <div style={S.page} className="fade-in">
      <div style={S.header}>
        <h1 style={S.title}>My Applications</h1>
        <p style={S.sub}>{apps.length} total applications</p>
      </div>

      {/* Filter tabs */}
      <div style={S.filters}>
        <button onClick={() => setFilter('all')} style={{ ...S.filterBtn, ...(filter === 'all' ? S.filterActive : {}) }}>
          All ({apps.length})
        </button>
        {Object.keys(STATUS_CONFIG).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ ...S.filterBtn, ...(filter === s ? { ...S.filterActive, color: STATUS_CONFIG[s].color, borderColor: STATUS_CONFIG[s].color, background: STATUS_CONFIG[s].bg } : {}) }}>
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* List */}
      <div style={S.list}>
        {loading
          ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:100, borderRadius:12 }} />)
          : filtered.length === 0
          ? (
            <div style={S.empty}>
              <FileText size={48} color="#1e293b" />
              <p style={{ color:'#475569', marginTop:12 }}>{filter === 'all' ? 'No applications yet. Browse jobs to get started!' : `No ${filter} applications`}</p>
            </div>
          )
          : filtered.map(app => {
            const job  = app.jobId;
            const cfg  = STATUS_CONFIG[app.status] || STATUS_CONFIG.Applied;
            const ai   = app.aiAnalysis;
            const isExp= expanded === app._id;
            return (
              <div key={app._id} style={S.appCard} onClick={() => setExpanded(isExp ? null : app._id)}>
                <div style={S.appTop}>
                  <div style={S.appIcon}>{job?.title?.[0] || '?'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={S.appTitle}>{job?.title || 'Job'}</div>
                    <div style={S.appMeta}>
                      {job?.organization && <span>{job.organization}</span>}
                      {job?.location && <span style={S.metaDot}><MapPin size={11} /> {job.location}</span>}
                      <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...S.statusBadge, background: cfg.bg, color: cfg.color }}>
                      {cfg.icon} {app.status}
                    </div>
                    {app.matchScore > 0 && (
                      <div style={S.matchScore}>Match: {app.matchScore}%</div>
                    )}
                  </div>
                </div>

                {/* AI analysis - shown when expanded */}
                {isExp && ai?.status === 'done' && (
                  <div style={S.aiSection} onClick={e => e.stopPropagation()}>
                    <div style={S.aiHead}><Brain size={14} color="#3b82f6" /> AI Resume Analysis</div>
                    <div style={S.aiScoreRow}>
                      <div style={S.aiScoreBox}>
                        <span style={{ ...S.aiScore, color: ai.score >= 80 ? '#10b981' : ai.score >= 60 ? '#f59e0b' : '#ef4444' }}>{ai.score}</span>
                        <span style={S.aiScoreLabel}>AI Score</span>
                      </div>
                      <p style={{ fontSize:13, color:'#94a3b8', flex:1, lineHeight:1.6 }}>{ai.summary}</p>
                    </div>
                    {ai.strengths?.length > 0 && (
                      <div style={{ marginTop:12 }}>
                        <p style={{ fontSize:12, color:'#10b981', fontWeight:600, marginBottom:6 }}>✓ Strengths</p>
                        {ai.strengths.map((s,i) => <div key={i} style={{ fontSize:12, color:'#64748b', padding:'3px 0' }}>{s}</div>)}
                      </div>
                    )}
                    {ai.missingSkills?.length > 0 && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:12, color:'#ef4444', fontWeight:600, marginBottom:6 }}>✗ Missing Skills</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {ai.missingSkills.map((s,i) => (
                            <span key={i} style={{ fontSize:11, padding:'2px 8px', background:'rgba(239,68,68,0.1)', color:'#fc8181', borderRadius:6 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isExp && ai?.status === 'pending' && (
                  <div style={{ ...S.aiSection, display:'flex', alignItems:'center', gap:10 }} onClick={e => e.stopPropagation()}>
                    <div style={{ width:20, height:20, border:'2px solid rgba(59,130,246,0.3)', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize:13, color:'#64748b' }}>AI analysis in progress...</span>
                  </div>
                )}

                {isExp && !ai?.score && ai?.status !== 'pending' && (
                  <div style={{ ...S.aiSection, color:'#475569', fontSize:13 }} onClick={e => e.stopPropagation()}>
                    No resume uploaded for AI analysis. Upload a resume when applying.
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

const S = {
  page:       { display:'flex', flexDirection:'column', gap:20, maxWidth:900 },
  header:     { },
  title:      { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:        { color:'#64748b', fontSize:14 },
  filters:    { display:'flex', gap:8, flexWrap:'wrap' },
  filterBtn:  { padding:'7px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' },
  filterActive:{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', color:'#3b82f6' },
  list:       { display:'flex', flexDirection:'column', gap:12 },
  appCard:    { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:18, cursor:'pointer', transition:'border-color 0.15s' },
  appTop:     { display:'flex', alignItems:'center', gap:14 },
  appIcon:    { width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 },
  appTitle:   { fontSize:15, fontWeight:600, color:'#f1f5f9', marginBottom:4 },
  appMeta:    { display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'#64748b' },
  metaDot:    { display:'flex', alignItems:'center', gap:3 },
  statusBadge:{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20, marginBottom:4 },
  matchScore: { fontSize:12, color:'#64748b', textAlign:'right' },
  aiSection:  { marginTop:16, padding:16, background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:10 },
  aiHead:     { display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#f1f5f9', marginBottom:12 },
  aiScoreRow: { display:'flex', gap:16, alignItems:'center' },
  aiScoreBox: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'rgba(255,255,255,0.05)', padding:'12px 16px', borderRadius:10, flexShrink:0 },
  aiScore:    { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800 },
  aiScoreLabel:{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' },
  empty:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', background:'#111827', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)' },
};
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, MapPin, Star, Brain, CheckCircle,
  XCircle, ChevronRight, Clock, Award, TrendingUp,
  AlertTriangle, Loader, MessageSquare, X
} from 'lucide-react';
import { jobsAPI, candidatesAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

const STAGES  = ['Applied','Shortlisted','Interview','Offer','Rejected'];
const COLORS   = { Applied:'#3b82f6', Shortlisted:'#f59e0b', Interview:'#8b5cf6', Offer:'#10b981', Rejected:'#ef4444' };
const NEXT_STATUS = { Applied:'Shortlisted', Shortlisted:'Interview', Interview:'Offer' };

export default function PipelinePage() {
  const { jobId } = useParams();
  const [job,     setJob]     = useState(null);
  const [pipeline,setPipeline]= useState({});
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null); // app detail
  const [updating,setUpdating]= useState(null);

  const load = async () => {
    try {
      const res = await jobsAPI.getPipeline(jobId);
      setJob(res.data.job);
      setPipeline(res.data.pipeline);
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [jobId]);

  const updateStatus = async (appId, status) => {
    setUpdating(appId);
    try {
      await candidatesAPI.updateStatus(appId, { status });
      toast.success(`Moved to ${status}`);
      setSelected(null);
      load();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const ScoreBar = ({ score }) => (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'#64748b' }}>AI Score</span>
        <span style={{ fontSize:12, fontWeight:700, color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>{score}</span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4 }}>
        <div style={{ height:'100%', width:`${score}%`, borderRadius:4, background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444', transition:'width 0.5s' }} />
      </div>
    </div>
  );

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <Link to="/recruiter/jobs" style={styles.back}><ArrowLeft size={16} /> Back to Jobs</Link>
        {job && (
          <div style={{ marginTop:12 }}>
            <h1 style={styles.title}>{job.title}</h1>
            <p style={styles.sub}>{job.department} · {job.location} · {job.type}</p>
          </div>
        )}
      </div>

      {/* Stage summary */}
      {!loading && (
        <div style={styles.stageSummary}>
          {STAGES.map(s => (
            <div key={s} style={styles.stageSum}>
              <div style={{ ...styles.stageDot, background: COLORS[s] }} />
              <span style={styles.stageSumLabel}>{s}</span>
              <span style={styles.stageSumCount}>{pipeline[s]?.length || 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div style={styles.board}>
        {STAGES.map(stage => (
          <div key={stage} style={styles.column}>
            <div style={styles.colHead}>
              <div style={{ ...styles.colDot, background: COLORS[stage] }} />
              <span style={styles.colTitle}>{stage}</span>
              <span style={styles.colCount}>{pipeline[stage]?.length || 0}</span>
            </div>

            <div style={styles.cards}>
              {loading
                ? Array(2).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:120, borderRadius:10 }} />)
                : (pipeline[stage] || []).map(app => {
                  const c = app.candidateId;
                  const ai = app.aiAnalysis;
                  return (
                    <div key={app._id} style={styles.kanbanCard} onClick={() => setSelected(app)}>
                      <div style={styles.cardTop}>
                        <div style={styles.cardAvatar}>{c?.name?.[0]?.toUpperCase() || '?'}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={styles.cardName}>{c?.name || 'Unknown'}</div>
                          <div style={styles.cardRole}>{c?.title || 'Candidate'}</div>
                        </div>
                        {app.matchScore >= 85 && (
                          <span style={styles.bestFit}>Best Fit</span>
                        )}
                      </div>
                      {c?.location && (
                        <div style={styles.cardLoc}><MapPin size={10} /> {c.location}</div>
                      )}
                      {ai?.score != null && <ScoreBar score={ai.score} />}
                      <div style={styles.cardMatch}>
                        <span style={styles.matchLabel}>Match</span>
                        <span style={{ ...styles.matchVal, color: app.matchScore >= 80 ? '#10b981' : app.matchScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                          {app.matchScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              {!loading && (pipeline[stage] || []).length === 0 && (
                <div style={styles.emptyCol}>No candidates</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.panel} onClick={e => e.stopPropagation()}>
            <div style={styles.panelHead}>
              <h2 style={styles.panelTitle}>Candidate Detail</h2>
              <button onClick={() => setSelected(null)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ padding:24, overflowY:'auto', flex:1 }}>
              {/* Candidate info */}
              <div style={styles.candHeader}>
                <div style={{ ...styles.cardAvatar, width:52, height:52, fontSize:20 }}>
                  {selected.candidateId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{selected.candidateId?.name}</h3>
                  <p style={{ fontSize:13, color:'#64748b' }}>{selected.candidateId?.title}</p>
                  <p style={{ fontSize:12, color:'#475569', marginTop:4 }}>{selected.candidateId?.email}</p>
                </div>
              </div>

              {/* Stats row */}
              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <span style={styles.statBoxVal}>{selected.matchScore}%</span>
                  <span style={styles.statBoxLabel}>Match Score</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statBoxVal}>{selected.aiAnalysis?.score ?? '—'}</span>
                  <span style={styles.statBoxLabel}>AI Score</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statBoxVal}>{selected.candidateId?.experience || 0}y</span>
                  <span style={styles.statBoxLabel}>Experience</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ ...styles.statBoxVal, color: COLORS[selected.status] }}>{selected.status}</span>
                  <span style={styles.statBoxLabel}>Current Stage</span>
                </div>
              </div>

              {/* AI Analysis */}
              {selected.aiAnalysis?.score != null && (
                <div style={styles.aiSection}>
                  <div style={styles.sectionTitle}><Brain size={14} color="#3b82f6" /> AI Analysis</div>
                  <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6, marginBottom:12 }}>{selected.aiAnalysis.summary}</p>
                  {selected.aiAnalysis.strengths?.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <p style={{ fontSize:12, color:'#10b981', fontWeight:600, marginBottom:6 }}>✓ Strengths</p>
                      {selected.aiAnalysis.strengths.map((s, i) => (
                        <div key={i} style={styles.strengthItem}>{s}</div>
                      ))}
                    </div>
                  )}
                  {selected.aiAnalysis.missingSkills?.length > 0 && (
                    <div>
                      <p style={{ fontSize:12, color:'#ef4444', fontWeight:600, marginBottom:6 }}>✗ Missing Skills</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {selected.aiAnalysis.missingSkills.map((s, i) => (
                          <span key={i} style={styles.missingSkill}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Skills */}
              {selected.candidateId?.skills?.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={styles.sectionTitle}>Skills</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {selected.candidateId.skills.map(s => (
                      <span key={s} style={styles.skillChip}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover letter */}
              {selected.coverLetter && (
                <div style={{ marginBottom:20 }}>
                  <div style={styles.sectionTitle}>Cover Letter</div>
                  <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7 }}>{selected.coverLetter}</p>
                </div>
              )}

              {/* Actions */}
              <div style={styles.panelActions}>
                {NEXT_STATUS[selected.status] && (
                  <button
                    onClick={() => updateStatus(selected._id, NEXT_STATUS[selected.status])}
                    disabled={updating === selected._id}
                    style={{ ...styles.actionPrimary, background:`linear-gradient(135deg,${COLORS[NEXT_STATUS[selected.status]]},${COLORS[NEXT_STATUS[selected.status]]}aa)` }}
                  >
                    {updating === selected._id ? <Loader size={14} /> : <><ChevronRight size={14} /> Move to {NEXT_STATUS[selected.status]}</>}
                  </button>
                )}
                {selected.status !== 'Rejected' && (
                  <button
                    onClick={() => updateStatus(selected._id, 'Rejected')}
                    disabled={updating === selected._id}
                    style={styles.actionDanger}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page:        { display:'flex', flexDirection:'column', gap:20 },
  header:      { },
  back:        { display:'inline-flex', alignItems:'center', gap:6, color:'#64748b', textDecoration:'none', fontSize:13, marginBottom:8 },
  title:       { fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:         { color:'#64748b', fontSize:13 },
  stageSummary:{ display:'flex', gap:16, flexWrap:'wrap' },
  stageSum:    { display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20 },
  stageDot:    { width:8, height:8, borderRadius:'50%' },
  stageSumLabel:{ fontSize:12, color:'#64748b' },
  stageSumCount:{ fontSize:12, fontWeight:700, color:'#f1f5f9' },
  board:       { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, overflowX:'auto' },
  column:      { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:12, minWidth:180 },
  colHead:     { display:'flex', alignItems:'center', gap:8, marginBottom:12 },
  colDot:      { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  colTitle:    { fontSize:13, fontWeight:600, color:'#94a3b8', flex:1 },
  colCount:    { fontSize:12, fontWeight:700, color:'#f1f5f9', background:'rgba(255,255,255,0.08)', padding:'1px 7px', borderRadius:10 },
  cards:       { display:'flex', flexDirection:'column', gap:8 },
  kanbanCard:  { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:12, cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', gap:8 },
  cardTop:     { display:'flex', alignItems:'center', gap:8 },
  cardAvatar:  { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 },
  cardName:    { fontSize:13, fontWeight:600, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  cardRole:    { fontSize:11, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  bestFit:     { fontSize:9, fontWeight:700, background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'2px 6px', borderRadius:4, letterSpacing:'0.5px', flexShrink:0 },
  cardLoc:     { display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#475569' },
  cardMatch:   { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.05)' },
  matchLabel:  { fontSize:11, color:'#475569' },
  matchVal:    { fontSize:13, fontWeight:700 },
  emptyCol:    { fontSize:12, color:'#334155', textAlign:'center', padding:'20px 0' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:       { width:460, background:'#111827', borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', maxHeight:'100vh' },
  panelHead:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 },
  panelTitle:  { fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'#f1f5f9' },
  closeBtn:    { background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', cursor:'pointer' },
  candHeader:  { display:'flex', alignItems:'center', gap:16, marginBottom:20, paddingBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 },
  statBox:     { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 8px', textAlign:'center' },
  statBoxVal:  { display:'block', fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'#f1f5f9', marginBottom:2 },
  statBoxLabel:{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' },
  aiSection:   { background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:16, marginBottom:20 },
  sectionTitle:{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#f1f5f9', marginBottom:10 },
  strengthItem:{ fontSize:12, color:'#94a3b8', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  missingSkill:{ fontSize:11, padding:'3px 8px', background:'rgba(239,68,68,0.1)', color:'#fc8181', borderRadius:6 },
  skillChip:   { fontSize:11, padding:'3px 8px', background:'rgba(59,130,246,0.1)', color:'#60a5fa', borderRadius:6 },
  panelActions:{ display:'flex', gap:10, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)', marginTop:8 },
  actionPrimary:{ flex:1, border:'none', borderRadius:8, color:'#fff', padding:'11px 16px', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 },
  actionDanger:{ padding:'11px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:6 },
};
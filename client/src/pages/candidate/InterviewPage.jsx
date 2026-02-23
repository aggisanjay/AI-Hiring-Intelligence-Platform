import { useState, useRef, useEffect } from 'react';
import { Video, Send, Brain, CheckCircle, RefreshCw, Award, TrendingUp, MessageSquare, Loader, ChevronRight } from 'lucide-react';
import { interviewsAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

const JOB_ROLES = [
  'Senior React Developer', 'Full-Stack Engineer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer',
  'Data Scientist', 'Backend Developer', 'Mobile Developer', 'QA Engineer'
];

export default function InterviewPage() {
  const [phase,     setPhase]     = useState('setup');   // setup | active | complete | result
  const [jobRole,   setJobRole]   = useState('');
  const [interviewId,setInterviewId] = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [answer,    setAnswer]    = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnsLeft, setTurnsLeft] = useState(8);
  const [result,    setResult]    = useState(null);
  const [polling,   setPolling]   = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, isLoading]);

  const startInterview = async () => {
    if (!jobRole.trim()) { toast.error('Select a job role'); return; }
    setIsLoading(true);
    try {
      const res = await interviewsAPI.start({ jobRole });
      setInterviewId(res.data.interviewId);
      setMessages([{ role:'assistant', content: res.data.question }]);
      setPhase('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview. Check API key.');
    } finally { setIsLoading(false); }
  };

  const sendAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    const userMsg = answer.trim();
    setAnswer('');
    setMessages(m => [...m, { role:'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const res = await interviewsAPI.sendMsg(interviewId, { answer: userMsg });
      setTurnsLeft(res.data.turnsLeft || 0);
      if (res.data.nextQuestion) {
        setMessages(m => [...m, { role:'assistant', content: res.data.nextQuestion }]);
      }
      if (res.data.isComplete) {
        setPhase('complete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed');
      setMessages(m => m.slice(0, -1));
    } finally { setIsLoading(false); }
  };

  const submitForEval = async () => {
    setIsLoading(true);
    try {
      await interviewsAPI.complete(interviewId);
      setPhase('evaluating');
      pollForResult();
    } catch (err) {
      toast.error('Failed to submit interview');
    } finally { setIsLoading(false); }
  };

  const pollForResult = async () => {
    setPolling(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await interviewsAPI.getResult(interviewId);
        if (res.data.interview.status === 'evaluated') {
          clearInterval(interval);
          setResult(res.data.interview.evaluation);
          setPolling(false);
          setPhase('result');
        }
      } catch {}
      if (attempts >= 20) { clearInterval(interval); setPolling(false); toast.error('Evaluation timed out'); }
    }, 3000);
  };

  const reset = () => {
    setPhase('setup'); setMessages([]); setInterviewId(null);
    setAnswer(''); setTurnsLeft(8); setResult(null); setJobRole('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
  };

  const ScoreRing = ({ score, label, color }) => (
    <div style={{ textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:`conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', position:'relative' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'#111827', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize:12, color:'#64748b' }}>{label}</span>
    </div>
  );

  return (
    <div style={S.page} className="fade-in">
      {/* Setup phase */}
      {phase === 'setup' && (
        <div style={S.setup}>
          <div style={S.setupIcon}><Brain size={32} color="#8b5cf6" /></div>
          <h1 style={S.setupTitle}>AI Mock Interview</h1>
          <p style={S.setupSub}>Practice with an AI interviewer that asks role-specific questions and evaluates your answers in real-time.</p>

          <div style={S.roleSection}>
            <label style={S.label}>Select Job Role</label>
            <div style={S.roleGrid}>
              {JOB_ROLES.map(r => (
                <button key={r} onClick={() => setJobRole(r)}
                  style={{ ...S.roleBtn, ...(jobRole === r ? S.roleBtnActive : {}) }}>
                  {r}
                </button>
              ))}
            </div>
            <input value={jobRole} onChange={e => setJobRole(e.target.value)}
              placeholder="Or type a custom role..." style={S.roleInput} />
          </div>

          <div style={S.featureList}>
            {['8 role-specific questions', 'Follow-up questioning', 'Real-time AI evaluation', 'Detailed feedback report'].map(f => (
              <div key={f} style={S.feature}><CheckCircle size={14} color="#10b981" /> {f}</div>
            ))}
          </div>

          <button onClick={startInterview} disabled={!jobRole || isLoading} style={S.startBtn}>
            {isLoading ? <Loader size={18} style={{ animation:'spin 0.7s linear infinite' }} /> : <><Video size={18} /> Start Interview</>}
          </button>
        </div>
      )}

      {/* Active interview */}
      {(phase === 'active' || phase === 'complete') && (
        <div style={S.chatWrap}>
          <div style={S.chatHeader}>
            <div style={S.chatTitle}><Brain size={18} color="#8b5cf6" /> AI Interview — {jobRole}</div>
            <div style={S.turnsLeft}>
              {turnsLeft > 0 ? `${turnsLeft} questions remaining` : 'Interview complete'}
            </div>
          </div>

          <div style={S.chat}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...S.bubble, ...(m.role === 'user' ? S.userBubble : S.aiBubble) }}>
                {m.role === 'assistant' && (
                  <div style={S.aiAvatar}><Brain size={14} color="#8b5cf6" /></div>
                )}
                <div style={{ ...S.bubbleText, ...(m.role === 'user' ? S.userText : S.aiText) }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ ...S.bubble, ...S.aiBubble }}>
                <div style={S.aiAvatar}><Brain size={14} color="#8b5cf6" /></div>
                <div style={S.typing}>
                  <div style={S.dot} /><div style={{ ...S.dot, animationDelay:'0.2s' }} /><div style={{ ...S.dot, animationDelay:'0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {phase === 'active' && !isLoading && (
            <div style={S.inputRow}>
              <textarea
                value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={handleKey}
                placeholder="Type your answer... (Enter to send)"
                style={S.answerInput} rows={3}
              />
              <button onClick={sendAnswer} disabled={!answer.trim()} style={S.sendBtn}>
                <Send size={18} />
              </button>
            </div>
          )}

          {phase === 'complete' && (
            <div style={S.completeBar}>
              <span style={{ color:'#f1f5f9', fontSize:14, fontWeight:600 }}>Interview complete! Submit for AI evaluation.</span>
              <button onClick={submitForEval} disabled={isLoading} style={S.evalBtn}>
                <Award size={15} /> Get Evaluation <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Evaluating */}
      {phase === 'evaluating' && (
        <div style={S.evaluating}>
          <div style={S.evalLoader} />
          <h2 style={{ fontFamily:'Syne,sans-serif', color:'#f1f5f9', fontSize:22, marginTop:20, marginBottom:8 }}>Evaluating your interview...</h2>
          <p style={{ color:'#64748b', fontSize:14 }}>AI is analyzing your answers. This takes 20-40 seconds.</p>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && result && (
        <div style={S.result}>
          <div style={S.resultHead}>
            <Award size={28} color="#f59e0b" />
            <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Interview Results</h1>
            <p style={{ color:'#64748b', fontSize:14 }}>AI evaluation for: {jobRole}</p>
          </div>

          <div style={S.scores}>
            <ScoreRing score={result.communicationScore} label="Communication" color="#3b82f6" />
            <ScoreRing score={result.technicalScore}     label="Technical"     color="#8b5cf6" />
            <ScoreRing score={result.overallScore}       label="Overall"       color="#10b981" />
          </div>

          <div style={{ ...S.recommendation, background: result.recommendation === 'Hire' ? 'rgba(16,185,129,0.1)' : result.recommendation === 'Consider' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', borderColor: result.recommendation === 'Hire' ? 'rgba(16,185,129,0.25)' : result.recommendation === 'Consider' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)', color: result.recommendation === 'Hire' ? '#10b981' : result.recommendation === 'Consider' ? '#f59e0b' : '#ef4444' }}>
            Recommendation: <strong>{result.recommendation}</strong>
          </div>

          <div style={S.feedback}>
            <h3 style={S.feedHead}>Feedback Summary</h3>
            <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.7 }}>{result.feedbackSummary}</p>
          </div>

          {result.strengths?.length > 0 && (
            <div style={S.feedback}>
              <h3 style={{ ...S.feedHead, color:'#10b981' }}>✓ Strengths</h3>
              {result.strengths.map((s,i) => <div key={i} style={S.feedItem}>{s}</div>)}
            </div>
          )}

          {result.improvements?.length > 0 && (
            <div style={S.feedback}>
              <h3 style={{ ...S.feedHead, color:'#f59e0b' }}>↑ Areas to Improve</h3>
              {result.improvements.map((s,i) => <div key={i} style={S.feedItem}>{s}</div>)}
            </div>
          )}

          <button onClick={reset} style={S.restartBtn}><RefreshCw size={15} /> Practice Again</button>
        </div>
      )}
    </div>
  );
}

const S = {
  page:        { display:'flex', justifyContent:'center', maxWidth:780, margin:'0 auto', width:'100%' },
  setup:       { width:'100%', background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:40, display:'flex', flexDirection:'column', alignItems:'center', gap:20, textAlign:'center' },
  setupIcon:   { width:72, height:72, borderRadius:20, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' },
  setupTitle:  { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#f1f5f9' },
  setupSub:    { fontSize:14, color:'#64748b', maxWidth:500, lineHeight:1.7 },
  roleSection: { width:'100%', textAlign:'left' },
  label:       { display:'block', fontSize:13, fontWeight:500, color:'#94a3b8', marginBottom:10 },
  roleGrid:    { display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 },
  roleBtn:     { padding:'7px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' },
  roleBtnActive:{ background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.4)', color:'#a78bfa' },
  roleInput:   { width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', marginTop:4 },
  featureList: { display:'flex', flexWrap:'wrap', justifyContent:'center', gap:12 },
  feature:     { display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b' },
  startBtn:    { display:'flex', alignItems:'center', gap:10, background:'linear-gradient(135deg,#8b5cf6,#6366f1)', border:'none', color:'#fff', padding:'14px 32px', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 0 24px rgba(139,92,246,0.3)' },
  chatWrap:    { width:'100%', display:'flex', flexDirection:'column', height:'calc(100vh - 140px)' },
  chatHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px 12px 0 0', flexShrink:0 },
  chatTitle:   { display:'flex', alignItems:'center', gap:8, fontFamily:'Syne,sans-serif', fontWeight:600, color:'#f1f5f9', fontSize:15 },
  turnsLeft:   { fontSize:12, color:'#64748b', background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:20 },
  chat:        { flex:1, overflowY:'auto', padding:'20px 16px', background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.05)', borderTop:'none', display:'flex', flexDirection:'column', gap:16 },
  bubble:      { display:'flex', gap:10, maxWidth:'85%' },
  aiBubble:    { alignSelf:'flex-start' },
  userBubble:  { alignSelf:'flex-end', flexDirection:'row-reverse' },
  aiAvatar:    { width:30, height:30, borderRadius:8, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 },
  bubbleText:  { padding:'12px 16px', borderRadius:12, fontSize:14, lineHeight:1.6 },
  aiText:      { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', color:'#e2e8f0' },
  userText:    { background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.2))', border:'1px solid rgba(139,92,246,0.2)', color:'#e2e8f0' },
  typing:      { display:'flex', gap:4, padding:'14px 16px', background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, alignItems:'center' },
  dot:         { width:7, height:7, borderRadius:'50%', background:'#475569', animation:'bounce 1.4s infinite ease-in-out' },
  inputRow:    { display:'flex', gap:10, padding:'12px', background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderTop:'none', borderRadius:'0 0 12px 12px' },
  answerInput: { flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', resize:'none' },
  sendBtn:     { width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#8b5cf6,#6366f1)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', alignSelf:'flex-end', boxShadow:'0 0 16px rgba(139,92,246,0.3)' },
  completeBar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderTop:'none', borderRadius:'0 0 12px 12px' },
  evalBtn:     { display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#10b981,#059669)', border:'none', color:'#fff', padding:'10px 20px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' },
  evaluating:  { width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', textAlign:'center' },
  evalLoader:  { width:56, height:56, border:'3px solid rgba(139,92,246,0.2)', borderTopColor:'#8b5cf6', borderRadius:'50%', animation:'spin 1s linear infinite' },
  result:      { width:'100%', display:'flex', flexDirection:'column', gap:20 },
  resultHead:  { display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center', padding:'24px 0' },
  scores:      { display:'flex', justifyContent:'center', gap:40, padding:'24px', background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 },
  recommendation: { padding:'12px 20px', borderRadius:10, border:'1px solid', fontSize:14, textAlign:'center' },
  feedback:    { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
  feedHead:    { fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:600, color:'#f1f5f9', marginBottom:10 },
  feedItem:    { fontSize:13, color:'#94a3b8', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  restartBtn:  { display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#94a3b8', padding:'12px 24px', fontSize:14, cursor:'pointer', fontFamily:'DM Sans,sans-serif', alignSelf:'center' },
};
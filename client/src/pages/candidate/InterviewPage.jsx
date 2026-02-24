

import { useState, useRef, useEffect } from 'react';
import { Video, Send, Brain, CheckCircle, RefreshCw, Award, Loader, ChevronRight, AlertCircle } from 'lucide-react';
import { interviewsAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

const JOB_ROLES = [
  'Senior React Developer', 'Full-Stack Engineer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer',
  'Data Scientist', 'Backend Developer', 'Mobile Developer', 'QA Engineer',
];

export default function InterviewPage() {
  const [phase,       setPhase]       = useState('setup');
  const [jobRole,     setJobRole]     = useState('');
  const [interviewId, setInterviewId] = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [answer,      setAnswer]      = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [turnsLeft,   setTurnsLeft]   = useState(8);
  const [result,      setResult]      = useState(null);
  const [evalError,   setEvalError]   = useState(null);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const startInterview = async () => {
    if (!jobRole.trim()) { toast.error('Select a job role'); return; }
    setIsLoading(true);
    try {
      const res = await interviewsAPI.start({ jobRole });
      setInterviewId(res.data.interviewId);
      setMessages([{ role: 'assistant', content: res.data.question }]);
      setPhase('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start. Check your Gemini API key.');
    } finally { setIsLoading(false); }
  };

  const sendAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    const userMsg = answer.trim();
    setAnswer('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const res = await interviewsAPI.sendMsg(interviewId, { answer: userMsg });
      setTurnsLeft(res.data.turnsLeft ?? 0);
      if (res.data.nextQuestion) setMessages(m => [...m, { role: 'assistant', content: res.data.nextQuestion }]);
      if (res.data.isComplete)   setPhase('complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed', { duration: 5000 });
      setMessages(m => m.slice(0, -1));
      setAnswer(userMsg);
    } finally { setIsLoading(false); }
  };

  // Called when "Get Evaluation" button is clicked, and when retrying
  const submitForEval = async (isRetry = false) => {
    setIsLoading(true);
    setEvalError(null);
    setPhase('evaluating');
    try {
      const res = isRetry
        ? await interviewsAPI.retry(interviewId)
        : await interviewsAPI.complete(interviewId);

      if (res.data.evaluated && res.data.evaluation) {
        // Got evaluation directly in response — show result immediately
        setResult(res.data.evaluation);
        setPhase('result');
      } else {
        // Evaluation failed on server side
        const errMsg = res.data.evalError || 'Evaluation failed. Please retry.';
        setEvalError(errMsg);
        setPhase('complete');
        toast.error(errMsg, { duration: 6000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Evaluation request failed';
      setEvalError(msg);
      setPhase('complete');
      toast.error(msg, { duration: 6000 });
    } finally { setIsLoading(false); }
  };

  const reset = () => {
    setPhase('setup'); setMessages([]); setInterviewId(null);
    setAnswer(''); setTurnsLeft(8); setResult(null);
    setJobRole(''); setEvalError(null);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
  };

  const ScoreRing = ({ score, label, color }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
        <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
    </div>
  );

  return (
    <div style={S.page} className="fade-in">

      {/* ── SETUP ── */}
      {phase === 'setup' && (
        <div style={S.setup}>
          <div style={S.setupIcon}><Brain size={34} color="#8b5cf6" /></div>
          <h1 style={S.setupTitle}>AI Mock Interview</h1>
          <p style={S.setupSub}>Practice with an AI interviewer. Get role-specific questions and a full evaluation report.</p>
          <div style={S.roleSection}>
            <label style={S.label}>Select Job Role</label>
            <div style={S.roleGrid}>
              {JOB_ROLES.map(r => (
                <button key={r} onClick={() => setJobRole(r)}
                  style={{ ...S.roleBtn, ...(jobRole === r ? S.roleBtnActive : {}) }}>{r}</button>
              ))}
            </div>
            <input value={jobRole} onChange={e => setJobRole(e.target.value)}
              placeholder="Or type a custom role..." style={S.roleInput} />
          </div>
          <div style={S.features}>
            {['8 role-specific questions', 'AI follow-up questions', 'Instant evaluation report', 'Hire / Consider / Reject verdict'].map(f => (
              <span key={f} style={S.feature}><CheckCircle size={13} color="#10b981" /> {f}</span>
            ))}
          </div>
          <button onClick={startInterview} disabled={!jobRole || isLoading}
            style={{ ...S.startBtn, opacity: (!jobRole || isLoading) ? 0.6 : 1 }}>
            {isLoading ? <><Loader size={18} style={S.spin} /> Starting...</> : <><Video size={18} /> Start Interview</>}
          </button>
        </div>
      )}

      {/* ── CHAT ── */}
      {(phase === 'active' || phase === 'complete') && (
        <div style={S.chatWrap}>
          <div style={S.chatHeader}>
            <div style={S.chatTitle}><Brain size={17} color="#8b5cf6" /> {jobRole}</div>
            <div style={S.turnsChip}>{phase === 'complete' ? '✓ All questions answered' : `${turnsLeft} questions left`}</div>
          </div>

          <div style={S.chat}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {m.role === 'assistant' && <div style={S.aiAvatar}><Brain size={14} color="#8b5cf6" /></div>}
                <div style={{ ...S.bubble, ...(m.role === 'user' ? S.userBubble : S.aiBubble) }}>{m.content}</div>
              </div>
            ))}
            {isLoading && phase === 'active' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={S.aiAvatar}><Brain size={14} color="#8b5cf6" /></div>
                <div style={{ ...S.bubble, ...S.aiBubble }}>
                  <div style={S.typing}><div style={S.dot} /><div style={{ ...S.dot, animationDelay: '.2s' }} /><div style={{ ...S.dot, animationDelay: '.4s' }} /></div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {phase === 'active' && (
            <div style={S.inputRow}>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={handleKey}
                placeholder="Type your answer... (Enter to send)" style={S.textarea} rows={3} disabled={isLoading} />
              <button onClick={sendAnswer} disabled={!answer.trim() || isLoading}
                style={{ ...S.sendBtn, opacity: (!answer.trim() || isLoading) ? 0.5 : 1 }}>
                <Send size={18} />
              </button>
            </div>
          )}

          {phase === 'complete' && (
            <div style={S.completeBar}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                  All questions answered!
                </p>
                {evalError && (
                  <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={12} /> {evalError}
                  </p>
                )}
              </div>
              <button onClick={() => submitForEval(!!evalError)} disabled={isLoading} style={S.evalBtn}>
                {isLoading
                  ? <><Loader size={15} style={S.spin} /> Evaluating...</>
                  : evalError
                  ? <><RefreshCw size={15} /> Retry Evaluation</>
                  : <><Award size={15} /> Get AI Evaluation <ChevronRight size={14} /></>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── EVALUATING ── */}
      {phase === 'evaluating' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <h2 style={{ fontFamily: 'Syne,sans-serif', color: '#f1f5f9', fontSize: 22, margin: '20px 0 8px' }}>
            Evaluating your interview...
          </h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Gemini is analyzing your answers. This takes 15–30 seconds.</p>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && result && (
        <div style={S.result}>
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <Award size={30} color="#f59e0b" />
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '8px 0 4px' }}>Interview Results</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>{jobRole}</p>
          </div>

          <div style={S.scoresRow}>
            <ScoreRing score={result.communicationScore} label="Communication" color="#3b82f6" />
            <ScoreRing score={result.technicalScore}     label="Technical"     color="#8b5cf6" />
            <ScoreRing score={result.overallScore}       label="Overall"       color="#10b981" />
          </div>

          <div style={{
            padding: '14px 20px', borderRadius: 10, border: '1px solid', textAlign: 'center', fontSize: 15,
            background:   result.recommendation === 'Hire' ? 'rgba(16,185,129,0.1)' : result.recommendation === 'Consider' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor:  result.recommendation === 'Hire' ? 'rgba(16,185,129,0.3)' : result.recommendation === 'Consider' ? 'rgba(245,158,11,0.3)'  : 'rgba(239,68,68,0.3)',
            color:        result.recommendation === 'Hire' ? '#10b981'               : result.recommendation === 'Consider' ? '#f59e0b'                : '#ef4444',
          }}>
            Recommendation: <strong>{result.recommendation}</strong>
          </div>

          {result.feedbackSummary && (
            <div style={S.feedCard}>
              <h3 style={S.feedTitle}>Feedback</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{result.feedbackSummary}</p>
            </div>
          )}
          {result.strengths?.length > 0 && (
            <div style={S.feedCard}>
              <h3 style={{ ...S.feedTitle, color: '#10b981' }}>✓ Strengths</h3>
              {result.strengths.map((s, i) => <div key={i} style={S.feedItem}>{s}</div>)}
            </div>
          )}
          {result.improvements?.length > 0 && (
            <div style={S.feedCard}>
              <h3 style={{ ...S.feedTitle, color: '#f59e0b' }}>↑ Areas to Improve</h3>
              {result.improvements.map((s, i) => <div key={i} style={S.feedItem}>{s}</div>)}
            </div>
          )}

          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', padding: '12px 28px', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', alignSelf: 'center' }}>
            <RefreshCw size={15} /> Practice Again
          </button>
        </div>
      )}
    </div>
  );
}

const S = {
  page:       { display: 'flex', justifyContent: 'center', maxWidth: 780, margin: '0 auto', width: '100%' },
  setup:      { width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' },
  setupIcon:  { width: 76, height: 76, borderRadius: 22, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  setupTitle: { fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9' },
  setupSub:   { fontSize: 14, color: '#64748b', maxWidth: 480, lineHeight: 1.7 },
  roleSection:{ width: '100%', textAlign: 'left' },
  label:      { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 10 },
  roleGrid:   { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  roleBtn:    { padding: '7px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, color: '#64748b', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans,sans-serif' },
  roleBtnActive: { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' },
  roleInput:  { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'DM Sans,sans-serif' },
  features:   { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  feature:    { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' },
  startBtn:   { display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: '#fff', padding: '13px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', boxShadow: '0 0 24px rgba(139,92,246,0.3)' },
  chatWrap:   { width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 500 },
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px 12px 0 0', flexShrink: 0 },
  chatTitle:  { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Syne,sans-serif', fontWeight: 600, color: '#f1f5f9', fontSize: 15 },
  turnsChip:  { fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20 },
  chat:       { flex: 1, overflowY: 'auto', padding: '20px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 14 },
  aiAvatar:   { width: 30, height: 30, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:     { maxWidth: '80%', padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.65 },
  aiBubble:   { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: 4 },
  userBubble: { background: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.25))', border: '1px solid rgba(139,92,246,0.25)', color: '#e2e8f0', borderBottomRightRadius: 4 },
  typing:     { display: 'flex', gap: 5, alignItems: 'center', padding: '2px 4px' },
  dot:        { width: 7, height: 7, borderRadius: '50%', background: '#475569', animation: 'pulse 1.4s infinite ease-in-out' },
  inputRow:   { display: 'flex', gap: 10, padding: '12px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none', borderRadius: '0 0 12px 12px', flexShrink: 0 },
  textarea:   { flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'DM Sans,sans-serif', resize: 'none' },
  sendBtn:    { width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', boxShadow: '0 0 16px rgba(139,92,246,0.3)' },
  completeBar:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderTop: 'none', borderRadius: '0 0 12px 12px', flexShrink: 0, gap: 12 },
  evalBtn:    { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' },
  center:     { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' },
  spinner:    { width: 56, height: 56, border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  result:     { width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  scoresRow:  { display: 'flex', justifyContent: 'center', gap: 48, padding: '28px 24px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 },
  feedCard:   { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 },
  feedTitle:  { fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 10 },
  feedItem:   { fontSize: 13, color: '#94a3b8', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  spin:       { animation: 'spin 0.7s linear infinite' },
};
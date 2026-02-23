import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { authAPI } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email) => {
    setForm({ email, password: 'password123' });
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password: 'password123' });
      login(res.data.user, res.data.token);
      toast.success(`Logged in as ${res.data.user.name}`);
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      {/* Background grid */}
      <div style={styles.grid} />
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <Brain size={28} color="#3b82f6" />
          <span style={styles.logoText}>HireIQ</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail size={16} color="#475569" style={styles.inputIcon} />
              <input
                type="email" required
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} color="#475569" style={styles.inputIcon} />
              <input
                type={show ? 'text' : 'password'} required
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShow(!show)} style={styles.eyeBtn}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? <span style={styles.spinner} /> : <><span>Sign In</span><ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Quick logins */}
        <div style={styles.quickSection}>
          <div style={styles.quickLabel}><Zap size={12} color="#f59e0b" /> Quick Demo Login</div>
          <div style={styles.quickGrid}>
            {[
              { label: 'Recruiter', email: 'sarah@techcorp.io',    color: '#3b82f6' },
              { label: 'Recruiter', email: 'marcus@innovatelabs.io', color: '#3b82f6' },
              { label: 'Candidate', email: 'alex@email.com',        color: '#10b981' },
              { label: 'Candidate', email: 'priya@email.com',       color: '#10b981' },
            ].map(q => (
              <button key={q.email} onClick={() => quickLogin(q.email)} style={{ ...styles.quickBtn, borderColor: q.color + '33', color: q.color }}>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{q.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{q.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={styles.register}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090f', padding:20, position:'relative', overflow:'hidden' },
  grid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' },
  glow: { position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:300, background:'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 70%)', pointerEvents:'none' },
  card: { background:'rgba(13,17,23,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:40, width:'100%', maxWidth:440, position:'relative', backdropFilter:'blur(20px)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' },
  logo: { display:'flex', alignItems:'center', gap:10, marginBottom:28 },
  logoText: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'#f1f5f9' },
  title: { fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#f1f5f9', marginBottom:6 },
  sub:   { color:'#64748b', fontSize:14, marginBottom:28 },
  form:  { display:'flex', flexDirection:'column', gap:16, marginBottom:24 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:13, fontWeight:500, color:'#94a3b8' },
  inputWrap: { position:'relative' },
  inputIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  input: { width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', transition:'border-color 0.2s' },
  eyeBtn: { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', display:'flex', alignItems:'center' },
  btn: { background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', border:'none', padding:'13px 20px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'DM Sans,sans-serif', boxShadow:'0 0 20px rgba(59,130,246,0.3)', transition:'all 0.2s', marginTop:4 },
  spinner: { width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' },
  quickSection: { marginBottom:20 },
  quickLabel: { fontSize:11, color:'#64748b', marginBottom:10, display:'flex', alignItems:'center', gap:5, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' },
  quickGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  quickBtn: { background:'transparent', border:'1px solid', borderRadius:8, padding:'8px 12px', cursor:'pointer', display:'flex', flexDirection:'column', gap:2, textAlign:'left', transition:'all 0.2s', fontFamily:'DM Sans,sans-serif' },
  register: { textAlign:'center', color:'#64748b', fontSize:13 },
};
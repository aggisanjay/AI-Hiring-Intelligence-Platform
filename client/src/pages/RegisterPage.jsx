import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Building2, ArrowRight, Briefcase, UserCheck } from 'lucide-react';
import { authAPI } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'candidate', organization:'' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.user, res.data.token);
      toast.success('Account created! Welcome to HireIQ 🎉');
      navigate(res.data.user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.grid} />
      <div style={styles.glow} />

      <div style={styles.card}>
        <div style={styles.logo}>
          <Brain size={26} color="#3b82f6" />
          <span style={styles.logoText}>HireIQ</span>
        </div>

        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Join the AI-powered hiring platform</p>

        {/* Role selector */}
        <div style={styles.roleRow}>
          {[
            { value:'recruiter', icon:<Briefcase size={18} />,  label:'Recruiter',  desc:'Post jobs & find talent' },
            { value:'candidate', icon:<UserCheck size={18} />, label:'Candidate',  desc:'Find your dream job' },
          ].map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => set('role', r.value)}
              style={{
                ...styles.roleBtn,
                ...(form.role === r.value ? styles.roleBtnActive : {}),
                borderColor: form.role === r.value ? '#3b82f6' : 'rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ color: form.role === r.value ? '#3b82f6' : '#64748b' }}>{r.icon}</span>
              <span style={{ fontWeight:600, color: form.role === r.value ? '#f1f5f9' : '#94a3b8', fontSize:13 }}>{r.label}</span>
              <span style={{ fontSize:11, color:'#475569' }}>{r.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field icon={<User size={15} />} label="Full Name" type="text" placeholder="John Smith"
            value={form.name} onChange={v => set('name', v)} required />
          <Field icon={<Mail size={15} />} label="Email" type="email" placeholder="you@company.com"
            value={form.email} onChange={v => set('email', v)} required />
          <Field icon={<Lock size={15} />} label="Password" type="password" placeholder="Min 6 characters"
            value={form.password} onChange={v => set('password', v)} required />
          {form.role === 'recruiter' && (
            <Field icon={<Building2 size={15} />} label="Organization" type="text" placeholder="Company name"
              value={form.organization} onChange={v => set('organization', v)} />
          )}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? <span style={styles.spinner} /> : <><span>Create Account</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={styles.login}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const Field = ({ icon, label, type, placeholder, value, onChange, required }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:13, fontWeight:500, color:'#94a3b8' }}>{label}</label>
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569', display:'flex' }}>{icon}</span>
      <input
        type={type} placeholder={placeholder} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' }}
      />
    </div>
  </div>
);

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090f', padding:20, position:'relative', overflow:'hidden' },
  grid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' },
  glow: { position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:300, background:'radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents:'none' },
  card: { background:'rgba(13,17,23,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:40, width:'100%', maxWidth:460, position:'relative', backdropFilter:'blur(20px)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' },
  logo: { display:'flex', alignItems:'center', gap:10, marginBottom:24 },
  logoText: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'#f1f5f9' },
  title: { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:6 },
  sub:   { color:'#64748b', fontSize:14, marginBottom:20 },
  roleRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 },
  roleBtn: { background:'rgba(255,255,255,0.02)', border:'1px solid', borderRadius:10, padding:'12px 14px', cursor:'pointer', display:'flex', flexDirection:'column', gap:4, textAlign:'left', transition:'all 0.2s', fontFamily:'DM Sans,sans-serif' },
  roleBtnActive: { background:'rgba(59,130,246,0.08)' },
  form:  { display:'flex', flexDirection:'column', gap:14 },
  btn: { background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', border:'none', padding:'13px 20px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'DM Sans,sans-serif', boxShadow:'0 0 20px rgba(59,130,246,0.3)', marginTop:4 },
  spinner: { width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' },
  login: { textAlign:'center', color:'#64748b', fontSize:13, marginTop:20 },
};
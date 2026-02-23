import { useState } from 'react';
import { User, Mail, MapPin, Github, Linkedin, Briefcase, Code2, Save, Loader, Plus, X } from 'lucide-react';
import { authAPI } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const SKILL_SUGGESTIONS = ['React','TypeScript','Node.js','Python','AWS','Docker','MongoDB','GraphQL','Vue.js','Figma','Kubernetes','Machine Learning','SQL','Java','Go','Redis'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:        user?.name        || '',
    title:       user?.title       || '',
    location:    user?.location    || '',
    bio:         user?.bio         || '',
    experience:  user?.experience  || 0,
    skills:      user?.skills      || [],
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl:   user?.githubUrl   || '',
  });
  const [saving,    setSaving]    = useState(false);
  const [newSkill,  setNewSkill]  = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSkill = (skill) => {
    if (!skill.trim() || form.skills.includes(skill)) return;
    set('skills', [...form.skills, skill]);
    setNewSkill('');
  };
  const removeSkill = (s) => set('skills', form.skills.filter(sk => sk !== s));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={S.page} className="fade-in">
      <div style={S.header}>
        <h1 style={S.title}>My Profile</h1>
        <p style={S.sub}>Keep your profile updated to improve AI match scores</p>
      </div>

      <div style={S.grid}>
        {/* Profile card */}
        <div style={S.card}>
          <div style={S.profileTop}>
            <div style={S.bigAvatar}>{user?.name?.[0]?.toUpperCase() || 'C'}</div>
            <div>
              <h2 style={S.name}>{user?.name}</h2>
              <p style={S.role}>{user?.title || 'Add your title below'}</p>
              <p style={S.email}><Mail size={12} /> {user?.email}</p>
            </div>
          </div>

          <div style={S.statsRow}>
            <div style={S.statBox}>
              <span style={S.statVal}>{form.skills.length}</span>
              <span style={S.statLabel}>Skills</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statVal}>{form.experience}</span>
              <span style={S.statLabel}>Years Exp</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ ...S.card, gap:20 }}>
          <h3 style={S.sectionTitle}>Personal Information</h3>
          <div style={S.formGrid}>
            <Field label="Full Name" icon={<User size={14} />} value={form.name} onChange={v => set('name', v)} placeholder="Your full name" />
            <Field label="Job Title" icon={<Briefcase size={14} />} value={form.title} onChange={v => set('title', v)} placeholder="e.g. Senior React Developer" />
            <Field label="Location" icon={<MapPin size={14} />} value={form.location} onChange={v => set('location', v)} placeholder="City, Country" />
            <div style={S.field}>
              <label style={S.label}>Years of Experience</label>
              <input type="number" min={0} max={40} value={form.experience} onChange={e => set('experience', parseInt(e.target.value) || 0)} style={S.input} />
            </div>
            <Field label="LinkedIn URL" icon={<Linkedin size={14} />} value={form.linkedinUrl} onChange={v => set('linkedinUrl', v)} placeholder="https://linkedin.com/in/..." />
            <Field label="GitHub URL" icon={<Github size={14} />} value={form.githubUrl} onChange={v => set('githubUrl', v)} placeholder="https://github.com/..." />
          </div>

          <div style={S.field}>
            <label style={S.label}>Bio</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell recruiters about yourself..."
              style={S.textarea} rows={3} />
          </div>

          {/* Skills */}
          <div>
            <label style={S.label}><Code2 size={13} /> Skills</label>
            <div style={S.skillsWrap}>
              {form.skills.map(s => (
                <span key={s} style={S.skillTag}>
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} style={S.removeSkill}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div style={S.addSkillRow}>
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                placeholder="Type a skill and press Enter..."
                style={{ ...S.input, flex:1 }} />
              <button type="button" onClick={() => addSkill(newSkill)} style={S.addBtn}><Plus size={15} /></button>
            </div>
            <div style={S.suggestions}>
              {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map(s => (
                <button key={s} type="button" onClick={() => addSkill(s)} style={S.suggestBtn}>+ {s}</button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} style={S.saveBtn}>
            {saving ? <Loader size={16} style={{ animation:'spin 0.7s linear infinite' }} /> : <><Save size={16} /> Save Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const Field = ({ label, icon, value, onChange, placeholder }) => (
  <div style={S.field}>
    <label style={S.label}>{icon} {label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={S.input} />
  </div>
);

const S = {
  page:       { display:'flex', flexDirection:'column', gap:24, maxWidth:900 },
  header:     { },
  title:      { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:        { color:'#64748b', fontSize:14 },
  grid:       { display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' },
  card:       { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:24, display:'flex', flexDirection:'column' },
  profileTop: { display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center', marginBottom:20 },
  bigAvatar:  { width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:28 },
  name:       { fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  role:       { fontSize:13, color:'#64748b', marginBottom:6 },
  email:      { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#475569', justifyContent:'center' },
  statsRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  statBox:    { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 8px', textAlign:'center' },
  statVal:    { display:'block', fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:700, color:'#f1f5f9', marginBottom:2 },
  statLabel:  { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' },
  sectionTitle:{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:600, color:'#f1f5f9', marginBottom:4 },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  field:      { display:'flex', flexDirection:'column', gap:6 },
  label:      { display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:500, color:'#94a3b8' },
  input:      { padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' },
  textarea:   { padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', resize:'vertical' },
  skillsWrap: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:10, minHeight:32 },
  skillTag:   { display:'inline-flex', alignItems:'center', gap:5, fontSize:12, padding:'4px 10px', background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20 },
  removeSkill:{ background:'none', border:'none', color:'#34d399', cursor:'pointer', display:'flex', alignItems:'center', padding:0 },
  addSkillRow:{ display:'flex', gap:8, marginBottom:10 },
  addBtn:     { width:40, height:40, borderRadius:8, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  suggestions:{ display:'flex', flexWrap:'wrap', gap:6 },
  suggestBtn: { padding:'4px 10px', background:'transparent', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:20, color:'#475569', cursor:'pointer', fontSize:11, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' },
  saveBtn:    { display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#10b981,#059669)', border:'none', color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginTop:8, boxShadow:'0 0 20px rgba(16,185,129,0.25)' },
};
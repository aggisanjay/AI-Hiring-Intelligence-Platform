import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Briefcase, MapPin, Clock, DollarSign, Users,
  Search, Edit2, Trash2, Eye, GitBranch, ChevronRight,
  X, Check, AlertCircle, Loader
} from 'lucide-react';
import { jobsAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

const SKILLS = ['React','TypeScript','Node.js','Python','AWS','Docker','Kubernetes','GraphQL','MongoDB','PostgreSQL','Vue.js','Angular','Go','Java','Figma','UX Research'];

export default function JobsPage() {
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editJob,   setEditJob]   = useState(null);
  const [submitting,setSubmitting]= useState(false);
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    return { title:'', description:'', requirements:'', department:'Engineering', type:'Full-time', location:'Remote', salaryMin:'', salaryMax:'', experienceMin:'', experienceMax:'', requiredSkills:[], status:'Active' };
  }

  const load = async () => {
    try {
      const res = await jobsAPI.getMyJobs();
      setJobs(res.data.jobs);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditJob(null); setForm(defaultForm()); setShowForm(true); };
  const openEdit   = (job) => {
    setEditJob(job);
    setForm({ ...job, salaryMin: job.salaryMin || '', salaryMax: job.salaryMax || '', experienceMin: job.experienceMin || '', experienceMax: job.experienceMax || '', requiredSkills: job.requiredSkills || [] });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editJob) {
        await jobsAPI.update(editJob._id, form);
        toast.success('Job updated!');
      } else {
        await jobsAPI.create(form);
        toast.success('Job posted!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job and all applications?')) return;
    try {
      await jobsAPI.delete(id);
      toast.success('Job deleted');
      setJobs(j => j.filter(job => job._id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const toggleSkill = (skill) => {
    setForm(p => ({
      ...p,
      requiredSkills: p.requiredSkills.includes(skill)
        ? p.requiredSkills.filter(s => s !== skill)
        : [...p.requiredSkills, skill]
    }));
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Job Postings</h1>
          <p style={styles.sub}>{jobs.length} total jobs · {jobs.filter(j => j.status === 'Active').length} active</p>
        </div>
        <button onClick={openCreate} style={styles.newBtn}>
          <Plus size={16} /> Post New Job
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={styles.grid}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:220, borderRadius:12 }} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div style={styles.emptyState}>
          <Briefcase size={48} color="#1e293b" />
          <h3 style={{ fontFamily:'Syne,sans-serif', color:'#475569', marginTop:12 }}>No jobs posted yet</h3>
          <p style={{ color:'#334155', fontSize:14, marginBottom:16 }}>Create your first job posting to start receiving applications.</p>
          <button onClick={openCreate} style={styles.newBtn}><Plus size={15} /> Post First Job</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {jobs.map(job => (
            <div key={job._id} style={styles.jobCard}>
              <div style={styles.jobCardHead}>
                <div style={styles.deptBadge}>{job.department}</div>
                <div style={{ ...styles.statusPill, background: job.status === 'Active' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: job.status === 'Active' ? '#10b981' : '#f59e0b' }}>
                  {job.status}
                </div>
              </div>
              <h3 style={styles.jobTitle}>{job.title}</h3>
              <div style={styles.jobMeta}>
                <span style={styles.metaItem}><MapPin size={12} /> {job.location}</span>
                <span style={styles.metaItem}><Clock size={12} /> {job.type}</span>
                {job.salaryMin && <span style={styles.metaItem}><DollarSign size={12} /> ${(job.salaryMin/1000).toFixed(0)}k–${(job.salaryMax/1000).toFixed(0)}k</span>}
              </div>
              <div style={styles.skillsWrap}>
                {(job.requiredSkills || []).slice(0, 3).map(s => (
                  <span key={s} style={styles.skillTag}>{s}</span>
                ))}
                {job.requiredSkills?.length > 3 && <span style={styles.moreTag}>+{job.requiredSkills.length - 3}</span>}
              </div>
              <div style={styles.jobFooter}>
                <div style={styles.appCount}><Users size={13} /> {job.applicantsCount || 0} applicants</div>
                <div style={styles.jobActions}>
                  <Link to={`/recruiter/pipeline/${job._id}`} style={styles.actionBtn} title="View Pipeline">
                    <GitBranch size={14} />
                  </Link>
                  <button onClick={() => openEdit(job)} style={styles.actionBtn} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(job._id)} style={{ ...styles.actionBtn, color:'#ef4444' }} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Form Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h2 style={styles.modalTitle}>{editJob ? 'Edit Job' : 'Post New Job'}</h2>
              <button onClick={() => setShowForm(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid2}>
                <Field label="Job Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Senior React Developer" required />
                <div style={styles.field}>
                  <label style={styles.label}>Department</label>
                  <select value={form.department} onChange={e => set('department', e.target.value)} style={styles.select}>
                    {['Engineering','AI/Research','Design','Product','Marketing','Sales','HR','Infrastructure'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the role, responsibilities..." style={styles.textarea} required rows={4} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Requirements</label>
                <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Required qualifications..." style={styles.textarea} rows={3} />
              </div>
              <div style={styles.formGrid3}>
                <div style={styles.field}>
                  <label style={styles.label}>Job Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={styles.select}>
                    {['Full-time','Part-time','Contract','Internship','Remote'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="Location" value={form.location} onChange={v => set('location', v)} placeholder="Remote / City" />
                <div style={styles.field}>
                  <label style={styles.label}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={styles.select}>
                    {['Active','Paused','Draft'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formGrid2}>
                <Field label="Min Salary (USD)" value={form.salaryMin} onChange={v => set('salaryMin', v)} placeholder="100000" type="number" />
                <Field label="Max Salary (USD)" value={form.salaryMax} onChange={v => set('salaryMax', v)} placeholder="150000" type="number" />
              </div>
              <div style={styles.formGrid2}>
                <Field label="Min Experience (yrs)" value={form.experienceMin} onChange={v => set('experienceMin', v)} placeholder="3" type="number" />
                <Field label="Max Experience (yrs)" value={form.experienceMax} onChange={v => set('experienceMax', v)} placeholder="10" type="number" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Required Skills</label>
                <div style={styles.skillGrid}>
                  {SKILLS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      style={{ ...styles.skillPick, ...(form.requiredSkills.includes(s) ? styles.skillPickActive : {}) }}>
                      {form.requiredSkills.includes(s) && <Check size={10} />} {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                  {submitting ? <Loader size={15} style={{ animation:'spin 0.7s linear infinite' }} /> : editJob ? 'Save Changes' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      style={styles.input} />
  </div>
);

const styles = {
  page:      { display:'flex', flexDirection:'column', gap:24, maxWidth:1200 },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:     { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:       { color:'#64748b', fontSize:14 },
  newBtn:    { display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', border:'none', padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 0 20px rgba(59,130,246,0.3)' },
  grid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 },
  jobCard:   { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:12, transition:'border-color 0.2s' },
  jobCardHead:{ display:'flex', justifyContent:'space-between', alignItems:'center' },
  deptBadge: { fontSize:11, fontWeight:600, color:'#64748b', background:'rgba(255,255,255,0.05)', padding:'3px 8px', borderRadius:6 },
  statusPill:{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 },
  jobTitle:  { fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#f1f5f9' },
  jobMeta:   { display:'flex', flexWrap:'wrap', gap:12 },
  metaItem:  { display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#64748b' },
  skillsWrap:{ display:'flex', flexWrap:'wrap', gap:6 },
  skillTag:  { fontSize:11, padding:'3px 8px', background:'rgba(59,130,246,0.1)', color:'#60a5fa', borderRadius:6, fontWeight:500 },
  moreTag:   { fontSize:11, padding:'3px 8px', background:'rgba(255,255,255,0.05)', color:'#64748b', borderRadius:6 },
  jobFooter: { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto' },
  appCount:  { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' },
  jobActions:{ display:'flex', gap:6 },
  actionBtn: { width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', textDecoration:'none', transition:'all 0.15s' },
  emptyState:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', background:'#111827', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:     { background:'#111827', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'auto' },
  modalHead: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky', top:0, background:'#111827', zIndex:10 },
  modalTitle:{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:'#f1f5f9' },
  closeBtn:  { background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', cursor:'pointer' },
  form:      { padding:24, display:'flex', flexDirection:'column', gap:16 },
  formGrid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  formGrid3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 },
  field:     { display:'flex', flexDirection:'column', gap:6 },
  label:     { fontSize:13, fontWeight:500, color:'#94a3b8' },
  input:     { padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' },
  select:    { padding:'10px 12px', background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' },
  textarea:  { padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', resize:'vertical' },
  skillGrid: { display:'flex', flexWrap:'wrap', gap:8, marginTop:4 },
  skillPick: { padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' },
  skillPickActive: { background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.4)', color:'#60a5fa' },
  formActions:{ display:'flex', gap:12, justifyContent:'flex-end', paddingTop:8 },
  cancelBtn: { padding:'10px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#94a3b8', cursor:'pointer', fontSize:14, fontFamily:'DM Sans,sans-serif' },
  submitBtn: { padding:'10px 24px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8 },
};
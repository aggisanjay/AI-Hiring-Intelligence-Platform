import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Briefcase, Search, Upload, X, Loader, CheckCircle } from 'lucide-react';
import { jobsAPI, candidatesAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

export default function BrowseJobsPage() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [applying, setApplying] = useState(null); // jobId being applied to
  const [applied,  setApplied]  = useState(new Set());
  const [modal,    setModal]    = useState(null); // job for apply modal
  const [form,     setForm]     = useState({ coverLetter:'', resume: null });
  const [submitting,setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getAll({ search, limit: 20 });
      setJobs(res.data.jobs);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openApply = (job) => {
    setModal(job);
    setForm({ coverLetter: '', resume: null });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('jobId', modal._id);
      fd.append('coverLetter', form.coverLetter);
      if (form.resume) fd.append('resume', form.resume);
      await candidatesAPI.apply(fd);
      toast.success('Application submitted! AI analysis queued.');
      setApplied(s => new Set([...s, modal._id]));
      setModal(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Application failed';
      if (msg.includes('already applied')) toast.error('Already applied to this job');
      else toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div style={S.page} className="fade-in">
      <div style={S.header}>
        <h1 style={S.title}>Browse Jobs</h1>
        <p style={S.sub}>{jobs.length} positions available</p>
      </div>

      <div style={S.searchWrap}>
        <Search size={16} color="#475569" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job title, skills..."
          style={S.search} />
      </div>

      <div style={S.grid}>
        {loading
          ? Array(8).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:260, borderRadius:12 }} />)
          : jobs.map(job => {
            const isApplied = applied.has(job._id);
            return (
              <div key={job._id} style={S.card}>
                <div style={S.cardTop}>
                  <div style={S.orgAvatar}>{(job.organization || job.recruiterId?.organization || 'C')[0].toUpperCase()}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={S.org}>{job.organization || 'Company'}</div>
                    <div style={S.dept}>{job.department}</div>
                  </div>
                  <div style={{ ...S.typeBadge, background: job.type === 'Remote' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: job.type === 'Remote' ? '#10b981' : '#60a5fa' }}>
                    {job.type}
                  </div>
                </div>

                <h3 style={S.jobTitle}>{job.title}</h3>

                <div style={S.metaRow}>
                  <span style={S.meta}><MapPin size={11} /> {job.location}</span>
                  {job.salaryMin && <span style={S.meta}><DollarSign size={11} /> ${(job.salaryMin/1000).toFixed(0)}k–${(job.salaryMax/1000).toFixed(0)}k</span>}
                  <span style={S.meta}><Clock size={11} /> {job.experienceMin}+ yrs</span>
                </div>

                <p style={S.desc}>{job.description?.substring(0, 100)}...</p>

                <div style={S.skillsWrap}>
                  {(job.requiredSkills || []).slice(0, 4).map(s => <span key={s} style={S.skill}>{s}</span>)}
                  {(job.requiredSkills?.length || 0) > 4 && <span style={S.more}>+{job.requiredSkills.length - 4}</span>}
                </div>

                <button
                  onClick={() => isApplied ? null : openApply(job)}
                  disabled={isApplied}
                  style={{ ...S.applyBtn, ...(isApplied ? S.applyBtnDone : {}) }}
                >
                  {isApplied ? <><CheckCircle size={14} /> Applied</> : 'Apply Now'}
                </button>
              </div>
            );
          })
        }
      </div>

      {/* Apply Modal */}
      {modal && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHead}>
              <div>
                <h2 style={S.modalTitle}>Apply for {modal.title}</h2>
                <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{modal.organization}</p>
              </div>
              <button onClick={() => setModal(null)} style={S.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleApply} style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={S.label}>Cover Letter</label>
                <textarea
                  value={form.coverLetter}
                  onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  placeholder="Tell us why you're a great fit for this role..."
                  style={S.textarea} rows={5}
                />
              </div>
              <div>
                <label style={S.label}>Resume (PDF, DOC, DOCX)</label>
                <label style={S.fileLabel}>
                  <Upload size={16} />
                  {form.resume ? form.resume.name : 'Click to upload resume (AI analysis will run)'}
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }}
                    onChange={e => setForm(p => ({ ...p, resume: e.target.files[0] }))} />
                </label>
                <p style={{ fontSize:11, color:'#475569', marginTop:4 }}>AI will extract your skills and score your fit against the job description.</p>
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={S.submitBtn}>
                  {submitting ? <Loader size={14} style={{ animation:'spin 0.7s linear infinite' }} /> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:      { display:'flex', flexDirection:'column', gap:20, maxWidth:1200 },
  header:    { },
  title:     { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:       { color:'#64748b', fontSize:14 },
  searchWrap:{ position:'relative' },
  search:    { width:'100%', padding:'11px 14px 11px 42px', background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' },
  grid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 },
  card:      { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:12 },
  cardTop:   { display:'flex', alignItems:'center', gap:10 },
  orgAvatar: { width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#1e40af,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 },
  org:       { fontSize:12, color:'#64748b' },
  dept:      { fontSize:11, color:'#334155' },
  typeBadge: { fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:6 },
  jobTitle:  { fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#f1f5f9' },
  metaRow:   { display:'flex', flexWrap:'wrap', gap:12 },
  meta:      { display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#64748b' },
  desc:      { fontSize:12, color:'#64748b', lineHeight:1.6 },
  skillsWrap:{ display:'flex', flexWrap:'wrap', gap:6 },
  skill:     { fontSize:11, padding:'3px 8px', background:'rgba(16,185,129,0.1)', color:'#34d399', borderRadius:6 },
  more:      { fontSize:11, padding:'3px 8px', background:'rgba(255,255,255,0.04)', color:'#475569', borderRadius:6 },
  applyBtn:  { background:'linear-gradient(135deg,#10b981,#059669)', border:'none', color:'#fff', padding:'11px 16px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6 },
  applyBtnDone: { background:'rgba(16,185,129,0.1)', color:'#10b981', cursor:'default' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:     { background:'#111827', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:520 },
  modalHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  modalTitle:{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:'#f1f5f9' },
  closeBtn:  { background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', cursor:'pointer' },
  label:     { display:'block', fontSize:13, fontWeight:500, color:'#94a3b8', marginBottom:6 },
  textarea:  { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif', resize:'vertical' },
  fileLabel: { display:'flex', alignItems:'center', gap:10, padding:'16px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.12)', borderRadius:8, color:'#64748b', fontSize:13, cursor:'pointer' },
  cancelBtn: { padding:'10px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#94a3b8', cursor:'pointer', fontSize:14, fontFamily:'DM Sans,sans-serif' },
  submitBtn: { padding:'10px 24px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:8 },
};
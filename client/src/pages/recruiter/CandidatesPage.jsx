import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Star, Filter, Github, Linkedin, Users } from 'lucide-react';
import { candidatesAPI } from '../../api/axios.js';
import toast from 'react-hot-toast';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await candidatesAPI.getAll({ search, page, limit: 12 });
      setCandidates(res.data.candidates);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load candidates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Talent Pool</h1>
          <p style={styles.sub}>{total} candidates registered</p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={16} color="#475569" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
        <input
          value={search} onChange={handleSearch}
          placeholder="Search by name, title, or skill..."
          style={styles.searchInput}
        />
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {loading
          ? Array(9).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height:200, borderRadius:12 }} />)
          : candidates.length === 0
          ? (
            <div style={{ gridColumn:'1/-1', ...styles.emptyState }}>
              <Users size={48} color="#1e293b" />
              <p style={{ color:'#475569', marginTop:12 }}>No candidates found</p>
            </div>
          )
          : candidates.map(c => (
            <div key={c._id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.avatar}>{c.name?.[0]?.toUpperCase() || '?'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={styles.name}>{c.name}</div>
                  <div style={styles.role}>{c.title || 'Candidate'}</div>
                </div>
              </div>

              {c.location && (
                <div style={styles.location}><MapPin size={12} /> {c.location}</div>
              )}

              <div style={styles.expRow}>
                <Briefcase size={12} color="#475569" />
                <span style={styles.expText}>{c.experience || 0} years experience</span>
              </div>

              {c.skills?.length > 0 && (
                <div style={styles.skillsWrap}>
                  {c.skills.slice(0, 4).map(s => (
                    <span key={s} style={styles.skill}>{s}</span>
                  ))}
                  {c.skills.length > 4 && <span style={styles.more}>+{c.skills.length - 4}</span>}
                </div>
              )}

              <div style={styles.links}>
                {c.githubUrl  && <a href={c.githubUrl}  target="_blank" rel="noreferrer" style={styles.link}><Github size={14} /></a>}
                {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noreferrer" style={styles.link}><Linkedin size={14} /></a>}
                {c.email && <span style={styles.email}>{c.email}</span>}
              </div>
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {Math.ceil(total / 12) > 1 && (
        <div style={styles.pagination}>
          {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page:       { display:'flex', flexDirection:'column', gap:20, maxWidth:1200 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:      { fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  sub:        { color:'#64748b', fontSize:14 },
  searchWrap: { position:'relative' },
  searchInput:{ width:'100%', padding:'11px 12px 11px 42px', background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'DM Sans,sans-serif' },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  card:       { background:'#111827', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:18, display:'flex', flexDirection:'column', gap:10 },
  cardTop:    { display:'flex', alignItems:'center', gap:12 },
  avatar:     { width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 },
  name:       { fontSize:15, fontWeight:600, color:'#f1f5f9', marginBottom:2 },
  role:       { fontSize:12, color:'#64748b' },
  location:   { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' },
  expRow:     { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' },
  expText:    { },
  skillsWrap: { display:'flex', flexWrap:'wrap', gap:6 },
  skill:      { fontSize:11, padding:'3px 8px', background:'rgba(59,130,246,0.1)', color:'#60a5fa', borderRadius:6 },
  more:       { fontSize:11, padding:'3px 8px', background:'rgba(255,255,255,0.05)', color:'#64748b', borderRadius:6 },
  links:      { display:'flex', alignItems:'center', gap:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto' },
  link:       { color:'#64748b', display:'flex', alignItems:'center', textDecoration:'none', transition:'color 0.15s' },
  email:      { fontSize:11, color:'#475569', marginLeft:'auto', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', background:'#111827', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)' },
  pagination: { display:'flex', gap:8, justifyContent:'center', paddingTop:8 },
  pageBtn:    { width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif' },
  pageBtnActive: { background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#3b82f6' },
};
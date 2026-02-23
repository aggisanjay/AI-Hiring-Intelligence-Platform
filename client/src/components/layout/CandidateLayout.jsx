import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Brain, LayoutDashboard, Search, FileText,
  Video, User, LogOut, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/candidate/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard'    },
  { to: '/candidate/jobs',         icon: <Search size={18} />,          label: 'Browse Jobs'  },
  { to: '/candidate/applications', icon: <FileText size={18} />,        label: 'My Applications'},
  { to: '/candidate/interview',    icon: <Video size={18} />,           label: 'AI Interview' },
  { to: '/candidate/profile',      icon: <User size={18} />,            label: 'Profile'      },
];

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebarWrap}>
        <div style={styles.sidebar}>
          <div style={styles.logoWrap}>
            <div style={styles.logoIcon}><Brain size={20} color="#10b981" /></div>
            <span style={styles.logoText}>HireIQ</span>
          </div>
          <div style={styles.candidateBadge}>
            <span style={{ ...styles.orgDot, background:'#10b981' }} />
            <span style={styles.orgText}>Candidate Portal</span>
          </div>
          <nav style={styles.nav}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navActive : {}) })}>
                <span>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div style={styles.bottom}>
            <div style={styles.userCard}>
              <div style={{ ...styles.avatar, background:'linear-gradient(135deg,#10b981,#059669)' }}>
                {user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={styles.userName}>{user?.name}</div>
                <div style={styles.userRole}>{user?.title || 'Candidate'}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <LogOut size={15} /><span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ flex:1 }} />
          <button style={styles.iconBtn}><Bell size={18} /></button>
          <div style={{ ...styles.topAvatar, background:'linear-gradient(135deg,#10b981,#059669)' }}>
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
        </div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:        { display:'flex', minHeight:'100vh', background:'#06090f' },
  sidebarWrap:   { width:240, flexShrink:0, position:'fixed', top:0, left:0, bottom:0, zIndex:50 },
  sidebar:       { height:'100%', background:'#0d1117', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' },
  logoWrap:      { display:'flex', alignItems:'center', gap:10, padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  logoIcon:      { width:34, height:34, background:'rgba(16,185,129,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  logoText:      { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'#f1f5f9' },
  candidateBadge:{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  orgDot:        { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  orgText:       { fontSize:11, color:'#475569', fontWeight:500 },
  nav:           { flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 },
  navItem:       { display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, color:'#64748b', textDecoration:'none', fontSize:14, fontWeight:500, transition:'all 0.15s' },
  navActive:     { background:'rgba(16,185,129,0.12)', color:'#10b981' },
  navLabel:      { fontFamily:'DM Sans,sans-serif' },
  bottom:        { padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.06)' },
  userCard:      { display:'flex', alignItems:'center', gap:10, padding:'8px 8px 12px' },
  avatar:        { width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 },
  userName:      { fontSize:13, fontWeight:600, color:'#f1f5f9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole:      { fontSize:11, color:'#475569' },
  logoutBtn:     { display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', width:'100%' },
  main:          { flex:1, marginLeft:240, display:'flex', flexDirection:'column' },
  topbar:        { display:'flex', alignItems:'center', gap:12, padding:'0 24px', height:60, background:'rgba(13,17,23,0.9)', borderBottom:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(8px)', position:'sticky', top:0, zIndex:40 },
  iconBtn:       { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', cursor:'pointer' },
  topAvatar:     { width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 },
  content:       { flex:1, padding:28, overflowY:'auto' },
};
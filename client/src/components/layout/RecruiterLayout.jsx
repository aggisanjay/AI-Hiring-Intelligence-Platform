import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Brain, LayoutDashboard, Briefcase, Users, GitBranch,
  BarChart2, LogOut, Bell, Settings, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/recruiter/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard'  },
  { to: '/recruiter/jobs',      icon: <Briefcase size={18} />,       label: 'Jobs'       },
  { to: '/recruiter/candidates',icon: <Users size={18} />,           label: 'Candidates' },
  { to: '/recruiter/analytics', icon: <BarChart2 size={18} />,       label: 'Analytics'  },
];

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}><Brain size={20} color="#3b82f6" /></div>
        {!collapsed && <span style={styles.logoText}>HireIQ</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ ...styles.collapseBtn, marginLeft: collapsed ? 0 : 'auto' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Org badge */}
      {!collapsed && (
        <div style={styles.orgBadge}>
          <span style={styles.orgDot} />
          <span style={styles.orgText}>{user?.organization || 'Organization'}</span>
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV.map(item => (
          <NavLink
            key={item.to} to={item.to}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navActive : {}),
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={styles.bottom}>
        {!collapsed && (
          <div style={styles.userCard}>
            <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'R'}</div>
            <div style={{ overflow:'hidden' }}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>Recruiter</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{ ...styles.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <LogOut size={16} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.layout}>
      {/* Desktop sidebar */}
      <div style={{ ...styles.sidebarWrap, width: collapsed ? 64 : 240 }}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div style={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ ...styles.main, marginLeft: collapsed ? 64 : 240 }}>
        {/* Top bar */}
        <div style={styles.topbar}>
          <button onClick={() => setMobileOpen(true)} style={styles.menuBtn}>
            <Menu size={18} />
          </button>
          <div style={{ flex: 1 }} />
          <button style={styles.iconBtn}><Bell size={18} /></button>
          <button style={styles.iconBtn}><Settings size={18} /></button>
          <div style={styles.topAvatar}>{user?.name?.[0]?.toUpperCase() || 'R'}</div>
        </div>

        {/* Page content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:     { display:'flex', minHeight:'100vh', background:'#06090f' },
  sidebarWrap:{ position:'fixed', top:0, left:0, bottom:0, zIndex:50, transition:'width 0.25s ease', flexShrink:0 },
  sidebar:    { height:'100%', background:'#0d1117', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' },
  logoWrap:   { display:'flex', alignItems:'center', gap:10, padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  logoIcon:   { width:34, height:34, background:'rgba(59,130,246,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  logoText:   { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'#f1f5f9', whiteSpace:'nowrap' },
  collapseBtn:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', flexShrink:0 },
  orgBadge:   { display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  orgDot:     { width:6, height:6, borderRadius:'50%', background:'#10b981', flexShrink:0 },
  orgText:    { fontSize:11, color:'#475569', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  nav:        { flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' },
  navItem:    { display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, color:'#64748b', textDecoration:'none', fontSize:14, fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap' },
  navActive:  { background:'rgba(59,130,246,0.12)', color:'#3b82f6' },
  navLabel:   { fontFamily:'DM Sans,sans-serif' },
  bottom:     { padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.06)' },
  userCard:   { display:'flex', alignItems:'center', gap:10, padding:'8px 8px 12px' },
  avatar:     { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 },
  userName:   { fontSize:13, fontWeight:600, color:'#f1f5f9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole:   { fontSize:11, color:'#475569' },
  logoutBtn:  { display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', width:'100%', transition:'all 0.15s' },
  main:       { flex:1, display:'flex', flexDirection:'column', transition:'margin-left 0.25s ease', minWidth:0 },
  topbar:     { display:'flex', alignItems:'center', gap:12, padding:'0 24px', height:60, background:'rgba(13,17,23,0.9)', borderBottom:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(8px)', position:'sticky', top:0, zIndex:40 },
  menuBtn:    { display:'none', background:'none', border:'none', color:'#64748b', cursor:'pointer' },
  iconBtn:    { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', cursor:'pointer' },
  topAvatar:  { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 },
  content:    { flex:1, padding:28, overflowY:'auto' },
  mobileOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'none' },
  mobileSidebar: { width:240, height:'100%' },
};
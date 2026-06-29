import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  CheckSquare, 
  BarChart3, 
  LogOut, 
  User,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, handleLogout, isOpen, setIsOpen, isMobile }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'room', label: 'Meeting Room', icon: Mic },
    { id: 'kanban', label: 'Kanban Board', icon: CheckSquare },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <aside style={styles.sidebar(isMobile, isOpen)} className="glass-panel">

      <div style={styles.brand}>
        <div style={styles.logoCircle}>
          <Sparkles size={18} color="#ffffff" />
        </div>
        <h2 style={styles.logoText}>AI Meeting</h2>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(255, 107, 74, 0.1)' : 'transparent',
                borderColor: isActive ? 'var(--coral-accent)' : 'transparent',
              }}
              className="nav-btn-hover"
            >
              <IconComponent 
                size={20} 
                color={isActive ? 'var(--coral-accent)' : 'var(--text-secondary)'} 
              />
              <span style={styles.labelText}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userProfile}>
          <div style={styles.avatar}>
            <User size={16} color="var(--coral-accent)" />
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name || 'User'}</div>
            <div style={styles.userEmail}>{user?.email || 'demo@aimeeting.com'}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} className="outline-btn">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: (isMobile, isOpen) => ({
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: isMobile ? '0' : '0 24px 24px 0',
    borderLeft: 'none',
    borderTop: 'none',
    borderBottom: 'none',
    zIndex: 100,
    padding: '30px 20px',
    transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(13, 15, 23, 0.98)',
  }),
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
    paddingLeft: '8px',
  },
  logoCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(255, 107, 74, 0.3)',
  },
  logoText: {
    fontSize: '20px',
    background: 'linear-gradient(135deg, #ffffff 40%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  labelText: {
    fontSize: '15px',
  },
  footer: {
    borderTop: '1px solid var(--panel-border)',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 8px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 107, 74, 0.08)',
    border: '1px solid rgba(255, 107, 74, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flexGrow: 1,
    overflow: 'hidden',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '10px',
    fontSize: '14px',
  }
};

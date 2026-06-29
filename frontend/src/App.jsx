import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsView from './components/AnalyticsView';
import { getApiUrl } from './config';
import { Menu, Sparkles } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Session verification and mobile layout states
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Validate session on load
  useEffect(() => {
    if (token) {
      setIsVerifying(true);
      fetch(`${getApiUrl()}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      })
      .catch(err => {
        console.warn(err.message);
        handleLogout();
      })
      .finally(() => {
        setIsVerifying(false);
      });
    } else {
      setIsVerifying(false);
    }
  }, [token]);

  // Handle viewport resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setSelectedMeeting(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleMeetingUpdated = () => {
    setDashboardRefreshTrigger(prev => prev + 1);
  };

  // Render core views
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            token={token} 
            onSelectMeeting={setSelectedMeeting}
            setActiveTab={setActiveTab}
            key={`dash-${dashboardRefreshTrigger}`}
          />
        );
      case 'room':
        return (
          <MeetingRoom 
            selectedMeeting={selectedMeeting} 
            token={token}
            onMeetingUpdated={handleMeetingUpdated}
            setActiveTab={setActiveTab}
            user={user}
          />
        );
      case 'kanban':
        return (
          <KanbanBoard 
            token={token} 
            key={`kanban-${dashboardRefreshTrigger}`}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            token={token} 
            key={`analytics-${dashboardRefreshTrigger}`}
          />
        );
      default:
        return (
          <Dashboard 
            user={user} 
            token={token} 
            onSelectMeeting={setSelectedMeeting}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  // Session verification loader screen
  if (isVerifying) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.glowOrb1}></div>
        <div style={styles.glowOrb2}></div>
        <div style={styles.loaderContent} className="glass-panel">
          <div style={styles.loaderLogo}>
            <Sparkles size={36} color="#ffffff" />
          </div>
          <h2 style={styles.loaderText}>AI Meeting Intelligent</h2>
          <p style={styles.loaderSubText}>Securing meeting workspace...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login page
  if (!token || !user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-container ${isMobile ? 'mobile-layout' : ''}`}>
      {isMobile && (
        <header style={styles.mobileHeader} className="glass-panel">
          <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <Menu size={24} color="#ffffff" />
          </button>
          <div style={styles.mobileBrand}>
            <div style={styles.logoCircle}>
              <Sparkles size={14} color="#ffffff" />
            </div>
            <span style={styles.logoText}>AI Meeting</span>
          </div>
          <div style={{ width: '24px' }}></div>
        </header>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
        user={user} 
        handleLogout={handleLogout} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      {isMobile && sidebarOpen && (
        <div 
          style={styles.sidebarOverlay} 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <main className={`main-content ${isMobile ? 'mobile-content' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}

const styles = {
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07080c',
    position: 'relative',
    overflow: 'hidden',
  },
  loaderContent: {
    padding: '40px 60px',
    textAlign: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(18, 22, 33, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  loaderLogo: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 0 30px rgba(255, 107, 74, 0.3)',
    animation: 'pulseGlow 2s infinite',
  },
  loaderText: {
    fontSize: '24px',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '8px',
  },
  loaderSubText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  glowOrb1: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '20%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255, 107, 74, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 90,
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    background: 'rgba(7, 8, 12, 0.85)',
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '16px',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: '#ffffff',
  },
  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 95,
  }
};


import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsView from './components/AnalyticsView';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Validate session on load
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5001/api/auth/me', {
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
      });
    }
  }, [token]);

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
    // Increment trigger to force sub-components to refresh
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

  // If user is not authenticated, show login page
  if (!token || !user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        handleLogout={handleLogout} 
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

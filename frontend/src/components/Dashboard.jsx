import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  ListTodo,
  CalendarCheck,
  Video,
  Sparkles
} from 'lucide-react';

export default function Dashboard({ user, token, onSelectMeeting, setActiveTab }) {
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalDuration: 0,
    avgProductivity: 0,
    tasks: { total: 0, todo: 0, in_progress: 0, completed: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [date, setDate] = useState('');
  const [schedulingError, setSchedulingError] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch meetings
      const meetingsRes = await fetch('http://localhost:5001/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meetingsData = await meetingsRes.json();
      if (meetingsRes.ok) setMeetings(meetingsData);

      // Fetch analytics summary
      const statsRes = await fetch('http://localhost:5001/api/analytics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData.stats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSchedulingError('');
    setSchedulingLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/meetings/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, date, goal })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to schedule meeting');

      setMeetings(prev => [data, ...prev]);
      setShowScheduleForm(false);
      setTitle('');
      setGoal('');
      setDate('');
      
      // Refresh analytics
      fetchData();
    } catch (err) {
      setSchedulingError(err.message);
    } finally {
      setSchedulingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Workspace Overview</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}. Here is what is happening today.</p>
        </div>
        <button 
          onClick={() => setShowScheduleForm(true)} 
          className="coral-glow-btn"
        >
          <Plus size={18} />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Stats Section */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} className="glass-panel">
          <div style={styles.statIconWrapper(1)}>
            <CalendarCheck size={20} color="var(--coral-accent)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.totalMeetings}</div>
            <div style={styles.statLabel}>Total Meetings</div>
          </div>
        </div>
        
        <div style={styles.statCard} className="glass-panel">
          <div style={styles.statIconWrapper(2)}>
            <Clock size={20} color="var(--violet-accent)" />
          </div>
          <div>
            <div style={styles.statVal}>
              {stats.totalDuration > 60 
                ? `${Math.round(stats.totalDuration / 60 * 10) / 10}h` 
                : `${stats.totalDuration}m`
              }
            </div>
            <div style={styles.statLabel}>Total Duration</div>
          </div>
        </div>

        <div style={styles.statCard} className="glass-panel">
          <div style={styles.statIconWrapper(3)}>
            <TrendingUp size={20} color="var(--emerald-accent)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.avgProductivity}%</div>
            <div style={styles.statLabel}>Avg Productivity</div>
          </div>
        </div>

        <div style={styles.statCard} className="glass-panel">
          <div style={styles.statIconWrapper(4)}>
            <ListTodo size={20} color="var(--amber-accent)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.tasks.todo + stats.tasks.in_progress}</div>
            <div style={styles.statLabel}>Pending Actions</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Meetings List */}
        <div style={styles.section} className="glass-panel">
          <h3 style={styles.sectionTitle}>Meetings & Logs</h3>
          {loading ? (
            <div style={styles.loading}>Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div style={styles.emptyState}>
              <Video size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p>No meetings found.</p>
              <button 
                onClick={() => setShowScheduleForm(true)} 
                style={styles.emptyBtn} 
                className="outline-btn"
              >
                Schedule your first meeting
              </button>
            </div>
          ) : (
            <div style={styles.list}>
              {meetings.map((meeting) => (
                <div key={meeting._id} style={styles.meetingItem} className="meeting-hover-card">
                  <div style={styles.meetingHeader}>
                    <div style={styles.meetingMainInfo}>
                      <h4 style={styles.meetingTitle}>{meeting.title}</h4>
                      <div style={styles.meetingMeta}>
                        <span style={styles.metaSpan}>
                          <Calendar size={13} style={{ marginRight: '4px' }} />
                          {formatDate(meeting.date)}
                        </span>
                        {meeting.duration > 0 && (
                          <span style={styles.metaSpan}>
                            <Clock size={13} style={{ marginRight: '4px' }} />
                            {meeting.duration} mins
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {meeting.duration > 0 ? (
                        <span className="badge badge-completed" style={styles.prodBadge}>
                          {meeting.productivityScore}% Score
                        </span>
                      ) : (
                        <span className="badge badge-todo" style={styles.prodBadge}>
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {meeting.goal && (
                    <p style={styles.meetingGoal}>
                      <strong>Goal:</strong> {meeting.goal}
                    </p>
                  )}

                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div style={styles.agendaPreview}>
                      <strong>Agenda:</strong> {meeting.agenda.slice(0, 2).join(' • ')} 
                      {meeting.agenda.length > 2 && ' ...'}
                    </div>
                  )}

                  <div style={styles.meetingFooter}>
                    <button 
                      onClick={() => {
                        onSelectMeeting(meeting);
                        setActiveTab('room');
                      }} 
                      style={styles.actionBtn} 
                      className="outline-btn"
                    >
                      {meeting.duration > 0 ? 'View AI Summary & Notes' : 'Join & Start Transcribe'}
                      <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Summary Panel */}
        <div style={styles.sidebarPanel} className="glass-panel">
          <h3 style={styles.sectionTitle}>Task Summary</h3>
          <div style={styles.taskStatsContainer}>
            <div style={styles.taskProgressBarContainer}>
              <div style={styles.taskProgressText}>
                <span>Completed Tasks</span>
                <span>
                  {stats.tasks.completed} / {stats.tasks.total}
                </span>
              </div>
              <div style={styles.progressBg}>
                <div 
                  style={styles.progressFill(
                    stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0
                  )}
                ></div>
              </div>
            </div>

            <div style={styles.taskBreakdown}>
              <div style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>To Do</span>
                <span className="badge badge-todo">{stats.tasks.todo}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>In Progress</span>
                <span className="badge badge-progress">{stats.tasks.in_progress}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>Completed</span>
                <span className="badge badge-completed">{stats.tasks.completed}</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('kanban')} 
              style={styles.viewBoardBtn} 
              className="violet-glow-btn"
            >
              <CheckCircle2 size={16} />
              <span>Go to Kanban Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="glass-panel fade-in">
            <h2 style={styles.modalTitle}>Schedule New Meeting</h2>
            <p style={styles.modalSub}>Enter the details below. Our AI will automatically pre-generate a custom agenda.</p>
            
            {schedulingError && (
              <div style={styles.errorBox}>{schedulingError}</div>
            )}

            <form onSubmit={handleSchedule} style={styles.modalForm}>
              <div className="form-group">
                <label>Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g., UI/UX Design Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Meeting Goal / Objective</label>
                <textarea
                  placeholder="e.g., Review the design guidelines and align on terracotta/obsidian color palette."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="form-input"
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label>Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowScheduleForm(false)} 
                  className="outline-btn"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={schedulingLoading} 
                  className="coral-glow-btn"
                  style={{ padding: '10px 20px' }}
                >
                  <Sparkles size={16} />
                  <span>{schedulingLoading ? 'Scheduling...' : 'AI Schedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '35px',
    textAlign: 'left',
  },
  title: {
    fontSize: '28px',
    color: '#ffffff',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'left',
  },
  statIconWrapper: (index) => {
    const backgrounds = [
      'rgba(255, 107, 74, 0.08)',
      'rgba(139, 92, 246, 0.08)',
      'rgba(16, 185, 129, 0.08)',
      'rgba(245, 158, 11, 0.08)'
    ];
    const borders = [
      '1px solid rgba(255, 107, 74, 0.15)',
      '1px solid rgba(139, 92, 246, 0.15)',
      '1px solid rgba(16, 185, 129, 0.15)',
      '1px solid rgba(245, 158, 11, 0.15)'
    ];
    return {
      width: '42px',
      height: '42px',
      borderRadius: '10px',
      background: backgrounds[(index - 1) % 4],
      border: borders[(index - 1) % 4],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  },
  statVal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.8fr 1fr',
    gap: '24px',
  },
  section: {
    padding: '30px',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#ffffff',
    marginBottom: '20px',
    fontWeight: '600',
  },
  sidebarPanel: {
    padding: '30px',
    textAlign: 'left',
    height: 'fit-content',
  },
  loading: {
    padding: '40px 0',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  emptyState: {
    padding: '60px 0',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyBtn: {
    marginTop: '16px',
    fontSize: '14px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  meetingItem: {
    border: '1px solid var(--panel-border)',
    borderRadius: '12px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.01)',
    transition: 'all 0.2s ease',
  },
  meetingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  meetingMainInfo: {
    textAlign: 'left',
  },
  meetingTitle: {
    fontSize: '17px',
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: '4px',
  },
  meetingMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  metaSpan: {
    display: 'flex',
    alignItems: 'center',
  },
  prodBadge: {
    fontSize: '11px',
    padding: '4px 8px',
  },
  meetingGoal: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  agendaPreview: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  meetingFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
  taskStatsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  taskProgressBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  taskProgressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  progressBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: (percent) => ({
    width: `${percent}%`,
    height: '100%',
    background: 'linear-gradient(90deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  }),
  taskBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  breakdownLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  viewBoardBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '500px',
    padding: '30px',
    background: 'var(--bg-secondary)',
    textAlign: 'left',
  },
  modalTitle: {
    fontSize: '22px',
    color: '#ffffff',
    marginBottom: '6px',
  },
  modalSub: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: '1.4',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  errorBox: {
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  }
};

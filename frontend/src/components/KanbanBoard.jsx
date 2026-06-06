import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';

export default function KanbanBoard({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // New Task form state
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('Alok Singh');
  const [status, setStatus] = useState('todo');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const teamMembers = ['Alok Singh', 'Shweta Keshari', 'Harsh Pal', 'Abdul Rashid Ansari'];

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, assignee, status, deadline })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to create task');

      setTasks(prev => [data, ...prev]);
      setShowAddTask(false);
      setText('');
      setAssignee('Alok Singh');
      setStatus('todo');
      setDeadline('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      if (response.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getTasksByStatus = (colStatus) => {
    return tasks.filter(task => task.status === colStatus);
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Action Items Board</h1>
          <p style={styles.subtitle}>Track responsibilities and deadlines extracted by AI from meeting notes.</p>
        </div>
        <button 
          onClick={() => setShowAddTask(true)} 
          className="coral-glow-btn"
        >
          <Plus size={18} />
          <span>Add Action Item</span>
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading action items...</div>
      ) : (
        /* Columns Grid */
        <div style={styles.boardGrid}>
          {/* TO DO Column */}
          <div style={styles.column} className="glass-panel">
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>
                <div style={{ ...styles.columnDot, background: 'var(--amber-accent)' }}></div>
                To Do
              </h3>
              <span className="badge badge-todo">{getTasksByStatus('todo').length}</span>
            </div>
            <div style={styles.cardsArea}>
              {getTasksByStatus('todo').map(task => (
                <div key={task._id} style={styles.card} className="glass-panel">
                  <p style={styles.cardText}>{task.text}</p>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <User size={12} color="var(--text-secondary)" />
                      <span>{task.assignee}</span>
                    </div>
                    {task.deadline && (
                      <div style={styles.metaItem}>
                        <Calendar size={12} color="var(--text-secondary)" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardActions}>
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      style={styles.deleteBtn}
                      title="Delete action item"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleMoveTask(task._id, 'in_progress')}
                      style={styles.moveBtn}
                      title="Move to In Progress"
                    >
                      <span>Start</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div style={styles.column} className="glass-panel">
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>
                <div style={{ ...styles.columnDot, background: 'var(--violet-accent)' }}></div>
                In Progress
              </h3>
              <span className="badge badge-progress">{getTasksByStatus('in_progress').length}</span>
            </div>
            <div style={styles.cardsArea}>
              {getTasksByStatus('in_progress').map(task => (
                <div key={task._id} style={styles.card} className="glass-panel">
                  <p style={styles.cardText}>{task.text}</p>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <User size={12} color="var(--text-secondary)" />
                      <span>{task.assignee}</span>
                    </div>
                    {task.deadline && (
                      <div style={styles.metaItem}>
                        <Calendar size={12} color="var(--text-secondary)" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardActions}>
                    <button 
                      onClick={() => handleMoveTask(task._id, 'todo')}
                      style={styles.backBtn}
                      title="Move to To Do"
                    >
                      <ArrowLeft size={12} />
                      <span>Back</span>
                    </button>
                    <button 
                      onClick={() => handleMoveTask(task._id, 'completed')}
                      style={{ ...styles.moveBtn, borderColor: 'var(--emerald-accent)' }}
                      title="Mark as Completed"
                    >
                      <span>Complete</span>
                      <Check size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div style={styles.column} className="glass-panel">
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>
                <div style={{ ...styles.columnDot, background: 'var(--emerald-accent)' }}></div>
                Completed
              </h3>
              <span className="badge badge-completed">{getTasksByStatus('completed').length}</span>
            </div>
            <div style={styles.cardsArea}>
              {getTasksByStatus('completed').map(task => (
                <div key={task._id} style={styles.card} className="glass-panel" style={{ ...styles.card, opacity: 0.7 }}>
                  <p style={{ ...styles.cardText, textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                    {task.text}
                  </p>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <User size={12} color="var(--text-muted)" />
                      <span>{task.assignee}</span>
                    </div>
                    {task.deadline && (
                      <div style={styles.metaItem}>
                        <Calendar size={12} color="var(--text-muted)" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardActions}>
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      style={styles.deleteBtn}
                      title="Delete action item"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleMoveTask(task._id, 'in_progress')}
                      style={styles.backBtn}
                      title="Reopen action item"
                    >
                      <ArrowLeft size={12} />
                      <span>Reopen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="glass-panel fade-in">
            <h2 style={styles.modalTitle}>Add New Action Item</h2>
            <p style={styles.modalSub}>Create a manual task and assign responsibility.</p>
            
            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}

            <form onSubmit={handleAddTask} style={styles.modalForm}>
              <div className="form-group">
                <label>Action Description</label>
                <input
                  type="text"
                  placeholder="e.g., Integrate custom CSS layout variables"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 0 }}>
                <div className="form-group">
                  <label>Assignee</label>
                  <select 
                    value={assignee} 
                    onChange={(e) => setAssignee(e.target.value)}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    {teamMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowAddTask(false)} 
                  className="outline-btn"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="coral-glow-btn"
                  style={{ padding: '10px 20px' }}
                >
                  <Sparkles size={16} />
                  <span>Create Item</span>
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
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
  loading: {
    padding: '60px 0',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    alignItems: 'flex-start',
    minHeight: '550px',
  },
  column: {
    padding: '20px',
    background: 'rgba(21, 24, 33, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '500px',
    textAlign: 'left',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--panel-border)',
    paddingBottom: '12px',
  },
  columnTitle: {
    fontSize: '16px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  columnDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  cardsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flexGrow: 1,
  },
  card: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--panel-border)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  cardText: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    paddingTop: '10px',
    marginTop: '4px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease, background 0.2s ease',
  },
  moveBtn: {
    background: 'transparent',
    border: '1px solid var(--panel-border)',
    borderRadius: '6px',
    padding: '4px 8px',
    color: 'var(--text-primary)',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
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
    maxWidth: '450px',
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

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  User, 
  Clock, 
  Globe, 
  Save, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export default function MeetingRoom({ selectedMeeting, token, onMeetingUpdated, setActiveTab }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState('Alok Singh');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Results pane
  const [showResults, setShowResults] = useState(false);
  const [processedMeeting, setProcessedMeeting] = useState(null);
  const [extractedTasks, setExtractedTasks] = useState([]);

  const recognitionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const transcriptEndRef = useRef(null);

  const teamMembers = ['Alok Singh', 'Shweta Keshari', 'Harsh Pal', 'Abdul Rashid Ansari'];

  // Seed transcription simulation sentences
  const simulationPhrases = [
    { speaker: 'Alok Singh', text: 'Let\'s kick off this sprint. We need to define our styling principles first.' },
    { speaker: 'Abdul Rashid Ansari', text: 'I can design a beautiful glassmorphic layout. I will write a custom CSS file with variable palettes.' },
    { speaker: 'Harsh Pal', text: 'Excellent. I will setup the Express routes and write the schemas for Users and Tasks.' },
    { speaker: 'Shweta Keshari', text: 'I need to check the web speech API. I will build the real-time speech-to-text integration.' },
    { speaker: 'Alok Singh', text: 'Sounds like a plan! Let\'s complete these tasks and test everything by Friday.' }
  ];
  const [simIndex, setSimIndex] = useState(0);

  // Scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Duration timer
  useEffect(() => {
    if (isRecording) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isRecording]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const text = event.results[lastResultIndex][0].transcript;
        
        const timestamp = formatTime(duration);
        setTranscript(prev => [...prev, {
          speaker: activeSpeaker,
          text: text.trim(),
          timestamp
        }]);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setError('Microphone access denied. Falling back to Simulation Mode.');
        }
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }, [activeSpeaker, duration]);

  const toggleRecording = () => {
    if (!selectedMeeting) {
      setError('Please schedule or select a meeting from the Dashboard first.');
      return;
    }
    setError('');

    if (isRecording) {
      // Stop
      setIsRecording(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    } else {
      // Start
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // If already started or fails
          console.warn('Failed to start native speech. Running simulation support.');
        }
      }
    }
  };

  // Simulate a line of speech
  const handleSimulateSpeech = () => {
    if (!isRecording) return;
    
    const phrase = simulationPhrases[simIndex % simulationPhrases.length];
    const timestamp = formatTime(duration);
    
    setTranscript(prev => [...prev, {
      speaker: phrase.speaker,
      text: phrase.text,
      timestamp
    }]);

    setSimIndex(prev => prev + 1);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndMeeting = async () => {
    if (transcript.length === 0) {
      setError('Cannot summarize an empty meeting. Record some speech first.');
      return;
    }
    
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    setProcessing(true);
    setError('');

    const meetingDurationMinutes = Math.max(1, Math.ceil(duration / 60));

    try {
      const response = await fetch(`http://localhost:5001/api/meetings/${selectedMeeting._id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: selectedMeeting.title,
          transcript,
          duration: meetingDurationMinutes,
          language: selectedLanguage
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Processing failed');

      setProcessedMeeting(data.meeting);
      setExtractedTasks(data.tasks);
      setShowResults(true);

      // Notify parent of updates
      if (onMeetingUpdated) onMeetingUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Translate Mock
  const handleTranslate = (lang) => {
    setSelectedLanguage(lang);
    if (transcript.length === 0) return;

    // Simulate simple translation suffix to show language change
    const langSuffixes = {
      'English': '',
      'Hindi': ' (अनुवादित)',
      'Spanish': ' (traducido)',
      'French': ' (traduit)',
      'German': ' (übersetzt)'
    };

    setTranscript(prev => prev.map(t => ({
      ...t,
      text: t.text.endsWith(')') ? t.text.replace(/\s\([^)]+\)$/, '') + langSuffixes[lang] : t.text + langSuffixes[lang]
    })));
  };

  if (!selectedMeeting) {
    return (
      <div style={styles.noSelection} className="glass-panel fade-in">
        <MicOff size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        <h2>No Active Meeting</h2>
        <p>Please select a scheduled meeting from the Dashboard to join the room.</p>
        <button onClick={() => setActiveTab('dashboard')} className="coral-glow-btn" style={{ marginTop: '20px' }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      {/* Meeting Header */}
      <div style={styles.meetingHeader} className="glass-panel">
        <div style={styles.headerInfo}>
          <div style={styles.headerBadge}>
            <span className="pulse-dot" style={{ display: isRecording ? 'inline-block' : 'none' }}></span>
            <span style={{ color: isRecording ? 'var(--coral-accent)' : 'var(--text-secondary)' }}>
              {isRecording ? 'Meeting Live' : 'Room Ready'}
            </span>
          </div>
          <h1 style={styles.meetingTitle}>{selectedMeeting.title}</h1>
          <p style={styles.meetingGoal}><strong>Goal:</strong> {selectedMeeting.goal || 'No goal specified.'}</p>
        </div>

        <div style={styles.headerControls}>
          <div style={styles.timerBox}>
            <Clock size={16} color="var(--text-secondary)" />
            <span style={styles.timerText}>{formatTime(duration)}</span>
          </div>

          <div style={styles.langSelectWrapper}>
            <Globe size={16} color="var(--text-secondary)" />
            <select 
              value={selectedLanguage} 
              onChange={(e) => handleTranslate(e.target.value)}
              style={styles.langSelect}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
            </select>
          </div>
        </div>
      </div>

      {showResults ? (
        /* Post Meeting AI Summary Results View */
        <div style={styles.resultsWrapper} className="fade-in">
          <div style={styles.statsPanel} className="glass-panel">
            <h3 style={styles.resultsTitle}>
              <Sparkles size={20} color="var(--coral-accent)" />
              AI Meeting Analysis
            </h3>
            
            <div style={styles.metricsRow}>
              <div style={styles.metricItem}>
                <div style={styles.metricVal}>{processedMeeting?.productivityScore}%</div>
                <div style={styles.metricLabel}>Productivity Score</div>
              </div>
              <div style={styles.metricItem}>
                <div style={styles.metricVal}>{processedMeeting?.duration} mins</div>
                <div style={styles.metricLabel}>Meeting Duration</div>
              </div>
              <div style={styles.metricItem}>
                <div style={styles.metricVal}>{extractedTasks.length}</div>
                <div style={styles.metricLabel}>Extracted Action Items</div>
              </div>
            </div>

            <div style={styles.summaryBox}>
              <h4 style={styles.subHeading}>AI Smart Summary</h4>
              <p style={styles.summaryText}>{processedMeeting?.summary}</p>
            </div>
          </div>

          <div style={styles.tasksPanel} className="glass-panel">
            <h3 style={styles.resultsTitle}>
              <CheckCircle size={20} color="var(--emerald-accent)" />
              Extracted Action Items
            </h3>
            
            {extractedTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No action items were identified in the conversation.</p>
            ) : (
              <div style={styles.tasksList}>
                {extractedTasks.map((task, idx) => (
                  <div key={task._id || idx} style={styles.taskCard}>
                    <div style={styles.taskCardHeader}>
                      <span className="badge badge-todo">To Do</span>
                      <span style={styles.taskAssignee}>
                        <User size={12} style={{ marginRight: '4px' }} />
                        {task.assignee}
                      </span>
                    </div>
                    <p style={styles.taskText}>{task.text}</p>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setActiveTab('kanban')} 
              style={styles.actionBoardBtn} 
              className="violet-glow-btn"
            >
              <span>Manage on Kanban Board</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Active Transcription View */
        <div style={styles.roomContent}>
          {/* Left panel: Agenda & Controls */}
          <div style={styles.leftCol}>
            <div style={styles.controlPanel} className="glass-panel">
              <h3 style={styles.sectionTitle}>Controls</h3>
              
              {error && (
                <div style={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={styles.micButtonContainer}>
                <button 
                  onClick={toggleRecording} 
                  style={styles.micBtn(isRecording)}
                >
                  {isRecording ? <Mic size={28} /> : <MicOff size={28} />}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <strong>{isRecording ? 'Mic is Active' : 'Mic is Muted'}</strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isRecording ? 'Listening for voice input...' : 'Click to begin transcribing'}
                  </p>
                </div>
              </div>

              {isRecording && (
                <div style={styles.simulationHelper} className="glass-panel">
                  <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                    💡 <strong>Test Simulation Support:</strong> Click below to simulate high-fidelity meeting dialogue blocks.
                  </p>
                  <button 
                    onClick={handleSimulateSpeech} 
                    className="outline-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                  >
                    Simulate Next Dialogue
                  </button>
                </div>
              )}

              <button 
                onClick={handleEndMeeting}
                disabled={processing || transcript.length === 0}
                style={styles.endBtn} 
                className="coral-glow-btn"
              >
                <Save size={16} />
                <span>{processing ? 'Processing...' : 'End & Analyze Meeting'}</span>
              </button>
            </div>

            {/* Agenda Panel */}
            <div style={styles.agendaPanel} className="glass-panel">
              <h3 style={styles.sectionTitle}>Generated Agenda</h3>
              <div style={styles.agendaList}>
                {selectedMeeting.agenda?.map((item, idx) => (
                  <div key={idx} style={styles.agendaItem}>
                    <div style={styles.agendaIdx}>{idx + 1}</div>
                    <div style={styles.agendaText}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Real-time Transcription Display */}
          <div style={styles.transcriptPanel} className="glass-panel">
            <div style={styles.transcriptHeader}>
              <h3 style={styles.sectionTitle} style={{ margin: 0 }}>Real-Time Live Notes</h3>
              {isRecording && (
                <div className="voice-wave">
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                </div>
              )}
            </div>

            {/* Speaker Selector */}
            <div style={styles.speakerSelector}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Active Speaker:
              </span>
              <div style={styles.speakerButtons}>
                {teamMembers.map(member => (
                  <button
                    key={member}
                    onClick={() => setActiveSpeaker(member)}
                    style={styles.speakerBtn(activeSpeaker === member)}
                  >
                    {member.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript Scroll Area */}
            <div style={styles.transcriptArea}>
              {transcript.length === 0 ? (
                <div style={styles.emptyTranscript}>
                  <Mic size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                  <p>Transcript will appear here in real-time as the team speaks.</p>
                </div>
              ) : (
                transcript.map((block, idx) => (
                  <div key={idx} style={styles.transcriptBlock}>
                    <div style={styles.blockMeta}>
                      <span style={styles.blockSpeaker}>{block.speaker}</span>
                      <span style={styles.blockTime}>{block.timestamp}</span>
                    </div>
                    <p style={styles.blockText}>{block.text}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
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
  noSelection: {
    padding: '80px 40px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '60px auto 0',
  },
  meetingHeader: {
    padding: '24px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(21, 24, 33, 0.4)',
    textAlign: 'left',
  },
  headerInfo: {
    flexGrow: 1,
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  meetingTitle: {
    fontSize: '24px',
    color: '#ffffff',
    marginBottom: '6px',
  },
  meetingGoal: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  headerControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  timerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--panel-border)',
  },
  timerText: {
    fontFamily: 'monospace',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  langSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--panel-border)',
  },
  langSelect: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    cursor: 'pointer',
  },
  roomContent: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '24px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  controlPanel: {
    padding: '30px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#ffffff',
    marginBottom: '20px',
    fontWeight: '600',
  },
  micButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  micBtn: (active) => ({
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    border: 'none',
    background: active ? 'var(--coral-accent)' : 'rgba(255,255,255,0.03)',
    border: active ? 'none' : '1px solid var(--panel-border)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: active ? '0 0 30px var(--coral-glow-strong)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  simulationHelper: {
    background: 'rgba(245, 158, 11, 0.02)',
    border: '1px solid rgba(245, 158, 11, 0.1)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '16px',
    color: 'var(--text-secondary)',
  },
  endBtn: {
    width: '100%',
    justifyContent: 'center',
  },
  agendaPanel: {
    padding: '30px',
    textAlign: 'left',
  },
  agendaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  agendaItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  agendaIdx: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    background: 'rgba(255, 107, 74, 0.1)',
    border: '1px solid rgba(255, 107, 74, 0.2)',
    color: 'var(--coral-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0,
    marginTop: '2px',
  },
  agendaText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  transcriptPanel: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
  },
  transcriptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--panel-border)',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  speakerSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  speakerButtons: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  speakerBtn: (active) => ({
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: active ? 'var(--coral-accent)' : 'var(--panel-border)',
    background: active ? 'rgba(255, 107, 74, 0.1)' : 'transparent',
    color: active ? 'var(--coral-accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  }),
  transcriptArea: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingRight: '10px',
  },
  emptyTranscript: {
    margin: 'auto',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    maxWidth: '300px',
  },
  transcriptBlock: {
    textAlign: 'left',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  blockMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  blockSpeaker: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--coral-accent)',
  },
  blockTime: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  blockText: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
  },
  errorBox: {
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  resultsWrapper: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    textAlign: 'left',
  },
  statsPanel: {
    padding: '30px',
  },
  tasksPanel: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
  },
  resultsTitle: {
    fontSize: '18px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid var(--panel-border)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  metricsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '30px',
  },
  metricItem: {
    flex: 1,
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--panel-border)',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  metricVal: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  summaryBox: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--panel-border)',
    padding: '20px',
    borderRadius: '12px',
  },
  subHeading: {
    fontSize: '14px',
    color: 'var(--coral-accent)',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  summaryText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexGrow: 1,
    maxHeight: '350px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  taskCard: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--panel-border)',
    padding: '14px 16px',
    borderRadius: '10px',
  },
  taskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  taskAssignee: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  taskText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
  },
  actionBoardBtn: {
    width: '100%',
    justifyContent: 'center',
    marginTop: '20px',
    padding: '12px',
    fontSize: '14px',
  }
};

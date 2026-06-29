import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ============================================================================
// OFFLINE & LOCALSTORAGE HYBRID FALLBACK INTERCEPTOR
// Intercepts API calls to handle network failures / missing backend gracefully.
// ============================================================================

const originalFetch = window.fetch;

// Initialize mock client-side database if not present
if (!localStorage.getItem('mock_meetings')) {
  const seedMeetings = [
    {
      _id: 'meet_001',
      userId: 'user_demo_123',
      title: 'Project Kickoff & Brainstorming',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      goal: 'Kickoff the new AI Meeting Intelligent project and align on team roles.',
      agenda: [
        'Welcome & Introductions (5m)',
        'Slide contents review (15m)',
        'Backend routing & schemas (15m)',
        'Frontend React designs (10m)'
      ],
      transcript: [
        { speaker: 'Alok Singh', text: "Let's kick off this sprint. We need to define our styling principles first.", timestamp: '00:15' },
        { speaker: 'Shweta Keshari', text: 'Yes, I think we should outline all slide content first so we know what features are required.', timestamp: '02:00' },
        { speaker: 'Harsh Pal', text: 'Yes, and we need a backend that can extract tasks automatically. I can work on the Express API and Mongoose schemas.', timestamp: '04:30' },
        { speaker: 'Abdul Rashid Ansari', text: 'For the frontend, we should build a Kanban board for tasks and an SVG analytics view for speaking times. I can handle the frontend React components.', timestamp: '06:10' },
        { speaker: 'Alok Singh', text: "Great. Let's make sure we include a login page and a very premium, dark glassmorphism design. Let's set deadlines for these tasks by next week.", timestamp: '08:45' }
      ],
      summary: 'The team kicked off the AI Meeting Intelligent project. Alok Singh led the meeting. Shweta Keshari summarized slide requirements. Harsh Pal took ownership of the MERN backend setup, while Abdul Rashid Ansari agreed to build the React components, including the Kanban board and SVG charts. Alok Singh emphasized the need for a premium dark glassmorphic design and user authentication.',
      productivityScore: 92,
      language: 'English',
      deviceType: 'Laptop/Desktop',
      micOnTime: 2100,
      cameraOnTime: 1800,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'meet_002',
      userId: 'user_demo_123',
      title: 'Weekly Sync & Design Review',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      goal: 'Review backend routes and styling architecture for React frontend.',
      agenda: [
        'Check backend API connectivity (10m)',
        'Review custom CSS variables and UI screens (15m)',
        'Next steps (5m)'
      ],
      transcript: [
        { speaker: 'Harsh Pal', text: 'The Express server is fully written. I implemented a fallback in-memory DB so it runs even without MongoDB locally.', timestamp: '00:45' },
        { speaker: 'Abdul Rashid Ansari', text: 'That is awesome, Harsh! I created the base CSS styles. I used a deep obsidian background with coral and violet accents.', timestamp: '02:30' },
        { speaker: 'Shweta Keshari', text: 'The UI looks amazing. We should make sure we integrate the HTML5 Web Speech API for the room transcription so it works live.', timestamp: '04:50' },
        { speaker: 'Alok Singh', text: "Agreed. Let's complete the integration today and prepare for testing the dashboard and Kanban board.", timestamp: '07:15' }
      ],
      summary: 'The team reviewed backend APIs and the frontend design system. Harsh confirmed backend APIs are ready with a memory fallback. Abdul demonstrated the obsidian-coral-violet glassmorphic UI. Shweta recommended using Web Speech API for real-time transcription. Alok set the target to complete integration today.',
      productivityScore: 88,
      language: 'English',
      deviceType: 'Phone',
      micOnTime: 1620,
      cameraOnTime: 0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('mock_meetings', JSON.stringify(seedMeetings));
}

if (!localStorage.getItem('mock_tasks')) {
  const seedTasks = [
    { _id: 'task_001', userId: 'user_demo_123', meetingId: 'meet_001', text: 'Review slide presentation and outline feature checklist', assignee: 'Shweta Keshari', status: 'completed', deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'task_002', userId: 'user_demo_123', meetingId: 'meet_001', text: 'Setup Express routes and write schemas for Users, Meetings and Tasks', assignee: 'Harsh Pal', status: 'in_progress', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: 'task_003', userId: 'user_demo_123', meetingId: 'meet_001', text: 'Build React UI components including Kanban board and SVG charts', assignee: 'Abdul Rashid Ansari', status: 'todo', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }
  ];
  localStorage.setItem('mock_tasks', JSON.stringify(seedTasks));
}

function generateMockAgenda(goal) {
  if (!goal) return ['Introduction & Welcome (5m)', 'Main Discussion (20m)', 'Action Items Review (5m)'];
  const goalLower = goal.toLowerCase();
  const agenda = ['Introduction & Welcome (5m)'];
  if (goalLower.includes('design') || goalLower.includes('ui') || goalLower.includes('ux')) {
    agenda.push('Review User Personas & Wireframes (10m)');
    agenda.push('Design System & Color Palette Discussion (15m)');
  } else {
    agenda.push('Key Objectives Review (10m)');
    agenda.push('Strategy & Implementation Roadmap (15m)');
  }
  agenda.push('Task Assignment & Next Steps (5m)');
  return agenda;
}

window.fetch = async function (input, init) {
  const url = typeof input === 'string' ? input : input.url;
  
  if (url.includes('/api/')) {
    try {
      // Try real network request first
      const response = await originalFetch(input, init);
      return response;
    } catch (networkError) {
      console.warn('[Offline Fallback] Server unreachable. Serving request client-side via LocalStorage:', url);
      
      let cleanUrl = url;
      if (url.startsWith('http')) {
        const parsed = new URL(url);
        cleanUrl = parsed.pathname + parsed.search;
      }
      
      let responseBody = {};
      let status = 200;
      
      // 1. Authentication routes
      if (cleanUrl.includes('/api/auth/login')) {
        const payload = init && init.body ? JSON.parse(init.body) : {};
        responseBody = {
          token: 'mock-jwt-token-12345',
          user: { id: 'user_demo_123', name: 'Demo User', email: payload.email || 'demo@aimeeting.com' }
        };
      } else if (cleanUrl.includes('/api/auth/register')) {
        const payload = init && init.body ? JSON.parse(init.body) : {};
        responseBody = {
          token: 'mock-jwt-token-12345',
          user: { id: 'user_demo_123', name: payload.name || 'Demo User', email: payload.email || 'demo@aimeeting.com' }
        };
      } else if (cleanUrl.includes('/api/auth/me')) {
        responseBody = { id: 'user_demo_123', name: 'Demo User', email: 'demo@aimeeting.com' };
      }
      
      // 2. Meetings endpoints
      else if (cleanUrl.includes('/api/meetings/schedule')) {
        const payload = init && init.body ? JSON.parse(init.body) : {};
        const newMeeting = {
          _id: 'meet_' + Date.now(),
          userId: 'user_demo_123',
          title: payload.title || 'Untitled Meeting',
          date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
          duration: 0,
          goal: payload.goal || '',
          agenda: generateMockAgenda(payload.goal),
          transcript: [],
          summary: '',
          productivityScore: 100,
          language: 'English',
          createdAt: new Date().toISOString()
        };
        const meetings = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
        meetings.unshift(newMeeting);
        localStorage.setItem('mock_meetings', JSON.stringify(meetings));
        responseBody = newMeeting;
      } else if (cleanUrl.includes('/process')) {
        const match = cleanUrl.match(/\/api\/meetings\/([^/]+)\/process/);
        const meetingId = match ? match[1] : '';
        const payload = init && init.body ? JSON.parse(init.body) : {};
        
        const meetings = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
        const idx = meetings.findIndex(m => m._id === meetingId);
        let meeting = null;
        
        if (idx !== -1) {
          meeting = meetings[idx];
          meeting.transcript = payload.transcript || [];
          meeting.duration = payload.duration || 0;
          meeting.summary = `This meeting concluded after reviewing "${payload.title || 'the agenda'}". Key items discussed included: ` +
                (payload.transcript || []).slice(0, 3).map(t => `"${t.text.substring(0, 40)}..." by ${t.speaker}`).join(', ') + 
                '. The team coordinated on setting up task ownership and deadlines.';
          meeting.deviceType = payload.deviceType || 'Laptop/Desktop';
          meeting.micOnTime = payload.micOnTime || 0;
          meeting.cameraOnTime = payload.cameraOnTime || 0;
          
          let score = 75;
          if (meeting.transcript.length > 2) score += 10;
          if (meeting.duration > 10 && meeting.duration < 60) score += 10;
          meeting.productivityScore = Math.min(score, 100);
          
          meetings[idx] = meeting;
          localStorage.setItem('mock_meetings', JSON.stringify(meetings));
        }
        
        // Extract mock tasks
        const newTasks = [];
        if (payload.transcript) {
          payload.transcript.forEach(t => {
            const isAction = /\b(will|should|can|please|need to|must|task|action|assign|ownership|develop|design|build|write|setup|fix|test)\b/i.test(t.text);
            if (isAction && t.text.length > 15) {
              const task = {
                _id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                userId: 'user_demo_123',
                meetingId,
                text: t.text,
                assignee: t.speaker || 'Demo User',
                status: 'todo',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
              };
              newTasks.push(task);
              const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
              tasks.push(task);
              localStorage.setItem('mock_tasks', JSON.stringify(tasks));
            }
          });
        }
        
        responseBody = { meeting, tasks: newTasks };
      } else if (cleanUrl.match(/\/api\/meetings\/([^/]+)$/)) {
        const match = cleanUrl.match(/\/api\/meetings\/([^/]+)$/);
        const meetingId = match[1];
        const meetings = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
        const meeting = meetings.find(m => m._id === meetingId);
        if (meeting) {
          responseBody = meeting;
        } else {
          status = 404;
          responseBody = { msg: 'Meeting not found' };
        }
      } else if (cleanUrl.includes('/api/meetings')) {
        responseBody = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
      }
      
      // 3. Tasks endpoints
      else if (cleanUrl.match(/\/api\/tasks\/([^/]+)$/) && init && init.method === 'PUT') {
        const match = cleanUrl.match(/\/api\/tasks\/([^/]+)$/);
        const taskId = match[1];
        const payload = init.body ? JSON.parse(init.body) : {};
        const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        const idx = tasks.findIndex(t => t._id === taskId);
        if (idx !== -1) {
          tasks[idx] = { ...tasks[idx], ...payload };
          localStorage.setItem('mock_tasks', JSON.stringify(tasks));
          responseBody = tasks[idx];
        } else {
          status = 404;
          responseBody = { msg: 'Task not found' };
        }
      } else if (cleanUrl.includes('/api/tasks')) {
        responseBody = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
      }
      
      // 4. Analytics endpoints
      else if (cleanUrl.includes('/api/analytics/summary')) {
        const meetings = JSON.parse(localStorage.getItem('mock_meetings') || '[]');
        const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        
        const totalDuration = meetings.reduce((acc, m) => acc + (m.duration || 0), 0);
        const avgProd = meetings.length ? Math.round(meetings.reduce((acc, m) => acc + (m.productivityScore || 0), 0) / meetings.length) : 0;
        
        responseBody = {
          stats: {
            totalMeetings: meetings.length,
            totalDuration,
            avgProductivity: avgProd
          },
          tasks: {
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
          },
          speakerBalance: [
            { name: 'Alok Singh', percentage: 40, color: 'var(--coral-accent)' },
            { name: 'Abdul Rashid Ansari', percentage: 25, color: 'var(--violet-accent)' },
            { name: 'Harsh Pal', percentage: 20, color: 'var(--emerald-accent)' },
            { name: 'Shweta Keshari', percentage: 15, color: 'var(--amber-accent)' }
          ],
          productivityTimeline: meetings.slice().reverse().map(m => ({
            date: m.date ? m.date.substring(5, 10) : '',
            score: m.productivityScore || 100
          }))
        };
      }
      
      return new Response(JSON.stringify(responseBody), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

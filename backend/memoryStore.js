const bcrypt = require('bcryptjs');

// Mock memory store databases
const users = [];
const meetings = [];
const tasks = [];

// Seed Initial Data
const seedData = async () => {
    // 1. Seed default user (password: demo123)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);
    const demoUser = {
        _id: 'user_demo_123',
        name: 'Demo User',
        email: 'demo@aimeeting.com',
        password: hashedPassword,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    };
    users.push(demoUser);

    // 2. Seed past meetings
    const pastMeetings = [
        {
            _id: 'meet_001',
            userId: 'user_demo_123',
            title: 'Project Kickoff & Brainstorming',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000), // 4 days ago
            duration: 45, // minutes
            goal: 'Kickoff the new AI Meeting Intelligent project and align on team roles.',
            agenda: [
                'Welcome and introductions (10m)',
                'Review of project requirements and slides (15m)',
                'Brainstorming architecture and technology stack (15m)',
                'Action items and responsibilities (5m)'
            ],
            transcript: [
                { speaker: 'Alok Singh', text: 'Welcome everyone to our project kickoff! Let\'s go over the AI Meeting Intelligent requirements.', timestamp: '00:05' },
                { speaker: 'Shweta Keshari', text: 'I reviewed the PPT slides. We need to focus on smart agenda generation, real-time transcription, and analytics.', timestamp: '02:15' },
                { speaker: 'Harsh Pal', text: 'Yes, and we need a backend that can extract tasks automatically. I can work on the Express API and Mongoose schemas.', timestamp: '04:30' },
                { speaker: 'Abdul Rashid Ansari', text: 'For the frontend, we should build a Kanban board for tasks and an SVG analytics view for speaking times. I can handle the frontend React components.', timestamp: '06:10' },
                { speaker: 'Alok Singh', text: 'Great. Let\'s make sure we include a login page and a very premium, dark glassmorphism design. Let\'s set deadlines for these tasks by next week.', timestamp: '08:45' }
            ],
            summary: 'The team kicked off the AI Meeting Intelligent project. Alok Singh led the meeting. Shweta Keshari summarized slide requirements. Harsh Pal took ownership of the MERN backend setup, while Abdul Rashid Ansari agreed to build the React components, including the Kanban board and SVG charts. Alok Singh emphasized the need for a premium dark glassmorphic design and user authentication.',
            productivityScore: 92,
            language: 'English',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        {
            _id: 'meet_002',
            userId: 'user_demo_123',
            title: 'Weekly Sync & Design Review',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000), // 1 day ago
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
                { speaker: 'Alok Singh', text: 'Agreed. Let\'s complete the integration today and prepare for testing the dashboard and Kanban board.', timestamp: '07:15' }
            ],
            summary: 'The team reviewed backend APIs and the frontend design system. Harsh confirmed backend APIs are ready with a memory fallback. Abdul demonstrated the obsidian-coral-violet glassmorphic UI. Shweta recommended using Web Speech API for real-time transcription. Alok set the target to complete integration today.',
            productivityScore: 88,
            language: 'English',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
    ];
    meetings.push(...pastMeetings);

    // 3. Seed tasks
    const initialTasks = [
        {
            _id: 'task_001',
            userId: 'user_demo_123',
            meetingId: 'meet_001',
            text: 'Setup Express server.js and configure database connections',
            assignee: 'Harsh Pal',
            status: 'completed',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // in 2 days
        },
        {
            _id: 'task_002',
            userId: 'user_demo_123',
            meetingId: 'meet_001',
            text: 'Design custom CSS stylesheet with glassmorphism presets',
            assignee: 'Abdul Rashid Ansari',
            status: 'completed',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
            _id: 'task_003',
            userId: 'user_demo_123',
            meetingId: 'meet_001',
            text: 'Integrate HTML5 Web Speech API for room transcription',
            assignee: 'Shweta Keshari',
            status: 'in_progress',
            deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
        },
        {
            _id: 'task_004',
            userId: 'user_demo_123',
            meetingId: 'meet_002',
            text: 'Perform end-to-end integration and run validation tests',
            assignee: 'Alok Singh',
            status: 'todo',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
    ];
    tasks.push(...initialTasks);
    
    console.log('Memory database seeded successfully with fallback data!');
};

seedData();

module.exports = {
    users,
    meetings,
    tasks
};

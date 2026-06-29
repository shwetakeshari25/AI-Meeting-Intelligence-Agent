const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const memoryStore = require('../memoryStore');

// Helper to generate AI Agenda based on Goal
function generateAIAgenda(goal) {
    if (!goal) return ['Introduction & Welcome (5m)', 'Main Discussion (20m)', 'Action Items Review (5m)'];
    
    const goalLower = goal.toLowerCase();
    const agenda = ['Introduction & Welcome (5m)'];
    
    if (goalLower.includes('design') || goalLower.includes('ui') || goalLower.includes('ux')) {
        agenda.push('Review User Personas & Wireframes (10m)');
        agenda.push('Design System & Color Palette Discussion (15m)');
        agenda.push('Layout, Spacing, & Animations Review (15m)');
    } else if (goalLower.includes('database') || goalLower.includes('backend') || goalLower.includes('api')) {
        agenda.push('Database Schema Review & Relationships (10m)');
        agenda.push('API Endpoint Architecture & Auth Flow (15m)');
        agenda.push('Performance, Fallback Modes, & Security (15m)');
    } else if (goalLower.includes('marketing') || goalLower.includes('launch') || goalLower.includes('sales')) {
        agenda.push('Target Audience & Market Segments Analysis (10m)');
        agenda.push('Campaign Channels & Content Strategy (15m)');
        agenda.push('Launch Timeline & Budget Allocation (15m)');
    } else {
        agenda.push('Key Objectives Review (10m)');
        agenda.push('Strategy & Implementation Roadmap (15m)');
        agenda.push('Resource Allocation & Blockers (15m)');
    }
    
    agenda.push('Task Assignment & Next Steps (5m)');
    return agenda;
}

// Helper to auto-extract tasks from transcript
function extractTasksFromTranscript(transcript, meetingId, userId) {
    const extractedTasks = [];
    const teamMembers = ['Shweta Keshari', 'Harsh Pal', 'Abdul Rashid Ansari', 'Alok Singh', 'Shweta', 'Harsh', 'Abdul', 'Alok'];
    
    transcript.forEach(block => {
        const text = block.text.trim();
        const speaker = block.speaker;
        
        // Look for task-oriented verbs or keywords
        const isAction = /\b(will|should|can|please|need to|must|task|action|assign|ownership|develop|design|build|write|setup|fix|test)\b/i.test(text);
        
        if (isAction && text.length > 15) {
            let assignee = speaker;
            
            // Check if someone else is mentioned in the text
            for (const member of teamMembers) {
                if (new RegExp('\\b' + member.split(' ')[0] + '\\b', 'i').test(text) && 
                    member.toLowerCase().split(' ')[0] !== speaker.toLowerCase().split(' ')[0]) {
                    assignee = member;
                    break;
                }
            }
            
            // Standardize assignee name
            if (assignee.toLowerCase().includes('shweta')) assignee = 'Shweta Keshari';
            else if (assignee.toLowerCase().includes('harsh')) assignee = 'Harsh Pal';
            else if (assignee.toLowerCase().includes('abdul')) assignee = 'Abdul Rashid Ansari';
            else if (assignee.toLowerCase().includes('alok')) assignee = 'Alok Singh';
            else if (assignee.toLowerCase() === 'user' || assignee === 'Demo User') assignee = 'Alok Singh'; // fallback
            
            // Clean task text
            let taskText = text.replace(/^(ok|okay|yes|yeah|great|sure)\b,?\s*/i, '');
            taskText = taskText.charAt(0).toUpperCase() + taskText.slice(1);
            
            extractedTasks.push({
                _id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                userId,
                meetingId,
                text: taskText,
                assignee,
                status: 'todo',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            });
        }
    });
    
    return extractedTasks;
}

// @route   GET api/meetings
// @desc    Get all meetings for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        if (req.isDbConnected) {
            const meetings = await Meeting.find({ userId: req.user.id }).sort({ date: -1 });
            res.json(meetings);
        } else {
            const userMeetings = memoryStore.meetings
                .filter(m => m.userId === req.user.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            res.json(userMeetings);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/meetings/:id
// @desc    Get meeting by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        if (req.isDbConnected) {
            const meeting = await Meeting.findOne({ _id: req.id || req.params.id, userId: req.user.id });
            if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });
            res.json(meeting);
        } else {
            const meeting = memoryStore.meetings.find(m => m._id === req.params.id && m.userId === req.user.id);
            if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });
            res.json(meeting);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/meetings/schedule
// @desc    Schedule meeting & pre-generate agenda
// @access  Private
router.post('/schedule', auth, async (req, res) => {
    const { title, date, goal } = req.body;

    try {
        if (!title) return res.status(400).json({ msg: 'Meeting title is required' });

        const agenda = generateAIAgenda(goal);

        if (req.isDbConnected) {
            const newMeeting = new Meeting({
                userId: req.user.id,
                title,
                date: date || new Date(),
                goal,
                agenda,
                transcript: [],
                summary: '',
                productivityScore: 100
            });
            const meeting = await newMeeting.save();
            res.json(meeting);
        } else {
            const newMeeting = {
                _id: 'meet_' + Date.now(),
                userId: req.user.id,
                title,
                date: date ? new Date(date) : new Date(),
                duration: 0,
                goal,
                agenda,
                transcript: [],
                summary: '',
                productivityScore: 100,
                language: 'English',
                createdAt: new Date()
            };
            memoryStore.meetings.push(newMeeting);
            res.json(newMeeting);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/meetings/:id/process
// @desc    Post-process meeting (generate summary, extract tasks, compute productivity score)
// @access  Private
router.post('/:id/process', auth, async (req, res) => {
    const { transcript, duration, language, deviceType, micOnTime, cameraOnTime } = req.body;

    try {
        if (!transcript || !Array.isArray(transcript)) {
            return res.status(400).json({ msg: 'Valid transcript array is required' });
        }

        // 1. Generate Summary (Simple Rule-based/NLP Mock)
        let summaryText = '';
        if (transcript.length === 0) {
            summaryText = 'This meeting had no spoken conversation recorded.';
        } else {
            const topics = transcript.map(t => t.text).join(' ');
            summaryText = `This meeting concluded after reviewing "${req.body.title || 'the agenda'}". Key items discussed included: ` +
                transcript.slice(0, 3).map(t => `"${t.text.substring(0, 40)}..." by ${t.speaker}`).join(', ') + 
                '. The team coordinated on setting up task ownership and deadlines.';
        }

        // 2. Extract Tasks
        const extracted = extractTasksFromTranscript(transcript, req.params.id, req.user.id);

        // 3. Compute Productivity Score
        // Formula factors: has transcript, duration fits agenda items, number of action items extracted
        let score = 70; // baseline
        if (transcript.length > 2) score += 10;
        if (extracted.length > 0) score += 15;
        if (duration > 10 && duration < 60) score += 5; // optimal meeting length
        score = Math.min(score, 100);

        if (req.isDbConnected) {
            const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user.id });
            if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });

            meeting.transcript = transcript;
            meeting.duration = duration || 0;
            meeting.summary = summaryText;
            meeting.productivityScore = score;
            if (language) meeting.language = language;
            meeting.deviceType = deviceType || 'Laptop/Desktop';
            meeting.micOnTime = micOnTime || 0;
            meeting.cameraOnTime = cameraOnTime || 0;

            await meeting.save();

            // Save tasks in parallel
            const savedTasks = [];
            for (const task of extracted) {
                const newTask = new Task({
                    userId: req.user.id,
                    meetingId: meeting._id,
                    text: task.text,
                    assignee: task.assignee,
                    status: 'todo',
                    deadline: task.deadline
                });
                const saved = await newTask.save();
                savedTasks.push(saved);
            }

            res.json({ meeting, tasks: savedTasks });
        } else {
            const meetingIndex = memoryStore.meetings.findIndex(m => m._id === req.params.id && m.userId === req.user.id);
            if (meetingIndex === -1) return res.status(404).json({ msg: 'Meeting not found' });

            const meeting = memoryStore.meetings[meetingIndex];
            meeting.transcript = transcript;
            meeting.duration = duration || 0;
            meeting.summary = summaryText;
            meeting.productivityScore = score;
            if (language) meeting.language = language;
            meeting.deviceType = deviceType || 'Laptop/Desktop';
            meeting.micOnTime = micOnTime || 0;
            meeting.cameraOnTime = cameraOnTime || 0;

            // Push tasks to memory
            const savedTasks = [];
            extracted.forEach(task => {
                const cleanTask = {
                    _id: task._id,
                    userId: req.user.id,
                    meetingId: meeting._id,
                    text: task.text,
                    assignee: task.assignee,
                    status: 'todo',
                    deadline: task.deadline,
                    createdAt: new Date()
                };
                memoryStore.tasks.push(cleanTask);
                savedTasks.push(cleanTask);
            });

            res.json({ meeting, tasks: savedTasks });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

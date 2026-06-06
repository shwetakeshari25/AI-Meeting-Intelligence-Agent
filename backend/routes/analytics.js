const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const memoryStore = require('../memoryStore');

// @route   GET api/analytics/summary
// @desc    Get aggregate meeting and task stats for the dashboard
// @access  Private
router.get('/summary', auth, async (req, res) => {
    try {
        let userMeetings = [];
        let userTasks = [];

        if (req.isDbConnected) {
            userMeetings = await Meeting.find({ userId: req.user.id });
            userTasks = await Task.find({ userId: req.user.id });
        } else {
            userMeetings = memoryStore.meetings.filter(m => m.userId === req.user.id);
            userTasks = memoryStore.tasks.filter(t => t.userId === req.user.id);
        }

        // 1. Calculations
        const totalMeetings = userMeetings.length;
        const totalDuration = userMeetings.reduce((sum, m) => sum + (m.duration || 0), 0);
        
        let avgProductivity = 0;
        if (totalMeetings > 0) {
            avgProductivity = Math.round(
                userMeetings.reduce((sum, m) => sum + (m.productivityScore || 0), 0) / totalMeetings
            );
        }

        // 2. Task breakdown
        const taskCounts = { todo: 0, in_progress: 0, completed: 0 };
        userTasks.forEach(t => {
            if (taskCounts[t.status] !== undefined) {
                taskCounts[t.status]++;
            } else {
                taskCounts.todo++; // fallback
            }
        });

        // 3. Speaker balance (calculated from all transcripts)
        const speakerWords = {};
        let totalWords = 0;
        
        userMeetings.forEach(m => {
            if (m.transcript && Array.isArray(m.transcript)) {
                m.transcript.forEach(block => {
                    const words = block.text.split(/\s+/).filter(w => w.length > 0).length;
                    speakerWords[block.speaker] = (speakerWords[block.speaker] || 0) + words;
                    totalWords += words;
                });
            }
        });

        // Convert word counts to percentages
        const speakerBalance = [];
        const colors = ['#ff6b4a', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899']; // unique colors for speakers
        
        let colorIndex = 0;
        Object.keys(speakerWords).forEach(speaker => {
            const words = speakerWords[speaker];
            const percentage = totalWords > 0 ? Math.round((words / totalWords) * 100) : 0;
            speakerBalance.push({
                name: speaker,
                percentage,
                color: colors[colorIndex % colors.length]
            });
            colorIndex++;
        });

        // If no speaker data, return default mock breakdown
        if (speakerBalance.length === 0) {
            speakerBalance.push(
                { name: 'Alok Singh', percentage: 35, color: '#ff6b4a' },
                { name: 'Shweta Keshari', percentage: 25, color: '#8b5cf6' },
                { name: 'Harsh Pal', percentage: 20, color: '#3b82f6' },
                { name: 'Abdul Rashid Ansari', percentage: 20, color: '#f59e0b' }
            );
        }

        // 4. Productivity Over Time (timeline for charts)
        const productivityTimeline = userMeetings
            .map(m => ({
                title: m.title,
                date: m.date,
                score: m.productivityScore
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            stats: {
                totalMeetings,
                totalDuration,
                avgProductivity,
                tasks: {
                    total: userTasks.length,
                    ...taskCounts
                }
            },
            speakerBalance,
            productivityTimeline
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

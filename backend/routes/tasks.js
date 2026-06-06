const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const memoryStore = require('../memoryStore');

// @route   GET api/tasks
// @desc    Get all tasks for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    const { meetingId } = req.query;

    try {
        if (req.isDbConnected) {
            const query = { userId: req.user.id };
            if (meetingId) query.meetingId = meetingId;
            
            const tasks = await Task.find(query).sort({ createdAt: -1 });
            res.json(tasks);
        } else {
            let userTasks = memoryStore.tasks.filter(t => t.userId === req.user.id);
            if (meetingId) userTasks = userTasks.filter(t => t.meetingId === meetingId);
            
            res.json(userTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/tasks
// @desc    Create a task manually
// @access  Private
router.post('/', auth, async (req, res) => {
    const { text, assignee, status, deadline, meetingId } = req.body;

    try {
        if (!text || !assignee) {
            return res.status(400).json({ msg: 'Task text and assignee are required' });
        }

        if (req.isDbConnected) {
            const newTask = new Task({
                userId: req.user.id,
                meetingId,
                text,
                assignee,
                status: status || 'todo',
                deadline
            });

            const task = await newTask.save();
            res.json(task);
        } else {
            const newTask = {
                _id: 'task_' + Date.now(),
                userId: req.user.id,
                meetingId,
                text,
                assignee,
                status: status || 'todo',
                deadline: deadline ? new Date(deadline) : null,
                createdAt: new Date()
            };

            memoryStore.tasks.push(newTask);
            res.json(newTask);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update a task (e.g., status, assignee, text)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { text, assignee, status, deadline } = req.body;

    try {
        if (req.isDbConnected) {
            const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
            if (!task) return res.status(404).json({ msg: 'Task not found' });

            if (text !== undefined) task.text = text;
            if (assignee !== undefined) task.assignee = assignee;
            if (status !== undefined) task.status = status;
            if (deadline !== undefined) task.deadline = deadline;

            await task.save();
            res.json(task);
        } else {
            const taskIndex = memoryStore.tasks.findIndex(t => t._id === req.params.id && t.userId === req.user.id);
            if (taskIndex === -1) return res.status(404).json({ msg: 'Task not found' });

            const task = memoryStore.tasks[taskIndex];
            if (text !== undefined) task.text = text;
            if (assignee !== undefined) task.assignee = assignee;
            if (status !== undefined) task.status = status;
            if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;

            res.json(task);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.isDbConnected) {
            const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
            if (!task) return res.status(404).json({ msg: 'Task not found' });
            res.json({ msg: 'Task deleted successfully' });
        } else {
            const taskIndex = memoryStore.tasks.findIndex(t => t._id === req.params.id && t.userId === req.user.id);
            if (taskIndex === -1) return res.status(404).json({ msg: 'Task not found' });

            memoryStore.tasks.splice(taskIndex, 1);
            res.json({ msg: 'Task deleted successfully' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

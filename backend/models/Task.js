const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting'
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    assignee: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'completed'],
        default: 'todo'
    },
    deadline: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', TaskSchema);

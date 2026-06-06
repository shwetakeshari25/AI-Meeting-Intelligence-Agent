const mongoose = require('mongoose');

const TranscriptBlockSchema = new mongoose.Schema({
    speaker: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        default: '00:00'
    }
});

const MeetingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number, // In minutes
        default: 0
    },
    goal: {
        type: String,
        trim: true
    },
    agenda: [{
        type: String
    }],
    transcript: [TranscriptBlockSchema],
    summary: {
        type: String,
        default: ''
    },
    productivityScore: {
        type: Number,
        default: 100
    },
    language: {
        type: String,
        default: 'English'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Meeting', MeetingSchema);

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const memoryStore = require('../memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'aimeeting_secret_key';

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        if (req.isDbConnected) {
            // MongoDB Mode
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = new User({ name, email, password });
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            
            await user.save();

            // Return JWT
            const payload = { user: { id: user.id } };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
            });
        } else {
            // Memory Store Mode
            const existingUser = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = {
                _id: 'user_' + Date.now(),
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                createdAt: new Date()
            };

            memoryStore.users.push(newUser);

            const payload = { user: { id: newUser._id } };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        if (req.isDbConnected) {
            // MongoDB Mode
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const payload = { user: { id: user.id } };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
            });
        } else {
            // Memory Store Mode
            const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const payload = { user: { id: user._id } };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        if (req.isDbConnected) {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        } else {
            const user = memoryStore.users.find(u => u._id === req.user.id);
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yashman911';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/website-organiser')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Models
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#7b2cbf' },
  order: { type: Number, default: 0 },
  keywords: [{
    name: { type: String, required: true },
    url: { type: String },
    description: { type: String },
    icon: { type: String }
  }]
}, { timestamps: true });

const Group = mongoose.model('Group', GroupSchema);

// --- Auth Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.admin = decoded;
    next();
  });
};

// --- Routes ---

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid password' });
});

// Get all groups
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await Group.find().sort('order');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new group (Public for now, can be restricted)
app.post('/api/groups', async (req, res) => {
  const group = new Group(req.body);
  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a group (Admin Only)
app.patch('/api/groups/:id', authenticate, async (req, res) => {
  try {
    const updatedGroup = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a group (Admin Only)
app.delete('/api/groups/:id', authenticate, async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a keyword to a group
app.post('/api/groups/:groupId/keywords', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    group.keywords.push(req.body);
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a keyword (Admin Only)
app.delete('/api/groups/:groupId/keywords/:keywordId', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.keywords = group.keywords.filter(k => k._id.toString() !== req.params.keywordId);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

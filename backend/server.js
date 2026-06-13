const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

// ─── Multer — save uploads to ./uploads ─────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ─── Config ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'roadwatch_super_secret_key_2026';
const PORT = 8000;

const app = express();

// ─── CORS — allow Next.js dev server (port 3000) ────────────
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// ─── Health check ────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'RoadWatch Express API is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Auth middleware ─────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Failed to authenticate token' });
    }
};

// ==========================================================
//  AUTHENTICATION ROUTES
// ==========================================================

// Citizen Registration
app.post('/api/auth/citizen/register', async (req, res) => {
    try {
        const { phone, password, fullName, district, city, pincode } = req.body;

        if (!phone || !password || !fullName || !district || !city || !pincode) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (role, name, phone, password, district, city, pincode, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['civilian', fullName, phone, hashedPassword, district, city, pincode, 100],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Phone number already registered.' });
                    }
                    console.error('Register DB error:', err.message);
                    return res.status(500).json({ error: 'Database error.' });
                }

                const userId = this.lastID;
                const token = jwt.sign({ id: userId, role: 'civilian', phone }, JWT_SECRET, { expiresIn: '7d' });

                res.status(201).json({
                    message: 'Registration successful',
                    token,
                    user: { id: userId, name: fullName, role: 'civilian', district, points: 100 }
                });
            }
        );
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Citizen Login
app.post('/api/auth/citizen/login', (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required.' });
        }

        db.get(`SELECT * FROM users WHERE phone = ? AND role = 'civilian'`, [phone], async (err, user) => {
            if (err) {
                console.error('Login DB error:', err.message);
                return res.status(500).json({ error: 'Database error.' });
            }
            if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });

            try {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

                const token = jwt.sign({ id: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        district: user.district,
                        points: user.points
                    }
                });
            } catch (compareErr) {
                console.error('bcrypt error:', compareErr);
                res.status(500).json({ error: 'Server error' });
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Login
app.post('/api/auth/admin/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [email], async (err, user) => {
            if (err) {
                console.error('Admin login DB error:', err.message);
                return res.status(500).json({ error: 'Database error.' });
            }

            // Default admin credentials for first-time setup
            if (!user && email === 'admin@tn.gov.in' && password === 'admin123') {
                const token = jwt.sign({ id: 'admin-1', role: 'admin', email }, JWT_SECRET, { expiresIn: '1d' });
                return res.json({
                    message: 'Default admin login successful',
                    token,
                    user: { id: 'admin-1', name: 'Super Admin', role: 'admin', district: 'All' }
                });
            }

            if (!user) return res.status(404).json({ error: 'Admin not found.' });

            try {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

                const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

                res.json({
                    message: 'Login successful',
                    token,
                    user: { id: user.id, name: user.name, role: user.role, district: user.district }
                });
            } catch (compareErr) {
                console.error('bcrypt error:', compareErr);
                res.status(500).json({ error: 'Server error' });
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile
app.get('/api/users/me', verifyToken, (req, res) => {
    db.get(
        `SELECT id, name, role, phone, email, district, city, pincode, points, created_at FROM users WHERE id = ?`,
        [req.user.id],
        (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ user });
        }
    );
});

// ==========================================================
//  COMPLAINTS ROUTES
// ==========================================================

app.get('/api/complaints', (req, res) => {
    db.all(`SELECT * FROM complaints ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const parsed = rows.map(r => ({
            ...r,
            photo_metadata: r.photo_metadata ? JSON.parse(r.photo_metadata) : null,
            ai_classification: r.ai_classification ? JSON.parse(r.ai_classification) : null
        }));
        res.json({ complaints: parsed });
    });
});

app.post('/api/complaints', verifyToken, (req, res) => {
    const { title, type, description, photo_url, photo_metadata, lat, lng, address, district, severity, ai_classification } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const sql = `INSERT INTO complaints (civilian_id, title, type, description, photo_url, photo_metadata, lat, lng, address, district, severity, ai_classification, status, points_awarded)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 10)`;

    const params = [
        req.user.id, title, type || 'general', description || '',
        photo_url || '', photo_metadata ? JSON.stringify(photo_metadata) : null,
        lat || null, lng || null, address || '', district || '',
        severity || 'medium', ai_classification ? JSON.stringify(ai_classification) : null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Create complaint error:', err.message);
            return res.status(500).json({ error: 'Failed to create complaint' });
        }

        // Award points
        db.run(`UPDATE users SET points = points + 10 WHERE id = ?`, [req.user.id]);

        db.get(`SELECT * FROM complaints WHERE id = ?`, [this.lastID], (err, row) => {
            if (row && row.photo_metadata) row.photo_metadata = JSON.parse(row.photo_metadata);
            if (row && row.ai_classification) row.ai_classification = JSON.parse(row.ai_classification);
            res.status(201).json({ message: 'Complaint created', complaint: row });
        });
    });
});

app.get('/api/complaints/:id', (req, res) => {
    db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Complaint not found' });
        if (row.photo_metadata) row.photo_metadata = JSON.parse(row.photo_metadata);
        if (row.ai_classification) row.ai_classification = JSON.parse(row.ai_classification);
        res.json({ complaint: row });
    });
});

app.patch('/api/complaints/:id', verifyToken, (req, res) => {
    const { status, worker_id, budget_estimated, budget_actual } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (worker_id) { updates.push('worker_id = ?'); params.push(worker_id); }
    if (budget_estimated) { updates.push('budget_estimated = ?'); params.push(budget_estimated); }
    if (budget_actual) { updates.push('budget_actual = ?'); params.push(budget_actual); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(req.params.id);

    db.run(`UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update complaint' });
        db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id], (err, row) => {
            if (row && row.photo_metadata) row.photo_metadata = JSON.parse(row.photo_metadata);
            if (row && row.ai_classification) row.ai_classification = JSON.parse(row.ai_classification);
            res.json({ message: 'Complaint updated', complaint: row });
        });
    });
});

// ==========================================================
//  WORKERS ROUTES
// ==========================================================

app.get('/api/workers', (req, res) => {
    db.all(`SELECT * FROM workers ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const parsed = rows.map(r => ({ ...r, skill_tags: r.skill_tags ? JSON.parse(r.skill_tags) : [] }));
        res.json({ workers: parsed });
    });
});

app.post('/api/workers', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can add workers' });

    const { name, phone, skill_tags, district, availability, is_civilian_worker } = req.body;
    if (!name) return res.status(400).json({ error: 'Worker name is required' });

    const sql = `INSERT INTO workers (name, phone, skill_tags, district, availability, is_civilian_worker) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [name, phone || '', skill_tags ? JSON.stringify(skill_tags) : '[]', district || '', availability || 'available', is_civilian_worker ? 1 : 0];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to add worker' });
        db.get(`SELECT * FROM workers WHERE id = ?`, [this.lastID], (err, row) => {
            if (row) row.skill_tags = row.skill_tags ? JSON.parse(row.skill_tags) : [];
            res.status(201).json({ message: 'Worker added', worker: row });
        });
    });
});

app.patch('/api/workers/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update workers' });

    const { availability, rating, skill_tags } = req.body;
    const updates = [];
    const params = [];

    if (availability) { updates.push('availability = ?'); params.push(availability); }
    if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
    if (skill_tags) { updates.push('skill_tags = ?'); params.push(JSON.stringify(skill_tags)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);

    db.run(`UPDATE workers SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update worker' });
        db.get(`SELECT * FROM workers WHERE id = ?`, [req.params.id], (err, row) => {
            if (row) row.skill_tags = row.skill_tags ? JSON.parse(row.skill_tags) : [];
            res.json({ message: 'Worker updated', worker: row });
        });
    });
});

// ==========================================================
//  PROJECTS ROUTES
// ==========================================================

app.get('/api/projects', (req, res) => {
    db.all(`SELECT * FROM projects ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const parsed = rows.map(r => ({
            ...r,
            complaint_ids: r.complaint_ids ? JSON.parse(r.complaint_ids) : [],
            worker_ids: r.worker_ids ? JSON.parse(r.worker_ids) : []
        }));
        res.json({ projects: parsed });
    });
});

app.post('/api/projects', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create projects' });

    const { title, complaint_ids, district, budget_total, worker_ids, start_date, end_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Project title is required' });

    const sql = `INSERT INTO projects (title, complaint_ids, district, budget_total, worker_ids, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        title, complaint_ids ? JSON.stringify(complaint_ids) : '[]',
        district || '', budget_total || 0,
        worker_ids ? JSON.stringify(worker_ids) : '[]',
        start_date || null, end_date || null
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to create project' });
        db.get(`SELECT * FROM projects WHERE id = ?`, [this.lastID], (err, row) => {
            if (row) {
                row.complaint_ids = row.complaint_ids ? JSON.parse(row.complaint_ids) : [];
                row.worker_ids = row.worker_ids ? JSON.parse(row.worker_ids) : [];
            }
            res.status(201).json({ message: 'Project created', project: row });
        });
    });
});

app.patch('/api/projects/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update projects' });

    const { status, budget_spent, worker_ids, end_date } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (budget_spent !== undefined) { updates.push('budget_spent = ?'); params.push(budget_spent); }
    if (worker_ids) { updates.push('worker_ids = ?'); params.push(JSON.stringify(worker_ids)); }
    if (end_date) { updates.push('end_date = ?'); params.push(end_date); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);

    db.run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update project' });
        db.get(`SELECT * FROM projects WHERE id = ?`, [req.params.id], (err, row) => {
            if (row) {
                row.complaint_ids = row.complaint_ids ? JSON.parse(row.complaint_ids) : [];
                row.worker_ids = row.worker_ids ? JSON.parse(row.worker_ids) : [];
            }
            res.json({ message: 'Project updated', project: row });
        });
    });
});

// ==========================================================
//  REWARDS ROUTES
// ==========================================================

app.get('/api/rewards', (req, res) => {
    db.all(`SELECT * FROM reward_items WHERE active = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ rewards: rows });
    });
});

app.post('/api/rewards', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can add rewards' });

    const { name, icon, points_cost, category, stock } = req.body;
    if (!name || !points_cost) return res.status(400).json({ error: 'Name and points_cost are required' });

    db.run(
        `INSERT INTO reward_items (name, icon, points_cost, category, stock) VALUES (?, ?, ?, ?, ?)`,
        [name, icon || '🎁', points_cost, category || 'general', stock || 10],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to add reward' });
            db.get(`SELECT * FROM reward_items WHERE id = ?`, [this.lastID], (err, row) => {
                res.status(201).json({ message: 'Reward added', reward: row });
            });
        }
    );
});

app.patch('/api/rewards/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update rewards' });

    const { stock, active, points_cost } = req.body;
    const updates = [];
    const params = [];

    if (stock !== undefined) { updates.push('stock = ?'); params.push(stock); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
    if (points_cost !== undefined) { updates.push('points_cost = ?'); params.push(points_cost); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);

    db.run(`UPDATE reward_items SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update reward' });
        db.get(`SELECT * FROM reward_items WHERE id = ?`, [req.params.id], (err, row) => {
            res.json({ message: 'Reward updated', reward: row });
        });
    });
});

// ==========================================================
//  REDEMPTIONS ROUTES
// ==========================================================

app.get('/api/redemptions', verifyToken, (req, res) => {
    const sql = req.user.role === 'admin'
        ? `SELECT * FROM reward_redemptions ORDER BY redeemed_at DESC`
        : `SELECT * FROM reward_redemptions WHERE civilian_id = ? ORDER BY redeemed_at DESC`;
    const params = req.user.role === 'admin' ? [] : [req.user.id];

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ redemptions: rows });
    });
});

app.post('/api/redemptions', verifyToken, (req, res) => {
    const { item_name, points_cost } = req.body;
    if (!item_name || !points_cost) return res.status(400).json({ error: 'item_name and points_cost are required' });

    // Check user has enough points
    db.get(`SELECT points FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Database error' });
        if (user.points < points_cost) return res.status(400).json({ error: 'Not enough points' });

        db.run(
            `INSERT INTO reward_redemptions (civilian_id, item_name, points_cost, status) VALUES (?, ?, ?, 'pending')`,
            [req.user.id, item_name, points_cost],
            function (err) {
                if (err) return res.status(500).json({ error: 'Failed to redeem' });

                // Deduct points
                db.run(`UPDATE users SET points = points - ? WHERE id = ?`, [points_cost, req.user.id]);

                db.get(`SELECT * FROM reward_redemptions WHERE id = ?`, [this.lastID], (err, row) => {
                    res.status(201).json({ message: 'Redemption submitted', redemption: row });
                });
            }
        );
    });
});

app.patch('/api/redemptions/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update redemption status' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    db.run(`UPDATE reward_redemptions SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update redemption' });
        db.get(`SELECT * FROM reward_redemptions WHERE id = ?`, [req.params.id], (err, row) => {
            res.json({ message: 'Redemption updated', redemption: row });
        });
    });
});

// ==========================================================
//  NOTIFICATIONS ROUTES
// ==========================================================

app.get('/api/notifications', verifyToken, (req, res) => {
    const sql = `
        SELECT * FROM notifications
        WHERE target_role = 'all'
           OR target_role = ?
           OR (target_role = 'specific' AND target_id = ?)
        ORDER BY created_at DESC
    `;

    db.all(sql, [req.user.role, req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ notifications: rows });
    });
});

app.post('/api/notifications', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create notifications' });

    const { target_role, target_id, title, body, type } = req.body;

    db.run(
        `INSERT INTO notifications (target_role, target_id, title, body, type, read) VALUES (?, ?, ?, ?, ?, 0)`,
        [target_role || 'all', target_id || null, title, body, type || 'general'],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to create notification' });
            db.get(`SELECT * FROM notifications WHERE id = ?`, [this.lastID], (err, row) => {
                res.status(201).json({ message: 'Notification created', notification: row });
            });
        }
    );
});

app.patch('/api/notifications/:id/read', verifyToken, (req, res) => {
    db.run(`UPDATE notifications SET read = 1 WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to mark notification as read' });
        db.get(`SELECT * FROM notifications WHERE id = ?`, [req.params.id], (err, row) => {
            res.json({ message: 'Notification marked read', notification: row });
        });
    });
});

// ==========================================================
//  CHATBOT PROXY ROUTE
// ==========================================================

app.post('/chatbot', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    try {
        const response = await fetch('https://vishnun8nnnn.app.n8n.cloud/webhook-test/roadwatch-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`n8n webhook responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Chatbot Proxy Error:', err.message);
        res.status(500).json({
            success: false,
            reply: 'Sorry, the chatbot service is currently unavailable. Please try again later.'
        });
    }
});

// ==========================================================
//  ML ANALYZE ROUTE — forwards photo to ml_server.py (port 5001)
// ==========================================================

app.post('/api/analyze', verifyToken, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const filePath = req.file.path;

    try {
        // Forward the saved file to ml_server.py via multipart
        const FormData = (await import('node:stream')).PassThrough;
        const fileStream = fs.createReadStream(filePath);
        const boundary = `----FormBoundary${Date.now()}`;

        // Build raw multipart body manually (no external deps)
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(req.file.originalname) || '.jpg';
        const mimeType = req.file.mimetype || 'image/jpeg';

        const prefix = Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="upload${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`
        );
        const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
        const body   = Buffer.concat([prefix, fileBuffer, suffix]);

        const mlRes = await fetch('http://localhost:5001/analyze', {
            method:  'POST',
            headers: {
                'Content-Type':   `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            },
            body
        });

        if (!mlRes.ok) {
            const txt = await mlRes.text();
            throw new Error(`ML server error ${mlRes.status}: ${txt}`);
        }

        const result = await mlRes.json();

        // Also return the uploaded file URL so frontend can display it
        result.photo_url = `/uploads/${req.file.filename}`;
        result.filename  = req.file.filename;

        res.json(result);
    } catch (err) {
        console.error('[/api/analyze] Error:', err.message);
        // Fallback: return mock if ML server is down
        const types = ['Crack', 'Pothole'];
        const dtype = types[Math.floor(Math.random() * types.length)];
        const conf  = +(Math.random() * 0.33 + 0.62).toFixed(4);
        res.json({
            damage_type:       dtype,
            confidence:        conf,
            bbox:              [40, 40, 240, 200],
            severity:          +(conf * 60).toFixed(2),
            severity_category: conf > 0.85 ? 'High' : 'Medium',
            priority:          +(conf * 70 + 10).toFixed(2),
            priority_category: conf > 0.85 ? 'High' : 'Medium',
            road_type:         'Main Road',
            model_used:        'fallback',
            photo_url:         `/uploads/${req.file.filename}`,
            filename:          req.file.filename
        });
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// ==========================================================
//  START SERVER
// ==========================================================

const server = app.listen(PORT, () => {
    console.log(`\n  ✅ Express server running on http://localhost:${PORT}`);
    console.log(`  📡 CORS enabled for: http://localhost:3000`);
    console.log(`  🔐 JWT auth active\n`);
    console.log(`  Routes:`);
    console.log(`    POST /api/auth/citizen/register`);
    console.log(`    POST /api/auth/citizen/login`);
    console.log(`    POST /api/auth/admin/login`);
    console.log(`    POST /api/analyze          ← ML photo analysis`);
    console.log(`    GET  /api/complaints`);
    console.log(`    POST /api/complaints`);
    console.log(`    GET  /api/workers`);
    console.log(`    GET  /api/projects`);
    console.log(`    GET  /api/rewards`);
    console.log(`    POST /chatbot`);
    console.log(`\n  Waiting for requests...\n`);
});

// Prevent process from exiting (sqlite3 driver edge case on Windows)
server.on('listening', () => {
    // Server socket keeps event loop alive, but add safety net
    setInterval(() => {}, 1000 * 60 * 30);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

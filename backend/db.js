const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'roadwatch_express.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize tables
        db.serialize(() => {
            // Users table (both Citizen and Admin)
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL, -- 'civilian' or 'admin'
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE, -- For citizens
                    email TEXT UNIQUE, -- For admins
                    password TEXT NOT NULL,
                    district TEXT,
                    city TEXT,
                    pincode TEXT,
                    points INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS workers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    skill_tags TEXT, -- JSON array
                    district TEXT,
                    availability TEXT DEFAULT 'available',
                    rating REAL DEFAULT 5.0,
                    is_civilian_worker INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS complaints (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    civilian_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    type TEXT,
                    description TEXT,
                    photo_url TEXT,
                    photo_metadata TEXT, -- JSON
                    lat REAL,
                    lng REAL,
                    address TEXT,
                    district TEXT,
                    severity TEXT DEFAULT 'medium',
                    ai_classification TEXT, -- JSON
                    status TEXT DEFAULT 'pending',
                    points_awarded INTEGER DEFAULT 0,
                    worker_id INTEGER,
                    budget_estimated REAL,
                    budget_actual REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (civilian_id) REFERENCES users(id),
                    FOREIGN KEY (worker_id) REFERENCES workers(id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS reward_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    icon TEXT,
                    points_cost INTEGER NOT NULL,
                    category TEXT,
                    stock INTEGER DEFAULT 10,
                    active INTEGER DEFAULT 1
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS reward_redemptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    civilian_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    points_cost INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending',
                    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (civilian_id) REFERENCES users(id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    target_role TEXT DEFAULT 'all',
                    target_id INTEGER,
                    title TEXT NOT NULL,
                    body TEXT,
                    type TEXT,
                    read INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    complaint_ids TEXT, -- JSON array
                    district TEXT,
                    budget_total REAL DEFAULT 0,
                    budget_spent REAL DEFAULT 0,
                    status TEXT DEFAULT 'planning',
                    worker_ids TEXT, -- JSON array
                    start_date TEXT,
                    end_date TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('Database tables created/verified.');
        });
    }
});

module.exports = db;

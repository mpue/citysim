const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(dbPath = path.join(__dirname, 'data', 'citysim.db')) {
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeTables();
        this.createDefaultAdmin();
    }

    initializeTables() {
        // Users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                role TEXT DEFAULT 'player',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                total_playtime INTEGER DEFAULT 0
            )
        `);

        // Game saves table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS game_saves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                save_name TEXT NOT NULL,
                city_name TEXT,
                population INTEGER DEFAULT 0,
                money INTEGER DEFAULT 0,
                game_year INTEGER DEFAULT 1,
                game_data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_autosave INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // User statistics table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                cities_created INTEGER DEFAULT 0,
                total_population INTEGER DEFAULT 0,
                highest_population INTEGER DEFAULT 0,
                achievements TEXT DEFAULT '[]',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Sessions/activity log
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create indexes for better performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);
            CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
        `);

        console.log('✅ Database tables initialized successfully');
    }

    createDefaultAdmin() {
        const existingAdmin = this.db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
        
        if (!existingAdmin) {
            const passwordHash = bcrypt.hashSync('admin123', 10);
            const stmt = this.db.prepare(`
                INSERT INTO users (username, email, password_hash, display_name, role)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            try {
                stmt.run('admin', 'admin@citysim.local', passwordHash, 'Administrator', 'admin');
                console.log('✅ Default admin user created (username: admin, password: admin123)');
            } catch (error) {
                // Admin might already exist
            }
        }
    }

    // User management methods
    createUser(username, email, password, displayName = null, role = 'player') {
        const passwordHash = bcrypt.hashSync(password, 10);
        const stmt = this.db.prepare(`
            INSERT INTO users (username, email, password_hash, display_name, role)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(username, email, passwordHash, displayName || username, role);
        
        // Create user stats entry
        const statsStmt = this.db.prepare('INSERT INTO user_stats (user_id) VALUES (?)');
        statsStmt.run(result.lastInsertRowid);
        
        return result.lastInsertRowid;
    }

    getUserByUsername(username) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
        return stmt.get(username);
    }

    getUserByEmail(email) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
        return stmt.get(email);
    }

    getUserById(userId) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
        return stmt.get(userId);
    }

    verifyPassword(username, password) {
        const user = this.getUserByUsername(username);
        if (!user) return null;
        
        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (isValid) {
            // Update last login
            const updateStmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(user.id);
            return user;
        }
        return null;
    }

    updateUser(userId, updates) {
        const allowedFields = ['email', 'display_name', 'is_active'];
        const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
        
        if (fields.length === 0) return false;
        
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);
        values.push(userId);
        
        const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
        return stmt.run(...values).changes > 0;
    }

    updatePassword(userId, newPassword) {
        const passwordHash = bcrypt.hashSync(newPassword, 10);
        const stmt = this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        return stmt.run(passwordHash, userId).changes > 0;
    }

    deleteUser(userId) {
        const stmt = this.db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
        return stmt.run(userId).changes > 0;
    }

    getAllUsers(includeInactive = false) {
        const query = includeInactive 
            ? 'SELECT id, username, email, display_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
            : 'SELECT id, username, email, display_name, role, is_active, created_at, last_login FROM users WHERE is_active = 1 ORDER BY created_at DESC';
        return this.db.prepare(query).all();
    }

    // Game save methods
    saveGame(userId, saveName, cityName, population, money, gameYear, gameData, isAutosave = false) {
        const stmt = this.db.prepare(`
            INSERT INTO game_saves (user_id, save_name, city_name, population, money, game_year, game_data, is_autosave)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, saveName, cityName, population, money, gameYear, JSON.stringify(gameData), isAutosave ? 1 : 0).lastInsertRowid;
    }

    updateGameSave(saveId, cityName, population, money, gameYear, gameData) {
        const stmt = this.db.prepare(`
            UPDATE game_saves 
            SET city_name = ?, population = ?, money = ?, game_year = ?, game_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(cityName, population, money, gameYear, JSON.stringify(gameData), saveId).changes > 0;
    }

    getUserSaves(userId) {
        const stmt = this.db.prepare(`
            SELECT id, save_name, city_name, population, money, game_year, created_at, updated_at, is_autosave
            FROM game_saves 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        `);
        return stmt.all(userId);
    }

    getGameSave(saveId, userId) {
        const stmt = this.db.prepare('SELECT * FROM game_saves WHERE id = ? AND user_id = ?');
        return stmt.get(saveId, userId);
    }

    deleteGameSave(saveId, userId) {
        const stmt = this.db.prepare('DELETE FROM game_saves WHERE id = ? AND user_id = ?');
        return stmt.run(saveId, userId).changes > 0;
    }

    // Statistics methods
    getUserStats(userId) {
        const stmt = this.db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
        return stmt.get(userId);
    }

    updateUserStats(userId, stats) {
        const fields = ['cities_created', 'total_population', 'highest_population', 'achievements'];
        const updates = {};
        
        for (const field of fields) {
            if (stats[field] !== undefined) {
                updates[field] = field === 'achievements' ? JSON.stringify(stats[field]) : stats[field];
            }
        }
        
        if (Object.keys(updates).length === 0) return false;
        
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(userId);
        
        const stmt = this.db.prepare(`UPDATE user_stats SET ${setClause} WHERE user_id = ?`);
        return stmt.run(...values).changes > 0;
    }

    // Activity log methods
    logActivity(userId, action, details = null, ipAddress = null) {
        const stmt = this.db.prepare(`
            INSERT INTO activity_log (user_id, action, details, ip_address)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(userId, action, details, ipAddress).lastInsertRowid;
    }

    getUserActivity(userId, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT * FROM activity_log 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `);
        return stmt.all(userId, limit);
    }

    // Dashboard statistics
    getDashboardStats() {
        const totalUsers = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
        const totalSaves = this.db.prepare('SELECT COUNT(*) as count FROM game_saves').get().count;
        const activeToday = this.db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM activity_log WHERE DATE(created_at) = DATE('now')").get().count;
        
        return {
            totalUsers,
            totalSaves,
            activeToday
        };
    }

    close() {
        this.db.close();
    }
}

module.exports = DatabaseManager;

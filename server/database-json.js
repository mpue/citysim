const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(dbPath = path.join(__dirname, 'data', 'citysim.json')) {
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const adapter = new FileSync(dbPath);
        this.db = low(adapter);

        // Initialize database with default structure
        this.db.defaults({
            users: [],
            gameSaves: [],
            userStats: [],
            activityLog: []
        }).write();

        this.createDefaultAdmin();
    }

    createDefaultAdmin() {
        const existingAdmin = this.db.get('users').find({ role: 'admin' }).value();
        
        if (!existingAdmin) {
            const passwordHash = bcrypt.hashSync('admin123', 10);
            const newAdmin = {
                id: 1,
                username: 'admin',
                email: 'admin@citysim.local',
                password_hash: passwordHash,
                display_name: 'Administrator',
                role: 'admin',
                is_active: 1,
                created_at: new Date().toISOString(),
                last_login: null,
                total_playtime: 0
            };
            
            this.db.get('users').push(newAdmin).write();
            this.db.get('userStats').push({
                id: 1,
                user_id: 1,
                cities_created: 0,
                total_population: 0,
                highest_population: 0,
                achievements: []
            }).write();
            
            console.log('✅ Default admin user created (username: admin, password: admin123)');
        }
    }

    // User management methods
    createUser(username, email, password, displayName = null, role = 'player') {
        const passwordHash = bcrypt.hashSync(password, 10);
        const userId = this.db.get('users').size().value() + 1;
        
        const newUser = {
            id: userId,
            username,
            email,
            password_hash: passwordHash,
            display_name: displayName || username,
            role,
            is_active: 1,
            created_at: new Date().toISOString(),
            last_login: null,
            total_playtime: 0
        };
        
        this.db.get('users').push(newUser).write();
        
        // Create user stats entry
        this.db.get('userStats').push({
            id: userId,
            user_id: userId,
            cities_created: 0,
            total_population: 0,
            highest_population: 0,
            achievements: []
        }).write();
        
        return userId;
    }

    getUserByUsername(username) {
        return this.db.get('users')
            .find({ username, is_active: 1 })
            .value();
    }

    getUserByEmail(email) {
        return this.db.get('users')
            .find({ email, is_active: 1 })
            .value();
    }

    getUserById(userId) {
        return this.db.get('users')
            .find({ id: userId, is_active: 1 })
            .value();
    }

    verifyPassword(username, password) {
        const user = this.getUserByUsername(username);
        if (!user) return null;
        
        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (isValid) {
            // Update last login
            this.db.get('users')
                .find({ id: user.id })
                .assign({ last_login: new Date().toISOString() })
                .write();
            return user;
        }
        return null;
    }

    updateUser(userId, updates) {
        const allowedFields = ['email', 'display_name', 'is_active'];
        const updateData = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateData[key] = value;
            }
        }
        
        if (Object.keys(updateData).length === 0) return false;
        
        this.db.get('users')
            .find({ id: userId })
            .assign(updateData)
            .write();
        
        return true;
    }

    updatePassword(userId, newPassword) {
        const passwordHash = bcrypt.hashSync(newPassword, 10);
        this.db.get('users')
            .find({ id: userId })
            .assign({ password_hash: passwordHash })
            .write();
        return true;
    }

    deleteUser(userId) {
        // Soft delete - only deactivate
        this.db.get('users')
            .find({ id: userId })
            .assign({ is_active: 0 })
            .write();
        return true;
    }

    permanentDeleteUser(userId) {
        // Hard delete - completely remove user and associated data
        this.db.get('users')
            .remove({ id: userId })
            .write();
        
        // Delete all saves from this user
        this.db.get('game_saves')
            .remove({ user_id: userId })
            .write();
        
        // Delete all activity logs from this user
        this.db.get('activity_log')
            .remove({ user_id: userId })
            .write();
        
        return true;
    }

    getAllUsers(includeInactive = false) {
        let query = this.db.get('users');
        if (!includeInactive) {
            query = query.filter({ is_active: 1 });
        }
        return query.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            display_name: u.display_name,
            role: u.role,
            is_active: u.is_active,
            created_at: u.created_at,
            last_login: u.last_login
        })).value();
    }

    // Game save methods
    saveGame(userId, saveName, cityName, population, money, gameYear, gameData, isAutosave = false) {
        const saveId = this.db.get('gameSaves').size().value() + 1;
        
        const newSave = {
            id: saveId,
            user_id: userId,
            save_name: saveName,
            city_name: cityName,
            population,
            money,
            game_year: gameYear,
            game_data: JSON.stringify(gameData),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_autosave: isAutosave ? 1 : 0
        };
        
        this.db.get('gameSaves').push(newSave).write();
        return saveId;
    }

    updateGameSave(saveId, cityName, population, money, gameYear, gameData) {
        this.db.get('gameSaves')
            .find({ id: saveId })
            .assign({
                city_name: cityName,
                population,
                money,
                game_year: gameYear,
                game_data: JSON.stringify(gameData),
                updated_at: new Date().toISOString()
            })
            .write();
        return true;
    }

    getUserSaves(userId) {
        return this.db.get('gameSaves')
            .filter({ user_id: userId })
            .orderBy(['updated_at'], ['desc'])
            .map(s => ({
                id: s.id,
                save_name: s.save_name,
                city_name: s.city_name,
                population: s.population,
                money: s.money,
                game_year: s.game_year,
                created_at: s.created_at,
                updated_at: s.updated_at,
                is_autosave: s.is_autosave
            }))
            .value();
    }

    getGameSave(saveId, userId) {
        return this.db.get('gameSaves')
            .find({ id: saveId, user_id: userId })
            .value();
    }

    deleteGameSave(saveId, userId) {
        this.db.get('gameSaves')
            .remove({ id: saveId, user_id: userId })
            .write();
        return true;
    }

    // Statistics methods
    getUserStats(userId) {
        return this.db.get('userStats')
            .find({ user_id: userId })
            .value();
    }

    updateUserStats(userId, stats) {
        const updateData = {};
        const fields = ['cities_created', 'total_population', 'highest_population', 'achievements'];
        
        for (const field of fields) {
            if (stats[field] !== undefined) {
                updateData[field] = stats[field];
            }
        }
        
        if (Object.keys(updateData).length === 0) return false;
        
        this.db.get('userStats')
            .find({ user_id: userId })
            .assign(updateData)
            .write();
        
        return true;
    }

    // Activity log methods
    logActivity(userId, action, details = null, ipAddress = null) {
        const logId = this.db.get('activityLog').size().value() + 1;
        
        this.db.get('activityLog').push({
            id: logId,
            user_id: userId,
            action,
            details,
            ip_address: ipAddress,
            created_at: new Date().toISOString()
        }).write();
        
        return logId;
    }

    getUserActivity(userId, limit = 50) {
        return this.db.get('activityLog')
            .filter({ user_id: userId })
            .orderBy(['created_at'], ['desc'])
            .take(limit)
            .value();
    }

    // Dashboard statistics
    getDashboardStats() {
        const totalUsers = this.db.get('users').filter({ is_active: 1 }).size().value();
        const totalSaves = this.db.get('gameSaves').size().value();
        
        const today = new Date().toISOString().split('T')[0];
        const activeToday = this.db.get('activityLog')
            .filter(log => log.created_at.startsWith(today))
            .map('user_id')
            .uniq()
            .size()
            .value();
        
        return {
            totalUsers,
            totalSaves,
            activeToday
        };
    }

    close() {
        // lowdb writes synchronously, no need to close
    }
}

module.exports = DatabaseManager;

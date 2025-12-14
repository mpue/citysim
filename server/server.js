const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
const DatabaseManager = require('./database-json');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
const db = new DatabaseManager();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Disabled for easier development
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Zu viele Login-Versuche, bitte versuchen Sie es später erneut'
});

app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/', limiter);

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'citysim-secret-key-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true only with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
    }
    res.redirect('/login');
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Keine Berechtigung' });
}

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/game', isAuthenticated, express.static(path.join(__dirname, '..')));

// ==================== PUBLIC ROUTES ====================

// Login page
app.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// ==================== AUTH API ====================

// Login endpoint
app.post('/api/login', [
    body('username').trim().notEmpty().withMessage('Benutzername erforderlich'),
    body('password').notEmpty().withMessage('Passwort erforderlich')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    const user = db.verifyPassword(username, password);

    if (user) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userRole = user.role;
        req.session.displayName = user.display_name;

        db.logActivity(user.id, 'login', null, req.ip);

        res.json({
            success: true,
            message: 'Login erfolgreich',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                role: user.role
            },
            redirect: '/dashboard'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Ungültiger Benutzername oder Passwort'
        });
    }
});

// Register endpoint
app.post('/api/register', [
    body('username').trim().isLength({ min: 3, max: 20 })
        .withMessage('Benutzername muss 3-20 Zeichen lang sein')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nur Buchstaben, Zahlen und Unterstriche erlaubt'),
    body('email').trim().isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
    body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
    body('displayName').optional().trim().isLength({ max: 50 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    if (db.getUserByUsername(username)) {
        return res.status(400).json({ success: false, message: 'Benutzername bereits vergeben' });
    }

    if (db.getUserByEmail(email)) {
        return res.status(400).json({ success: false, message: 'E-Mail-Adresse bereits registriert' });
    }

    try {
        const userId = db.createUser(username, email, password, displayName);
        db.logActivity(userId, 'register', null, req.ip);

        res.json({
            success: true,
            message: 'Registrierung erfolgreich',
            redirect: '/login'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Fehler bei der Registrierung' });
    }
});

// Logout endpoint
app.post('/api/logout', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.logActivity(userId, 'logout', null, req.ip);

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Fehler beim Abmelden' });
        }
        res.json({ success: true, message: 'Erfolgreich abgemeldet' });
    });
});

// ==================== USER API ====================

// Get current user info
app.get('/api/user/me', isAuthenticated, (req, res) => {
    const user = db.getUserById(req.session.userId);
    if (user) {
        const stats = db.getUserStats(user.id);
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                stats: stats
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
    }
});

// Update user profile
app.put('/api/user/profile', isAuthenticated, [
    body('email').optional().trim().isEmail(),
    body('displayName').optional().trim().isLength({ max: 50 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const updates = {};
    if (req.body.email) updates.email = req.body.email;
    if (req.body.displayName) updates.display_name = req.body.displayName;

    if (db.updateUser(req.session.userId, updates)) {
        db.logActivity(req.session.userId, 'profile_update', JSON.stringify(updates), req.ip);
        res.json({ success: true, message: 'Profil aktualisiert' });
    } else {
        res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren' });
    }
});

// Change password
app.post('/api/user/change-password', isAuthenticated, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const user = db.getUserById(req.session.userId);
    const bcrypt = require('bcryptjs');
    
    if (!bcrypt.compareSync(req.body.currentPassword, user.password_hash)) {
        return res.status(401).json({ success: false, message: 'Aktuelles Passwort falsch' });
    }

    if (db.updatePassword(req.session.userId, req.body.newPassword)) {
        db.logActivity(req.session.userId, 'password_change', null, req.ip);
        res.json({ success: true, message: 'Passwort geändert' });
    } else {
        res.status(500).json({ success: false, message: 'Fehler beim Ändern des Passworts' });
    }
});

// ==================== GAME SAVE API ====================

// Get all saves for current user
app.get('/api/saves', isAuthenticated, (req, res) => {
    const saves = db.getUserSaves(req.session.userId);
    res.json({ success: true, saves });
});

// Get specific save
app.get('/api/saves/:id', isAuthenticated, (req, res) => {
    const save = db.getGameSave(req.params.id, req.session.userId);
    if (save) {
        save.game_data = JSON.parse(save.game_data);
        res.json({ success: true, save });
    } else {
        res.status(404).json({ success: false, message: 'Spielstand nicht gefunden' });
    }
});

// Create new save
app.post('/api/saves', isAuthenticated, [
    body('saveName').trim().notEmpty().isLength({ max: 100 }),
    body('cityName').trim().notEmpty().isLength({ max: 100 }),
    body('gameData').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { saveName, cityName, population, money, gameData, gameYear, isAutosave } = req.body;

    try {
        const saveId = db.saveGame(
            req.session.userId,
            saveName,
            cityName,
            population || 0,
            money || 0,
            gameYear || 1,
            gameData,
            isAutosave || false
        );

        db.logActivity(req.session.userId, 'game_save', `Save: ${saveName}`, req.ip);
        res.json({ success: true, message: 'Spielstand gespeichert', saveId });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Speichern' });
    }
});

// Update existing save
app.put('/api/saves/:id', isAuthenticated, (req, res) => {
    const { cityName, population, money, gameYear, gameData } = req.body;

    // Verify ownership
    const existingSave = db.getGameSave(req.params.id, req.session.userId);
    if (!existingSave) {
        return res.status(404).json({ success: false, message: 'Spielstand nicht gefunden' });
    }

    if (db.updateGameSave(req.params.id, cityName, population, money, gameYear, gameData)) {
        db.logActivity(req.session.userId, 'game_update', `Save ID: ${req.params.id}`, req.ip);
        res.json({ success: true, message: 'Spielstand aktualisiert' });
    } else {
        res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren' });
    }
});

// Delete save
app.delete('/api/saves/:id', isAuthenticated, (req, res) => {
    if (db.deleteGameSave(req.params.id, req.session.userId)) {
        db.logActivity(req.session.userId, 'game_delete', `Save ID: ${req.params.id}`, req.ip);
        res.json({ success: true, message: 'Spielstand gelöscht' });
    } else {
        res.status(404).json({ success: false, message: 'Spielstand nicht gefunden' });
    }
});

// ==================== ADMIN API ====================

// Get all users (admin only)
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    const users = db.getAllUsers(true);
    res.json({ success: true, users });
});

// Get dashboard stats (admin only)
app.get('/api/admin/stats', isAuthenticated, isAdmin, (req, res) => {
    const stats = db.getDashboardStats();
    res.json({ success: true, stats });
});

// Update user (admin only)
app.put('/api/admin/users/:id', isAuthenticated, isAdmin, (req, res) => {
    const updates = {};
    if (req.body.email) updates.email = req.body.email;
    if (req.body.displayName) updates.display_name = req.body.displayName;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive ? 1 : 0;

    if (db.updateUser(req.params.id, updates)) {
        db.logActivity(req.session.userId, 'admin_user_update', `User ID: ${req.params.id}`, req.ip);
        res.json({ success: true, message: 'Benutzer aktualisiert' });
    } else {
        res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, (req, res) => {
    if (req.params.id == req.session.userId) {
        return res.status(400).json({ success: false, message: 'Sie können sich nicht selbst löschen' });
    }

    if (db.deleteUser(req.params.id)) {
        db.logActivity(req.session.userId, 'admin_user_delete', `User ID: ${req.params.id}`, req.ip);
        res.json({ success: true, message: 'Benutzer deaktiviert' });
    } else {
        res.status(500).json({ success: false, message: 'Fehler beim Löschen' });
    }
});

// ==================== PAGE ROUTES ====================

// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Profile
app.get('/profile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Admin panel
app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Game route
app.get('/game', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Root redirect
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route nicht gefunden' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Interner Serverfehler' });
});

// ==================== START SERVER ====================

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server wird heruntergefahren...');
    db.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           🏙️  CitySim Backend Server v2.0                     ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Server läuft auf: http://localhost:${PORT}                       ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  📍 Wichtige URLs:                                             ║');
    console.log(`║     Login:      http://localhost:${PORT}/login                     ║`);
    console.log(`║     Register:   http://localhost:${PORT}/register                  ║`);
    console.log(`║     Dashboard:  http://localhost:${PORT}/dashboard                 ║`);
    console.log(`║     Admin:      http://localhost:${PORT}/admin                     ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  🔑 Standard Admin-Zugang:                                     ║');
    console.log('║     Username: admin                                            ║');
    console.log('║     Password: admin123                                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
});

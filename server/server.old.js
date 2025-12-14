const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded Credentials
const USERS = {
    'admin': 'password123',
    'player': 'citysim2025'
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration
app.use(session({
    secret: 'citysim-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Serve static files from parent directory (game files)
app.use('/game', isAuthenticated, express.static(path.join(__dirname, '..')));

// Login page route
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/game');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Benutzername und Passwort sind erforderlich'
        });
    }

    // Check credentials
    if (USERS[username] && USERS[username] === password) {
        req.session.user = username;
        return res.json({
            success: true,
            message: 'Login erfolgreich',
            redirect: '/game'
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Ungültiger Benutzername oder Passwort'
        });
    }
});

// Logout API endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Fehler beim Abmelden'
            });
        }
        res.json({
            success: true,
            message: 'Erfolgreich abgemeldet'
        });
    });
});

// Check session status
app.get('/api/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

// Root redirect
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/game');
    } else {
        res.redirect('/login');
    }
});

// Game route (protected)
app.get('/game', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`CitySim Backend läuft auf http://localhost:${PORT}`);
    console.log(`Login-Seite: http://localhost:${PORT}/login`);
    console.log('\nTest-Credentials:');
    console.log('  Username: admin, Password: password123');
    console.log('  Username: player, Password: citysim2025');
});

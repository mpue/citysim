module.exports = {
  apps: [{
    name: 'citysim-backend',
    cwd: './server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // SESSION_SECRET sollte als Umgebungsvariable gesetzt werden
      // oder hier eintragen (nicht empfohlen für öffentliche Repos)
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

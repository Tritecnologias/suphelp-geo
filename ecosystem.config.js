// Configuração PM2 para SupHelp Geo
module.exports = {
  apps: [{
    name: 'suphelp-geo',
    script: 'src/server.js',
    cwd: '/home/dev/suphelp-geo/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};

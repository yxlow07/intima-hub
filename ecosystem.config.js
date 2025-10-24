module.exports = {
    apps: [
        {
            name: 'intima-hub-backend',
            script: './start-backend.js',
            cwd: 'e:\\[03]_Programming\\[00]_Projects\\intima_hub',
            watch: false,
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '500M',
            error_file: './logs/backend-err.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'intima-hub-frontend',
            script: './serve-frontend.js',
            cwd: 'e:\\[03]_Programming\\[00]_Projects\\intima_hub',
            env: {
                NODE_ENV: 'production',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '500M',
            error_file: './logs/frontend-err.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};

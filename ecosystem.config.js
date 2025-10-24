module.exports = {
    apps: [
        {
            name: 'intima-hub-backend',
            script: './server.ts',
            interpreter: 'tsx',
            watch: ['server.ts', 'src/db'],
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'dist', 'uploads', 'logs'],
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
            script: 'npm',
            args: 'run dev',
            watch: ['src', 'index.html', 'vite.config.ts'],
            watch_delay: 1000,
            ignore_watch: ['node_modules', 'dist', 'uploads', 'logs'],
            env: {
                NODE_ENV: 'development',
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

module.exports = {
  apps: [
    {
      name: 'opendrap-worker',
      cwd: 'E:\\New folder (2)\\New folder\\thagam_smartwhatsapp\\Opendrap DevOps AI Platform\\workers',
      script: 'cmd',
      args: '/c npm run dev',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'opendrap-frontend',
      cwd: 'E:\\New folder (2)\\New folder\\thagam_smartwhatsapp\\Opendrap DevOps AI Platform',
      script: 'cmd',
      args: '/c npm run dev',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};

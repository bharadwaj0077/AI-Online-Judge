module.exports = {
  apps: [
    {
      name: "synapse-backend",
      cwd: "./backend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
    },
    {
      name: "synapse-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

module.exports = {
  apps: [{
    name: 'gabaritou-v3',
    script: './src/index.js',
    env: {
      BOT_TOKEN: process.env.BOT_TOKEN,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      ADMIN_SECRET: process.env.ADMIN_SECRET,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
      MODELSCOPE_TOKEN: process.env.MODELSCOPE_TOKEN,
      MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      PORT: process.env.PORT || 3000
    }
  }]
};

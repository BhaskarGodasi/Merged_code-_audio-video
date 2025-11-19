require('dotenv').config();

const shared = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'dooh_audio_platform',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging:
    process.env.DB_LOGGING && process.env.DB_LOGGING.toLowerCase() === 'true'
      ? console.log
      : false,
  define: {
    underscored: false,
    freezeTableName: false,
    timestamps: true,
  },
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};

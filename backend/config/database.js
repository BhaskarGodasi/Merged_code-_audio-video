const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

require('dotenv').config({
	path: fs.existsSync(path.join(__dirname, '..', '.env'))
		? path.join(__dirname, '..', '.env')
		: undefined,
});

const environment = process.env.NODE_ENV || 'development';
const config = require('./config.json')[environment];

const sequelize = new Sequelize(
	process.env.DB_NAME || config.database,
	process.env.DB_USER || config.username,
	process.env.DB_PASSWORD || config.password,
	{
		host: process.env.DB_HOST || config.host,
		port: process.env.DB_PORT || config.port || 3306,
		dialect: 'mysql',
		logging:
			process.env.DB_LOGGING && process.env.DB_LOGGING.toLowerCase() === 'true'
				? console.log
				: false,
		pool: {
			max: Number(process.env.DB_POOL_MAX || 10),
			min: Number(process.env.DB_POOL_MIN || 0),
			acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
			idle: Number(process.env.DB_POOL_IDLE || 10000),
		},
		define: {
			underscored: false,
			freezeTableName: false,
			timestamps: true,
		},
	},
);

module.exports = sequelize;

require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const campaignRoutes = require('./routes/campaigns');
const deviceRoutes = require('./routes/devices');
const jingleRoutes = require('./routes/jingles');
const logRoutes = require('./routes/logs');
const deviceScheduleRoutes = require('./routes/deviceSchedules');
const brandRoutes = require('./routes/clients');
const companyRoutes = require('./routes/companies');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const liveRelayRoutes = require('./routes/liveRelay');
const { sequelize } = require('./models');
const socketService = require('./services/socketService');
const scheduleService = require('./services/scheduleService');
const videoCampaignRoutes = require('./routes/videoCampaignRoutes');
const videoDeviceRoutes = require('./routes/videoDeviceRoutes');

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
	? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
	: ['http://localhost:5173'];

app.use(helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" },
	contentSecurityPolicy: {
		directives: {
			...helmet.contentSecurityPolicy.getDefaultDirectives(),
			"media-src": ["'self'", "data:", "blob:"],
		},
	},
}));
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/jingles', jingleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/device-schedules', deviceScheduleRoutes);
app.use('/api/clients', brandRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/live-relay', liveRelayRoutes);
app.use('/api/video-campaigns', videoCampaignRoutes);
app.use('/api/video-devices', videoDeviceRoutes);

app.use(errorHandler);

const port = process.env.PORT || 4000;
const hostname = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

const bootstrap = async () => {
	try {
		await sequelize.authenticate();

		console.log(`DB Name: ${process.env.DB_NAME}`);

		if ((process.env.DB_SYNC || '').toLowerCase() === 'true') {
			await sequelize.sync();
		}
		await scheduleService.syncCampaignStatuses();

		socketService.init(server);
		app.set('io', socketService.getIO());

		server.listen(port, hostname, () => {
			// eslint-disable-next-line no-console
			console.log(`Backend listening on http://${hostname}:${port}`);
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Failed to start server', error);
		process.exit(1);
	}
};

bootstrap();

module.exports = app;

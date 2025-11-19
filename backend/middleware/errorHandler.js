// Centralized error handler to keep consistent API responses
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
	const status = err.status || err.statusCode || 500;
	const message = err.message || 'Unexpected server error';

	if (status >= 500) {
		// Surface full stack traces only in development to avoid leaking details
		// eslint-disable-next-line no-console
		console.error(err);
	}

	res.status(status).json({
		error: true,
		message,
		details: err.details || null,
	});
}

module.exports = errorHandler;

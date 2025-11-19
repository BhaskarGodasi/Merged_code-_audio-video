const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'jingles');

if (!fs.existsSync(uploadDirectory)) {
	fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDirectory);
	},
	filename: (_req, file, cb) => {
		const timestamp = Date.now();
		const sanitized = file.originalname.replace(/\s+/g, '-');
		const uniqueName = `${timestamp}-${sanitized}`;
		cb(null, uniqueName);
	},
});

const fileFilter = (_req, file, cb) => {
	if (!file.mimetype.startsWith('audio/')) {
		return cb(new Error('Only audio files are allowed'));
	}
	cb(null, true);
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: Number(process.env.MAX_UPLOAD_SIZE || 20 * 1024 * 1024), // 20MB default
	},
});

module.exports = upload;

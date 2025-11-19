const ExcelJS = require('exceljs');

const buildLogsWorkbookBuffer = async (logs) => {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Playback Logs');

	sheet.columns = [
		{ header: 'Log ID', key: 'id', width: 10 },
		{ header: 'Device', key: 'device', width: 25 },
		{ header: 'Campaign', key: 'campaign', width: 30 },
		{ header: 'Jingle', key: 'jingle', width: 30 },
		{ header: 'Playback Time', key: 'playbackAt', width: 24 },
		{ header: 'Duration (s)', key: 'durationSeconds', width: 15 },
		{ header: 'Status', key: 'status', width: 15 },
	];

	const toPlain = (entry) => (entry && typeof entry.get === 'function' ? entry.get({ plain: true }) : entry);

	logs.forEach((logEntry) => {
		const log = toPlain(logEntry);
		sheet.addRow({
			id: log.id,
			device: log.device ? log.device.name || log.device.serialNumber : log.deviceId,
			campaign: log.campaign ? log.campaign.campaignName : log.campaignId,
			jingle: log.jingle ? log.jingle.title : log.jingleId,
			playbackAt: new Date(log.playbackAt).toISOString(),
			durationSeconds: log.durationSeconds || '',
			status: log.status,
		});
	});

	const header = sheet.getRow(1);
	header.font = { bold: true };

	return workbook.xlsx.writeBuffer();
};

module.exports = {
	buildLogsWorkbookBuffer,
};

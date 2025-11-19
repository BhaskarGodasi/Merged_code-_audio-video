export const formatDate = (value) => {
	if (!value) return '';
	return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value) => {
	if (!value) return '';
	return new Date(value).toLocaleString();
};

export const formatDuration = (seconds) => {
	if (!seconds) return '—';
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	if (minutes > 0) {
		return `${minutes}m ${remainder}s`;
	}
	return `${remainder}s`;
};

export const statusBadgeClass = (status) => {
	if (!status) return 'badge';
	const normalized = status.toLowerCase();
	if (normalized === 'active') return 'badge status-active';
	if (normalized === 'scheduled') return 'badge status-scheduled';
	if (normalized === 'completed') return 'badge status-completed';
	if (normalized === 'expired' || normalized === 'failed') return 'badge status-expired';
	return 'badge';
};

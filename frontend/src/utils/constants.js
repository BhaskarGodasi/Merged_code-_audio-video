export const NAV_LINKS = [
	{ to: '/', label: 'Dashboard', icon: '📊' },
	{ to: '/companies', label: 'Companies', icon: '🏢' },
	{ to: '/brands', label: 'Brands', icon: '🏷️' },
	{ to: '/devices', label: 'Devices', icon: '📱' },
	{ to: '/jingles', label: 'Jingles', icon: '🎵' },
	{ to: '/campaigns', label: 'Campaigns', icon: '📢' },
	{ to: '/send-ads', label: 'Send Ads', icon: '📡' },
	{ to: '/live-relay', label: 'Live Relay', icon: '🎙️' },
	{ to: '/users', label: 'Users', icon: '👤' },
	{ to: '/logs', label: 'Playback Logs', icon: '📝' },
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

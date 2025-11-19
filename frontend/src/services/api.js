import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const http = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Log requests for debugging
http.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		console.log('[API Request]', config.method?.toUpperCase(), config.url, {
			hasToken: !!token,
			headers: config.headers
		});
		return config;
	},
	(error) => {
		console.error('[API Request Error]', error);
		return Promise.reject(error);
	}
);

http.interceptors.response.use(
	(response) => {
		console.log('[API Response]', response.config.method?.toUpperCase(), response.config.url, {
			status: response.status,
			dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
		});
		return response;
	},
	(error) => {
		const message = error?.response?.data?.message || error?.response?.data?.error || error.message;
		const status = error?.response?.status;
		
		console.error('[API Response Error]', status, message);

		// Handle 401 Unauthorized - Token expired or invalid
		if (status === 401) {
			const isTokenExpired = message?.toLowerCase().includes('expired') || 
			                       message?.toLowerCase().includes('token');
			
			if (isTokenExpired) {
				// Clear auth data
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				localStorage.removeItem('tokenExpiry');
				
				// Dispatch event for auth context to handle
				window.dispatchEvent(new CustomEvent('auth:unauthorized', { 
					detail: { message: message || 'Your session has expired. Please login again.' }
				}));
				
				// Redirect to login if not already there
				if (!window.location.pathname.includes('/login')) {
					window.location.href = '/login';
				}
			}
		}

		throw error;
	},
);

export const campaignsApi = {
	list: () => http.get('/campaigns').then((res) => res.data),
	get: (id) => http.get(`/campaigns/${id}`).then((res) => res.data),
	getAnalytics: (id) => http.get(`/campaigns/${id}/analytics`).then((res) => res.data),
	create: (payload) => http.post('/campaigns', payload).then((res) => res.data),
	update: (id, payload) => http.put(`/campaigns/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/campaigns/${id}`).then((res) => res.data),
};

export const jinglesApi = {
	list: () => http.get('/jingles').then((res) => res.data),
	upload: async (payload) => {
		const formData = new FormData();
		Object.entries(payload).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, value);
			}
		});
		const response = await http.post('/jingles', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},
	update: (id, payload) => http.put(`/jingles/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/jingles/${id}`).then((res) => res.data),
};

export const devicesApi = {
	list: () => http.get('/devices').then((res) => res.data),
	get: (id) => http.get(`/devices/${id}`).then((res) => res.data),
	create: (payload) => http.post('/devices', payload).then((res) => res.data),
	update: (id, payload) => http.patch(`/devices/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/devices/${id}`).then((res) => res.data),
	repair: (id) => http.post(`/devices/${id}/repair`).then((res) => res.data),
	triggerPlayback: (id, payload) =>
		http.post(`/devices/${id}/commands/play`, payload).then((res) => res.data),
	controlPlayback: (id, action) =>
		http.post(`/devices/${id}/playback/control`, { action }).then((res) => res.data),
};

export const logsApi = {
	list: (params) => http.get('/logs', { params }).then((res) => res.data),
	count: (params) => http.get('/logs/count', { params }).then((res) => res.data),
	create: (payload) => http.post('/logs', payload).then((res) => res.data),
	export: (params) =>
		http.get('/logs/export', { params, responseType: 'blob' }).then((res) => res.data),
};

export const deviceSchedulesApi = {
	list: () => http.get('/device-schedules').then((res) => res.data),
	getByDevice: (deviceId) => http.get(`/device-schedules/device/${deviceId}`).then((res) => res.data),
	getActiveJingles: (deviceId) => http.get(`/device-schedules/device/${deviceId}/active`).then((res) => res.data),
	getPlayOrder: (deviceId) => http.get(`/device-schedules/device/${deviceId}/play-order`).then((res) => res.data),
	createOrUpdate: (payload) => http.post('/device-schedules', payload).then((res) => res.data),
	addJingle: (payload) => http.post('/device-schedules/jingles', payload).then((res) => res.data),
	addJingleToMultipleDevices: (payload) => http.post('/device-schedules/jingles/bulk', payload).then((res) => res.data),
	updateJingle: (id, payload) => http.put(`/device-schedules/jingles/${id}`, payload).then((res) => res.data),
	removeJingle: (id) => http.delete(`/device-schedules/jingles/${id}`).then((res) => res.data),
	remove: (id) => http.delete(`/device-schedules/${id}`).then((res) => res.data),
};

export const brandsApi = {
	list: () => http.get('/brands').then((res) => res.data),
	get: (id) => http.get(`/brands/${id}`).then((res) => res.data),
	getAnalytics: (id) => http.get(`/brands/${id}/analytics`).then((res) => res.data),
	create: (payload) => http.post('/brands', payload).then((res) => res.data),
	update: (id, payload) => http.put(`/brands/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/brands/${id}`).then((res) => res.data),
};

export const clientsApi = brandsApi; // backward compatibility for legacy imports

export const companiesApi = {
	list: () => http.get('/companies').then((res) => res.data),
	get: (id) => http.get(`/companies/${id}`).then((res) => res.data),
	create: (payload) => http.post('/companies', payload).then((res) => res.data),
	update: (id, payload) => http.put(`/companies/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/companies/${id}`).then((res) => res.data),
};

export const usersApi = {
	list: (params) => http.get('/users', { params }).then((res) => res.data),
	get: (id) => http.get(`/users/${id}`).then((res) => res.data),
	create: (payload) => http.post('/users', payload).then((res) => res.data),
	update: (id, payload) => http.put(`/users/${id}`, payload).then((res) => res.data),
	remove: (id) => http.delete(`/users/${id}`).then((res) => res.data),
	toggleStatus: (id) => http.patch(`/users/${id}/toggle-status`).then((res) => res.data),
};

export const liveRelayApi = {
	getOnlineDevices: () => http.get('/live-relay/online-devices').then((res) => res.data),
	getDeviceSchedule: (deviceId) => http.get(`/live-relay/device/${deviceId}/schedule`).then((res) => res.data),
	requestLiveStream: (deviceId) => http.post(`/live-relay/device/${deviceId}/live-stream`).then((res) => res.data),
};

export const refreshSummary = async () => {
	const [campaigns, devices, logs] = await Promise.all([
		campaignsApi.list(),
		devicesApi.list(),
		logsApi.list({ limit: 1 }),
	]);

	return {
		campaigns: campaigns.length,
		devices: devices.length,
		logs: logs.length,
	};
};

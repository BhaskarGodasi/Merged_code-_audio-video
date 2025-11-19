
import { useState } from 'react';
import PropTypes from 'prop-types';
import { jinglesApi } from '../../services/api';

const JingleUpload = ({ onUploaded }) => {
	const [title, setTitle] = useState('');
	const [file, setFile] = useState(null);
	const [duration, setDuration] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleFileChange = (event) => {
		const selectedFile = event.target.files?.[0] || null;
		setFile(selectedFile);
		
		// Auto-populate title from filename if title is empty
		if (selectedFile && !title) {
			const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
			setTitle(fileNameWithoutExt);
		}

		// Extract audio duration
		if (selectedFile && selectedFile.type.startsWith('audio/')) {
			const audio = new Audio();
			const objectUrl = URL.createObjectURL(selectedFile);
			
			audio.addEventListener('loadedmetadata', () => {
				setDuration(Math.round(audio.duration));
				URL.revokeObjectURL(objectUrl);
			});
			
			audio.addEventListener('error', () => {
				console.warn('Could not extract audio duration');
				URL.revokeObjectURL(objectUrl);
			});
			
			audio.src = objectUrl;
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!file) {
			setError('Select an audio file before uploading');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const payload = {
				file,
				title: title || file.name,
				durationSeconds: duration,
			};
			const created = await jinglesApi.upload(payload);
			setFile(null);
			setTitle('');
			setDuration(null);
			onUploaded(created);
		} catch (uploadError) {
			setError(uploadError?.response?.data?.message || 'Failed to upload audio');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="form-card" onSubmit={handleSubmit}>
			<h2>Upload Audio Jingle</h2>
			{error && <div className="error-message">{error}</div>}
			<div className="form-grid">
				<div className="form-control" style={{ gridColumn: '1 / -1' }}>
					<label htmlFor="jingleTitle">Title</label>
					<input id="jingleTitle" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Morning Promo" />
				</div>
				<div className="form-control" style={{ gridColumn: '1 / -1' }}>
					<label htmlFor="jingleFile">Audio File</label>
					<input id="jingleFile" type="file" accept="audio/*" onChange={handleFileChange} />
				</div>
			</div>
			<div className="form-actions">
				<button type="submit" className="button-primary" disabled={submitting}>
					{submitting ? 'Uploading...' : 'Upload'}
				</button>
			</div>
		</form>
	);
};

JingleUpload.propTypes = {
	onUploaded: PropTypes.func,
};

JingleUpload.defaultProps = {
	onUploaded: () => {},
};

export default JingleUpload;

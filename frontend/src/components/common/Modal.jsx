import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '800px' }) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div className="modal-overlay" onClick={handleBackdropClick}>
			<div className="modal-container" style={{ maxWidth }}>
				<div className="modal-header">
					<h2 className="modal-title">{title}</h2>
					<button 
						type="button" 
						className="modal-close" 
						onClick={onClose}
						aria-label="Close modal"
					>
						✕
					</button>
				</div>
				<div className="modal-body">
					{children}
				</div>
			</div>
		</div>
	);
};

Modal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	maxWidth: PropTypes.string,
};

export default Modal;

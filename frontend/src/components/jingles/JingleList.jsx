import { useState } from 'react';
import PropTypes from 'prop-types';
import { jinglesApi } from '../../services/api';
import { API_BASE_URL } from '../../utils/constants';
import Pagination from '../common/Pagination';

// Remove /api suffix to get base URL for static files
const assetBase = API_BASE_URL.replace(/\/api$/, '');

const JingleList = ({ jingles, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = jingles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(jingles.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Helper to build audio URL
  const getAudioUrl = (filePath) => {
    // filePath is already 'uploads/jingles/filename.mp3'
    const url = `${assetBase}/${filePath}`;
    console.log('Audio URL:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('assetBase:', assetBase);
    return url;
  };

  const handleAudioError = (e, jingleTitle) => {
    console.error('Audio loading error for', jingleTitle, e.target.error);
    console.error('Failed URL:', e.target.src);
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm('Delete this audio file?');
    if (!shouldDelete) {
      return;
    }
    
    try {
      await jinglesApi.remove(id);
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete jingle';
      alert(errorMessage);
    }
  };

  const startEdit = (jingle) => {
    setEditingId(jingle.id);
    setEditForm({
      title: jingle.title || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '' });
  };

  const handleUpdate = async (id) => {
    await jinglesApi.update(id, { title: editForm.title });
    setEditingId(null);
    onRefresh();
  };

  if (!jingles.length) {
    return <p className="muted">No jingles uploaded yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            {/* <th>Description</th> */}
            <th>Preview</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((jingle, idx) => {
            const serial = indexOfFirstItem + idx + 1;
            return (
              <tr key={jingle.id}>
                {editingId === jingle.id ? (
                  <>
                    <td style={{ textAlign: 'center' }}>{serial}</td>
                    <td>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Title"
                      />
                    </td>
                    {/* Description field removed */}
                    <td>
                      <audio 
                        controls 
                        preload="metadata" 
                        src={getAudioUrl(jingle.filePath)} 
                        onError={(e) => handleAudioError(e, jingle.title)}
                        style={{ width: '200px' }}
                      >
                        <track kind="captions" />
                      </audio>
                    </td>
                    <td>{(jingle.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="button-primary" onClick={() => handleUpdate(jingle.id)}>
                          Save
                        </button>
                        <button type="button" className="button-secondary" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ textAlign: 'center' }}>{serial}</td>
                    <td>{jingle.title}</td>
                    {/* Description field removed */}
                    <td>
                      <audio 
                        controls 
                        preload="metadata" 
                        src={getAudioUrl(jingle.filePath)}
                        onError={(e) => handleAudioError(e, jingle.title)}
                        style={{ width: '200px' }}
                      >
                        <track kind="captions" />
                      </audio>
                    </td>
                    <td>{(jingle.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="button-primary" onClick={() => startEdit(jingle)}>
                          Edit
                        </button>
                        <button type="button" className="button-secondary" onClick={() => handleDelete(jingle.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {jingles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={jingles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

JingleList.propTypes = {
  jingles: PropTypes.array,
  onRefresh: PropTypes.func,
};

JingleList.defaultProps = {
  jingles: [],
  onRefresh: () => {},
};

export default JingleList;

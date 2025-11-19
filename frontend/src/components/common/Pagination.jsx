import PropTypes from 'prop-types';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100]
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and surrounding pages
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      
      <div className="pagination-controls">
        <div className="rows-per-page">
          <label htmlFor="rowsPerPage">Rows per page:</label>
          <select 
            id="rowsPerPage"
            value={itemsPerPage} 
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            {rowsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="pagination-buttons">
          <button 
            className="pagination-button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={page}
                className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button 
            className="pagination-button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number)
};

export default Pagination;

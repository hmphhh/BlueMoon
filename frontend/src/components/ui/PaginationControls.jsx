/**
 * PaginationControls — unified pagination component for all list screens.
 *
 * Props:
 *   currentPage      {number}   1-based current page
 *   totalPages       {number}   total number of pages
 *   pageSize         {number}   current rows-per-page setting
 *   totalItems       {number}   total item count (used for display)
 *   onPageChange     {Function} called with a 1-based page number
 *   onPageSizeChange {Function} called with the new size (10 | 20 | 50)
 *   pageSizeOptions  {number[]} optional override for size options (default [10,20,50])
 */

const DEFAULT_SIZE_OPTIONS = [10, 20, 50];

export default function PaginationControls({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = DEFAULT_SIZE_OPTIONS,
}) {
    if (!totalItems) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="pagination-controls">
            {/* Total info */}
            <span className="pagination-controls__info">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>

            <div className="pagination-controls__actions">
                {/* Rows per page */}
                <div className="pagination-controls__group">
                    <label className="pagination-controls__label">Rows per page:</label>
                    <select
                        className="pagination-controls__select"
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                {/* Prev button */}
                <button
                    className="pagination-controls__btn"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label="Previous page"
                >
                    ←
                </button>

                {/* Jump to page */}
                <div className="pagination-controls__group">
                    <label className="pagination-controls__label">Page:</label>
                    <select
                        className="pagination-controls__select"
                        value={currentPage}
                        onChange={e => onPageChange(Number(e.target.value))}
                    >
                        {pages.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <span className="pagination-controls__label">of {totalPages}</span>
                </div>

                {/* Next button */}
                <button
                    className="pagination-controls__btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label="Next page"
                >
                    →
                </button>
            </div>
        </div>
    );
}

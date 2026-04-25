export default function Modal({ title, children, onConfirm, onCancel, confirmText = 'Confirm', confirmVariant = 'btn--danger' }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__title">{title}</div>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmVariant}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

import { Icon } from "./Icons";

export function Modal({ title, children, onClose, actions, width = "normal", closeable = true }) {
  return (
    <div className="modal-overlay" onMouseDown={closeable ? onClose : undefined}>
      <section
        className={`card modal-card modal-${width}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          {closeable && (
            <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
              <Icon name="close" size={18} />
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-actions">{actions}</footer>}
      </section>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel, danger = false, busy = false, onCancel, onConfirm }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className={`btn ${danger ? "btn-danger" : ""}`} disabled={busy} onClick={onConfirm}>
            {busy ? "Aguarde..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal-message">{message}</p>
    </Modal>
  );
}

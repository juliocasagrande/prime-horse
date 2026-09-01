import { useEffect } from "react";
import { Icon } from "./Icons";

export function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast" role="status">
      <span className="toast-icon"><Icon name="check" size={15} /></span>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Fechar"><Icon name="close" size={14} /></button>
    </div>
  );
}

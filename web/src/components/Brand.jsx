import { HorseIcon } from "./Icons";

export function Brand({ compact = false, inverse = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""} ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-mark"><HorseIcon size={compact ? 18 : 21} /></span>
      <div>
        <div className="brand-title">Prime Horse</div>
        <div className="brand-subtitle">Gestão Empresarial</div>
      </div>
    </div>
  );
}

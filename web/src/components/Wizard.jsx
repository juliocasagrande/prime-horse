import { Icon } from "./Icons";
import { Modal } from "./Modal";

export function Stepper({ steps, current }) {
  return (
    <ol className="stepper" aria-label={`Etapa ${current + 1} de ${steps.length}`}>
      {steps.map((step, index) => {
        const state = index < current ? "complete" : index === current ? "current" : "future";
        return (
          <li className={`stepper-item ${state}`} key={step}>
            <div className="stepper-track">
              <span className="stepper-dot">{state === "complete" ? <Icon name="check" size={13} /> : index + 1}</span>
            </div>
            <span className="stepper-label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Wizard({ title, steps, step, children, onClose, onBack, onNext, nextLabel, nextDisabled, saving, closeable = true }) {
  return (
    <Modal
      title={title}
      width="wizard"
      closeable={closeable}
      onClose={onClose}
      actions={
        <>
          <div>{step > 0 && <button type="button" className="btn btn-secondary" onClick={onBack}><Icon name="arrowLeft" /> Voltar</button>}</div>
          <button type="button" className="btn" onClick={onNext} disabled={nextDisabled || saving}>
            {saving ? "Salvando..." : nextLabel || (step === steps.length - 1 ? "Concluir" : "Continuar")}
            {!saving && step < steps.length - 1 && <Icon name="arrowRight" />}
          </button>
        </>
      }
    >
      <Stepper steps={steps} current={step} />
      <div className="wizard-content">{children}</div>
    </Modal>
  );
}

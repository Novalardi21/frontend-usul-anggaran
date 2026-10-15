import Icon from '../ui/Icon'

export default function FormField({ id, label, icon, error, children }) {
  return <div className="form-field">
    <label htmlFor={id}>{label} <span className="required">*</span></label>
    <div className={`input-wrap${error ? ' has-error' : ''}`}><Icon name={icon} />{children}</div>
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>
}

import { useEffect, useRef } from 'react'
import Icon from '../ui/Icon'

export default function Modal({ title, children, onClose, wide = false, busy = false, eyebrow = 'SIPADU · DATA CONTOH' }) {
  const dialog = useRef(null)
  useEffect(() => { dialog.current.showModal() }, [])
  return <dialog ref={dialog} className={`dash-modal${wide ? ' wide' : ''}`} aria-labelledby="dash-modal-title" onClose={onClose} onCancel={event => { if (busy) event.preventDefault() }}>
    <div className="dash-modal-heading"><div><span className="demo-eyebrow">{eyebrow}</span><h2 id="dash-modal-title">{title}</h2></div><button className="dash-icon-button" type="button" aria-label="Tutup dialog" onClick={onClose} disabled={busy}><Icon name="close" /></button></div>
    {children}
  </dialog>
}

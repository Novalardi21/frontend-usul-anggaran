import { useEffect, useRef } from 'react'
import Icon from '../ui/Icon'

export default function InfoDialog({ content, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    if (content && !ref.current.open) ref.current.showModal()
    if (!content && ref.current.open) ref.current.close()
  }, [content])

  return <dialog ref={ref} className="info-dialog" aria-labelledby="dialog-title" onClose={onClose}>
    <div className="dialog-heading"><span className="dialog-icon"><Icon name="info" /></span><button className="icon-button" type="button" aria-label="Tutup dialog" onClick={() => ref.current.close()}><Icon name="close" /></button></div>
    <h2 id="dialog-title">{content?.title}</h2><p>{content?.description}</p>
    <button type="button" className="primary-button" onClick={() => ref.current.close()}>Mengerti</button>
  </dialog>
}

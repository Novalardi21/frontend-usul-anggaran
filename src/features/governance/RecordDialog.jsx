import { useState } from 'react'
import Modal from '../../components/feedback/Modal'
import { Button } from './Workbench'

export default function RecordDialog({title,fields,initial={},onSave,onClose}){
  const [error,setError]=useState('')
  function submit(e){e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));try{onSave(values);onClose()}catch(err){setError(err.message)}}
  return <Modal title={title} onClose={onClose}><form className="work-form" onSubmit={submit}><p>Perubahan ini hanya berlaku pada data contoh selama sesi halaman.</p>{fields.map(f=><label key={f.name}>{f.label}{f.required&&' *'}{f.options?<select name={f.name} defaultValue={initial[f.name]??f.options[0][0]} required={f.required}>{f.options.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>:<input name={f.name} type={f.type||'text'} defaultValue={initial[f.name]??''} required={f.required} min={f.min} step={f.step} maxLength={f.maxLength||180} readOnly={f.readOnly}/> }</label>)}{error&&<p className="work-error" role="alert">{error}</p>}<div className="modal-actions"><Button secondary onClick={onClose}>Batal</Button><button type="submit" className="dash-button">Simpan Perubahan</button></div></form></Modal>
}

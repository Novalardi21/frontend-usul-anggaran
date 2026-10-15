import {useState} from 'react'
import {UNITS,ACCOUNTS,ALLOCATIONS,IKUS,USERS,timeNow} from './demo'
import {getRoleProfile} from '../dashboard/roleDashboard'

export default function useGovernance(role){
  const [catalog,setCatalog]=useState({units:UNITS,accounts:ACCOUNTS,allocations:ALLOCATIONS,ikus:IKUS,users:USERS,subcomponents:[{id:'051.A',name:'Sarana Prasarana Laboratorium'},{id:'052.A',name:'Pembelajaran Teori & Praktikum'},{id:'053.A',name:'Akreditasi & Sertifikasi'}]})
  const [events,setEvents]=useState([{id:'INIT-1',iso:'2026-10-15T01:30:00.000Z',time:'15 Okt 2026, 08:30:00 WIB',actor:'Administrator (contoh)',role:'ADMIN',module:'Master',action:'INISIALISASI_DEMO',target:'TA 2027',note:'Data contoh unit, pagu, akun, dan pengguna dimuat. Bukan data produksi.'}])
  function log(module,action,target,note,before,after){setEvents(previous=>[{id:`EVT-${Date.now()}-${previous.length}`,iso:new Date().toISOString(),time:timeNow(),actor:`${getRoleProfile(role).name} (demo)`,role,module,action,target,note,before,after},...previous])}
  function save(entity,record){
    if(role!=='ADMIN'&&!(role==='OPERATOR'&&['accounts','subcomponents'].includes(entity)))throw new Error('Peran Anda tidak dapat mengubah master ini.')
    const key=entity==='accounts'?'code':entity==='ikus'?'code':'id'
    const previous=(catalog[entity]||[]).find(r=>r[key]===record[key]&&(entity!=='accounts'||r.parent===record.parent))
    if(role==='OPERATOR'&&previous)throw new Error('Operator hanya dapat menambah akun atau subkomponen baru.')
    setCatalog(old=>({...old,[entity]:previous?old[entity].map(r=>r===previous?record:r):[...old[entity],record]}))
    log('Master',previous?'UBAH_MASTER':'TAMBAH_MASTER',record[key],record.name||`${entity} · ${record.unitId||record.code||''}`,previous?JSON.stringify(previous):'Belum ada',JSON.stringify(record))
  }
  return {...catalog,events,save,log}
}

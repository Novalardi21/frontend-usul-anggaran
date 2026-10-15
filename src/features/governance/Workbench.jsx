import Icon from '../../components/ui/Icon'

export function PageHeading({ eyebrow='TATA KELOLA ANGGARAN · TA 2027', title, description, children }) {
  return <section className="dash-card work-heading"><div><span className="work-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p><span className="demo-tag"><Icon name="info" />Prototipe · Data contoh, perubahan direset saat refresh</span></div><div className="work-actions">{children}</div></section>
}
export function Button({children, icon, secondary=false, ...props}) { return <button type="button" className={`dash-button${secondary?' secondary':''}`} {...props}>{icon && <Icon name={icon}/ >}{children}</button> }
export function Notice({children, warning=false}) { return <div className={`work-notice${warning?' warning':''}`}><Icon name={warning?'alert':'shield'}/><div>{children}</div></div> }
export function Metric({label,value,detail,icon='wallet',tone='primary'}) { const money=typeof value==='string'&&value.startsWith('Rp '); return <article className={`dash-card work-metric tone-${tone}`}><span className="stat-icon"><Icon name={icon}/></span><span className="work-eyebrow">{label}</span><strong className={money?'work-money':''}>{money?<><span>Rp</span><span>{value.slice(3)}</span></>:value}</strong><small>{detail}</small></article> }
export function Tabs({items,value,onChange,label='Pilihan tampilan'}) { return <div className="work-tabs" role="group" aria-label={label}>{items.map(([id,name])=><button type="button" key={id} aria-pressed={id===value} className={id===value?'selected':''} onClick={()=>onChange(id)}>{name}</button>)}</div> }
export function Empty({children='Belum ada data yang sesuai filter.'}) { return <div className="work-empty"><Icon name="file"/><p>{children}</p></div> }
export function Table({headers,children,caption}) { return <div className="table-scroll"><table className="work-table"><caption className="sr-only">{caption}</caption><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }

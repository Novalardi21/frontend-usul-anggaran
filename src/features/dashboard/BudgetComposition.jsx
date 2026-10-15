import Icon from '../../components/ui/Icon'
import { FUNDING, getBudgetSummary } from './demoData'
import { formatMoney } from '../../utils/format'

export default function BudgetComposition({ proposals, year, onDetails, allocations }) {
  return <section className="dash-card composition-card" aria-labelledby="composition-title">
    <div className="analytics-heading"><div><h2 id="composition-title">Komposisi Pagu & Penyerapan</h2><p>Komitmen usulan per sumber dana BOPTN vs PNBP</p></div><div className="chart-legend"><span><i className="validated" />Tervalidasi</span><span><i className="in-progress" />Proses</span><span><i className="remaining" />Sisa pagu</span></div></div>
    <div className="funding-list">{FUNDING.map(fund => {
      const ceiling = allocations ? allocations.filter(a=>a.source===fund.code).reduce((n,a)=>n+a.amount,0) : year === '2027' ? fund.ceiling : 0
      const { validated, committed } = getBudgetSummary(proposals.filter(item => item.source === fund.code))
      const remaining = ceiling - validated - committed
      return <article className="funding-row" key={fund.code}><div className="funding-heading"><div><span className={`funding-code ${fund.code.toLowerCase()}`}>{fund.code}</span><h3>{fund.name}</h3></div><p>Pagu maksimal: <strong>{formatMoney(ceiling)}</strong></p></div>
        <div className="stacked-meter" role="img" aria-label={`${fund.code}: tervalidasi ${formatMoney(validated)}, dalam proses ${formatMoney(committed)}, sisa pagu ${formatMoney(remaining)}`}><span className="validated" style={{ width: `${ceiling ? validated / ceiling * 100 : 0}%` }} /><span className="in-progress" style={{ width: `${ceiling ? committed / ceiling * 100 : 0}%` }} /></div>
        <div className="funding-values"><p>Tervalidasi:<strong>{formatMoney(validated)}</strong></p><p>Dalam proses:<strong>{formatMoney(committed)}</strong></p><p>Sisa kuota:<strong>{formatMoney(remaining)}</strong></p></div>
      </article>
    })}</div>
    <div className="composition-footer"><span><Icon name="info" />Pagu adalah alokasi, bukan realisasi belanja.</span><button className="text-button" onClick={onDetails}>Rincian pagu <Icon name="arrow" /></button></div>
  </section>
}

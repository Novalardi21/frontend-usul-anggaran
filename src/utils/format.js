const numberFormatter = new Intl.NumberFormat('id-ID')
export const formatNumber = value => numberFormatter.format(value)
export const formatMoney = value => `Rp ${formatNumber(value)}`
export const formatPercent = value => `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

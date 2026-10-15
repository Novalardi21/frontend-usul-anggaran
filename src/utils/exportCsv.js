export function exportProposals(proposals, year) {
  const escape = value => {
    const text = String(value)
    return `"${(/^[=+@\-\t\r\n]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`
  }
  const rows = [
    ['DATA CONTOH — Bukan laporan resmi POLINDRA'],
    ['Nomor', 'Kegiatan', 'Pengusul', 'Sumber', 'Nominal (Rp)', 'Status', 'Tahap', 'Terakhir diperbarui'],
    ...proposals.map(item => [item.id, item.title, item.proposer, item.source, item.amount, item.status, item.stage || '-', item.updated]),
  ]
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(escape).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `data-contoh-usulan-${year}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

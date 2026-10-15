export function isActionable(item, role) {
  return (role === 'OPERATOR' && item.status === 'KOREKSI' && item.stage === role)
    || (item.status === 'DALAM_PROSES' && item.stage === role)
}

export function filterProposals(proposals, { search = '', status = 'ALL', source = 'ALL', stage = 'ALL', role, sort = 'default' } = {}) {
  const keyword = search.trim().toLocaleLowerCase('id-ID')
  const result = proposals.filter(item => {
    const matchesStatus = status === 'ALL' || (status === 'TASKS' ? isActionable(item, role) : item.status === status)
    const matchesStage = stage === 'ALL' || (stage === 'DONE' ? item.status === 'TERVALIDASI' : item.stage === stage && item.status !== 'TERVALIDASI')
    return matchesStatus && matchesStage && (source === 'ALL' || item.source === source)
      && `${item.id} ${item.title} ${item.account} ${item.proposer} ${item.source}`.toLocaleLowerCase('id-ID').includes(keyword)
  })
  if (sort === 'amount-desc') result.sort((a, b) => b.amount - a.amount)
  if (sort === 'amount-asc') result.sort((a, b) => a.amount - b.amount)
  if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title, 'id-ID'))
  return result
}

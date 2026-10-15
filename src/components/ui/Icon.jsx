const paths = {
  dashboard: ['M3 3h7v9H3Zm11 0h7v5h-7ZM3 16h7v5H3Zm11-4h7v9h-7Z'],
  file: ['M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8m-8 4h6'],
  review: ['M9 5h12v15H3V5h2M8 3h8v4H8Zm-2 9 2 2 4-4m2 2h4m-4 4h4'],
  alert: ['M12 8v5m0 4v.01M12 3 2 21h20L12 3Z'],
  tree: ['M9 3h6v5H9ZM3 16h6v5H3Zm12 0h6v5h-6ZM12 8v4m-6 4v-4h12v4'],
  pie: ['M12 3v9h9M8 3.9A9 9 0 1 0 20.1 16M16 3.9a9 9 0 0 1 4.1 4.1'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 3a4 4 0 0 1 0 8m5 10v-2a4 4 0 0 0-3-4'],
  search: ['M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'],
  settings: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z'],
  plus: ['M12 7v10M7 12h10M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
  wallet: ['M20 8V5H5a2 2 0 0 1 0-4h13v4M3 3v16a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1-2-2m17 7h-6v4h6m-3-2h.01'],
  savings: ['M5 7 4 3l5 2h5a7 7 0 0 1 7 7v3h-3l-1 5h-3l-1-3H8l-1 3H4l-1-7V9l2-2Zm11 2h.01M8 9h4'],
  swap: ['M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2'],
  edit: ['m14 5 5 5M3 21l5-1L21 7l-5-5L3 15v6Z'],
  download: ['M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'],
  logout: ['M9 3H3v18h6m5-14 5 5-5 5M8 12h12'],
  menu: ['M3 6h18M3 12h18M3 18h18'],
  building: ['M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M3 21h18M9 21v-6h6v6M9 7h1m4 0h1m-6 4h1m4 0h1'],
  shield: ['M12 3 3.5 6v5c0 5 3.5 8 8.5 10 5-2 8.5-5 8.5-10V6L12 3Z', 'm8.5 12 2.5 2.5 4.5-5'],
  calendar: ['M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21a7 7 0 0 1 14 0H5Z'],
  lock: ['M8 10V7a4 4 0 0 1 8 0v3M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Zm6 5v2'],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  eyeOff: ['m3 3 18 18M10.6 5.1 12 5c7 0 10 7 10 7a19 19 0 0 1-3 4M6 6a20 20 0 0 0-4 6s3 7 10 7a11 11 0 0 0 5-1.2M10 10a3 3 0 0 0 4 4'],
  chevron: ['m7 10 5 5 5-5'],
  arrow: ['M4 12h16m-6-6 6 6-6 6'],
  coin: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v12m3-9c-1-2-6-2-6 1 0 3 6 1 6 4 0 3-5 3-6 1'],
  chart: ['M4 12h4v9H4Zm6-5h4v14h-4Zm6-4h4v18h-4Z'],
  check: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm8 12 3 3 5-6'],
  info: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v.01'],
  fingerprint: ['M12 11c0 4-1 7-3 10M6 18a16 16 0 0 0 2-7 4 4 0 0 1 8 0c0 4-1 7-2 10M19 18c1-3 1-5 1-7a8 8 0 0 0-16 0v3M12 7a4 4 0 0 1 4 4'],
  close: ['m6 6 12 12M6 18 18 6'],
}

export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths[name]?.map((d, index) => <path key={index} d={d} />)}
  </svg>
}

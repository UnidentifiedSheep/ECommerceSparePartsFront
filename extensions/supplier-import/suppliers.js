import { collectArmtekPage } from './adapters/armtek.js'
import { collectTmtrPage } from './adapters/tmtr.js'

export const supplierAdapters = [
  { host: 'etp.armtek.ru', supplier: 'Armtek', collect: collectArmtekPage, supports: () => true },
  { host: 'market.tmtr.ru', supplier: 'Tmtr', collect: collectTmtrPage, supports: path => /^\/goods\/[^/]+\/?$/.test(path) },
]
export function getSupplierAdapter(address) {
  let url
  try { url = new URL(address) } catch { return undefined }
  if (url.protocol !== 'https:') return undefined
  return supplierAdapters.find(adapter => url.hostname === adapter.host && adapter.supports(url.pathname))
}

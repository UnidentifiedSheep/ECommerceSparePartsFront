/* global chrome */
import { getSupplierAdapter } from './suppliers.js'
import { createGroupJson, maxGroupProducts } from './export.js'
import { messages } from './messages.js'

const element = id => document.getElementById(id)
let locale = navigator.language.slice(0, 2)
try { locale = localStorage.getItem('locale') || locale } catch { /* Browser policy can disable local storage. */ }
if (!Object.hasOwn(messages, locale)) locale = 'ru'
let result, source, snapshot, busy = false, page = 0, selected = new Set(), status
const pageSize = 50
function t(key, params = {}) { return (messages[locale][key] || key).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? '')) }
function showStatus(key, params = {}, error = false) { status = { key, params, error }; renderStatus() }
function renderStatus() {
  element('status').hidden = !status
  element('status').textContent = status ? t(status.key, status.params) : ''
  element('status').classList.toggle('error', !!status?.error)
}
function setChecked(input, products) {
  const count = products.filter(product => selected.has(product.key)).length
  input.checked = !!products.length && count === products.length
  input.indeterminate = count > 0 && count < products.length
  input.disabled = busy || !products.length
}
function renderControls() {
  document.querySelectorAll('button, select, input').forEach(control => { control.disabled = busy })
  for (const id of ['copy', 'download']) element(id).disabled = busy || !result || !selected.size || selected.size > maxGroupProducts
  element('previous').disabled = busy || page === 0
  element('next').disabled = busy || !result || (page + 1) * pageSize >= result.products.length
  if (!result) return
  setChecked(element('all'), result.products)
  for (const section of ['results', 'replacements']) {
    const products = result.products.filter(product => product.sections.includes(section))
    setChecked(element(section), products)
    element(`${section}-count`).textContent = `(${products.length})`
  }
  element('summary').textContent = t('summary', { selected: selected.size, total: result.products.length, duplicates: result.duplicates, max: maxGroupProducts })
}
function renderRows() {
  const body = element('products'); body.replaceChildren()
  if (!result) return
  result.products.slice(page * pageSize, (page + 1) * pageSize).forEach(product => {
    const row = document.createElement('tr'), selectCell = document.createElement('td'), reference = document.createElement('td'), name = document.createElement('td')
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(product.key); check.disabled = busy
    check.setAttribute('aria-label', t('select', product))
    check.addEventListener('change', () => {
      if (check.checked) selected.add(product.key); else selected.delete(product.key)
      status = undefined; renderStatus(); renderControls()
    })
    selectCell.append(check)
    const sku = document.createElement('strong'), producer = document.createElement('small')
    sku.textContent = product.sku; producer.textContent = product.producer; name.textContent = product.name
    reference.append(sku, producer); row.append(selectCell, reference, name); body.append(row)
  })
  element('page').textContent = t('page', { page: page + 1, pages: Math.ceil(result.products.length / pageSize) })
}
function render() {
  document.documentElement.lang = locale
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n) })
  element('locale').value = locale; element('locale').setAttribute('aria-label', t('language')); element('all').setAttribute('aria-label', t('all'))
  element('preview').hidden = !result
  element('export').hidden = !result
  element('intro').hidden = !!result
  if (result) {
    element('preview-heading').textContent = `${t('preview')} · ${result.supplier === 'Tmtr' ? 'Truck Motors' : result.supplier}`
    element('loaded').textContent = t(result.virtualized ? 'virtualized' : result.moreAvailable ? 'loaded' : 'complete')
    element('skipped').hidden = !result.skipped
    element('skipped').textContent = t('skipped', { count: result.skipped })
  }
  renderRows(); renderControls(); renderStatus()
}
async function readPage(expected) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (expected && (tab?.id !== expected.id || tab?.url !== expected.url)) throw new Error('changed')
  const adapter = getSupplierAdapter(tab?.url ?? '')
  if (!adapter || tab.id == null) throw new Error('unsupported')
  const [execution] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: adapter.collect })
  const data = execution?.result
  if (!data?.ok) throw new Error(['unsupported', 'notSearch', 'empty', 'limit'].includes(data?.code) ? data.code : 'readFailed')
  if (data.supplier !== adapter.supplier) throw new Error('readFailed')
  return { data, tab: { id: tab.id, url: tab.url } }
}
function readError(cause) { return ['unsupported', 'notSearch', 'empty', 'limit', 'changed'].includes(cause?.message) ? cause.message : 'readFailed' }
element('scan').addEventListener('click', async () => {
  if (busy) return
  busy = true; result = undefined; selected.clear(); page = 0; showStatus('reading'); render()
  try {
    const read = await readPage()
    result = read.data; source = read.tab; snapshot = JSON.stringify(result)
    selected = new Set(result.products.map(product => product.key)); status = undefined
    if (selected.size > maxGroupProducts) showStatus('limit', {}, true)
  } catch (cause) { showStatus(readError(cause), {}, true) }
  finally { busy = false; render() }
})
async function exportGroup(mode) {
  if (busy || !result || !selected.size || selected.size > maxGroupProducts) return
  busy = true; showStatus('reading'); renderControls()
  try {
    const current = await readPage(source)
    if (JSON.stringify(current.data) !== snapshot) throw new Error('changed')
  } catch (cause) {
    result = undefined; selected.clear(); busy = false; showStatus(readError(cause), {}, true); render(); return
  }
  try {
    const json = createGroupJson(result, selected)
    if (mode === 'copy') { await navigator.clipboard.writeText(json); showStatus('copied') }
    else {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }))
      const link = document.createElement('a'); link.href = url; link.download = `${result.supplier}-crosses-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000)
      showStatus('downloaded')
    }
  } catch { showStatus(mode === 'copy' ? 'copyFailed' : 'exportFailed', {}, true) }
  finally { busy = false; renderControls() }
}
for (const mode of ['copy', 'download']) element(mode).addEventListener('click', () => { void exportGroup(mode) })
for (const section of ['results', 'replacements', 'all']) element(section).addEventListener('change', event => {
  if (!result || busy) return
  for (const product of result.products) if (section === 'all' || product.sections.includes(section)) {
    if (event.target.checked) selected.add(product.key); else selected.delete(product.key)
  }
  status = undefined; renderRows(); renderControls(); renderStatus()
})
element('previous').addEventListener('click', () => { if (page > 0) { page--; renderRows(); renderControls() } })
element('next').addEventListener('click', () => { if (result && (page + 1) * pageSize < result.products.length) { page++; renderRows(); renderControls() } })
element('locale').addEventListener('change', event => {
  locale = event.target.value
  try { localStorage.setItem('locale', locale) } catch { /* Keep the current session usable. */ }
  render()
})
render()

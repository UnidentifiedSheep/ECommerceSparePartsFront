<template>
  <div class="service-settings-page">
    <PageHeader :title="t('serviceSettings.title')" :description="t('serviceSettings.description')">
      <template #actions>
        <el-button type="primary" :loading="isLoadingServices" @click="loadServices">
          {{ t('common.actions.refresh') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="service-settings-content">
      <section class="service-strip">
        <button
          v-for="service in serviceCards"
          :key="service.key"
          type="button"
          class="service-card"
          :class="{ unavailable: !service.available, active: selectedService === service.key }"
          :disabled="!service.available"
          @click="selectService(service.key)"
        >
          <div class="service-card-title">
            <span>{{ serviceLabel(service.key) }}</span>
            <el-tag :type="service.available ? 'success' : 'info'" effect="plain">
              {{ service.available ? t('serviceSettings.available') : t('serviceSettings.unavailable') }}
            </el-tag>
          </div>
          <div class="service-card-meta">
            {{ service.available ? t('serviceSettings.selectService') : t('common.messages.serviceUnavailable') }}
          </div>
        </button>
      </section>

      <el-empty v-if="!canManageSettings" :description="t('serviceSettings.noAccess')" />

      <section v-else class="settings-workspace">
      <aside class="settings-list-panel">
        <div class="settings-list-toolbar">
          <div>
            <h2>{{ t('serviceSettings.settings') }}</h2>
            <p>{{ selectedService ? serviceLabel(selectedService) : t('serviceSettings.selectServiceHint') }}</p>
          </div>
          <el-button
            plain
            :loading="isLoadingSettings"
            :disabled="!selectedService"
            @click="loadSettings"
          >
            {{ t('common.actions.refresh') }}
          </el-button>
        </div>

        <div v-loading="isLoadingSettings" class="settings-list">
          <button
            v-for="setting in settings"
            :key="setting.systemName"
            type="button"
            class="setting-row"
            :class="{ active: selectedSetting?.systemName === setting.systemName }"
            @click="selectSetting(setting)"
          >
            <strong>{{ setting.name || setting.systemName }}</strong>
            <span>{{ setting.description || setting.systemName }}</span>
          </button>
          <el-empty
            v-if="!isLoadingSettings && settings.length === 0"
            :description="selectedService ? t('serviceSettings.empty') : t('serviceSettings.selectServiceHint')"
          />
        </div>
      </aside>

      <main class="setting-editor-panel">
        <template v-if="selectedSetting">
          <div class="setting-editor-header">
            <div>
              <span>{{ selectedSetting.systemName }}</span>
              <h2>{{ selectedSetting.name || selectedSetting.systemName }}</h2>
              <p>{{ selectedSetting.description }}</p>
            </div>
            <el-button
              type="primary"
              :loading="isSaving"
              :disabled="!canSaveSetting"
              @click="saveSetting"
            >
              {{ t('common.actions.save') }}
            </el-button>
          </div>

          <el-alert
            v-if="schemaError"
            type="error"
            show-icon
            :closable="false"
            :title="schemaError"
          />

          <el-form v-else label-position="top" class="setting-form">
            <DynamicSchemaForm
              :fields="schemaFields"
              :model-value="inputState"
              :empty-text="t('serviceSettings.noInput')"
              :is-supported-selector="isSupportedSelector"
              :is-selector-loading="isSelectorLoading"
              :selector-options="selectorOptions"
              :selector-option-value="selectorOptionValue"
              :selector-option-label="selectorOptionLabel"
              :search-selector-options="searchSelectorOptions"
              :load-selector-options-on-open="loadSelectorOptionsOnOpen"
              @update-field="setInputStateField"
              @selector-load-more="loadMoreSelectorOptions"
            />
          </el-form>

          <section v-if="readonlyOutputFields.length > 0" class="readonly-state">
            <div class="readonly-state-header">
              <h3>{{ t('serviceSettings.currentState') }}</h3>
              <p>{{ t('serviceSettings.currentStateHint') }}</p>
            </div>
            <div class="readonly-state-grid">
              <div
                v-for="field in readonlyOutputFields"
                :key="field.name"
                class="readonly-state-field"
              >
                <span>{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
                <small v-if="field.description">{{ field.description }}</small>
              </div>
            </div>
          </section>
        </template>

        <el-empty v-else :description="t('serviceSettings.selectSetting')" />
      </main>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import DynamicSchemaForm, { type FieldValue } from '@/components/schema/DynamicSchemaForm.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { searchProducts } from '@/services/api/search.ts'
import { getServiceNamedObjects, type NamedObjectModel } from '@/services/api/jobs.ts'
import { getServiceSettings, updateServiceSetting, type SettingModel } from '@/services/api/serviceSettings.ts'

interface ServiceCard {
  key: string
  available: boolean
}

interface SettingSchemaField {
  name: string
  type: string
  label?: string
  description?: string
  required?: boolean
  control?: string
  dependsOnEntity?: string
  dependsOnField?: string
}

interface SettingSchema {
  fields: SettingSchemaField[]
}

interface EnumSelectorOption {
  value: string
  label: string
}

interface ReadonlyOutputField {
  name: string
  label: string
  description?: string
  value: string
}

type SelectorOption = CurrencyModel | ProductSearchModel | EnumSelectorOption | NamedObjectModel

const { t } = useI18n()
const { hasPermission } = usePermissions()
const canManageSettings = computed(() => hasPermission('OPTIONS_GET'))
const knownServices: ServiceCard[] = [
  { key: 'main', available: true },
  { key: 'analytics', available: true },
  { key: 'pricing', available: true },
  { key: 'search', available: true },
]

const services = ref<Record<string, ServiceCard>>({})
const selectedService = ref<string | null>(null)
const settings = ref<SettingModel[]>([])
const selectedSetting = ref<SettingModel | null>(null)
const schemaFields = ref<SettingSchemaField[]>([])
const schemaError = ref('')
const isLoadingServices = ref(false)
const isLoadingSettings = ref(false)
const isSaving = ref(false)
const currencies = ref<CurrencyModel[]>([])
const products = ref<ProductSearchModel[]>([])
const productsQuery = ref('')
const productsPage = ref(0)
const productsLimit = ref(50)
const productsHasNext = ref(true)
const namedObjects = ref<Record<string, NamedObjectModel[]>>({})
const isLoadingCurrencies = ref(false)
const isLoadingProducts = ref(false)
const loadingNamedObjectGroups = ref<Set<string>>(new Set())
const inputState = reactive<Record<string, string | number | boolean | null>>({})
const readonlyOutputFields = ref<ReadonlyOutputField[]>([])

const serviceCards = computed(() => Object.entries(services.value).map(([key, service]) => ({
  key,
  available: service.available,
})))

const canSaveSetting = computed(() => Boolean(
  selectedService.value
  && selectedSetting.value
  && !schemaError.value
  && schemaFields.value.every((field) => !field.required || !isEmptyValue(inputState[field.name])),
))

function serviceLabel(key: string) {
  const labels: Record<string, string> = {
    main: 'Main',
    analytics: 'Analytics',
    search: 'Search',
    pricing: 'Pricing',
  }

  return labels[key] ?? key
}

async function loadServices() {
  if (!canManageSettings.value) return

  isLoadingServices.value = true
  try {
    services.value = Object.fromEntries(knownServices.map((service) => [service.key, service]))
    if (!selectedService.value) {
      selectedService.value = serviceCards.value.find((service) => service.available)?.key ?? null
      if (selectedService.value) await loadSettings()
    }
  } finally {
    isLoadingServices.value = false
  }
}

async function selectService(serviceKey: string) {
  if (selectedService.value === serviceKey) return
  selectedService.value = serviceKey
  settings.value = []
  selectedSetting.value = null
  resetInputState()
  readonlyOutputFields.value = []
  await loadSettings()
}

async function loadSettings() {
  if (!selectedService.value || !canManageSettings.value) return

  isLoadingSettings.value = true
  try {
    const response = await getServiceSettings(selectedService.value)
    settings.value = response.settings
    const nextSelected = selectedSetting.value
      ? response.settings.find((setting) => setting.systemName === selectedSetting.value?.systemName) ?? null
      : response.settings[0] ?? null
    selectSetting(nextSelected)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('serviceSettings.loadSettingsError'))
  } finally {
    isLoadingSettings.value = false
  }
}

function selectSetting(setting: SettingModel | null) {
  selectedSetting.value = setting
  resetInputState()
  readonlyOutputFields.value = []
  schemaError.value = ''

  if (!setting) {
    schemaFields.value = []
    return
  }

  parseSettingSchema(setting.inputData)
  hydrateOutputData(setting.outputData, setting.outputMetadata)
  void loadSchemaSelectors()
}

function resetInputState() {
  Object.keys(inputState).forEach((key) => {
    delete inputState[key]
  })
}

function parseSettingSchema(rawSchema: string) {
  try {
    const parsed = JSON.parse(rawSchema || '{}') as SettingSchema
    schemaFields.value = Array.isArray(parsed.fields) ? parsed.fields : []
    schemaFields.value.forEach((field) => {
      inputState[field.name] = defaultValue(field)
    })
  } catch {
    schemaError.value = t('serviceSettings.schemaError')
  }
}

function hydrateOutputData(rawOutput: string, rawOutputMetadata?: string | null) {
  if (!rawOutput) return

  try {
    const parsed = JSON.parse(rawOutput) as Record<string, string | number | boolean | null>
    const outputMetadataFields = parseOutputMetadataFields(rawOutputMetadata)
    schemaFields.value.forEach((field) => {
      const currentValue = findCurrentFieldValue(parsed, field.name)
      if (currentValue.found) {
        inputState[field.name] = normalizeFieldValue(field, currentValue.value)
      }
    })
    readonlyOutputFields.value = buildReadonlyOutputFields(parsed, outputMetadataFields)
  } catch {
    schemaError.value = t('serviceSettings.outputParseError')
  }
}

function parseOutputMetadataFields(rawOutputMetadata?: string | null): SettingSchemaField[] {
  if (!rawOutputMetadata) return []

  const parsed = JSON.parse(rawOutputMetadata || '{}') as SettingSchema
  return Array.isArray(parsed.fields) ? parsed.fields : []
}

function buildReadonlyOutputFields(source: Record<string, unknown>, outputMetadataFields: SettingSchemaField[]): ReadonlyOutputField[] {
  if (outputMetadataFields.length > 0) {
    const metadataFieldNames = new Set(outputMetadataFields.map((field) => normalizeKey(field.name)))
    const describedFields = outputMetadataFields
      .map((field): ReadonlyOutputField | null => {
        const currentValue = findCurrentFieldValue(source, field.name)
        if (!currentValue.found) return null

        const readonlyField: ReadonlyOutputField = {
          name: field.name,
          label: fieldLabel(field),
          description: field.description,
          value: formatReadonlyValue(currentValue.value, field),
        }
        return readonlyField
      })
      .filter((field): field is ReadonlyOutputField => field !== null)

    return [
      ...describedFields,
      ...buildFallbackReadonlyOutputFields(source, metadataFieldNames),
    ]
  }

  return buildFallbackReadonlyOutputFields(
    source,
    new Set(schemaFields.value.map((field) => normalizeKey(field.name))),
  )
}

function buildFallbackReadonlyOutputFields(source: Record<string, unknown>, excludedFieldNames: Set<string>): ReadonlyOutputField[] {
  const editableFieldNames = new Set(schemaFields.value.map((field) => normalizeKey(field.name)))

  return Object.entries(source)
    .filter(([key]) => !editableFieldNames.has(normalizeKey(key)) && !excludedFieldNames.has(normalizeKey(key)))
    .map(([key, value]) => ({
      name: key,
      label: key,
      value: formatReadonlyValue(value),
    }))
}

function normalizeKey(key: string) {
  return key.toLowerCase()
}

function formatReadonlyValue(value: unknown, field?: SettingSchemaField): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field?.control === 'EnumSelector') return String(normalizeEnumValue(field, value as string | number | boolean))
  if (typeof value === 'boolean') return value ? t('serviceSettings.yes') : t('serviceSettings.no')
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

function findCurrentFieldValue(source: Record<string, unknown>, fieldName: string) {
  if (Object.prototype.hasOwnProperty.call(source, fieldName)) {
    return { found: true, value: source[fieldName] }
  }

  const pascalName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  if (Object.prototype.hasOwnProperty.call(source, pascalName)) {
    return { found: true, value: source[pascalName] }
  }

  const normalizedFieldName = fieldName.toLowerCase()
  const matchedKey = Object.keys(source).find((key) => key.toLowerCase() === normalizedFieldName)
  if (matchedKey) {
    return { found: true, value: source[matchedKey] }
  }

  return { found: false, value: null }
}

function normalizeFieldValue(field: SettingSchemaField, value: unknown) {
  if (value === null || value === undefined) return defaultValue(field)
  if (field.control === 'DatePicker' && typeof value === 'string') return value.slice(0, 10)
  if (field.control === 'EnumSelector' && isPrimitiveSettingValue(value)) return normalizeEnumValue(field, value)
  if (isPrimitiveSettingValue(value)) return value
  return JSON.stringify(value)
}

function normalizeEnumValue(field: SettingSchemaField, value: string | number | boolean) {
  if (field.dependsOnEntity === 'ExchangeRateProvider' && typeof value === 'number') {
    return value === 1 ? 'MoneyConvert' : 'Cbr'
  }

  return typeof value === 'boolean' ? String(value) : value
}

function isPrimitiveSettingValue(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function defaultValue(field: SettingSchemaField) {
  if (field.control === 'TextField') return ''
  if (field.control === 'DatePicker') return ''
  if (['EntitySelector', 'EnumSelector', 'NamedObjectSelector'].includes(field.control ?? '')) return null
  if (field.type === 'boolean') return false
  if (isNumberField(field)) return 0
  return ''
}

function isNumberField(field: SettingSchemaField) {
  if (['TextField', 'DatePicker', 'EntitySelector', 'EnumSelector', 'NamedObjectSelector'].includes(field.control ?? '')) return false
  return ['int', 'integer', 'long', 'float', 'double', 'decimal', 'number'].includes(field.type.toLowerCase())
}

function fieldLabel(field: SettingSchemaField) {
  return field.label || field.name
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === ''
}

function setInputStateField(name: string, value: FieldValue) {
  inputState[name] = value
}

function normalizedInputState() {
  return Object.fromEntries(schemaFields.value.map((field): [string, string | number | boolean | null] => {
    const value = inputState[field.name]
    return [field.name, !field.required && isEmptyValue(value) ? null : value ?? null]
  }))
}

function isSupportedSelector(field: SettingSchemaField) {
  return field.dependsOnEntity === 'Currency'
    || field.dependsOnEntity === 'Product'
    || field.dependsOnEntity === 'ExchangeRateProvider'
    || (field.control === 'NamedObjectSelector' && Boolean(field.dependsOnEntity))
}

function isSelectorLoading(field: SettingSchemaField) {
  if (field.dependsOnEntity === 'Currency') return isLoadingCurrencies.value
  if (field.dependsOnEntity === 'Product') return isLoadingProducts.value
  if (field.control === 'NamedObjectSelector' && field.dependsOnEntity && selectedService.value) {
    return loadingNamedObjectGroups.value.has(namedObjectsCacheKey(selectedService.value, field.dependsOnEntity))
  }
  return false
}

function selectorOptions(field: SettingSchemaField): SelectorOption[] {
  if (field.dependsOnEntity === 'Currency') return currencies.value
  if (field.dependsOnEntity === 'Product') return products.value
  if (field.dependsOnEntity === 'ExchangeRateProvider') {
    return [
      { value: 'Cbr', label: t('common.exchangeRateProviders.Cbr') },
      { value: 'MoneyConvert', label: t('common.exchangeRateProviders.MoneyConvert') },
    ]
  }
  if (field.control === 'NamedObjectSelector' && field.dependsOnEntity && selectedService.value) {
    return namedObjects.value[namedObjectsCacheKey(selectedService.value, field.dependsOnEntity)] ?? []
  }
  return []
}

function selectorOptionValue(field: SettingSchemaField, option: SelectorOption): string | number {
  if ('value' in option) return option.value
  if ('systemName' in option) return option.systemName

  const key = field.dependsOnField ?? 'id'
  const value = option[key as keyof SelectorOption]
  return typeof value === 'number' || typeof value === 'string'
    ? value
    : option.id
}

function selectorOptionLabel(field: SettingSchemaField, option: SelectorOption) {
  if ('label' in option) return option.label
  if ('systemName' in option) return option.name || option.systemName

  if (field.dependsOnEntity === 'Currency') {
    const currency = option as CurrencyModel
    return `${currency.shortName} (${currency.currencySign})`
  }

  if (field.dependsOnEntity === 'Product') {
    const product = option as ProductSearchModel
    return `${product.sku} - ${product.name}`
  }

  return String(selectorOptionValue(field, option))
}

async function loadCurrenciesIfNeeded() {
  if (currencies.value.length > 0 || isLoadingCurrencies.value) return

  isLoadingCurrencies.value = true
  try {
    const response = await getCurrencies()
    currencies.value = response.currencies
  } finally {
    isLoadingCurrencies.value = false
  }
}

async function loadProducts(query = '', reset = true) {
  if (isLoadingProducts.value) return
  if (reset) {
    productsQuery.value = query
    productsPage.value = 0
    productsHasNext.value = true
    products.value = []
  }
  if (!productsHasNext.value) return

  isLoadingProducts.value = true
  try {
    const response = await searchProducts({
      query: productsQuery.value.trim() || undefined,
      page: productsPage.value,
      size: productsLimit.value,
      sortBy: 'id_asc',
    })
    const existingIds = new Set(products.value.map((product) => product.id))
    products.value.push(...response.products.filter((product) => !existingIds.has(product.id)))
    productsHasNext.value = response.products.length === productsLimit.value
    productsPage.value += 1
  } finally {
    isLoadingProducts.value = false
  }
}

async function loadProductsIfNeeded() {
  if (products.value.length > 0 || isLoadingProducts.value) return
  await loadProducts()
}

function namedObjectsCacheKey(serviceKey: string, groupName: string) {
  return `${serviceKey}:${groupName}`
}

async function loadNamedObjects(groupName: string) {
  if (!selectedService.value) return

  const key = namedObjectsCacheKey(selectedService.value, groupName)
  if (namedObjects.value[key]?.length || loadingNamedObjectGroups.value.has(key)) return

  loadingNamedObjectGroups.value = new Set([...loadingNamedObjectGroups.value, key])
  try {
    const response = await getServiceNamedObjects(selectedService.value, groupName)
    namedObjects.value = {
      ...namedObjects.value,
      [key]: response.namedObjects,
    }
  } finally {
    const next = new Set(loadingNamedObjectGroups.value)
    next.delete(key)
    loadingNamedObjectGroups.value = next
  }
}

async function loadSelectorOptionsOnOpen(field: SettingSchemaField, isOpen: boolean) {
  if (!isOpen) return
  await loadSelectorOptions(field)
}

async function loadSelectorOptions(field: SettingSchemaField) {
  if (field.dependsOnEntity === 'Currency') {
    await loadCurrenciesIfNeeded()
    return
  }

  if (field.dependsOnEntity === 'Product') {
    await loadProductsIfNeeded()
    return
  }

  if (field.control === 'NamedObjectSelector' && field.dependsOnEntity) {
    await loadNamedObjects(field.dependsOnEntity)
  }
}

function searchSelectorOptions(field: SettingSchemaField, query: string) {
  if (field.dependsOnEntity === 'Product') {
    void loadProducts(query, true)
  }
}

function loadMoreSelectorOptions(field: SettingSchemaField) {
  if (field.dependsOnEntity === 'Product') {
    void loadProducts(productsQuery.value, false)
  }
}

async function loadSchemaSelectors() {
  await Promise.all(schemaFields.value
    .filter((field) => ['EntitySelector', 'EnumSelector', 'NamedObjectSelector'].includes(field.control ?? '') && isSupportedSelector(field))
    .map((field) => loadSelectorOptions(field)))
}

async function saveSetting() {
  if (!selectedService.value || !selectedSetting.value || !canSaveSetting.value) return

  const missingField = schemaFields.value.find((field) => field.required && isEmptyValue(inputState[field.name]))
  if (missingField) {
    ElMessage.warning(t('serviceSettings.fillField', { field: fieldLabel(missingField) }))
    return
  }

  isSaving.value = true
  try {
    await updateServiceSetting(selectedService.value, selectedSetting.value.systemName, {
      json: JSON.stringify(normalizedInputState()),
    })
    ElMessage.success(t('serviceSettings.saved'))
    await loadSettings()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('serviceSettings.saveError'))
  } finally {
    isSaving.value = false
  }
}

onMounted(loadServices)
</script>

<style scoped>
.service-settings-page {
  min-height: calc(100vh - 56px);
  background: #f7f8fa;
}

.service-settings-content {
  padding: 24px;
}

.settings-list-toolbar,
.setting-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings-list-toolbar h2,
.setting-editor-header h2 {
  margin: 0;
  color: #111827;
  font-weight: 700;
}

.settings-list-toolbar p,
.setting-editor-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.service-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.service-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
  text-align: left;
}

.service-card.active {
  border-color: #94a3b8;
  background: #f8fafc;
}

.service-card.unavailable {
  background: #f8fafc;
  border-color: #e2e8f0;
  cursor: not-allowed;
  opacity: 0.72;
}

.service-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #111827;
  font-weight: 650;
}

.service-card-meta {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.settings-workspace {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
}

.settings-list-panel,
.setting-editor-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.settings-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.setting-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
  text-align: left;
}

.setting-row.active,
.setting-row:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

.setting-row.active {
  border-color: #047857;
  background: #f7fdf9;
}

.setting-row strong,
.setting-row span {
  display: block;
}

.setting-row strong {
  color: #111827;
}

.setting-row span {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.setting-editor-header {
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
  padding-bottom: 16px;
}

.setting-editor-header span {
  color: #64748b;
  font-size: 12px;
}

.setting-form {
  max-width: 720px;
}

.readonly-state {
  max-width: 720px;
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
  padding-top: 18px;
}

.readonly-state-header h3 {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.readonly-state-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.readonly-state-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.readonly-state-field {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 12px;
}

.readonly-state-field span,
.readonly-state-field strong,
.readonly-state-field small {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.readonly-state-field span {
  color: #64748b;
  font-size: 12px;
}

.readonly-state-field strong {
  margin-top: 4px;
  color: #111827;
  font-size: 14px;
}

.readonly-state-field small {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .service-strip,
  .settings-workspace {
    grid-template-columns: 1fr;
  }

  .readonly-state-grid {
    grid-template-columns: 1fr;
  }
}
</style>

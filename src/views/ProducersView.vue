<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <PageHeader :title="t('producers.title')" :description="t('producers.description')">
      <template #actions>
        <el-button :icon="Plus" type="primary" @click="openCreateDialog">
          {{ t('producers.addProducer') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="producer-page-body">
      <div class="producer-search-bar">
        <label for="producer-search">{{ t('producers.search') }}</label>
        <el-input
          id="producer-search"
          v-model="searchTerm"
          :prefix-icon="Search"
          clearable
          :placeholder="t('producers.searchPlaceholder')"
        />
        <span class="producer-search-bar__count">
          {{ t('producers.foundOnPage', { count: producers.length }) }}
        </span>
      </div>

      <div class="producer-workspace">
            <el-card v-loading="listLoading" shadow="never" class="producer-list-card">
              <el-table
                :data="producers"
                class="w-full"
                height="100%"
                highlight-current-row
                @current-change="selectProducer"
              >
                <el-table-column prop="name" :label="t('common.labels.name')" min-width="220" />
                <el-table-column v-if="!isMobile" :label="t('common.labels.description')" min-width="260">
                  <template #default="{ row }">
                    {{ row.description || '—' }}
                  </template>
                </el-table-column>
                <el-table-column fixed="right" :label="t('common.labels.actions')" width="92" align="right">
                  <template #default="{ row }">
                    <div class="producer-actions">
                      <ActionIconButton :label="t('common.actions.edit')" :icon="Edit" @click="openEditDialog(row)" />
                      <ActionIconButton :label="t('common.actions.delete')" :icon="Delete" tone="danger" @click="removeProducer(row.id)" />
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <template #footer>
                <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
              </template>
            </el-card>

            <el-card shadow="never" class="producer-details-card">
              <template v-if="selectedProducer">
                <div class="producer-details-header">
                  <h2>{{ selectedProducer.name }}</h2>
                  <p>
                    {{ selectedProducer.description || t('producers.noDescription') }}
                  </p>

                  <div class="producer-details-toolbar">
                    <div class="producer-details-tabs" role="tablist">
                      <button
                        v-for="option in detailsModeOptions"
                        :key="option.value"
                        type="button"
                        role="tab"
                        :aria-selected="detailsMode === option.value"
                        :class="{ 'is-active': detailsMode === option.value }"
                        @click="detailsMode = option.value"
                      >
                        {{ option.label }}
                      </button>
                    </div>

                    <el-button
                      v-if="detailsMode === 'aliases'"
                      :icon="Plus"
                      size="small"
                      plain
                      @click="aliasDialogOpen = true"
                    >
                      {{ t('producers.addAlias') }}
                    </el-button>
                    <el-button
                      v-else
                      :icon="Plus"
                      size="small"
                      plain
                      @click="openSupplierMappingDialog"
                    >
                      {{ t('producers.addSupplierReference') }}
                    </el-button>
                  </div>
                </div>

                <div v-loading="detailsLoading" class="producer-details-table">
                  <el-table v-if="detailsMode === 'aliases'" :data="aliases" height="100%">
                    <el-table-column prop="alias" :label="t('producers.alias')" min-width="220" />
                    <el-table-column width="56" align="center">
                      <template #header>
                        <span class="sr-only">{{ t('common.labels.actions') }}</span>
                      </template>
                      <template #default="{ row }">
                        <ActionIconButton
                          :label="t('common.actions.delete')"
                          :icon="Delete"
                          tone="danger"
                          @click="removeAlias(row.alias)"
                        />
                      </template>
                    </el-table-column>
                  </el-table>

                  <el-table v-else :data="supplierMappings" height="100%">
                    <el-table-column :label="t('producers.supplier')" min-width="105">
                      <template #default="{ row }">
                        {{ t(`producers.suppliers.${row.supplier}`) }}
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="supplierProducerName"
                      :label="t('producers.supplierProducerName')"
                      min-width="145"
                    />
                    <el-table-column width="56" align="center">
                      <template #header>
                        <span class="sr-only">{{ t('common.labels.actions') }}</span>
                      </template>
                      <template #default="{ row }">
                        <ActionIconButton
                          :label="t('common.actions.delete')"
                          :icon="Delete"
                          tone="danger"
                          @click="removeSupplierMapping(row.id)"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>

              <template v-else>
                <div class="producer-details-empty">
                  <el-empty :description="t('producers.selectToView')" />
                </div>
              </template>
            </el-card>
      </div>
    </div>

    <el-dialog v-model="createDialogOpen" :title="t('producers.createTitle')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.name')">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item :label="t('common.labels.description')">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveCreate">{{ t('common.actions.create') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogOpen" :title="t('producers.editTitle')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.name')">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item :label="t('common.labels.description')">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveEdit">{{ t('common.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="aliasDialogOpen" :title="t('producers.addAliasTitle')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('producers.aliasLabel')">
          <el-input v-model="aliasForm.alias" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aliasDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveAlias">{{ t('common.actions.add') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="supplierMappingDialogOpen"
      :title="t('producers.addSupplierReferenceTitle')"
      width="520"
    >
      <el-form label-position="top">
        <el-form-item :label="t('producers.supplier')" required>
          <el-select v-model="supplierMappingForm.supplier" class="w-full">
            <el-option
              v-for="supplier in supplierOptions"
              :key="supplier"
              :label="t(`producers.suppliers.${supplier}`)"
              :value="supplier"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('producers.supplierProducerName')" required>
          <el-input
            v-model="supplierMappingForm.supplierProducerName"
            :placeholder="t('producers.supplierProducerNamePlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplierMappingDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!supplierMappingForm.supplierProducerName.trim()"
          @click="saveSupplierMapping"
        >
          {{ t('common.actions.add') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import type {
  ProducerAliasModel,
  ProducerSupplierMappingModel,
  Supplier,
} from '@/models/producerModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  addProducerAlias,
  createProducerSupplierMapping,
  createProducer,
  deleteProducer,
  deleteProducerAlias,
  deleteProducerSupplierMapping,
  editProducer,
  getProducerAliases,
  getProducerSupplierMappings,
} from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const isMobile = useMediaQuery('(max-width: 640px)')
const producers = ref<ProducerSearchModel[]>([])
const selectedProducer = ref<ProducerSearchModel>()
const aliases = ref<ProducerAliasModel[]>([])
const supplierMappings = ref<ProducerSupplierMappingModel[]>([])
type DetailsMode = 'aliases' | 'supplierReferences'

const detailsMode = ref<DetailsMode>('aliases')
const aliasesLoaded = ref(false)
const supplierMappingsLoaded = ref(false)
const searchTerm = ref('')
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const listLoading = ref(false)
const detailsLoading = ref(false)

const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const aliasDialogOpen = ref(false)
const supplierMappingDialogOpen = ref(false)

const createForm = reactive({
  name: '',
  description: '',
})

const editForm = reactive({
  id: 0,
  name: '',
  description: '',
})

const aliasForm = reactive({
  alias: '',
})

const supplierOptions: Supplier[] = ['Armtek', 'FavoritParts']
const supplierMappingForm = reactive<{
  supplier: Supplier
  supplierProducerName: string
}>({
  supplier: 'Armtek',
  supplierProducerName: '',
})

const detailsModeOptions = computed<Array<{ label: string, value: DetailsMode }>>(() => [
  { label: t('producers.aliases'), value: 'aliases' },
  { label: t('producers.supplierReferences'), value: 'supplierReferences' },
])

const loadProducersDebounced = useDebounceFn(async () => {
  await loadProducers(true)
}, 300)

async function loadProducers(resetPage: boolean) {
  if (listLoading.value) return

  listLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await searchProducers({
      query: searchTerm.value.trim() || undefined,
      page: page.value,
      size: limit.value,
    })

    producers.value = resp.producers
    hasNext.value = resp.producers.length === limit.value

    if (selectedProducer.value) {
      const nextSelected = resp.producers.find((producer) => producer.id === selectedProducer.value?.id)
      selectedProducer.value = nextSelected
      if (!nextSelected) resetDetails()
    }
  } finally {
    listLoading.value = false
  }
}

async function selectProducer(producer?: ProducerSearchModel) {
  if (producer?.id === selectedProducer.value?.id) return

  selectedProducer.value = producer
  resetDetails()
  if (!producer) {
    return
  }

  await loadCurrentDetails()
}

function resetDetails() {
  aliases.value = []
  supplierMappings.value = []
  aliasesLoaded.value = false
  supplierMappingsLoaded.value = false
}

async function loadCurrentDetails() {
  const producer = selectedProducer.value
  if (!producer) return

  if (detailsMode.value === 'aliases' && aliasesLoaded.value) return
  if (detailsMode.value === 'supplierReferences' && supplierMappingsLoaded.value) return

  detailsLoading.value = true
  try {
    if (detailsMode.value === 'aliases') {
      const resp = await getProducerAliases(producer.id)
      if (selectedProducer.value?.id !== producer.id) return
      aliases.value = resp.aliases
      aliasesLoaded.value = true
      return
    }

    const resp = await getProducerSupplierMappings({ producerId: producer.id })
    if (selectedProducer.value?.id !== producer.id) return
    supplierMappings.value = resp.mappings
    supplierMappingsLoaded.value = true
  } finally {
    detailsLoading.value = false
  }
}

function openCreateDialog() {
  createForm.name = ''
  createForm.description = ''
  createDialogOpen.value = true
}

function openEditDialog(producer: ProducerSearchModel) {
  editForm.id = producer.id
  editForm.name = producer.name
  editForm.description = producer.description ?? ''
  editDialogOpen.value = true
}

function updateProducerInList(producer: ProducerSearchModel) {
  producers.value = producers.value.map((item) => (
    item.id === producer.id ? producer : item
  ))

  if (selectedProducer.value?.id === producer.id) {
    selectedProducer.value = producer
  }
}

function addProducerToList(producer: ProducerSearchModel) {
  producers.value = [
    producer,
    ...producers.value.filter((item) => item.id !== producer.id),
  ]
  selectedProducer.value = producer
  resetDetails()
}

async function saveCreate() {
  const resp = await createProducer({
    name: createForm.name,
    description: createForm.description || null,
  })

  addProducerToList(resp.producer)

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.created'),
    type: 'success',
  })

  createDialogOpen.value = false
}

async function saveEdit() {
  const resp = await editProducer({
    id: editForm.id,
    name: editForm.name,
    description: editForm.description || null,
  })

  updateProducerInList(resp.producer)

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.updated'),
    type: 'success',
  })

  editDialogOpen.value = false
}

async function removeProducer(id: number) {
  await deleteProducer(id)

  producers.value = producers.value.filter((producer) => producer.id !== id)

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.deleted'),
    type: 'success',
  })

  if (selectedProducer.value?.id === id) {
    selectedProducer.value = undefined
    resetDetails()
  }
}

async function saveAlias() {
  if (!selectedProducer.value) return

  await addProducerAlias({
    producerId: selectedProducer.value.id,
    alias: aliasForm.alias,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.aliasAdded'),
    type: 'success',
  })

  aliasDialogOpen.value = false
  aliases.value.push({
    producerId: selectedProducer.value.id,
    alias: aliasForm.alias,
  })
  aliasesLoaded.value = true
  aliasForm.alias = ''
}

async function removeAlias(alias: string) {
  if (!selectedProducer.value) return

  await deleteProducerAlias({
    producerId: selectedProducer.value.id,
    alias,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.aliasDeleted'),
    type: 'success',
  })

  aliases.value = aliases.value.filter((item) => item.alias !== alias)
}

function openSupplierMappingDialog() {
  supplierMappingForm.supplier = 'Armtek'
  supplierMappingForm.supplierProducerName = ''
  supplierMappingDialogOpen.value = true
}

async function saveSupplierMapping() {
  const producer = selectedProducer.value
  const supplierProducerName = supplierMappingForm.supplierProducerName.trim()
  if (!producer || !supplierProducerName) return

  const resp = await createProducerSupplierMapping({
    producerId: producer.id,
    supplier: supplierMappingForm.supplier,
    supplierProducerName,
  })

  supplierMappings.value = [
    resp.producerSupplierMapping,
    ...supplierMappings.value.filter((item) => item.id !== resp.producerSupplierMapping.id),
  ]
  supplierMappingsLoaded.value = true
  supplierMappingDialogOpen.value = false

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.supplierReferenceAdded'),
    type: 'success',
  })
}

async function removeSupplierMapping(mappingId: number) {
  const producer = selectedProducer.value
  if (!producer) return

  await deleteProducerSupplierMapping(producer.id, mappingId)
  supplierMappings.value = supplierMappings.value.filter((item) => item.id !== mappingId)

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.supplierReferenceDeleted'),
    type: 'success',
  })
}

watch(limit, async () => loadProducers(true))
watch(page, async () => loadProducers(false))
watch(searchTerm, () => loadProducersDebounced())
watch(detailsMode, async () => loadCurrentDetails())
onMounted(async () => loadProducers(true))
</script>

<style scoped>
.producer-page-body {
  padding: 16px;
}

.producer-search-bar {
  display: grid;
  grid-template-columns: auto minmax(240px, 420px) 1fr;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px 16px;
}

.producer-search-bar label {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.producer-search-bar__count {
  justify-self: end;
  color: #64748b;
  font-size: 12px;
}

.producer-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(400px, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.producer-list-card,
.producer-details-card {
  height: clamp(580px, calc(100dvh - 230px), 760px);
  overflow: hidden;
}

.producer-list-card {
  display: flex;
  flex-direction: column;
}

.producer-list-card :deep(.el-card__body) {
  min-height: 0;
  flex: 1;
}

.producer-details-card :deep(.el-card__body) {
  display: flex;
  height: 100%;
  box-sizing: border-box;
  flex-direction: column;
  padding: 0;
}

.producer-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.producer-details-header {
  flex: 0 0 auto;
  padding: 20px 20px 0;
}

.producer-details-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.producer-details-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.producer-details-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 45px;
  margin-top: 15px;
  border-bottom: 1px solid var(--app-border);
}

.producer-details-tabs {
  display: flex;
  align-self: stretch;
  gap: 20px;
}

.producer-details-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
  white-space: nowrap;
}

.producer-details-tabs button::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
  content: '';
}

.producer-details-tabs button:hover {
  color: #1e293b;
}

.producer-details-tabs button.is-active {
  color: #047857;
}

.producer-details-tabs button.is-active::after {
  background: #059669;
}

.producer-details-toolbar > .el-button {
  margin-bottom: 7px;
}

.producer-details-table {
  min-height: 0;
  flex: 1;
  margin: 12px 20px 20px;
}

.producer-details-empty {
  display: grid;
  height: 100%;
  place-items: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .producer-workspace {
    grid-template-columns: 1fr;
  }

  .producer-list-card {
    height: 620px;
  }

  .producer-details-card {
    height: 460px;
  }
}

@media (max-width: 640px) {
  .producer-page-body {
    padding: 12px;
  }

  .producer-search-bar {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .producer-search-bar__count {
    justify-self: start;
  }

  .producer-details-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding-bottom: 10px;
  }

  .producer-details-tabs {
    min-height: 40px;
  }

  .producer-details-toolbar > .el-button {
    width: 100%;
    margin-bottom: 0;
  }

  .producer-details-card {
    height: 420px;
  }
}
</style>

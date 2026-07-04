<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <PageHeader :title="t('producers.title')" :description="t('producers.description')">
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">{{ t('producers.addProducer') }}</el-button>
      </template>
    </PageHeader>

    <div class="p-4">
      <el-card shadow="never">
        <el-row :gutter="20" align="bottom">
          <el-col :span="8">
            <label class="mb-2 block text-sm font-medium text-slate-700">{{ t('producers.search') }}</label>
            <el-input v-model="searchTerm" clearable :placeholder="t('producers.searchPlaceholder')" />
          </el-col>
          <el-col :span="4">
            <el-button plain @click="searchTerm = ''">{{ t('common.actions.reset') }}</el-button>
          </el-col>
        </el-row>
      </el-card>

      <div class="pt-4">
        <el-row :gutter="24">
          <el-col :span="14">
            <el-card shadow="never" class="h-[760px]">
              <el-table
                :data="producers"
                class="w-full"
                height="100%"
                highlight-current-row
                @current-change="selectProducer"
              >
                <el-table-column prop="name" :label="t('common.labels.name')" min-width="220" />
                <el-table-column :label="t('common.labels.description')" min-width="260">
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
          </el-col>

          <el-col :span="10">
            <el-card shadow="never" class="h-[760px] overflow-hidden">
              <template v-if="selectedProducer">
                <div class="mb-4 rounded-lg bg-slate-50 p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-lg font-semibold text-slate-900">{{ selectedProducer.name }}</div>
                    </div>
                    <el-button size="small" type="primary" @click="aliasDialogOpen = true">{{ t('producers.addAlias') }}</el-button>
                  </div>
                  <div class="mt-3 text-sm text-slate-700">
                    {{ selectedProducer.description || t('producers.noDescription') }}
                  </div>
                </div>

                <div v-loading="detailsLoading" class="h-[calc(100%-150px)] overflow-auto pr-1">
                  <el-table :data="aliases" stripe>
                    <el-table-column prop="alias" :label="t('producers.alias')" min-width="220" />
                    <el-table-column fixed="right" :label="t('common.labels.actions')" width="72" align="right">
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
                </div>
              </template>

              <template v-else>
                <el-empty :description="t('producers.selectToView')" />
              </template>
            </el-card>
          </el-col>
        </el-row>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { Delete, Edit } from '@element-plus/icons-vue'
import type { ProducerAliasModel } from '@/models/producerModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  addProducerAlias,
  createProducer,
  deleteProducer,
  deleteProducerAlias,
  editProducer,
  getProducerAliases,
} from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const producers = ref<ProducerSearchModel[]>([])
const selectedProducer = ref<ProducerSearchModel>()
const aliases = ref<ProducerAliasModel[]>([])
const searchTerm = ref('')
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const listLoading = ref(false)
const detailsLoading = ref(false)

const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const aliasDialogOpen = ref(false)

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
      if (!nextSelected) aliases.value = []
    }
  } finally {
    listLoading.value = false
  }
}

async function selectProducer(producer?: ProducerSearchModel) {
  selectedProducer.value = producer
  if (!producer) {
    aliases.value = []
    return
  }

  detailsLoading.value = true
  try {
    const resp = await getProducerAliases(producer.id)
    aliases.value = resp.aliases
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
  aliases.value = []
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

  ElNotification({
    title: t('common.labels.success'),
    message: t('producers.deleted'),
    type: 'success',
  })

  if (selectedProducer.value?.id === id) {
    selectedProducer.value = undefined
    aliases.value = []
  }

  await loadProducers(false)
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
  aliasForm.alias = ''
  await selectProducer(selectedProducer.value)
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

  await selectProducer(selectedProducer.value)
}

watch(limit, async () => loadProducers(true))
watch(page, async () => loadProducers(false))
watch(searchTerm, () => loadProducersDebounced())
onMounted(async () => loadProducers(true))
</script>

<style scoped>
.producer-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
</style>

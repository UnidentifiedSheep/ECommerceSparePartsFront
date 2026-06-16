<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Производители</h1>
        <p class="text-sm text-slate-500">Справочник производителей и дополнительных имён.</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">Добавить производителя</el-button>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <el-row :gutter="20" align="bottom">
          <el-col :span="8">
            <label class="mb-2 block text-sm font-medium text-slate-700">Поиск</label>
            <el-input v-model="searchTerm" clearable placeholder="Название производителя" />
          </el-col>
          <el-col :span="4">
            <el-button plain @click="searchTerm = ''">Сбросить</el-button>
          </el-col>
        </el-row>
      </el-card>

      <div class="pt-4">
        <el-row :gutter="24">
          <el-col :span="14">
            <el-card shadow="hover" class="h-[760px]">
              <el-table
                :data="producers"
                class="w-full"
                height="100%"
                highlight-current-row
                @current-change="selectProducer"
              >
                <el-table-column prop="name" label="Название" min-width="220" />
                <el-table-column label="Описание" min-width="260">
                  <template #default="{ row }">
                    {{ row.description || '—' }}
                  </template>
                </el-table-column>
                <el-table-column fixed="right" label="Действия" min-width="180">
                  <template #default="{ row }">
                    <el-button size="small" @click="openEditDialog(row)">Редактировать</el-button>
                    <el-button size="small" type="danger" @click="removeProducer(row.id)">Удалить</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <template #footer>
                <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
              </template>
            </el-card>
          </el-col>

          <el-col :span="10">
            <el-card shadow="hover" class="h-[760px] overflow-hidden">
              <template v-if="selectedProducer">
                <div class="mb-4 rounded-xl bg-slate-50 p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-lg font-semibold text-slate-900">{{ selectedProducer.name }}</div>
                    </div>
                    <el-button size="small" type="primary" @click="otherNameDialogOpen = true">Добавить имя</el-button>
                  </div>
                  <div class="mt-3 text-sm text-slate-700">
                    {{ selectedProducer.description || 'Описание отсутствует.' }}
                  </div>
                </div>

                <div v-loading="detailsLoading" class="h-[calc(100%-150px)] overflow-auto pr-1">
                  <el-table :data="otherNames" stripe>
                    <el-table-column prop="otherName" label="Доп. имя" min-width="180" />
                    <el-table-column prop="whereUsed" label="Где используется" min-width="180" />
                    <el-table-column fixed="right" label="Действия" min-width="120">
                      <template #default="{ row }">
                        <el-button size="small" type="danger" @click="removeOtherName(row.otherName)">Удалить</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>

              <template v-else>
                <el-empty description="Выберите производителя слева, чтобы увидеть детали" />
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-dialog v-model="createDialogOpen" title="Добавить производителя" width="520">
      <el-form label-position="top">
        <el-form-item label="Название">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogOpen = false">Отмена</el-button>
        <el-button type="primary" @click="saveCreate">Создать</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogOpen" title="Редактировать производителя" width="520">
      <el-form label-position="top">
        <el-form-item label="Название">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogOpen = false">Отмена</el-button>
        <el-button type="primary" @click="saveEdit">Сохранить</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="otherNameDialogOpen" title="Добавить дополнительное имя" width="520">
      <el-form label-position="top">
        <el-form-item label="Дополнительное имя">
          <el-input v-model="otherNameForm.otherName" />
        </el-form-item>
        <el-form-item label="Где используется">
          <el-input v-model="otherNameForm.whereUsed" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="otherNameDialogOpen = false">Отмена</el-button>
        <el-button type="primary" @click="saveOtherName">Добавить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import type { ProducerOtherNameModel } from '@/models/producerModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import {
  addProducerOtherName,
  createProducer,
  deleteProducer,
  deleteProducerOtherName,
  editProducer,
  getProducerOtherNames,
} from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'

const producers = ref<ProducerSearchModel[]>([])
const selectedProducer = ref<ProducerSearchModel>()
const otherNames = ref<ProducerOtherNameModel[]>([])
const searchTerm = ref('')
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const listLoading = ref(false)
const detailsLoading = ref(false)

const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const otherNameDialogOpen = ref(false)

const createForm = reactive({
  name: '',
  description: '',
})

const editForm = reactive({
  id: 0,
  name: '',
  description: '',
})

const otherNameForm = reactive({
  otherName: '',
  whereUsed: '',
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
      if (!nextSelected) otherNames.value = []
    }
  } finally {
    listLoading.value = false
  }
}

async function selectProducer(producer?: ProducerSearchModel) {
  selectedProducer.value = producer
  if (!producer) {
    otherNames.value = []
    return
  }

  detailsLoading.value = true
  try {
    const resp = await getProducerOtherNames(producer.id)
    otherNames.value = resp.names
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
  otherNames.value = []
}

async function saveCreate() {
  const resp = await createProducer({
    name: createForm.name,
    description: createForm.description || null,
  })

  addProducerToList(resp.producer)

  ElNotification({
    title: 'Успех',
    message: 'Производитель создан',
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
    title: 'Успех',
    message: 'Производитель обновлён',
    type: 'success',
  })

  editDialogOpen.value = false
}

async function removeProducer(id: number) {
  await deleteProducer(id)

  ElNotification({
    title: 'Успех',
    message: 'Производитель удалён',
    type: 'success',
  })

  if (selectedProducer.value?.id === id) {
    selectedProducer.value = undefined
    otherNames.value = []
  }

  await loadProducers(false)
}

async function saveOtherName() {
  if (!selectedProducer.value) return

  await addProducerOtherName({
    producerId: selectedProducer.value.id,
    otherName: otherNameForm.otherName,
    whereUsed: otherNameForm.whereUsed,
  })

  ElNotification({
    title: 'Успех',
    message: 'Дополнительное имя добавлено',
    type: 'success',
  })

  otherNameDialogOpen.value = false
  otherNameForm.otherName = ''
  otherNameForm.whereUsed = ''
  await selectProducer(selectedProducer.value)
}

async function removeOtherName(otherName: string) {
  if (!selectedProducer.value) return

  await deleteProducerOtherName({
    producerId: selectedProducer.value.id,
    otherName,
  })

  ElNotification({
    title: 'Успех',
    message: 'Дополнительное имя удалено',
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
</style>

<template>
  <div class="jobs-page">
    <section class="jobs-hero">
      <div>
        <h1>Задачи</h1>
        <p>Запуск фоновых задач сервисов и подготовка входных данных.</p>
      </div>
      <el-button type="primary" :loading="isLoadingJobs" @click="loadJobs">
        Обновить
      </el-button>
    </section>

    <section class="service-strip">
      <div
        v-for="service in serviceCards"
        :key="service.key"
        class="service-card"
        :class="{ unavailable: !service.available }"
      >
        <div class="service-card-title">
          <span>{{ serviceLabel(service.key) }}</span>
          <el-tag :type="service.available ? 'success' : 'danger'" effect="light" round>
            {{ service.available ? 'Доступен' : 'Недоступен' }}
          </el-tag>
        </div>
        <div class="service-card-meta">
          {{ service.available ? `Задач: ${service.jobsCount}` : service.error || `HTTP ${service.statusCode}` }}
        </div>
      </div>
    </section>

    <section class="jobs-workspace">
      <aside class="jobs-filter-panel">
        <el-input
          v-model="searchQuery"
          clearable
          placeholder="Поиск задачи"
        />

        <el-select v-model="selectedService" clearable placeholder="Все сервисы" class="w-full">
          <el-option
            v-for="service in serviceCards"
            :key="service.key"
            :label="serviceLabel(service.key)"
            :value="service.key"
          />
        </el-select>

        <el-checkbox v-model="showUnavailable">
          Показывать недоступные сервисы
        </el-checkbox>
      </aside>

      <main class="jobs-list">
        <el-empty v-if="!isLoadingJobs && visibleJobs.length === 0" description="Задачи не найдены" />

        <button
          v-for="item in visibleJobs"
          :key="`${item.serviceKey}:${item.job.systemName}`"
          type="button"
          class="job-row"
          @click="openJob(item)"
        >
          <div class="job-row-main">
            <div class="job-row-title">
              <span>{{ item.job.name }}</span>
              <el-tag size="small" effect="plain">{{ serviceLabel(item.serviceKey) }}</el-tag>
            </div>
            <p>{{ item.job.description }}</p>
          </div>
          <div class="job-row-action">Открыть</div>
        </button>

        <div v-if="showUnavailable" class="unavailable-list">
          <div
            v-for="service in unavailableServices"
            :key="service.key"
            class="unavailable-row"
          >
            <div>
              <strong>{{ serviceLabel(service.key) }}</strong>
              <span>{{ service.error || `HTTP ${service.statusCode}` }}</span>
            </div>
            <el-tag type="danger" effect="light">Ошибка</el-tag>
          </div>
        </div>
      </main>
    </section>

    <el-drawer
      v-model="drawerOpen"
      direction="rtl"
      size="520px"
      :with-header="false"
      class="job-drawer"
    >
      <div v-if="selectedJob" class="job-drawer-content">
        <header class="job-drawer-header">
          <div>
            <span>{{ serviceLabel(selectedJob.serviceKey) }}</span>
            <h2>{{ selectedJob.job.name }}</h2>
          </div>
          <el-button text @click="drawerOpen = false">Закрыть</el-button>
        </header>

        <div class="job-drawer-body">
          <p class="job-description">{{ selectedJob.job.description }}</p>

          <el-alert
            v-if="schemaError"
            type="error"
            :closable="false"
            :title="schemaError"
            show-icon
          />

          <el-form
            v-else
            label-position="top"
            class="job-form"
            @submit.prevent
          >
            <template v-if="schemaFields.length > 0">
              <el-form-item
                v-for="field in schemaFields"
                :key="field.name"
                :label="fieldLabel(field)"
                :required="field.required"
              >
                <template v-if="field.control === 'UploadFile'">
                  <div class="upload-field">
                    <el-select
                      v-model="inputState[field.name]"
                      filterable
                      clearable
                      placeholder="Выберите загруженный файл"
                      :loading="isLoadingUploads"
                      class="w-full"
                      @visible-change="loadUploadsOnOpen"
                    >
                      <el-option
                        v-for="file in filteredUploads(field)"
                        :key="file.key"
                        :label="file.key"
                        :value="file.key"
                      >
                        <div class="upload-option">
                          <span>{{ file.key }}</span>
                          <small>{{ formatFileSize(file.size) }}</small>
                        </div>
                      </el-option>
                    </el-select>
                    <div class="upload-actions">
                      <input
                        :ref="(el) => setFileInputRef(field.name, el)"
                        type="file"
                        class="hidden-file-input"
                        :accept="field.accepts?.join(',')"
                        @change="(event) => uploadSelectedFile(field, event)"
                      />
                      <el-button plain :loading="uploadingField === field.name" @click="chooseLocalFile(field.name)">
                        Загрузить файл
                      </el-button>
                      <el-button plain :loading="isLoadingUploads" @click="loadUploads(true)">
                        Обновить список
                      </el-button>
                      <el-button v-if="uploadsHasMore" plain :loading="isLoadingUploads" @click="loadUploads(false)">
                        Загрузить еще
                      </el-button>
                    </div>
                  </div>
                  <div v-if="field.description" class="field-hint">{{ field.description }}</div>
                </template>

                <el-switch
                  v-else-if="field.type === 'boolean'"
                  v-model="inputState[field.name]"
                />

                <el-input-number
                  v-else-if="isNumberField(field)"
                  v-model="inputState[field.name]"
                  class="w-full"
                  controls-position="right"
                />

                <el-input
                  v-else
                  v-model="inputState[field.name]"
                  :placeholder="field.description || field.name"
                />
              </el-form-item>
            </template>
            <el-empty v-else description="Для задачи не нужны входные данные" />

            <el-form-item label="Попытки">
              <el-input-number v-model="maxAttempts" :min="1" :max="20" controls-position="right" />
            </el-form-item>
          </el-form>
        </div>

        <footer class="job-drawer-footer">
          <el-button @click="drawerOpen = false">Отмена</el-button>
          <el-button
            type="primary"
            :loading="isCreatingJob"
            :disabled="Boolean(schemaError)"
            @click="submitJob"
          >
            Запустить задачу
          </el-button>
        </footer>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createServiceJob,
  getGatewayJobs,
  type JobInitStateSchema,
  type JobSchemaField,
  type ServiceJobDefinition,
} from '@/services/api/jobs.ts'
import { getUploads, uploadFile, type UploadFileModel } from '@/services/api/uploads.ts'

interface ServiceCard {
  key: string
  available: boolean
  statusCode: number
  jobsCount: number
  error: string | null
}

const isLoadingJobs = ref(false)
const isCreatingJob = ref(false)
const isLoadingUploads = ref(false)
const uploadingField = ref<string | null>(null)
const uploadsCursor = ref<string | null>(null)
const uploadsHasMore = ref(false)
const drawerOpen = ref(false)
const searchQuery = ref('')
const selectedService = ref<string | null>(null)
const showUnavailable = ref(true)
const selectedJob = ref<ServiceJobDefinition | null>(null)
const schemaError = ref<string | null>(null)
const schemaFields = ref<JobSchemaField[]>([])
const maxAttempts = ref(3)
const services = ref<Record<string, { available: boolean; statusCode: number; jobs: ServiceJobDefinition['job'][]; error: string | null }>>({})
const uploads = ref<UploadFileModel[]>([])
const inputState = reactive<Record<string, string | number | boolean | null>>({})
const fileInputRefs = new Map<string, HTMLInputElement>()

const serviceCards = computed<ServiceCard[]>(() => Object.entries(services.value).map(([key, service]) => ({
  key,
  available: service.available,
  statusCode: service.statusCode,
  jobsCount: service.jobs.length,
  error: service.error,
})))

const unavailableServices = computed(() => serviceCards.value.filter((service) => !service.available))

const allJobs = computed<ServiceJobDefinition[]>(() => Object.entries(services.value)
  .flatMap(([serviceKey, service]) => service.jobs.map((job) => ({
    serviceKey,
    service,
    job,
  }))))

const visibleJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return allJobs.value.filter((item) => {
    if (!item.service.available) return false
    if (selectedService.value && item.serviceKey !== selectedService.value) return false
    if (!query) return true

    return [
      item.job.name,
      item.job.description,
      item.job.systemName,
      serviceLabel(item.serviceKey),
    ].some((value) => value.toLowerCase().includes(query))
  })
})

onMounted(async () => {
  await loadJobs()
})

async function loadJobs() {
  isLoadingJobs.value = true
  try {
    const response = await getGatewayJobs()
    services.value = response.services
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить задачи')
  } finally {
    isLoadingJobs.value = false
  }
}

async function loadUploads(reset = true) {
  isLoadingUploads.value = true
  try {
    const response = await getUploads({
      cursor: reset ? null : uploadsCursor.value,
      size: 1000,
    })
    uploads.value = reset ? response.files : [...uploads.value, ...response.files]
    uploadsCursor.value = response.nextCursor
    uploadsHasMore.value = response.hasMore
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить список файлов')
  } finally {
    isLoadingUploads.value = false
  }
}

async function loadUploadsOnOpen(isOpen: boolean) {
  if (isOpen && uploads.value.length === 0) {
    await loadUploads(true)
  }
}

function openJob(item: ServiceJobDefinition) {
  selectedJob.value = item
  maxAttempts.value = 3
  resetInputState()
  parseSchema(item.job.initStateSchema)
  drawerOpen.value = true
}

function parseSchema(rawSchema: string) {
  schemaError.value = null
  schemaFields.value = []

  if (!rawSchema) return

  try {
    const parsed = JSON.parse(rawSchema) as JobInitStateSchema
    schemaFields.value = Array.isArray(parsed.fields) ? parsed.fields : []
    schemaFields.value.forEach((field) => {
      inputState[field.name] = defaultValue(field)
    })
  } catch {
    schemaError.value = 'Не удалось прочитать схему входных данных задачи'
  }
}

function resetInputState() {
  Object.keys(inputState).forEach((key) => {
    delete inputState[key]
  })
}

function defaultValue(field: JobSchemaField) {
  if (field.type === 'boolean') return false
  if (isNumberField(field)) return 0
  return ''
}

function isNumberField(field: JobSchemaField) {
  return ['int', 'integer', 'long', 'float', 'double', 'decimal', 'number'].includes(field.type.toLowerCase())
}

function fieldLabel(field: JobSchemaField) {
  return field.label || field.name
}

function filteredUploads(field: JobSchemaField) {
  const accepts = field.accepts?.map((item) => item.toLowerCase()) ?? []
  if (accepts.length === 0) return uploads.value

  return uploads.value.filter((file) => accepts.some((accept) => file.key.toLowerCase().endsWith(accept)))
}

function setFileInputRef(fieldName: string, el: unknown) {
  if (el instanceof HTMLInputElement) {
    fileInputRefs.set(fieldName, el)
  }
}

function chooseLocalFile(fieldName: string) {
  fileInputRefs.get(fieldName)?.click()
}

async function uploadSelectedFile(field: JobSchemaField, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  const accepts = field.accepts?.map((item) => item.toLowerCase()) ?? []
  if (accepts.length > 0 && !accepts.some((accept) => file.name.toLowerCase().endsWith(accept))) {
    ElMessage.warning(`Файл должен соответствовать: ${accepts.join(', ')}`)
    return
  }

  uploadingField.value = field.name
  try {
    const uploaded = await uploadFile(file)
    inputState[field.name] = uploaded.key
    await loadUploads(true)
    ElMessage.success('Файл загружен')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить файл')
  } finally {
    uploadingField.value = null
  }
}

async function submitJob() {
  if (!selectedJob.value) return

  const missingField = schemaFields.value.find((field) => field.required && isEmptyValue(inputState[field.name]))
  if (missingField) {
    ElMessage.warning(`Заполните поле "${fieldLabel(missingField)}"`)
    return
  }

  isCreatingJob.value = true
  try {
    await createServiceJob(selectedJob.value.serviceKey, {
      systemName: selectedJob.value.job.systemName,
      inputState: JSON.stringify(inputState),
      maxAttempts: maxAttempts.value,
    })
    ElMessage.success('Задача запущена')
    drawerOpen.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось запустить задачу')
  } finally {
    isCreatingJob.value = false
  }
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === ''
}

function serviceLabel(key: string) {
  const labels: Record<string, string> = {
    main: 'Main',
    analytics: 'Analytics',
    search: 'Search',
    pricing: 'Pricing',
  }

  return labels[key] ?? key
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`
  return `${(size / 1024 / 1024).toFixed(1)} МБ`
}
</script>

<style scoped>
.jobs-page {
  min-height: 100%;
  background: #f5f7fb;
  padding: 24px;
}

.jobs-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.jobs-hero h1 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.jobs-hero p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.service-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.service-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.service-card.unavailable {
  background: #fff7f7;
  border-color: #fecaca;
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

.jobs-workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.jobs-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-self: start;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.job-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  text-align: left;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}

.job-row:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
  transform: translateY(-1px);
}

.job-row-main {
  min-width: 0;
}

.job-row-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-size: 16px;
  font-weight: 650;
}

.job-row-main p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.45;
}

.job-row-action {
  flex: 0 0 auto;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
}

.unavailable-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.unavailable-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px dashed #fecaca;
  border-radius: 8px;
  background: #fff7f7;
  padding: 14px 16px;
}

.unavailable-row div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.unavailable-row strong {
  color: #991b1b;
}

.unavailable-row span {
  color: #b91c1c;
  font-size: 13px;
}

.job-drawer-content {
  display: flex;
  min-height: 100%;
  flex-direction: column;
}

.job-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding: 22px 24px 18px;
}

.job-drawer-header span {
  color: #2563eb;
  font-size: 13px;
  font-weight: 650;
}

.job-drawer-header h2 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 22px;
  font-weight: 700;
}

.job-drawer-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  overflow: auto;
  padding: 20px 24px;
}

.job-description {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
}

.job-form {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upload-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-option small {
  color: #94a3b8;
}

.field-hint {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.hidden-file-input {
  display: none;
}

.job-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
}

@media (max-width: 900px) {
  .jobs-page {
    padding: 16px;
  }

  .jobs-workspace {
    grid-template-columns: 1fr;
  }

  .jobs-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

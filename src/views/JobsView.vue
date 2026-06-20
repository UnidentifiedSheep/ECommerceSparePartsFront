<template>
  <div class="jobs-page">
    <section class="jobs-hero">
      <div>
        <h1>{{ t('jobs.title') }}</h1>
        <p>{{ t('jobs.description') }}</p>
      </div>
      <el-button type="primary" :loading="isLoadingJobs" @click="loadJobs">
        {{ t('common.actions.refresh') }}
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
            {{ service.available ? t('jobs.available') : t('jobs.unavailable') }}
          </el-tag>
        </div>
        <div class="service-card-meta">
          {{ service.available ? t('jobs.count', { count: service.jobsCount }) : serviceErrorText(service) }}
        </div>
      </div>
    </section>

    <el-tabs v-model="activeJobsTab" class="jobs-tabs">
      <el-tab-pane :label="t('jobs.availableTab')" name="available" />
      <el-tab-pane :label="t('jobs.currentTab')" name="current" />
    </el-tabs>

    <section v-if="activeJobsTab === 'available'" class="jobs-workspace">
      <aside class="jobs-filter-panel">
        <el-input
          v-model="searchQuery"
          clearable
          :placeholder="t('jobs.searchPlaceholder')"
        />

        <el-select v-model="selectedService" clearable :placeholder="t('jobs.allServices')" class="w-full">
          <el-option
            v-for="service in serviceCards"
            :key="service.key"
            :label="serviceLabel(service.key)"
            :value="service.key"
          />
        </el-select>

        <el-checkbox v-model="showUnavailable">
          {{ t('jobs.showUnavailable') }}
        </el-checkbox>
      </aside>

      <main class="jobs-list">
        <el-empty v-if="!isLoadingJobs && visibleJobs.length === 0" :description="t('jobs.emptyAvailable')" />

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
          <div class="job-row-action">{{ t('common.actions.open') }}</div>
        </button>

        <div v-if="showUnavailable" class="unavailable-list">
          <div
            v-for="service in unavailableServices"
            :key="service.key"
            class="unavailable-row"
          >
            <div>
              <strong>{{ serviceLabel(service.key) }}</strong>
              <span>{{ serviceErrorText(service) }}</span>
            </div>
            <el-tag type="danger" effect="light">{{ t('common.labels.error') }}</el-tag>
          </div>
        </div>
      </main>
    </section>

    <section v-else class="current-jobs-panel">
      <div class="current-jobs-toolbar">
        <el-select
          v-model="selectedCurrentService"
          :placeholder="t('common.placeholders.selectService')"
          class="current-service-select"
        >
          <el-option
            v-for="service in serviceCards"
            :key="service.key"
            :disabled="!service.available"
            :label="serviceLabel(service.key)"
            :value="service.key"
          />
        </el-select>

        <el-select
          v-model="currentJobStatuses"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          :placeholder="t('common.placeholders.statuses')"
          class="current-status-select"
        >
          <el-option
            v-for="status in jobStatusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>

        <el-select
          v-model="currentJobSystemNames"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          filterable
          :placeholder="t('common.placeholders.systemNames')"
          class="current-system-select"
        >
          <el-option
            v-for="job in currentServiceAvailableJobs"
            :key="job.systemName"
            :label="job.name"
            :value="job.systemName"
          >
            <div class="job-option">
              <span>{{ job.name }}</span>
              <small>{{ job.systemName }}</small>
            </div>
          </el-option>
        </el-select>

        <el-button type="primary" :loading="isLoadingCurrentJobs" :disabled="!selectedCurrentService" @click="loadCurrentJobs(true)">
          {{ t('common.actions.refresh') }}
        </el-button>
      </div>

      <el-alert
        v-if="!selectedCurrentService"
        type="info"
        :closable="false"
        :title="t('jobs.selectServiceInfo')"
        show-icon
      />

      <el-table
        v-else
        v-loading="isLoadingCurrentJobs"
        :data="currentJobs"
        border
        class="current-jobs-table"
        :empty-text="t('jobs.emptyCurrent')"
        @sort-change="handleCurrentJobsSortChange"
      >
        <el-table-column prop="status" :label="t('common.labels.status')" min-width="130" sortable="custom">
          <template #default="{ row }: { row: JobModel }">
            <el-tag :type="jobStatusTagType(row.status)" effect="light">
              {{ jobStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.labels.job')" min-width="260">
          <template #default="{ row }: { row: JobModel }">
            <div class="current-job-title">
              <strong>{{ jobDefinitionName(row.systemName) }}</strong>
              <span>{{ row.systemName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.labels.attempts')" width="110">
          <template #default="{ row }: { row: JobModel }">
            {{ row.attempts }} / {{ row.maxAttempts }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" :label="t('common.labels.createdAt')" min-width="170" sortable="custom">
          <template #default="{ row }: { row: JobModel }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="updatedAt" :label="t('common.labels.updatedAt')" min-width="170" sortable="custom">
          <template #default="{ row }: { row: JobModel }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('common.labels.error')" min-width="220">
          <template #default="{ row }: { row: JobModel }">
            <span :class="row.errorMessage ? 'text-red-600' : 'text-slate-400'">
              {{ row.errorMessage || '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="" width="120" fixed="right">
          <template #default="{ row }: { row: JobModel }">
            <el-button plain size="small" :loading="loadingStateJobId === row.id" @click="openJobState(row)">
              {{ t('jobs.state') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedCurrentService" class="current-jobs-footer">
        <ZeroPagination
          v-model:page="currentJobsPage"
          v-model:size="currentJobsLimit"
          :has-next="currentJobsHasNext"
        />
      </div>
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
          <el-button text @click="drawerOpen = false">{{ t('common.actions.close') }}</el-button>
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
                      :placeholder="t('common.placeholders.selectUploadedFile')"
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
                        {{ t('common.actions.uploadFile') }}
                      </el-button>
                      <el-button plain :loading="isLoadingUploads" @click="loadUploads(true)">
                        {{ t('common.actions.refreshList') }}
                      </el-button>
                      <el-button v-if="uploadsHasMore" plain :loading="isLoadingUploads" @click="loadUploads(false)">
                        {{ t('common.actions.loadMore') }}
                      </el-button>
                    </div>
                  </div>
                  <div v-if="field.description" class="field-hint">{{ field.description }}</div>
                </template>

                <el-input
                  v-else-if="field.control === 'TextField'"
                  v-model="inputState[field.name]"
                  clearable
                  :placeholder="field.description || field.name"
                />

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
            <el-empty v-else :description="t('jobs.noInput')" />

            <el-form-item :label="t('jobs.maxAttempts')">
              <el-input-number v-model="maxAttempts" :min="1" :max="20" controls-position="right" />
            </el-form-item>
          </el-form>
        </div>

        <footer class="job-drawer-footer">
          <el-button @click="drawerOpen = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button
            type="primary"
            :loading="isCreatingJob"
            :disabled="Boolean(schemaError)"
            @click="submitJob"
          >
            {{ t('jobs.run') }}
          </el-button>
        </footer>
      </div>
    </el-drawer>

    <el-dialog
      v-model="stateDialogOpen"
      :title="t('jobs.stateTitle')"
      width="min(900px, 94vw)"
      destroy-on-close
    >
      <div v-if="selectedStateJob" class="state-dialog-meta">
        <div>
          <span>{{ t('common.labels.job') }}</span>
          <strong>{{ jobDefinitionName(selectedStateJob.systemName) }}</strong>
          <small>{{ selectedStateJob.systemName }}</small>
        </div>
        <el-tag :type="jobStatusTagType(selectedStateJob.status)" effect="light">
          {{ jobStatusLabel(selectedStateJob.status) }}
        </el-tag>
      </div>

      <el-skeleton v-if="isLoadingJobState" :rows="8" animated />
      <pre v-else class="state-preview">{{ formattedJobState }}</pre>

      <template #footer>
        <el-button @click="stateDialogOpen = false">{{ t('common.actions.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { HubConnection } from '@microsoft/signalr'
import { ElMessage, ElNotification } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import {
  createServiceJob,
  getGatewayJobs,
  getServiceJobs,
  getServiceJobState,
  type JobDefinitionModel,
  type JobInitStateSchema,
  type JobModel,
  type JobSchemaField,
  type JobStatus,
  type JobsServiceModel,
  type ServiceJobDefinition,
} from '@/services/api/jobs.ts'
import { getUploads, uploadFile, type UploadFileModel } from '@/services/api/uploads.ts'
import { useI18n } from '@/i18n'
import { startJobHub, type JobStatusUpdatedEvent } from '@/services/realtime/jobHub.ts'

interface ServiceCard {
  key: string
  available: boolean
  statusCode: number | null
  jobsCount: number
  error: string | null
}

const isLoadingJobs = ref(false)
const isCreatingJob = ref(false)
const isLoadingCurrentJobs = ref(false)
const isLoadingJobState = ref(false)
const isLoadingUploads = ref(false)
const uploadingField = ref<string | null>(null)
const uploadsCursor = ref<string | null>(null)
const uploadsHasMore = ref(false)
const drawerOpen = ref(false)
const stateDialogOpen = ref(false)
const activeJobsTab = ref<'available' | 'current'>('available')
const searchQuery = ref('')
const selectedService = ref<string | null>(null)
const selectedCurrentService = ref<string | null>(null)
const currentJobStatuses = ref<JobStatus[]>([])
const currentJobSystemNames = ref<string[]>([])
const currentJobsSortBy = ref('createdAt_desc')
const currentJobsPage = ref(0)
const currentJobsLimit = ref(20)
const currentJobsHasNext = ref(false)
const showUnavailable = ref(true)
const selectedJob = ref<ServiceJobDefinition | null>(null)
const schemaError = ref<string | null>(null)
const schemaFields = ref<JobSchemaField[]>([])
const maxAttempts = ref(3)
const services = ref<Record<string, JobsServiceModel>>({})
const currentJobs = ref<JobModel[]>([])
const selectedStateJob = ref<JobModel | null>(null)
const jobState = ref('')
const loadingStateJobId = ref<string | null>(null)
const uploads = ref<UploadFileModel[]>([])
const inputState = reactive<Record<string, string | number | boolean | null>>({})
const fileInputRefs = new Map<string, HTMLInputElement>()
let jobHubConnection: HubConnection | null = null
let jobHubServiceKey: string | null = null
const { locale, t } = useI18n()

const jobStatusOptions = computed<Array<{ label: string; value: JobStatus }>>(() => [
  { label: t('jobs.statuses.Pending'), value: 'Pending' },
  { label: t('jobs.statuses.Locked'), value: 'Locked' },
  { label: t('jobs.statuses.Processing'), value: 'Processing' },
  { label: t('jobs.statuses.Failed'), value: 'Failed' },
  { label: t('jobs.statuses.Succeeded'), value: 'Succeeded' },
  { label: t('jobs.statuses.Cancelled'), value: 'Cancelled' },
])

const serviceCards = computed<ServiceCard[]>(() => Object.entries(services.value).map(([key, service]) => ({
  key,
  available: service.available,
  statusCode: service.statusCode,
  jobsCount: service.jobs.length,
  error: service.error,
})))

const unavailableServices = computed(() => serviceCards.value.filter((service) => !service.available))

const currentServiceAvailableJobs = computed<JobDefinitionModel[]>(() => {
  if (!selectedCurrentService.value) return []
  return services.value[selectedCurrentService.value]?.jobs ?? []
})

const formattedJobState = computed(() => {
  if (!jobState.value) return t('jobs.emptyState')

  try {
    return JSON.stringify(JSON.parse(jobState.value), null, 2)
  } catch {
    return jobState.value
  }
})

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

onBeforeUnmount(async () => {
  await stopJobHubConnection()
})

watch(activeJobsTab, async (tab) => {
  if (tab === 'current') {
    ensureCurrentServiceSelected()
    await syncJobHubConnection()
    await loadCurrentJobs(true)
  } else {
    await stopJobHubConnection()
  }
})

watch(selectedCurrentService, async () => {
  currentJobSystemNames.value = []
  if (activeJobsTab.value === 'current') {
    await syncJobHubConnection()
    await loadCurrentJobs(true)
  }
})

watch([currentJobStatuses, currentJobSystemNames, currentJobsSortBy], async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(true)
  }
}, { deep: true })

watch(currentJobsPage, async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(false)
  }
})

watch(currentJobsLimit, async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(true)
  }
})

async function loadJobs() {
  isLoadingJobs.value = true
  try {
    const response = await getGatewayJobs()
    const previousCurrentService = selectedCurrentService.value
    services.value = response.services
    ensureCurrentServiceSelected()
    if (activeJobsTab.value === 'current' && previousCurrentService === selectedCurrentService.value) {
      await loadCurrentJobs(true)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadError'))
  } finally {
    isLoadingJobs.value = false
  }
}

async function loadCurrentJobs(resetPage = false) {
  if (!selectedCurrentService.value) return

  if (resetPage) {
    currentJobsPage.value = 0
  }

  isLoadingCurrentJobs.value = true
  try {
    const response = await getServiceJobs(selectedCurrentService.value, {
      page: currentJobsPage.value,
      size: currentJobsLimit.value,
      statuses: currentJobStatuses.value,
      systemNames: currentJobSystemNames.value,
      sortBy: currentJobsSortBy.value,
    })
    currentJobs.value = response.jobs
    currentJobsHasNext.value = response.jobs.length === currentJobsLimit.value
  } catch (error) {
    currentJobs.value = []
    currentJobsHasNext.value = false
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadCurrentError'))
  } finally {
    isLoadingCurrentJobs.value = false
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
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadUploadsError'))
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
    schemaError.value = t('jobs.schemaError')
  }
}

function resetInputState() {
  Object.keys(inputState).forEach((key) => {
    delete inputState[key]
  })
}

function defaultValue(field: JobSchemaField) {
  if (field.control === 'TextField') return ''
  if (field.type === 'boolean') return false
  if (isNumberField(field)) return 0
  return ''
}

function isNumberField(field: JobSchemaField) {
  if (field.control === 'TextField') return false
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
    ElMessage.warning(t('jobs.fileAccepts', { accepts: accepts.join(', ') }))
    return
  }

  uploadingField.value = field.name
  try {
    const uploaded = await uploadFile(file)
    inputState[field.name] = uploaded.key
    await loadUploads(true)
    ElMessage.success(t('jobs.fileUploaded'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.uploadError'))
  } finally {
    uploadingField.value = null
  }
}

async function submitJob() {
  if (!selectedJob.value) return
  const serviceKey = selectedJob.value.serviceKey
  const systemName = selectedJob.value.job.systemName

  const missingField = schemaFields.value.find((field) => field.required && isEmptyValue(inputState[field.name]))
  if (missingField) {
    ElMessage.warning(t('jobs.fillField', { field: fieldLabel(missingField) }))
    return
  }

  isCreatingJob.value = true
  try {
    await createServiceJob(serviceKey, {
      systemName,
      inputState: JSON.stringify(inputState),
      maxAttempts: maxAttempts.value,
    })
    ElMessage.success(t('jobs.created'))
    drawerOpen.value = false
    if (selectedCurrentService.value === serviceKey) {
      await loadCurrentJobs(true)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.createError'))
  } finally {
    isCreatingJob.value = false
  }
}

function ensureCurrentServiceSelected() {
  if (selectedCurrentService.value && services.value[selectedCurrentService.value]?.available) return
  selectedCurrentService.value = serviceCards.value.find((service) => service.available)?.key ?? null
}

async function syncJobHubConnection() {
  const serviceKey = activeJobsTab.value === 'current'
    ? selectedCurrentService.value
    : null

  if (!serviceKey) {
    await stopJobHubConnection()
    return
  }

  if (jobHubConnection && jobHubServiceKey === serviceKey) return

  await stopJobHubConnection()

  try {
    jobHubConnection = await startJobHub(serviceKey, handleJobStatusUpdated)
    jobHubServiceKey = serviceKey
  } catch {
    jobHubConnection = null
    jobHubServiceKey = null
    ElNotification.warning({
      title: t('common.messages.realtimeUnavailableTitle'),
      message: t('jobs.realtimeUnavailable', { service: serviceLabel(serviceKey) }),
    })
  }
}

async function stopJobHubConnection() {
  const connection = jobHubConnection
  jobHubConnection = null
  jobHubServiceKey = null
  await connection?.stop()
}

function handleJobStatusUpdated(event: JobStatusUpdatedEvent) {
  const job = currentJobs.value.find((item) => item.id.toLowerCase() === event.jobId.toLowerCase())
  if (!job) return

  job.status = event.status
  job.attempts = event.attempts
  job.updatedAt = new Date().toISOString()
}

function handleCurrentJobsSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    currentJobsSortBy.value = 'createdAt_desc'
    return
  }

  currentJobsSortBy.value = event.order === 'descending'
    ? `${event.prop}_desc`
    : event.prop
}

async function openJobState(row: JobModel) {
  if (!selectedCurrentService.value) return

  selectedStateJob.value = row
  jobState.value = ''
  stateDialogOpen.value = true
  isLoadingJobState.value = true
  loadingStateJobId.value = row.id

  try {
    const response = await getServiceJobState(selectedCurrentService.value, row.id)
    jobState.value = response.state
  } catch (error) {
    stateDialogOpen.value = false
    ElMessage.error(error instanceof Error ? error.message : t('jobs.stateLoadError'))
  } finally {
    isLoadingJobState.value = false
    loadingStateJobId.value = null
  }
}

function jobDefinitionName(systemName: string) {
  return currentServiceAvailableJobs.value.find((job) => job.systemName === systemName)?.name ?? systemName
}

function jobStatusLabel(status: JobStatus | string) {
  return jobStatusOptions.value.find((item) => item.value === status)?.label ?? status
}

function jobStatusTagType(status: JobStatus | string) {
  const types: Record<JobStatus, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    Pending: 'info',
    Locked: 'warning',
    Processing: 'warning',
    Failed: 'danger',
    Succeeded: 'success',
    Cancelled: 'info',
  }

  return types[status as JobStatus] ?? ''
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
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

function serviceErrorText(service: ServiceCard) {
  if (service.error) return service.error
  if (service.statusCode) return `HTTP ${service.statusCode}`
  return t('common.messages.serviceUnavailable')
}

function formatFileSize(size: number) {
  const formatter = new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 })
  if (size < 1024) return `${formatter.format(size)} ${t('common.messages.byte')}`
  if (size < 1024 * 1024) return `${formatter.format(size / 1024)} ${t('common.messages.kilobyte')}`
  return `${formatter.format(size / 1024 / 1024)} ${t('common.messages.megabyte')}`
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

.jobs-tabs {
  margin-bottom: 14px;
}

.current-jobs-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.current-jobs-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.current-service-select {
  width: 190px;
}

.current-status-select {
  width: 220px;
}

.current-system-select {
  width: 280px;
}

.job-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.job-option small {
  color: #94a3b8;
}

.current-jobs-table {
  width: 100%;
}

.current-job-title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.current-job-title strong {
  color: #111827;
  font-weight: 650;
}

.current-job-title span {
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-jobs-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.state-dialog-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.state-dialog-meta div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.state-dialog-meta span,
.state-dialog-meta small {
  color: #64748b;
  font-size: 12px;
}

.state-dialog-meta strong {
  color: #111827;
  font-weight: 650;
}

.state-preview {
  max-height: min(68vh, 720px);
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.55;
  margin: 0;
  padding: 14px;
  white-space: pre;
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

  .current-jobs-toolbar > * {
    width: 100%;
  }

  .current-service-select,
  .current-status-select,
  .current-system-select {
    width: 100%;
  }
}
</style>

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
      <el-tab-pane :label="t('jobs.schedulesTab')" name="schedules" />
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

    <section v-else-if="activeJobsTab === 'current'" class="current-jobs-panel">
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
        height="100%"
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

    <section v-else class="current-jobs-panel">
      <div class="current-jobs-toolbar current-jobs-toolbar--split">
        <div class="current-jobs-toolbar-main">
          <el-select
            v-model="selectedScheduleService"
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
        </div>

        <div class="current-jobs-toolbar-actions">
          <el-button plain :icon="Filter" :disabled="!selectedScheduleService" @click="scheduleFiltersOpen = true">
            {{ t('common.actions.filter') }}
          </el-button>

          <el-button type="primary" :loading="isLoadingSchedules" :disabled="!selectedScheduleService" @click="loadSchedules(true)">
            {{ t('common.actions.refresh') }}
          </el-button>

          <el-button :disabled="!selectedScheduleService" @click="openCreateScheduleDrawer()">
            {{ t('jobs.createSchedule') }}
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="!selectedScheduleService"
        type="info"
        :closable="false"
        :title="t('jobs.selectScheduleServiceInfo')"
        show-icon
      />

      <el-table
        v-else
        v-loading="isLoadingSchedules"
        :data="schedules"
        border
        class="current-jobs-table"
        :empty-text="t('jobs.emptySchedules')"
        height="100%"
        @sort-change="handleSchedulesSortChange"
      >
        <el-table-column prop="enabled" :label="t('jobs.enabled')" width="130" sortable="custom">
          <template #default="{ row }: { row: JobScheduleModel }">
            <el-switch
              :model-value="row.enabled"
              :loading="updatingScheduleId === row.id"
              @change="(value: string | number | boolean) => toggleScheduleEnabled(row, Boolean(value))"
            />
          </template>
        </el-table-column>

        <el-table-column prop="name" :label="t('common.labels.name')" min-width="220" sortable="custom">
          <template #default="{ row }: { row: JobScheduleModel }">
            <div class="current-job-title">
              <strong>{{ row.name }}</strong>
              <span>{{ row.description || row.id }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="jobSystemName" :label="t('common.labels.job')" min-width="240" sortable="custom">
          <template #default="{ row }: { row: JobScheduleModel }">
            <div class="current-job-title">
              <strong>{{ scheduleJobDefinitionName(row.jobSystemName) }}</strong>
              <span>{{ row.jobSystemName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="cron" :label="t('jobs.cron')" min-width="220">
          <template #default="{ row }: { row: JobScheduleModel }">
            <div class="current-job-title">
              <strong>{{ row.localizedCron || row.cron }}</strong>
              <span>{{ row.cron }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="nextRunAt" :label="t('jobs.nextRunAt')" min-width="170" sortable="custom">
          <template #default="{ row }: { row: JobScheduleModel }">
            {{ formatDateTime(row.nextRunAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="lastQueuedAt" :label="t('jobs.lastQueuedAt')" min-width="170" sortable="custom">
          <template #default="{ row }: { row: JobScheduleModel }">
            {{ formatDateTime(row.lastQueuedAt) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('common.labels.attempts')" width="110">
          <template #default="{ row }: { row: JobScheduleModel }">
            {{ row.maxAttempts }}
          </template>
        </el-table-column>

        <el-table-column label="" width="120" fixed="right">
          <template #default="{ row }: { row: JobScheduleModel }">
            <el-button plain size="small" @click="openEditScheduleDrawer(row)">
              {{ t('common.actions.edit') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedScheduleService" class="current-jobs-footer current-jobs-footer--left">
        <ZeroPagination
          v-model:page="schedulesPage"
          v-model:size="schedulesLimit"
          :has-next="schedulesHasNext"
        />
      </div>
    </section>

    <el-drawer
      v-model="scheduleFiltersOpen"
      direction="rtl"
      size="min(440px, 100vw)"
      :title="t('common.actions.filter')"
      class="jobs-schedule-filters-drawer"
    >
      <div class="drawer-content">
        <div class="drawer-body">
          <section class="drawer-section">
            <div class="drawer-section-title">{{ t('common.placeholders.systemNames') }}</div>
            <label class="filter-field">
              <span>{{ t('common.labels.job') }}</span>
              <el-select
                v-model="scheduleJobSystemNames"
                multiple
                collapse-tags
                collapse-tags-tooltip
                clearable
                filterable
                :placeholder="t('common.placeholders.systemNames')"
                class="w-full"
              >
                <el-option
                  v-for="job in scheduleServiceAvailableJobs"
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
            </label>
          </section>

          <section class="drawer-section">
            <div class="drawer-section-title">{{ t('jobs.nextRun') }}</div>
            <label class="filter-field">
              <span>{{ t('jobs.nextRun') }}</span>
              <el-date-picker
                v-model="scheduleNextRunRange"
                type="datetimerange"
                range-separator="—"
                :start-placeholder="t('jobs.from')"
                :end-placeholder="t('jobs.to')"
                format="DD.MM.YYYY HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                class="w-full"
              />
            </label>
          </section>
        </div>

        <div class="drawer-footer">
          <el-button @click="resetScheduleFilters">{{ t('common.actions.reset') }}</el-button>
          <el-button type="primary" @click="scheduleFiltersOpen = false">{{ t('common.actions.apply') }}</el-button>
        </div>
      </div>
    </el-drawer>

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
            <h2>{{ drawerTitle }}</h2>
          </div>
          <el-button text @click="drawerOpen = false">{{ t('common.actions.close') }}</el-button>
        </header>

        <div class="job-drawer-body">
          <p class="job-description">{{ selectedJob.job.description }}</p>

          <el-form
            v-if="drawerMode !== 'run'"
            label-position="top"
            class="job-form schedule-form"
            @submit.prevent
          >
            <el-form-item :label="t('common.labels.job')" required>
              <el-select
                v-model="scheduleForm.jobSystemName"
                filterable
                class="w-full"
                :disabled="drawerMode === 'schedule-edit'"
                :placeholder="t('jobs.selectJobForSchedule')"
                @change="onScheduleJobChanged"
              >
                <el-option
                  v-for="job in scheduleServiceAvailableJobs"
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
            </el-form-item>

            <el-form-item :label="t('common.labels.name')" required>
              <el-input v-model="scheduleForm.name" maxlength="64" show-word-limit />
            </el-form-item>

            <el-form-item :label="t('common.labels.description')">
              <el-input
                v-model="scheduleForm.description"
                type="textarea"
                maxlength="255"
                show-word-limit
                :rows="3"
              />
            </el-form-item>

            <el-form-item :label="t('jobs.cron')" required>
              <div class="cron-builder">
                <el-segmented v-model="cronBuilder.mode" :options="cronModeOptions" class="cron-mode-tabs" />

                <div v-if="cronBuilder.mode === 'daily'" class="cron-builder-row">
                  <span>{{ t('jobs.cronBuilder.everyDay') }}</span>
                  <div class="cron-time-control">
                    <el-time-picker
                      v-model="cronBuilder.time"
                      format="HH:mm"
                      value-format="HH:mm"
                      :placeholder="t('jobs.cronBuilder.time')"
                    />
                    <el-tag effect="plain" size="small">{{ localTimeZoneLabel }}</el-tag>
                  </div>
                </div>

                <div v-else-if="cronBuilder.mode === 'weekly'" class="cron-builder-stack">
                  <div class="cron-builder-row">
                    <span>{{ t('jobs.cronBuilder.everyWeek') }}</span>
                    <div class="cron-time-control">
                      <el-time-picker
                        v-model="cronBuilder.time"
                        format="HH:mm"
                        value-format="HH:mm"
                        :placeholder="t('jobs.cronBuilder.time')"
                      />
                      <el-tag effect="plain" size="small">{{ localTimeZoneLabel }}</el-tag>
                    </div>
                  </div>
                  <el-checkbox-group v-model="cronBuilder.weekDays" class="cron-weekdays">
                    <el-checkbox-button
                      v-for="day in weekDayOptions"
                      :key="day.value"
                      :value="day.value"
                    >
                      {{ day.label }}
                    </el-checkbox-button>
                  </el-checkbox-group>
                </div>

                <div v-else-if="cronBuilder.mode === 'monthly'" class="cron-builder-row">
                  <span>{{ t('jobs.cronBuilder.everyMonth') }}</span>
                  <el-input-number v-model="cronBuilder.monthDay" :min="1" :max="31" controls-position="right" />
                  <span>{{ t('jobs.cronBuilder.dayAt') }}</span>
                  <div class="cron-time-control">
                    <el-time-picker
                      v-model="cronBuilder.time"
                      format="HH:mm"
                      value-format="HH:mm"
                      :placeholder="t('jobs.cronBuilder.time')"
                    />
                    <el-tag effect="plain" size="small">{{ localTimeZoneLabel }}</el-tag>
                  </div>
                </div>

                <div v-else-if="cronBuilder.mode === 'intervalMinutes'" class="cron-builder-row">
                  <span>{{ t('jobs.cronBuilder.every') }}</span>
                  <el-input-number v-model="cronBuilder.intervalMinutes" :min="1" :max="59" controls-position="right" />
                  <span>{{ t('jobs.cronBuilder.minutes') }}</span>
                </div>

                <div v-else-if="cronBuilder.mode === 'intervalHours'" class="cron-builder-row">
                  <span>{{ t('jobs.cronBuilder.every') }}</span>
                  <el-input-number v-model="cronBuilder.intervalHours" :min="1" :max="23" controls-position="right" />
                  <span>{{ t('jobs.cronBuilder.hours') }}</span>
                </div>

                <el-input
                  v-else
                  v-model="scheduleForm.cron"
                  placeholder="0 9 * * *"
                />

                <div class="cron-preview">
                  <span>{{ t('jobs.cronBuilder.preview') }}</span>
                  <strong>{{ cronPreview }}</strong>
                  <code v-if="cronBuilder.mode === 'advanced'">{{ scheduleForm.cron || '0 9 * * *' }}</code>
                </div>
              </div>
            </el-form-item>

            <div class="schedule-options-row">
              <el-form-item :label="t('jobs.maxAttempts')" class="schedule-option-attempts">
                <el-input-number v-model="scheduleForm.maxAttempts" :min="1" :max="20" controls-position="right" />
              </el-form-item>

              <div class="schedule-enabled-control">
                <span>{{ t('jobs.scheduleStatus') }}</span>
                <div>
                  <el-switch v-model="scheduleForm.enabled" size="small" />
                  <strong>{{ scheduleForm.enabled ? t('jobs.enabledState') : t('jobs.disabledState') }}</strong>
                </div>
              </div>
            </div>
          </el-form>

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
            <div v-if="drawerMode !== 'run'" class="input-state-heading">
              <span>{{ t('jobs.initialState') }}</span>
              <p>{{ t('jobs.initialStateDescription') }}</p>
            </div>

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

                <el-date-picker
                  v-else-if="field.control === 'DatePicker'"
                  v-model="inputState[field.name]"
                  type="date"
                  format="DD.MM.YYYY"
                  value-format="YYYY-MM-DD"
                  class="w-full"
                  :placeholder="field.description || field.name"
                />

                <template v-else-if="field.control === 'EntitySelector'">
                  <el-select
                    v-if="isSupportedEntitySelector(field)"
                    v-model="inputState[field.name]"
                    filterable
                    clearable
                    :remote="field.dependsOnEntity === 'Product'"
                    :remote-method="(query: string) => searchEntityOptions(field, query)"
                    class="w-full"
                    :loading="isEntityLoading(field)"
                    :placeholder="field.description || field.name"
                    @visible-change="(isOpen: boolean) => loadEntityOptionsOnOpen(field, isOpen)"
                  >
                    <el-option
                      v-for="option in entityOptions(field)"
                      :key="String(entityOptionValue(field, option))"
                      :label="entityOptionLabel(field, option)"
                      :value="entityOptionValue(field, option)"
                    />
                  </el-select>
                  <el-input
                    v-else
                    v-model="inputState[field.name]"
                    :placeholder="field.description || field.name"
                  />
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
            <el-empty v-else :description="t('jobs.noInput')" />

            <el-form-item v-if="drawerMode === 'run'" :label="t('jobs.maxAttempts')">
              <el-input-number v-model="maxAttempts" :min="1" :max="20" controls-position="right" />
            </el-form-item>
          </el-form>
        </div>

        <footer class="job-drawer-footer">
          <el-button @click="drawerOpen = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button
            type="primary"
            :loading="drawerMode === 'run' ? isCreatingJob : isSavingSchedule"
            :disabled="Boolean(schemaError)"
            @click="submitDrawer"
          >
            {{ drawerSubmitLabel }}
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
import { Filter } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import {
  createServiceJobSchedule,
  createServiceJob,
  getGatewayJobs,
  getServiceJobSchedules,
  getServiceJobs,
  getServiceJobState,
  patchField,
  updateServiceJobSchedule,
  type JobDefinitionModel,
  type JobInitStateSchema,
  type JobModel,
  type JobScheduleModel,
  type JobSchemaField,
  type JobStatus,
  type JobsServiceModel,
  type ServiceJobDefinition,
} from '@/services/api/jobs.ts'
import { getUploads, uploadFile, type UploadFileModel } from '@/services/api/uploads.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { searchProducts } from '@/services/api/search.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { useI18n } from '@/i18n'
import { startJobHub, type JobStatusUpdatedEvent } from '@/services/realtime/jobHub.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'

interface ServiceCard {
  key: string
  available: boolean
  statusCode: number | null
  jobsCount: number
  error: string | null
}

type EntitySelectorOption = CurrencyModel | ProductSearchModel
type CronBuilderMode = 'daily' | 'weekly' | 'monthly' | 'intervalMinutes' | 'intervalHours' | 'advanced'

const isLoadingJobs = ref(false)
const isCreatingJob = ref(false)
const isSavingSchedule = ref(false)
const isLoadingCurrentJobs = ref(false)
const isLoadingSchedules = ref(false)
const isLoadingJobState = ref(false)
const isLoadingUploads = ref(false)
const isLoadingCurrencies = ref(false)
const isLoadingProducts = ref(false)
const uploadingField = ref<string | null>(null)
const uploadsCursor = ref<string | null>(null)
const uploadsHasMore = ref(false)
const drawerOpen = ref(false)
const stateDialogOpen = ref(false)
const scheduleFiltersOpen = ref(false)
const activeJobsTab = ref<'available' | 'current' | 'schedules'>('available')
const drawerMode = ref<'run' | 'schedule-create' | 'schedule-edit'>('run')
const searchQuery = ref('')
const selectedService = ref<string | null>(null)
const selectedCurrentService = ref<string | null>(null)
const selectedScheduleService = ref<string | null>(null)
const currentJobStatuses = ref<JobStatus[]>([])
const currentJobSystemNames = ref<string[]>([])
const scheduleJobSystemNames = ref<string[]>([])
const scheduleNextRunRange = ref<string[] | null>([])
const currentJobsSortBy = ref('createdAt_desc')
const schedulesSortBy = ref('id_desc')
const currentJobsPage = ref(0)
const currentJobsLimit = ref(20)
const currentJobsHasNext = ref(false)
const schedulesPage = ref(0)
const schedulesLimit = ref(20)
const schedulesHasNext = ref(false)
const showUnavailable = ref(true)
const selectedJob = ref<ServiceJobDefinition | null>(null)
const selectedSchedule = ref<JobScheduleModel | null>(null)
const schemaError = ref<string | null>(null)
const schemaFields = ref<JobSchemaField[]>([])
const maxAttempts = ref(3)
const scheduleForm = reactive({
  jobSystemName: '',
  name: '',
  description: '',
  cron: '',
  enabled: true,
  maxAttempts: 3,
})
const cronBuilder = reactive<{
  mode: CronBuilderMode
  time: string
  weekDays: number[]
  monthDay: number
  intervalMinutes: number
  intervalHours: number
}>({
  mode: 'daily',
  time: '09:00',
  weekDays: [1],
  monthDay: 1,
  intervalMinutes: 5,
  intervalHours: 1,
})
const services = ref<Record<string, JobsServiceModel>>({})
const currentJobs = ref<JobModel[]>([])
const schedules = ref<JobScheduleModel[]>([])
const selectedStateJob = ref<JobModel | null>(null)
const jobState = ref('')
const loadingStateJobId = ref<string | null>(null)
const updatingScheduleId = ref<string | null>(null)
const uploads = ref<UploadFileModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const products = ref<ProductSearchModel[]>([])
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

const cronModeOptions = computed(() => [
  { label: t('jobs.cronBuilder.daily'), value: 'daily' },
  { label: t('jobs.cronBuilder.weekly'), value: 'weekly' },
  { label: t('jobs.cronBuilder.monthly'), value: 'monthly' },
  { label: t('jobs.cronBuilder.minutesMode'), value: 'intervalMinutes' },
  { label: t('jobs.cronBuilder.hoursMode'), value: 'intervalHours' },
  { label: t('jobs.cronBuilder.advanced'), value: 'advanced' },
])

const weekDayOptions = computed(() => [
  { label: t('jobs.weekdays.mon'), value: 1 },
  { label: t('jobs.weekdays.tue'), value: 2 },
  { label: t('jobs.weekdays.wed'), value: 3 },
  { label: t('jobs.weekdays.thu'), value: 4 },
  { label: t('jobs.weekdays.fri'), value: 5 },
  { label: t('jobs.weekdays.sat'), value: 6 },
  { label: t('jobs.weekdays.sun'), value: 0 },
])

const localTimeZoneLabel = computed(() => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timeZone) return timeZone

  const offsetMinutes = -new Date().getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const minutes = String(absolute % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
})

const cronPreview = computed(() => {
  if (cronBuilder.mode === 'daily') {
    return t('jobs.cronBuilder.previewDaily', { time: cronBuilder.time })
  }
  if (cronBuilder.mode === 'weekly') {
    const days = cronBuilder.weekDays
      .map((value) => weekDayOptions.value.find((day) => day.value === value)?.label)
      .filter(Boolean)
      .join(', ')
    return t('jobs.cronBuilder.previewWeekly', { days: days || t('jobs.cronBuilder.noDays'), time: cronBuilder.time })
  }
  if (cronBuilder.mode === 'monthly') {
    return t('jobs.cronBuilder.previewMonthly', { day: cronBuilder.monthDay, time: cronBuilder.time })
  }
  if (cronBuilder.mode === 'intervalMinutes') {
    return t('jobs.cronBuilder.previewMinutes', { count: cronBuilder.intervalMinutes })
  }
  if (cronBuilder.mode === 'intervalHours') {
    return t('jobs.cronBuilder.previewHours', { count: cronBuilder.intervalHours })
  }
  return scheduleForm.cron.trim() || t('jobs.cronBuilder.manualExpression')
})

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

const scheduleServiceAvailableJobs = computed<JobDefinitionModel[]>(() => {
  if (!selectedScheduleService.value) return []
  return services.value[selectedScheduleService.value]?.jobs ?? []
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

const drawerTitle = computed(() => {
  if (!selectedJob.value) return ''
  if (drawerMode.value === 'schedule-create') return t('jobs.createSchedule')
  if (drawerMode.value === 'schedule-edit') return t('jobs.editSchedule')
  return selectedJob.value.job.name
})

const drawerSubmitLabel = computed(() => {
  if (drawerMode.value === 'schedule-create') return t('jobs.createSchedule')
  if (drawerMode.value === 'schedule-edit') return t('common.actions.save')
  return t('jobs.run')
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
  } else if (tab === 'schedules') {
    ensureScheduleServiceSelected()
    await stopJobHubConnection()
    await loadSchedules(true)
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

watch(selectedScheduleService, async () => {
  scheduleJobSystemNames.value = []
  if (activeJobsTab.value === 'schedules') {
    await loadSchedules(true)
  }
})

watch([currentJobStatuses, currentJobSystemNames, currentJobsSortBy], async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(true)
  }
}, { deep: true })

watch([scheduleJobSystemNames, scheduleNextRunRange, schedulesSortBy], async () => {
  if (activeJobsTab.value === 'schedules') {
    await loadSchedules(true)
  }
}, { deep: true })

watch(currentJobsPage, async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(false)
  }
})

watch(schedulesPage, async () => {
  if (activeJobsTab.value === 'schedules') {
    await loadSchedules(false)
  }
})

watch(currentJobsLimit, async () => {
  if (activeJobsTab.value === 'current') {
    await loadCurrentJobs(true)
  }
})

watch(schedulesLimit, async () => {
  if (activeJobsTab.value === 'schedules') {
    await loadSchedules(true)
  }
})

watch(cronBuilder, () => {
  syncCronFromBuilder()
}, { deep: true })

async function loadJobs() {
  isLoadingJobs.value = true
  try {
    const response = await getGatewayJobs()
    const previousCurrentService = selectedCurrentService.value
    const previousScheduleService = selectedScheduleService.value
    services.value = response.services
    ensureCurrentServiceSelected()
    ensureScheduleServiceSelected()
    if (activeJobsTab.value === 'current' && previousCurrentService === selectedCurrentService.value) {
      await loadCurrentJobs(true)
    }
    if (activeJobsTab.value === 'schedules' && previousScheduleService === selectedScheduleService.value) {
      await loadSchedules(true)
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

async function loadSchedules(resetPage = false) {
  if (!selectedScheduleService.value) return

  if (resetPage) {
    schedulesPage.value = 0
  }

  isLoadingSchedules.value = true
  try {
    const response = await getServiceJobSchedules(selectedScheduleService.value, {
      page: schedulesPage.value,
      size: schedulesLimit.value,
      systemNames: scheduleJobSystemNames.value,
      nextRunFrom: scheduleNextRunRange.value?.[0]
        ? toUtcDateTimeString(scheduleNextRunRange.value[0])
        : null,
      nextRunTo: scheduleNextRunRange.value?.[1]
        ? toUtcDateTimeString(scheduleNextRunRange.value[1])
        : null,
      sortBy: schedulesSortBy.value,
    })
    schedules.value = response.schedules
    schedulesHasNext.value = response.schedules.length === schedulesLimit.value
  } catch (error) {
    schedules.value = []
    schedulesHasNext.value = false
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadSchedulesError'))
  } finally {
    isLoadingSchedules.value = false
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

async function loadCurrenciesIfNeeded() {
  if (currencies.value.length > 0 || isLoadingCurrencies.value) return

  isLoadingCurrencies.value = true
  try {
    const response = await getCurrencies()
    currencies.value = response.currencies
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadError'))
  } finally {
    isLoadingCurrencies.value = false
  }
}

async function loadProducts(query = '') {
  isLoadingProducts.value = true
  try {
    const response = await searchProducts({
      query: query.trim() || undefined,
      page: 0,
      size: 20,
      sortBy: 'id_asc',
    })
    products.value = response.products
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.loadError'))
  } finally {
    isLoadingProducts.value = false
  }
}

async function loadProductsIfNeeded() {
  if (products.value.length > 0 || isLoadingProducts.value) return
  await loadProducts()
}

async function loadEntityOptionsOnOpen(field: JobSchemaField, isOpen: boolean) {
  if (!isOpen) return
  await loadEntityOptions(field)
}

async function loadEntityOptions(field: JobSchemaField) {
  if (field.dependsOnEntity === 'Currency') {
    await loadCurrenciesIfNeeded()
    return
  }

  if (field.dependsOnEntity === 'Product') {
    await loadProductsIfNeeded()
  }
}

function searchEntityOptions(field: JobSchemaField, query: string) {
  if (field.dependsOnEntity === 'Product') {
    void loadProducts(query)
  }
}

async function loadSchemaEntities() {
  await Promise.all(schemaFields.value
    .filter((field) => field.control === 'EntitySelector' && isSupportedEntitySelector(field))
    .map((field) => loadEntityOptions(field)))
}

function openJob(item: ServiceJobDefinition) {
  selectedJob.value = item
  selectedSchedule.value = null
  drawerMode.value = 'run'
  maxAttempts.value = 3
  resetInputState()
  parseSchema(item.job.initStateSchema)
  void loadSchemaEntities()
  drawerOpen.value = true
}

function serviceJobDefinition(serviceKey: string, systemName: string): ServiceJobDefinition | null {
  const service = services.value[serviceKey]
  const job = service?.jobs.find((item) => item.systemName === systemName)
  if (!service || !job) return null

  return {
    serviceKey,
    service,
    job,
  }
}

function resetScheduleForm() {
  scheduleForm.jobSystemName = ''
  scheduleForm.name = ''
  scheduleForm.description = ''
  setCronBuilderFromExpression('0 9 * * *')
  scheduleForm.enabled = true
  scheduleForm.maxAttempts = 3
}

function openCreateScheduleDrawer(systemName?: string) {
  if (!selectedScheduleService.value) return
  const targetSystemName = systemName ?? scheduleJobSystemNames.value[0] ?? scheduleServiceAvailableJobs.value[0]?.systemName
  if (!targetSystemName) {
    ElMessage.warning(t('jobs.selectJobForSchedule'))
    return
  }

  const definition = serviceJobDefinition(selectedScheduleService.value, targetSystemName)
  if (!definition) {
    ElMessage.warning(t('jobs.selectJobForSchedule'))
    return
  }

  selectedJob.value = definition
  selectedSchedule.value = null
  drawerMode.value = 'schedule-create'
  resetScheduleForm()
  scheduleForm.jobSystemName = definition.job.systemName
  applyScheduleJobDefinition(definition, false)
  drawerOpen.value = true
}

function openEditScheduleDrawer(schedule: JobScheduleModel) {
  if (!selectedScheduleService.value) return
  const definition = serviceJobDefinition(selectedScheduleService.value, schedule.jobSystemName)
  if (!definition) {
    ElMessage.warning(t('jobs.jobDefinitionNotFound'))
    return
  }

  selectedJob.value = definition
  selectedSchedule.value = schedule
  drawerMode.value = 'schedule-edit'
  resetScheduleForm()
  scheduleForm.jobSystemName = schedule.jobSystemName
  scheduleForm.name = schedule.name
  scheduleForm.description = schedule.description ?? ''
  setCronBuilderFromExpression(schedule.cron)
  scheduleForm.enabled = schedule.enabled
  scheduleForm.maxAttempts = schedule.maxAttempts
  resetInputState()
  parseSchema(definition.job.initStateSchema)
  hydrateInputState(schedule.inputState)
  void loadSchemaEntities()
  drawerOpen.value = true
}

function onScheduleJobChanged(value: string | number | boolean) {
  if (!selectedScheduleService.value) return
  const definition = serviceJobDefinition(selectedScheduleService.value, String(value))
  if (!definition) return

  applyScheduleJobDefinition(definition, true)
}

function applyScheduleJobDefinition(definition: ServiceJobDefinition, resetName: boolean) {
  selectedJob.value = definition
  if (resetName && !scheduleForm.name.trim()) {
    scheduleForm.name = definition.job.name
  }
  resetInputState()
  parseSchema(definition.job.initStateSchema)
  void loadSchemaEntities()
}

function parseCronTime(hour: string, minute: string) {
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) return null

  const parsedHour = Number(hour)
  const parsedMinute = Number(minute)
  if (parsedHour < 0 || parsedHour > 23 || parsedMinute < 0 || parsedMinute > 59) return null

  return `${String(parsedHour).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')}`
}

function parseLocalTimeParts(time: string) {
  const [hour = '9', minute = '0'] = time.split(':')
  return {
    hour: Math.min(Math.max(Number(hour) || 0, 0), 23),
    minute: Math.min(Math.max(Number(minute) || 0, 0), 59),
  }
}

function formatTimeFromDate(date: Date, useUtc = false) {
  const hour = useUtc ? date.getUTCHours() : date.getHours()
  const minute = useUtc ? date.getUTCMinutes() : date.getMinutes()
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function localTimeToUtcParts(time: string) {
  const { hour, minute } = parseLocalTimeParts(time)
  const date = new Date(2026, 0, 15, hour, minute)
  return {
    hour: String(date.getUTCHours()),
    minute: String(date.getUTCMinutes()),
  }
}

function localWeekDayToUtcDay(day: number, time: string) {
  const { hour, minute } = parseLocalTimeParts(time)
  const mondayIndex = day === 0 ? 6 : day - 1
  const date = new Date(2026, 0, 5 + mondayIndex, hour, minute)
  return date.getUTCDay()
}

function utcWeekDayToLocalDay(day: number, time: string) {
  const [hour = '0', minute = '0'] = time.split(':')
  const date = new Date(Date.UTC(2026, 0, 4 + day, Number(hour), Number(minute)))
  return date.getDay()
}

function localMonthDayToUtcDay(day: number, time: string) {
  const { hour, minute } = parseLocalTimeParts(time)
  const date = new Date(2026, 0, day, hour, minute)
  return date.getUTCDate()
}

function utcMonthDayToLocalDay(day: number, time: string) {
  const [hour = '0', minute = '0'] = time.split(':')
  const date = new Date(Date.UTC(2026, 0, day, Number(hour), Number(minute)))
  return date.getDate()
}

function sortWeekDays(days: number[]) {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return [...new Set(days)].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

function buildCronFromBuilder() {
  const { hour, minute } = localTimeToUtcParts(cronBuilder.time)

  if (cronBuilder.mode === 'daily') {
    return `${minute} ${hour} * * *`
  }
  if (cronBuilder.mode === 'weekly') {
    if (cronBuilder.weekDays.length === 0) return ''
    const utcDays = sortWeekDays(cronBuilder.weekDays.map((day) => localWeekDayToUtcDay(day, cronBuilder.time)))
    return `${minute} ${hour} * * ${utcDays.join(',')}`
  }
  if (cronBuilder.mode === 'monthly') {
    return `${minute} ${hour} ${localMonthDayToUtcDay(cronBuilder.monthDay, cronBuilder.time)} * *`
  }
  if (cronBuilder.mode === 'intervalMinutes') {
    return `*/${cronBuilder.intervalMinutes} * * * *`
  }
  if (cronBuilder.mode === 'intervalHours') {
    return `0 */${cronBuilder.intervalHours} * * *`
  }

  return scheduleForm.cron.trim()
}

function syncCronFromBuilder() {
  if (cronBuilder.mode === 'advanced') return
  scheduleForm.cron = buildCronFromBuilder()
}

function setCronBuilderFromExpression(cron: string) {
  const normalizedCron = cron.trim() || '0 9 * * *'
  const parts = normalizedCron.split(/\s+/)
  scheduleForm.cron = normalizedCron

  if (parts.length !== 5) {
    cronBuilder.mode = 'advanced'
    return
  }

  const [minute = '', hour = '', dayOfMonth = '', month = '', dayOfWeek = ''] = parts
  const utcTime = parseCronTime(hour, minute)
  const localDateForUtcTime = utcTime
    ? new Date(Date.UTC(2026, 0, 15, Number(hour), Number(minute)))
    : null
  const localTime = localDateForUtcTime ? formatTimeFromDate(localDateForUtcTime) : null
  const everyMinutes = minute.match(/^\*\/(\d+)$/)
  const everyHours = hour.match(/^\*\/(\d+)$/)

  if (everyMinutes && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    cronBuilder.mode = 'intervalMinutes'
    cronBuilder.intervalMinutes = Math.min(Math.max(Number(everyMinutes[1]) || 5, 1), 59)
    return
  }

  if (minute === '0' && everyHours && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    cronBuilder.mode = 'intervalHours'
    cronBuilder.intervalHours = Math.min(Math.max(Number(everyHours[1]) || 1, 1), 23)
    return
  }

  if (localTime && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    cronBuilder.mode = 'daily'
    cronBuilder.time = localTime
    return
  }

  if (utcTime && localTime && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = dayOfWeek
      .split(',')
      .map((value) => Number(value))
      .filter((value) => value >= 0 && value <= 6)
    if (days.length > 0) {
      cronBuilder.mode = 'weekly'
      cronBuilder.time = localTime
      cronBuilder.weekDays = sortWeekDays(days.map((day) => utcWeekDayToLocalDay(day, utcTime)))
      return
    }
  }

  if (utcTime && localTime && month === '*' && dayOfWeek === '*' && /^\d{1,2}$/.test(dayOfMonth)) {
    const parsedDay = Number(dayOfMonth)
    if (parsedDay >= 1 && parsedDay <= 31) {
      cronBuilder.mode = 'monthly'
      cronBuilder.time = localTime
      cronBuilder.monthDay = Math.min(Math.max(utcMonthDayToLocalDay(parsedDay, utcTime), 1), 31)
      return
    }
  }

  cronBuilder.mode = 'advanced'
}

function hydrateInputState(rawState: string) {
  if (!rawState) return

  try {
    const parsed = JSON.parse(rawState) as Record<string, string | number | boolean | null>
    Object.entries(parsed).forEach(([key, value]) => {
      inputState[key] = value
    })
  } catch {
    ElMessage.warning(t('jobs.stateParseError'))
  }
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
  if (field.control === 'DatePicker') return ''
  if (field.control === 'EntitySelector') return null
  if (field.type === 'boolean') return false
  if (isNumberField(field)) return 0
  return ''
}

function isNumberField(field: JobSchemaField) {
  if (['TextField', 'DatePicker', 'EntitySelector'].includes(field.control ?? '')) return false
  return ['int', 'integer', 'long', 'float', 'double', 'decimal', 'number'].includes(field.type.toLowerCase())
}

function fieldLabel(field: JobSchemaField) {
  return field.label || field.name
}

function isSupportedEntitySelector(field: JobSchemaField) {
  return field.dependsOnEntity === 'Currency' || field.dependsOnEntity === 'Product'
}

function isEntityLoading(field: JobSchemaField) {
  if (field.dependsOnEntity === 'Currency') return isLoadingCurrencies.value
  if (field.dependsOnEntity === 'Product') return isLoadingProducts.value
  return false
}

function entityOptions(field: JobSchemaField): EntitySelectorOption[] {
  if (field.dependsOnEntity === 'Currency') return currencies.value
  if (field.dependsOnEntity === 'Product') return products.value
  return []
}

function entityOptionValue(field: JobSchemaField, option: EntitySelectorOption): string | number {
  const key = field.dependsOnField ?? 'id'
  const value = option[key as keyof EntitySelectorOption]
  return typeof value === 'number' || typeof value === 'string'
    ? value
    : option.id
}

function entityOptionLabel(field: JobSchemaField, option: EntitySelectorOption) {
  if (field.dependsOnEntity === 'Currency') {
    const currency = option as CurrencyModel
    return `${currency.shortName} (${currency.currencySign})`
  }

  if (field.dependsOnEntity === 'Product') {
    const product = option as ProductSearchModel
    return `${product.sku} - ${product.name}`
  }

  return String(entityOptionValue(field, option))
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

async function submitDrawer() {
  if (drawerMode.value === 'run') {
    await submitJob()
    return
  }

  await submitSchedule()
}

async function submitSchedule() {
  if (!selectedJob.value) return

  if (!scheduleForm.jobSystemName) {
    ElMessage.warning(t('jobs.selectJobForSchedule'))
    return
  }

  const missingField = schemaFields.value.find((field) => field.required && isEmptyValue(inputState[field.name]))
  if (missingField) {
    ElMessage.warning(t('jobs.fillField', { field: fieldLabel(missingField) }))
    return
  }

  if (!scheduleForm.name.trim()) {
    ElMessage.warning(t('jobs.scheduleNameRequired'))
    return
  }

  syncCronFromBuilder()

  if (!scheduleForm.cron.trim()) {
    ElMessage.warning(t('jobs.cronRequired'))
    return
  }

  isSavingSchedule.value = true
  try {
    if (drawerMode.value === 'schedule-create') {
      const response = await createServiceJobSchedule(selectedJob.value.serviceKey, {
        name: scheduleForm.name.trim(),
        description: scheduleForm.description.trim() || null,
        jobSystemName: scheduleForm.jobSystemName,
        inputState: JSON.stringify(inputState),
        maxAttempts: scheduleForm.maxAttempts,
        cron: scheduleForm.cron.trim(),
        enabled: scheduleForm.enabled,
      })
      addOrReplaceSchedule(response.schedule)
      ElMessage.success(t('jobs.scheduleCreated'))
    } else if (selectedSchedule.value) {
      const response = await updateServiceJobSchedule(selectedJob.value.serviceKey, selectedSchedule.value.id, {
        name: patchField(scheduleForm.name.trim()),
        description: patchField(scheduleForm.description.trim() || null),
        inputState: patchField(JSON.stringify(inputState)),
        maxAttempts: patchField(scheduleForm.maxAttempts),
        cron: patchField(scheduleForm.cron.trim()),
        enabled: patchField(scheduleForm.enabled),
      })
      addOrReplaceSchedule(response.schedule)
      ElMessage.success(t('jobs.scheduleUpdated'))
    }

    drawerOpen.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.scheduleSaveError'))
  } finally {
    isSavingSchedule.value = false
  }
}

function addOrReplaceSchedule(schedule: JobScheduleModel) {
  const index = schedules.value.findIndex((item) => item.id === schedule.id)
  if (index >= 0) {
    schedules.value.splice(index, 1, schedule)
    return
  }

  schedules.value.unshift(schedule)
  if (schedules.value.length > schedulesLimit.value) {
    schedules.value.pop()
    schedulesHasNext.value = true
  }
}

function ensureCurrentServiceSelected() {
  if (selectedCurrentService.value && services.value[selectedCurrentService.value]?.available) return
  selectedCurrentService.value = serviceCards.value.find((service) => service.available)?.key ?? null
}

function ensureScheduleServiceSelected() {
  if (selectedScheduleService.value && services.value[selectedScheduleService.value]?.available) return
  selectedScheduleService.value = serviceCards.value.find((service) => service.available)?.key ?? null
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

function handleSchedulesSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    schedulesSortBy.value = 'id_desc'
    return
  }

  schedulesSortBy.value = event.order === 'descending'
    ? `${event.prop}_desc`
    : event.prop
}

function resetScheduleFilters() {
  scheduleJobSystemNames.value = []
  scheduleNextRunRange.value = []
}

async function toggleScheduleEnabled(row: JobScheduleModel, enabled: boolean) {
  if (!selectedScheduleService.value) return

  updatingScheduleId.value = row.id
  try {
    const response = await updateServiceJobSchedule(selectedScheduleService.value, row.id, {
      enabled: patchField(enabled),
    })
    addOrReplaceSchedule(response.schedule)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('jobs.scheduleSaveError'))
  } finally {
    updatingScheduleId.value = null
  }
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

function scheduleJobDefinitionName(systemName: string) {
  return scheduleServiceAvailableJobs.value.find((job) => job.systemName === systemName)?.name ?? systemName
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
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 56px);
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
  flex: 0 0 auto;
  margin-bottom: 14px;
}

.current-jobs-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
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

.current-jobs-toolbar--split {
  justify-content: space-between;
}

.current-jobs-toolbar-main,
.current-jobs-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-jobs-toolbar-main {
  min-width: 0;
}

.current-jobs-toolbar-actions {
  justify-content: flex-end;
  margin-left: auto;
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

.schedule-range-picker {
  width: 360px;
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
  flex: 1 1 auto;
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

:deep(.jobs-schedule-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 18px 20px;
}

:deep(.jobs-schedule-filters-drawer .el-drawer__body) {
  padding: 0;
}

.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.drawer-body {
  flex: 1;
  overflow: auto;
  padding: 10px 20px 24px;
}

.drawer-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.drawer-section + .drawer-section {
  margin-top: 14px;
}

.drawer-section-title {
  margin-bottom: 12px;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
}

.filter-field {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.filter-field > span {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 14px 20px;
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

.current-jobs-footer--left {
  justify-content: flex-start;
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

.schedule-form {
  margin-bottom: 0;
}

.cron-builder {
  display: grid;
  width: 100%;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}

.cron-mode-tabs {
  overflow-x: auto;
  justify-self: stretch;
  max-width: 100%;
}

.cron-mode-tabs :deep(.el-segmented__group) {
  min-width: max-content;
}

.cron-mode-tabs :deep(.el-segmented__item) {
  padding: 0 10px;
}

.cron-builder-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-size: 13px;
}

.cron-builder-stack {
  display: grid;
  gap: 10px;
}

.cron-time-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cron-weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cron-preview {
  display: grid;
  gap: 4px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.cron-preview span {
  color: #64748b;
  font-size: 12px;
}

.cron-preview strong {
  color: #111827;
  font-size: 13px;
  font-weight: 650;
}

.cron-preview code {
  width: fit-content;
  border-radius: 6px;
  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  padding: 3px 7px;
}

.schedule-options-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 14px;
}

.schedule-option-attempts {
  width: 150px;
}

.schedule-enabled-control {
  display: grid;
  gap: 8px;
  min-width: 170px;
}

.schedule-enabled-control > span {
  color: #606266;
  font-size: 14px;
  font-weight: 700;
}

.schedule-enabled-control > div {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.schedule-enabled-control strong {
  color: #111827;
  font-size: 13px;
  font-weight: 650;
}

.input-state-heading {
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin: 10px 0 16px;
  padding: 16px 0;
}

.input-state-heading span {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.input-state-heading p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
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

  .current-jobs-toolbar-main,
  .current-jobs-toolbar-actions {
    width: 100%;
  }

  .current-jobs-toolbar-actions {
    display: grid;
    grid-template-columns: 1fr;
    margin-left: 0;
  }

  .current-jobs-toolbar-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .current-service-select,
  .current-status-select,
  .current-system-select,
  .schedule-range-picker {
    width: 100%;
  }

  .schedule-option-attempts,
  .schedule-enabled-control {
    width: 100%;
  }
}
</style>

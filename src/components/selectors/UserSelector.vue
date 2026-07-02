<template>
  <el-select
    v-model="selectedUser"
    filterable
    value-key="id"
    :filter-method="onSearch"
    :placeholder="resolvedPlaceHolder"
    :clearable="clearable"
    :loading="isLoading"
    :popper-class="popperClass"
    @visible-change="onVisibleChange"
  >
    <el-option
      v-for="user in users"
      :key="user.id"
      :label="`${user.surname} ${user.name}`"
      :value="user"
    />
  </el-select>
</template>

<script setup lang="ts">
import {GeneralSearchStrategy} from "@/enums/generalSearchStrategy.ts";
import type {UserModel} from "@/models/userModel.ts";
import {computed, onMounted, ref, watch} from "vue";
import {useDebounceFn} from "@vueuse/core";
import {useSelectInfiniteScroll} from "@/composables/useSelectInfiniteScroll.ts";
import {getUsers} from "@/services/api/users.ts";
import {useI18n} from "@/i18n";

const props = withDefaults(defineProps<{
  placeHolder?: string,
  clearable?: boolean,
  roles?: string[],
}>(), {
  placeHolder: undefined,
  clearable: true,
  roles: () => [],
})

const {t} = useI18n()
const resolvedPlaceHolder = computed(() => props.placeHolder ?? t('users.selectUser'))
const loadDebounced = useDebounceFn(async () => loadNext(true), 250)
const popperClass = `user-selector-${Math.random().toString(36).slice(2)}`
const { attach: attachScroll, detach: detachScroll } = useSelectInfiniteScroll(popperClass, () => loadNext(false))

function onSearch(query: string) {
  searchTerm.value = query
  loadDebounced()
}

const selectedUser = defineModel<UserModel>('selected-user')

const searchTerm = ref('');
const strategy = GeneralSearchStrategy.General
const users = ref<UserModel[]>([])

const page = ref(0)
const limit = ref(24)
const hasNextPage = ref(false);
const isLoading = ref(false);
async function loadNext(reset: boolean = false) {
  if (isLoading.value) return
  if (reset) {
    hasNextPage.value = true;
    page.value = 0;
    users.value = [];
  }

  if (!hasNextPage.value) return;

  try {
    isLoading.value = true;
    const resp = await getUsers({
      searchMethod: strategy,
      searchTerm: searchTerm.value,
      page: page.value,
      limit: limit.value,
      roles: props.roles.length > 0 ? props.roles : undefined,
    })

    users.value.push(...resp.users)
    ensureSelectedUser()
    hasNextPage.value = resp.users.length === limit.value
    page.value += 1
  }
  finally {
    isLoading.value = false;
  }
}

function onVisibleChange(open: boolean) {
  if (!open) {
    detachScroll()
    return
  }

  attachScroll()
  if (users.value.length === 0) {
    loadNext(true)
  }
}

function ensureSelectedUser() {
  if (!selectedUser.value) return
  const exists = users.value.some((user) => user.id === selectedUser.value?.id)
  if (!exists) {
    users.value.unshift(selectedUser.value)
  }
}

watch(selectedUser, ensureSelectedUser)
onMounted(async () => await loadNext(true));
</script>

<style scoped>

</style>

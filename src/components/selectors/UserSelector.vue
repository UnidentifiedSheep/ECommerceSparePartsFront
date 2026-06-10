<template>
  <el-select
    v-model="selectedUser"
    filterable
    value-key="id"
    :filter-method="onSearch"
    :placeholder="placeHolder"
    :clearable="clearable"
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
import {onMounted, ref, watch} from "vue";
import {getUsers} from "@/services/api/users.ts";

const props = withDefaults(defineProps<{
  placeHolder?: string,
  clearable?: boolean,
  roles?: string[],
}>(), {
  placeHolder: "Выбирите пользователя",
  clearable: true,
  roles: () => [],
})

function onSearch(query: string) {
  searchTerm.value = query
  loadNext(true)
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

function ensureSelectedUser() {
  if (!selectedUser.value) return
  const exists = users.value.some((user) => user.id === selectedUser.value?.id)
  if (!exists) {
    users.value.unshift(selectedUser.value)
  }
}

watch(searchTerm, async () => await loadNext(true));
watch(selectedUser, ensureSelectedUser)
onMounted(async () => await loadNext(true));
</script>

<style scoped>

</style>

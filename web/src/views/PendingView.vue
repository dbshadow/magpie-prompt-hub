<script setup lang="ts">
import { useRouter } from 'vue-router'
import { pb } from '../lib/pocketbase'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const handleLogout = () => {
  pb.authStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface p-4 text-center">
    <img src="/logo.png" alt="Magpie Logo" class="mb-6 h-24 w-24 object-contain animate-bounce drop-shadow-md" />
    <h1 class="mb-4 text-4xl font-extrabold tracking-tight text-gray-900">{{ t('auth.waitingApproval') }}</h1>
    <p class="mb-8 max-w-md text-lg text-gray-600">
      {{ t('auth.approvalMessage') }}
    </p>
    <button @click="handleLogout" class="rounded-full bg-white px-8 py-3 font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all border border-gray-200">
      {{ t('common.logout') }}
    </button>
  </div>
</template>

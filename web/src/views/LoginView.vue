<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pb } from '../lib/pocketbase'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await pb.collection('users').authWithPassword(email.value.toLowerCase(), password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50">
      <div class="mb-8 text-center">
        <img src="/logo.png" alt="Magpie Logo" class="mx-auto mb-6 h-20 w-20 object-contain drop-shadow-md" />
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ t('auth.welcomeBack') }}</h1>
        <p class="mt-2 text-gray-500">{{ t('auth.signInToAccount') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('auth.email') }}</label>
          <input v-model="email" type="email" required class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="you@company.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('auth.password') }}</label>
          <input v-model="password" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="••••••••" />
        </div>

        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

        <button :disabled="loading" type="submit" class="w-full rounded-lg bg-primary py-3 font-semibold text-gray-900 transition-all hover:bg-primary-hover disabled:opacity-50 shadow-sm">
          {{ loading ? t('common.loading') : t('common.login') }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        {{ t('auth.dontHaveAccount') }} 
        <router-link to="/register" class="font-semibold text-primary hover:underline">{{ t('common.signUp') }}</router-link>
      </p>
    </div>
  </div>
</template>

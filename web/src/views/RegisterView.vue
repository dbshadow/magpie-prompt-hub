<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pb } from '../lib/pocketbase'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const username = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = {
      username: username.value,
      email: email.value.toLowerCase(),
      emailVisibility: true,
      password: password.value,
      passwordConfirm: password.value,
      status: 'pending',
      role: 'user'
    }

    await pb.collection('users').create(data)
    await pb.collection('users').authWithPassword(email.value.toLowerCase(), password.value)
    
    router.push('/pending')
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
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ t('auth.joinMagpie') }}</h1>
        <p class="mt-2 text-gray-500">{{ t('auth.createAccount') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('auth.username') }}</label>
          <input v-model="username" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="johndoe" />
        </div>
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
          {{ loading ? t('common.loading') : t('common.signUp') }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        {{ t('auth.alreadyHaveAccount') }} 
        <router-link to="/login" class="font-semibold text-primary hover:underline">{{ t('common.login') }}</router-link>
      </p>
    </div>
  </div>
</template>

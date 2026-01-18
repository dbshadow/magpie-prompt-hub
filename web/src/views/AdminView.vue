<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pb } from '../lib/pocketbase'
import Header from '../components/Header.vue'

const pendingUsers = ref<any[]>([])
const loading = ref(true)

const fetchPendingUsers = async () => {
  loading.value = true
  try {
    const records = await pb.collection('users').getList(1, 50, {
      filter: 'status = "pending"'
    })
    pendingUsers.value = records.items
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const approveUser = async (userId: string) => {
  try {
    await pb.collection('users').update(userId, { status: 'active' })
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId)
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchPendingUsers)
</script>

<template>
  <div class="min-h-screen bg-surface">
    <Header />
    <main class="mx-auto max-w-4xl p-6">
      <h1 class="mb-8 text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-xl font-semibold text-gray-800">Pending User Approvals</h2>
        
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-xl bg-gray-50"></div>
        </div>
        
        <div v-else-if="pendingUsers.length === 0" class="py-8 text-center text-gray-500">
          No pending users at the moment.
        </div>
        
        <ul v-else class="divide-y divide-gray-100">
          <li v-for="user in pendingUsers" :key="user.id" class="flex items-center justify-between py-4">
            <div>
              <p class="font-medium text-gray-900">{{ user.username || 'Anonymous' }}</p>
              <p class="text-sm text-gray-500">{{ user.id }}</p>
            </div>
            <button @click="approveUser(user.id)" class="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
              Approve
            </button>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

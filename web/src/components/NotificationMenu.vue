<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { pb } from '../lib/pocketbase'

const emit = defineEmits(['open-prompt'])
const notifications = ref<any[]>([])
const isOpen = ref(false)
const unreadCount = ref(0)

const fetchNotifications = async () => {
  if (!pb.authStore.model) return
  try {
    const records = await pb.collection('notifications').getList(1, 10, {
      filter: `recipient = "${pb.authStore.model.id}"`,
      sort: '-created',
      expand: 'trigger_user,prompt'
    })
    notifications.value = records.items
    
    // Get unread count
    const unread = await pb.collection('notifications').getList(1, 1, {
      filter: `recipient = "${pb.authStore.model.id}" && is_read = false`
    })
    unreadCount.value = unread.totalItems
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
  }
}

const markAsRead = async (notification: any) => {
  if (notification.is_read) {
    emit('open-prompt', notification.expand?.prompt)
    isOpen.value = false
    return
  }
  
  try {
    await pb.collection('notifications').update(notification.id, { is_read: true })
    await fetchNotifications()
    emit('open-prompt', notification.expand?.prompt)
    isOpen.value = false
  } catch (err) {
    console.error('Failed to mark as read:', err)
  }
}

const getAvatarUrl = (user: any) => {
  if (user?.avatar) {
    return `${pb.baseUrl}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`
  }
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'anon'}`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

let unsubscribe: any = null

onMounted(async () => {
  await fetchNotifications()
  
  // Real-time subscription
  if (pb.authStore.model) {
    unsubscribe = await pb.collection('notifications').subscribe('*', () => {
      fetchNotifications()
    }, {
        filter: `recipient = "${pb.authStore.model.id}"`
    })
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="relative">
    <button 
      @click="toggleDropdown"
      class="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-main transition-all"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span v-if="unreadCount > 0" class="absolute top-2 right-2 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </button>

    <!-- Dropdown -->
    <div v-if="isOpen" class="absolute right-0 mt-2 w-80 rounded-2xl bg-surface border border-gray-100 dark:border-gray-800 shadow-xl z-[150] overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h3 class="text-sm font-bold text-main">Notifications</h3>
        <span v-if="unreadCount > 0" class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{ unreadCount }} unread</span>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length > 0">
          <button 
            v-for="item in notifications" 
            :key="item.id" 
            @click="markAsRead(item)"
            class="w-full p-4 flex gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
            :class="{'bg-primary/5': !item.is_read}"
          >
            <img :src="getAvatarUrl(item.expand?.trigger_user)" class="h-10 w-10 rounded-full shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-muted leading-snug">
                <span class="font-bold text-main">{{ item.expand?.trigger_user?.name || item.expand?.trigger_user?.username }}</span>
                {{ item.type === 'like' ? ' liked your prompt ' : ' commented on ' }}
                <span class="font-bold text-main">"{{ item.expand?.prompt?.title }}"</span>
              </p>
              <p class="mt-1 text-[10px] text-gray-400">{{ formatDate(item.created) }}</p>
            </div>
            <div v-if="!item.is_read" class="h-2 w-2 mt-2 rounded-full bg-primary shrink-0"></div>
          </button>
        </div>
        <div v-else class="p-8 text-center">
          <p class="text-xs text-muted">No notifications yet.</p>
        </div>
      </div>
    </div>

    <!-- Backdrop to close -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-[-1]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { pb } from '../lib/pocketbase'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  prompt: any
}>()

const promptId = computed(() => props.prompt.id)
const { t } = useI18n()
const comments = ref<any[]>([])
const newComment = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const editContent = ref('')

const currentUser = computed(() => pb.authStore.model)

const fetchComments = async () => {
  isLoading.value = true
  try {
    const records = await pb.collection('comments').getList(1, 50, {
      filter: `prompt = "${promptId.value}"`,
      sort: 'created',
      expand: 'user'
    })
    comments.value = records.items
  } catch (err) {
    console.error('Failed to fetch comments:', err)
  } finally {
    isLoading.value = false
  }
}

const addComment = async () => {
  if (!newComment.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await pb.collection('comments').create({
      content: newComment.value,
      user: currentUser.value?.id,
      prompt: promptId.value
    })
    newComment.value = ''
    
    // Manually update count for immediate feedback
    if (props.prompt) {
      props.prompt.comments_count = (props.prompt.comments_count || 0) + 1
    }
    
    await fetchComments()
  } catch (err) {
    console.error('Failed to add comment:', err)
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (comment: any) => {
  editingId.value = comment.id
  editContent.value = comment.content
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
}

const saveEdit = async (comment: any) => {
  if (!editContent.value.trim()) return
  try {
    await pb.collection('comments').update(comment.id, {
      content: editContent.value
    })
    editingId.value = null
    await fetchComments()
  } catch (err) {
    console.error('Failed to update comment:', err)
  }
}

const deleteComment = async (id: string) => {
  if (!confirm(t('common.deleteConfirm') || 'Are you sure?')) return
  try {
    await pb.collection('comments').delete(id)
    
    // Manually update count for immediate feedback
    if (props.prompt && props.prompt.comments_count > 0) {
      props.prompt.comments_count--
    }
    
    await fetchComments()
  } catch (err) {
    console.error('Failed to delete comment:', err)
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
  return date.toLocaleString()
}

onMounted(fetchComments)
</script>

<template>
  <div class="mt-8 border-t border-gray-100 dark:border-gray-800 pt-8">
    <h4 class="mb-6 text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      {{ t('prompt.comments') || 'Comments' }}
    </h4>

    <!-- Comment Input -->
    <div v-if="currentUser" class="mb-8">
      <textarea 
        v-model="newComment"
        class="block w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-main shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary transition-all"
        rows="3"
        :placeholder="t('prompt.addCommentPlaceholder') || 'Write a comment...'"
      ></textarea>
      <div class="mt-3 flex justify-end">
        <button 
          @click="addComment"
          :disabled="!newComment.trim() || isSubmitting"
          class="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-all shadow-sm"
        >
          {{ isSubmitting ? '...' : (t('common.post') || 'Post') }}
        </button>
      </div>
    </div>

    <!-- Comments List -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 2" :key="i" class="animate-pulse flex gap-3">
        <div class="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <div v-else-if="comments.length > 0" class="space-y-6">
      <div v-for="comment in comments" :key="comment.id" class="group flex gap-3">
        <img :src="getAvatarUrl(comment.expand?.user)" class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800" />
        
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-main">{{ comment.expand?.user?.name || comment.expand?.user?.username }}</span>
              <span class="text-[10px] text-muted">{{ formatDate(comment.created) }}</span>
            </div>
            
            <div v-if="currentUser?.id === comment.user" class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="startEdit(comment)" class="text-[10px] font-bold text-muted hover:text-primary">{{ t('common.edit') || 'Edit' }}</button>
              <button @click="deleteComment(comment.id)" class="text-[10px] font-bold text-red-400 hover:text-red-500">{{ t('common.delete') || 'Delete' }}</button>
            </div>
          </div>

          <div v-if="editingId === comment.id">
            <textarea 
              v-model="editContent"
              class="block w-full rounded-lg border-0 bg-white dark:bg-gray-700 px-3 py-2 text-xs text-main shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-600 focus:ring-2 focus:ring-primary"
              rows="2"
            ></textarea>
            <div class="mt-2 flex gap-2 justify-end">
              <button @click="cancelEdit" class="text-[10px] font-bold text-muted">{{ t('common.cancel') || 'Cancel' }}</button>
              <button @click="saveEdit(comment)" class="text-[10px] font-bold text-primary">{{ t('common.save') || 'Save' }}</button>
            </div>
          </div>
          <p v-else class="text-sm text-muted leading-relaxed whitespace-pre-wrap">{{ comment.content }}</p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-xs text-muted">{{ t('prompt.noComments') || 'No comments yet.' }}</p>
    </div>
  </div>
</template>

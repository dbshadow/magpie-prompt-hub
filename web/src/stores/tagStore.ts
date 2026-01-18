import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '../lib/pocketbase'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<any[]>([])
  const loading = ref(false)

  const fetchTags = async () => {
    // If already loaded or currently loading, skip
    if (tags.value.length > 0 || loading.value) return
    
    loading.value = true
    try {
      const result = await pb.collection('tags').getFullList({
        sort: 'name',
        requestKey: null // Disable auto-cancellation for this request
      })
      tags.value = result
    } catch (e: any) {
      if (e.isAbort) return // Ignore abort errors
      console.error('Failed to fetch tags', e)
    } finally {
      loading.value = false
    }
  }

  return { tags, loading, fetchTags }
})

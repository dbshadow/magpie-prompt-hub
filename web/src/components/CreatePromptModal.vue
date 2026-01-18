<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { pb } from '../lib/pocketbase'
import { useI18n } from 'vue-i18n'
import { useTagStore } from '../stores/tagStore'

const props = defineProps<{
  isOpen: boolean
  initialData?: any
  editMode?: boolean
}>()

const emit = defineEmits(['close', 'created', 'updated'])
const { t } = useI18n()
const tagStore = useTagStore()

const title = ref('')
const content = ref('')
const description = ref('')
const resultText = ref('')
const resultImage = ref<File | null>(null)
const resultImagePreview = ref<string | null>(null)
const selectedTagIds = ref<string[]>([])
const loading = ref(false)
const activeTab = ref<'text' | 'image'>('text')

// Reset or Fill form
watch(() => props.isOpen, (open) => {
  if (open) {
    // Fetch tags if empty
    if (tagStore.tags.length === 0) {
      tagStore.fetchTags()
    }

    if (props.initialData) {
      title.value = props.initialData.title
      content.value = props.initialData.content
      description.value = props.initialData.description || ''
      resultText.value = props.initialData.result_text || ''
      
      // Handle tags (Relation)
      if (Array.isArray(props.initialData.tags)) {
        selectedTagIds.value = [...props.initialData.tags]
      } else {
        selectedTagIds.value = []
      }

      resultImage.value = null 
      // If editing existing prompt with image, show existing image as preview
      if (props.initialData.result_image) {
        activeTab.value = 'image'
        resultImagePreview.value = `${pb.baseUrl}/api/files/${props.initialData.collectionId}/${props.initialData.id}/${props.initialData.result_image}`
      } else {
        activeTab.value = 'text'
        resultImagePreview.value = null
      }
    } else {
      title.value = ''
      content.value = ''
      description.value = ''
      resultText.value = ''
      selectedTagIds.value = []
      resultImage.value = null
      resultImagePreview.value = null
      activeTab.value = 'text'
    }
  }
})

onMounted(() => {
  tagStore.fetchTags()
})

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    resultImage.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      resultImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  loading.value = true
  const user = pb.authStore.model
  
  if (!user) return

  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('content', content.value)
  formData.append('description', description.value)
  
  // Handle Mutual Exclusion
  if (activeTab.value === 'text') {
    formData.append('result_text', resultText.value)
    formData.append('result_image', '') 
  } else {
    formData.append('result_text', '') 
    if (resultImage.value) {
      formData.append('result_image', resultImage.value)
    }
  }

  // Tags as Relation IDs
  for (const tagId of selectedTagIds.value) {
     formData.append('tags', tagId)
  }
  
  formData.append('user', user.id)

  try {
    if (props.editMode && props.initialData?.id) {
      await pb.collection('prompts').update(props.initialData.id, formData)
      emit('updated')
    } else {
      if (props.initialData?.id) {
        formData.append('parent_id', props.initialData.id)
      }
      await pb.collection('prompts').create(formData)
      emit('created')
    }
    emit('close')
  } catch (e: any) {
    alert(e.message)
  }
  loading.value = false
}

const toggleTag = (tagId: string) => {
  if (selectedTagIds.value.includes(tagId)) {
    selectedTagIds.value = selectedTagIds.value.filter(t => t !== tagId)
  } else {
    selectedTagIds.value.push(tagId)
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <div @click="emit('close')" class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
    
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-6 sm:p-10 shadow-2xl scrollbar-hide">
      <h2 class="mb-6 text-2xl font-extrabold text-gray-900">
        {{ editMode ? t('prompt.update') : (initialData ? t('prompt.remix') : t('prompt.share')) }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500">{{ t('prompt.title') }}</label>
          <input 
            v-model="title"
            required
            type="text" 
            class="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            :placeholder="t('prompt.placeholders.title')"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500">{{ t('prompt.description') }}</label>
          <input 
            v-model="description"
            type="text" 
            class="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            :placeholder="t('prompt.placeholders.desc')"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500">{{ t('prompt.content') }}</label>
          <textarea 
            v-model="content"
            required
            rows="6"
            class="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            :placeholder="t('prompt.placeholders.content')"
          ></textarea>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
             <label class="text-xs font-bold uppercase tracking-wider text-gray-500">{{ t('prompt.resultPreview') }}</label>
             <div class="flex bg-gray-100 rounded-lg p-1">
                <button type="button" @click="activeTab = 'text'" :class="['px-3 py-1 text-xs font-bold rounded-md transition-all', activeTab === 'text' ? 'bg-white shadow text-primary' : 'text-gray-500']">{{ t('prompt.text') }}</button>
                <button type="button" @click="activeTab = 'image'" :class="['px-3 py-1 text-xs font-bold rounded-md transition-all', activeTab === 'image' ? 'bg-white shadow text-primary' : 'text-gray-500']">{{ t('prompt.image') }}</button>
             </div>
          </div>

          <div v-if="activeTab === 'text'">
             <textarea 
              v-model="resultText"
              rows="4"
              class="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              :placeholder="t('prompt.placeholders.resultText')"
            ></textarea>
          </div>

          <div v-else>
            <div class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden group">
              <input type="file" @change="handleFileUpload" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" />
              
              <div v-if="resultImagePreview" class="w-full h-48 relative">
                 <img :src="resultImagePreview" class="w-full h-full object-contain rounded-lg" />
                 <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur">Click to change</span>
                 </div>
              </div>

              <div v-else class="space-y-1 text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="text-sm text-gray-600">{{ t('prompt.uploadFile') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{{ t('prompt.tags') }}</label>
          <div class="flex flex-wrap gap-2">
            <div v-if="tagStore.loading" class="text-xs text-gray-400">Loading tags...</div>
            <div v-else-if="tagStore.tags.length === 0" class="text-xs text-gray-400">No tags defined in admin.</div>
            <button 
              type="button"
              v-for="tag in tagStore.tags" 
              :key="tag.id"
              @click="toggleTag(tag.id)"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                selectedTagIds.includes(tag.id)
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button type="button" @click="emit('close')" class="flex-1 rounded-2xl border border-gray-200 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-all">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :disabled="loading" class="flex-1 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? (editMode ? 'Updating...' : 'Sharing...') : (editMode ? t('common.save') : t('prompt.share')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
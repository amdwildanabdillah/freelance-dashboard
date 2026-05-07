<script setup>
import { ref, computed } from 'vue'

// Workflow asli sesuai urutan kerjamu
const tasks = ref([
  { id: 1, title: 'Backup & Sortir Folder (Vid, .arw, .jpg)', completed: true },
  { id: 2, title: 'Upload RAW ke Drive & Share Link', completed: true },
  { id: 3, title: 'Klien selesai milih foto (Target 30 foto)', completed: false },
  { id: 4, title: 'Editing (Retouch & Color Grading)', completed: false },
  { id: 5, title: 'Export & Backup Final ke Drive', completed: false },
  { id: 6, title: 'Desain Recap Konten (Canva)', completed: false },
  { id: 7, title: 'Posting Portfolio Sosmed (IG/TikTok)', completed: false }
])

const completedCount = computed(() => tasks.value.filter(t => t.completed).length)
const progressPercentage = computed(() => Math.round((completedCount.value / tasks.value.length) * 100))

const toggleTask = (id) => {
  const task = tasks.value.find(t => t.id === id)
  if (task) task.completed = !task.completed
}
</script>

<template>
  <div class="mt-2">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Progress</h3>
      <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{{ progressPercentage }}%</span>
    </div>
    
    <!-- Progress Bar -->
    <div class="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
      <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" :style="`width: ${progressPercentage}%`"></div>
    </div>

    <!-- Checklist -->
    <div class="space-y-3">
      <div 
        v-for="task in tasks" 
        :key="task.id"
        @click="toggleTask(task.id)"
        class="flex items-start p-3 rounded-xl border transition-all cursor-pointer select-none"
        :class="task.completed ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-200 hover:border-indigo-300'"
      >
        <div class="mt-0.5 flex-shrink-0">
          <div 
            class="w-5 h-5 rounded flex items-center justify-center transition-colors"
            :class="task.completed ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300 text-transparent'"
          >
            <svg v-if="task.completed" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>
        <span 
          class="ml-3 text-sm font-medium transition-colors"
          :class="task.completed ? 'text-slate-400 line-through' : 'text-slate-700'"
        >
          {{ task.title }}
        </span>
      </div>
    </div>
  </div>
</template>
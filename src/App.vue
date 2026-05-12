<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { initTheme } from './theme'

const route = useRoute()
const isMobileMenuOpen = ref(false)

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div v-if="route.meta.public">
    <RouterView />
  </div>

  <div v-else class="relative min-h-screen bg-[#f4f5f7] dark:bg-[#050505] text-slate-900 dark:text-white font-sans overflow-hidden transition-colors duration-500">
    
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-cyan-400/20 dark:bg-cyan-600/20 blur-[120px] opacity-50 mix-blend-normal transition-all"></div>
      <div class="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/20 dark:bg-blue-700/20 blur-[120px] opacity-50 mix-blend-normal transition-all"></div>
    </div>

    <Sidebar :isOpen="isMobileMenuOpen" @close="isMobileMenuOpen = false" />

    <div class="relative flex-1 flex flex-col md:pl-[288px] h-screen w-full z-10 transition-all duration-300">
      
      <header class="absolute top-4 left-4 right-4 md:left-[288px] h-16 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-full shadow-lg shadow-slate-200/20 dark:shadow-black/40 flex items-center justify-between px-6 z-30 transition-all duration-500">
        
        <div class="flex items-center">
          <button @click="isMobileMenuOpen = true" class="md:hidden mr-4 p-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full transition-colors active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h10" />
            </svg>
          </button>
          
          <h1 class="text-[15px] font-semibold tracking-tight text-slate-800 dark:text-white">
            {{ route.name || 'Dashboard' }}
          </h1>
        </div>
        
        <div class="flex items-center space-x-4"></div>
      </header>

      <main class="flex-1 overflow-auto pt-28 px-4 md:px-8 pb-12 relative w-full h-full z-20 custom-scrollbar">
        <div class="max-w-6xl mx-auto">
          <RouterView />
        </div>
      </main>

    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; margin: 0; }

/* Scrollbar biar tipis */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
</style>
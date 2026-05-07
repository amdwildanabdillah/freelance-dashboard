<script setup>
import { ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const isMobileMenuOpen = ref(false) // State buat ngatur buka-tutup sidebar di HP
</script>

<template>
  <!-- JIKA HALAMAN PUBLIK (FORM KLIEN) -->
  <div v-if="route.meta.public">
    <RouterView />
  </div>

  <!-- JIKA HALAMAN ADMIN DASHBOARD -->
  <div v-else class="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
    
    <!-- Sidebar Admin (Kirim state isOpen ke komponen Sidebar) -->
    <Sidebar :isOpen="isMobileMenuOpen" @close="isMobileMenuOpen = false" />

    <!-- CLASS md:pl-64 INI KUNCINYA BIAR DI HP NGGAK KEPOTONG -->
    <div class="flex-1 flex flex-col md:pl-64 h-screen overflow-hidden min-w-0 w-full transition-all duration-300">
      
      <!-- Navbar Atas -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 w-full">
        
        <div class="flex items-center">
          <!-- Tombol Hamburger khusus Mobile -->
          <button @click="isMobileMenuOpen = true" class="md:hidden mr-3 p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          <h1 class="text-lg font-semibold text-slate-800">
            {{ route.name || 'ShotFlow' }}
          </h1>
        </div>
        
        <div class="flex items-center space-x-6">
          <a href="/book" target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all shadow-sm flex items-center">
            <svg class="w-4 h-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="hidden md:inline">Preview Booking Form</span>
          </a>
        </div>
      </header>

      <!-- Area Konten Utama -->
      <main class="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative w-full">
        <div class="max-w-7xl mx-auto pb-12">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body { font-family: 'Inter', sans-serif; margin: 0; }
</style>
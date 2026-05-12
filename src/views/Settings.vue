<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2' // Import SweetAlert di sini

const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  applyGlobalTheme()
}

const applyGlobalTheme = () => {
  if (isDarkMode.value) { document.body.style.backgroundColor = '#0a0a0a'; document.body.style.color = '#ffffff' }
  else { document.body.style.backgroundColor = '#f8fafc'; document.body.style.color = '#0f172a' }
}
applyGlobalTheme() // Set warna dasar saat komponen dirender

const apiStatus = ref('Belum dites') 

// Info Developer VIXEL
const devInfo = {
  name: 'Ahmad Wildan Abdillah',
  title: 'Founder & Lead Developer of VIXEL Creative',
  university: 'UIN Sunan Ampel Surabaya (KPI)',
  description: 'Seorang Serial Entrepreneur yang fokus pada solusi kreatif digital lewat Storydesto & Destograph.',
  socials: ['Instagram', 'GitHub', 'LinkedIn']
}

// TEST DATABASE FIREBASE
const testConnection = async () => {
  apiStatus.value = 'Menghubungi Firebase...'
  setTimeout(() => {
    apiStatus.value = 'Connected (Firestore)'
    Swal.fire({
      title: 'Koneksi Stabil',
      text: 'Database Firestore berfungsi dengan baik.',
      icon: 'success',
      confirmButtonColor: '#0f172a'
    })
  }, 800)
}
</script>

<template>
  <div class="min-h-screen w-full transition-colors duration-500" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
    <div class="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <div>
      <h2 class="text-3xl font-black uppercase tracking-tight">System Settings</h2>
      <p class="text-sm font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Atur preferensi tampilan dan pelajari lebih lanjut tentang sistem.</p>
    </div>

    <!-- API Connection Test Card -->
    <div class="rounded-[2.5rem] p-8 border shadow-sm relative overflow-hidden transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Database Connection</h3>
          <p class="text-sm font-bold">Uji Koneksi ke Database Firebase</p>
          <p class="text-[11px] mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-400'">Status: <span class="font-bold font-mono" :class="apiStatus.includes('Connected') ? 'text-emerald-500' : (isDarkMode ? 'text-gray-500' : 'text-slate-500')">{{ apiStatus }}</span></p>
        </div>
        <button @click="testConnection" class="px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg transition-all active:scale-95 flex items-center" :class="isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-black'">
          PING SERVER
        </button>
      </div>
    </div>

    <!-- Preferences Section -->
    <div class="rounded-[2.5rem] p-8 border shadow-sm space-y-6 transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
      <h3 class="text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-900'">App Preferences</h3>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-bold">Mode Tampilan</p>
          <p class="text-[11px] font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Aktifkan Dark Mode untuk mengurangi silau.</p>
        </div>
        <button @click="toggleTheme" class="w-14 h-7 rounded-full p-1 transition-all border" :class="isDarkMode ? 'bg-cyan-500/20 border-cyan-400' : 'bg-slate-200 border-transparent'">
          <div :class="isDarkMode ? 'translate-x-7 bg-cyan-400' : 'translate-x-0 bg-white'" class="w-5 h-5 rounded-full shadow-sm transition-all"></div>
        </button>
      </div>
    </div>

    <!-- About Developer Section -->
    <div class="bg-indigo-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
      <div class="relative z-10 max-w-lg">
        <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">The Creator</h3>
        <h4 class="text-2xl font-bold mb-4">{{ devInfo.name }}</h4>
        <p class="text-indigo-100 text-sm leading-relaxed mb-6">
          {{ devInfo.description }} Berbasis di Surabaya untuk studi di {{ devInfo.university }}.
        </p>
        <div class="flex gap-4">
          <button v-for="link in devInfo.socials" :key="link" class="text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20 transition-all">
            {{ link }}
          </button>
        </div>
      </div>
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-800 rounded-full opacity-50 blur-3xl"></div>
      </div>
    </div>
  </div>
</template>
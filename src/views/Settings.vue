<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2' // Import SweetAlert di sini

const isDarkMode = ref(false)
const language = ref('Indonesia')
const apiStatus = ref('Belum dites') 

// Info Developer VIXEL
const devInfo = {
  name: 'Ahmad Wildan Abdillah',
  title: 'Founder & Lead Developer of VIXEL Creative',
  university: 'UIN Sunan Ampel Surabaya (KPI)',
  description: 'Seorang Serial Entrepreneur yang fokus pada solusi kreatif digital lewat Storydesto & Destograph.',
  socials: ['Instagram', 'GitHub', 'LinkedIn']
}

// FUNGSI TESTING KE GOOGLE SHEETS
const testConnection = async () => {
  apiStatus.value = 'Menghubungi server VIXEL...'
  
  try {
    const url = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'TEST_CONNECTION',
        data: 'Halo dari ShotFlow Vue!'
      })
    })

    const result = await response.json()
    
    if(result.status === 'success') {
      apiStatus.value = '✅ Connected (200 OK)'
      // Pakai SweetAlert untuk Sukses
      Swal.fire({
        title: 'Koneksi Sukses! 🚀',
        text: result.message,
        icon: 'success',
        confirmButtonColor: '#4f46e5', // Warna indigo-600
        confirmButtonText: 'Lanjutkan'
      })
      console.log("Data yang diterima Apps Script:", result.dataReceived)
    } else {
      apiStatus.value = '❌ Server Error'
      // Pakai SweetAlert untuk Error dari Server
      Swal.fire({
        title: 'Waduh Gagal!',
        text: result.message,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    }
  } catch (error) {
    apiStatus.value = '🚨 Error Jaringan / CORS'
    // Pakai SweetAlert untuk Error Jaringan
    Swal.fire({
      title: 'Koneksi Terputus!',
      text: 'Gagal menghubungi server: ' + error.message,
      icon: 'warning',
      confirmButtonColor: '#f59e0b'
    })
  }
}
</script>

<template>
  <div class="max-w-4xl space-y-8 pb-12">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">System Settings</h2>
      <p class="text-slate-500 text-sm mt-1">Atur preferensi tampilan dan pelajari lebih lanjut tentang sistem.</p>
    </div>

    <!-- API Connection Test Card -->
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
      <div class="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10"></div>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Database Connection</h3>
          <p class="text-sm font-bold text-slate-800">Uji Koneksi ke VIXEL Engine</p>
          <p class="text-[11px] text-slate-400 mt-1">Status: <span class="font-bold font-mono" :class="apiStatus.includes('✅') ? 'text-emerald-500' : 'text-slate-500'">{{ apiStatus }}</span></p>
        </div>
        <button @click="testConnection" class="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          PING SERVER
        </button>
      </div>
    </div>

    <!-- Preferences Section -->
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
      <h3 class="text-xs font-bold text-indigo-600 uppercase tracking-widest">App Preferences</h3>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-bold text-slate-800">Mode Tampilan</p>
          <p class="text-[11px] text-slate-400">Pilih antara mode terang atau gelap (Segera Hadir).</p>
        </div>
        <button @click="isDarkMode = !isDarkMode" class="w-12 h-6 rounded-full bg-slate-200 p-1 transition-all">
          <div :class="isDarkMode ? 'translate-x-6 bg-indigo-600' : 'translate-x-0 bg-white'" class="w-4 h-4 rounded-full shadow-sm transition-all"></div>
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
</template>
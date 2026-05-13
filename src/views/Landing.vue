<script setup>
import { useRouter } from 'vue-router'
import { useTheme } from '../theme'
import { onMounted } from 'vue'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()

// Kalau udah login, otomatis lempar ke dashboard pas buka web
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push('/dashboard')
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] dark:bg-[#050505] text-slate-900 dark:text-white font-sans overflow-hidden transition-colors duration-500 selection:bg-cyan-500/30">
    
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-cyan-400/20 dark:bg-cyan-600/10 blur-[120px] mix-blend-normal"></div>
      <div class="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/20 dark:bg-blue-700/10 blur-[120px] mix-blend-normal"></div>
    </div>

    <nav class="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-cyan-400 to-blue-500">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path></svg>
        </div>
        <span class="text-xl font-bold tracking-tight">Shotflow<span class="text-cyan-500">.</span></span>
      </div>
      
      <div class="flex items-center gap-4">
        <button @click="toggleTheme" class="p-2 text-slate-400 hover:text-amber-500 rounded-full transition-colors hidden sm:block">
          <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        </button>
        <RouterLink to="/login" class="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border shadow-sm bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500/50">
          Login Vendor
        </RouterLink>
      </div>
    </nav>

    <main class="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-20">
      <div class="text-center max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>
          Sistem Manajemen Studio v2.0
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-slate-900 dark:text-white">
          Fokus Berkarya. <br class="hidden md:block"/> Biar Sistem yang <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Urus Sisanya.</span>
        </h1>
        
        <p class="text-base md:text-lg text-slate-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Tinggalkan coret-coretan jadwal di kertas dan obrolan grup WhatsApp yang berantakan. Shotflow menyatukan Booking Klien, Pipeline Editing, Invoice, dan Manajemen Alat Fotografer dalam satu ekosistem elegan.
        </p>

        <div class="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink to="/login" class="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all">
            Mulai Gratis Sekarang
          </RouterLink>
          <a href="#features" class="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md font-bold text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
            Lihat Fitur
          </a>
        </div>
      </div>

      <div class="mt-20 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2.5rem] blur opacity-20"></div>
        <div class="relative bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-4 md:p-8">
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div class="col-span-2 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <div class="w-24 h-3 rounded-full bg-slate-200 dark:bg-white/10"></div>
                <div class="w-12 h-4 rounded-full bg-cyan-500/20"></div>
              </div>
              <div class="space-y-3">
                <div class="flex gap-4">
                  <div class="w-full h-24 rounded-xl bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm">
                    <div class="w-1/2 h-3 rounded-full bg-slate-200 dark:bg-white/10"></div>
                    <div class="flex justify-between items-end">
                      <div class="w-1/3 h-2 rounded-full bg-slate-200 dark:bg-white/10"></div>
                      <div class="w-6 h-6 rounded-full bg-cyan-500/20"></div>
                    </div>
                  </div>
                  <div class="w-full h-24 rounded-xl bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm">
                    <div class="w-3/4 h-3 rounded-full bg-slate-200 dark:bg-white/10"></div>
                    <div class="flex justify-between items-end">
                      <div class="w-1/4 h-2 rounded-full bg-slate-200 dark:bg-white/10"></div>
                      <div class="w-6 h-6 rounded-full bg-emerald-500/20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div class="space-y-2 relative z-10">
                <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p class="text-cyan-100 text-[10px] font-bold uppercase tracking-widest">Net Profit Studio</p>
                <h3 class="text-2xl font-bold text-white tracking-tight">Rp 12.500.000</h3>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>

    <section id="features" class="relative z-10 py-24 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-white/5">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Senjata Utama Vendor Pro</h2>
          <p class="text-slate-500 dark:text-gray-400 font-medium">Bukan sekadar pencatat jadwal. Shotflow adalah asisten digital studio Anda.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div class="bg-slate-50 dark:bg-[#111] p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 hover:border-cyan-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <h3 class="text-lg font-bold mb-2">Kanban Pipeline</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Geser project dari Booking, Editing, hingga Delivered semudah drag-and-drop ala Trello.</p>
          </div>

          <div class="bg-slate-50 dark:bg-[#111] p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 hover:border-blue-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            </div>
            <h3 class="text-lg font-bold mb-2">Public Booking Link</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Kirim satu link elegan ke klien. Mereka isi form, upload bukti bayar, data otomatis masuk database Anda.</p>
          </div>

          <div class="bg-slate-50 dark:bg-[#111] p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 hover:border-emerald-500/50 transition-colors group">
            <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-lg font-bold mb-2">Auto Invoice & Fee</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Cetak Invoice klien dengan sekali klik. Sistem otomatis menghitung potongan 80/20 untuk gaji Fotografer lepas.</p>
          </div>

        </div>
      </div>
    </section>

    <section class="relative z-10 py-24">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Harga Masuk Akal.</h2>
          <p class="text-slate-500 dark:text-gray-400 font-medium">Pilih paket yang sesuai dengan volume studio kamu.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          
          <div class="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col">
            <h3 class="text-xl font-bold mb-2">Free Starter</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 mb-6">Cocok untuk freelance fotografer pemula.</p>
            <div class="mb-8">
              <span class="text-4xl font-extrabold text-slate-900 dark:text-white">Rp 0</span>
              <span class="text-sm text-slate-500 font-medium">/ selamanya</span>
            </div>
            <ul class="space-y-4 mb-8 flex-1">
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Maksimal 5 Project Aktif</li>
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Kanban Board Basic</li>
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Public Booking Link</li>
            </ul>
            <RouterLink to="/login" class="w-full py-4 rounded-xl border-2 border-slate-200 dark:border-white/10 font-bold text-sm text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Daftar Gratis
            </RouterLink>
          </div>

          <div class="bg-slate-900 dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex flex-col relative overflow-hidden">
            <div class="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-bl-xl">Paling Laris</div>
            <h3 class="text-xl font-bold mb-2 text-white">Studio Pro</h3>
            <p class="text-sm text-slate-400 mb-6">Untuk vendor atau agency dengan traffic tinggi.</p>
            <div class="mb-8">
              <span class="text-4xl font-extrabold text-white">Rp 49K</span>
              <span class="text-sm text-slate-400 font-medium">/ bulan</span>
            </div>
            <ul class="space-y-4 mb-8 flex-1 text-slate-200">
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited Project & Klien</li>
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Cetak Invoice Custom Logo</li>
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Manajemen Tim & Gaji Otomatis</li>
              <li class="flex items-center text-sm font-medium"><svg class="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Prioritas Support</li>
            </ul>
            <RouterLink to="/login" class="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm text-center shadow-lg hover:scale-[1.02] transition-transform">
              Mulai Langganan
            </RouterLink>
          </div>

        </div>
      </div>
    </section>

    <footer class="relative z-10 border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#050505] pt-12 pb-8">
      <div class="max-w-7xl mx-auto px-6 text-center">
        <div class="w-12 h-12 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path></svg>
        </div>
        <p class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-2">Developed by VIXEL CREATIVE.</p>
        <p class="text-xs text-slate-500 dark:text-gray-400 mb-8">Bridging Code and Art for Digital Ecosystems.</p>
        <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          &copy; {{ new Date().getFullYear() }} Shotflow. All rights reserved.
        </div>
      </div>
    </footer>

  </div>
</template>
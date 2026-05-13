<script setup>
import { ref } from 'vue'
import { useTheme } from '../theme' 

const { isDark, toggleTheme } = useTheme()

// Info VIXEL CREATIVE (Data Terpusat ngikutin Footer.jsx)
const vixelInfo = {
  company: 'VIXEL CREATIVE',
  desc: 'Studio digital berbasis di Surabaya yang menjembatani logika bisnis (Code) dengan estetika visual (Art).',
  founder: 'Ahmad Wildan Abdillah',
  role: 'Fullstack Creative',
  photo: '/wildan.jpg', // <-- Syarat: taruh foto kamu di folder public/wildan.jpg
  links: [
    { name: 'Website', url: 'https://vixelcreative.my.id', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
    { name: 'Portfolio', url: 'https://portfoliowildan.my.id', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { name: 'Instagram', url: 'https://instagram.com/vixelcreative', icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z' },
    { name: 'GitHub', url: 'https://github.com/amdwildanabdillah', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' }
  ]
}

const imageError = ref(false)
const handleImgError = () => { imageError.value = true }
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
    
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Settings</h2>
        <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Preferensi aplikasi dan informasi developer.</p>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      
      <div class="space-y-6 md:space-y-8">
        
        <div class="rounded-[2rem] p-6 md:p-8 border shadow-sm transition-all bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
          <div class="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-5">
            <div class="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 border border-slate-200/60 dark:border-white/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">App Preferences</h3>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">Dark Mode</p>
              <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-0.5">Ubah tema aplikasi ke gelap.</p>
            </div>
            <button @click="toggleTheme" class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none" :class="isDark ? 'bg-cyan-500' : 'bg-slate-200'">
              <span class="sr-only">Toggle Dark Mode</span>
              <span class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform" :class="isDark ? 'translate-x-6 shadow-md' : 'translate-x-1 shadow-sm'" />
            </button>
          </div>
          
          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
            <div>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">App Version</p>
              <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-0.5">Sistem Shotflow terkini.</p>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-white/10">v2.0.0-beta</span>
          </div>
        </div>

        <div class="rounded-[2rem] p-6 md:p-8 border shadow-sm transition-all bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
          <div class="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-5">
            <div class="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Support & Feedback</h3>
          </div>
          <p class="text-xs font-medium text-slate-500 dark:text-gray-400 mb-5 leading-relaxed">
            Menemukan bug, error, atau punya ide fitur baru untuk Shotflow? Laporkan langsung ke tim developer kami.
          </p>
          <a href="mailto:vixelcreative.id@gmail.com?subject=Shotflow%20Bug%20Report" class="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold hover:scale-[0.98] transition-all shadow-md">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Kirim Feedback via Email
          </a>
        </div>
      </div>

      <div class="rounded-[2rem] p-8 border relative overflow-hidden transition-all bg-[#050505] border-white/10 shadow-2xl h-fit">
        
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <div class="relative z-10 space-y-8 flex flex-col h-full">
          
          <div>
            <h3 class="font-extrabold text-3xl tracking-tighter text-white uppercase">VIXEL CREATIVE<span class="text-cyan-400">.</span></h3>
            <p class="text-gray-400 leading-relaxed text-xs md:text-sm mt-3">{{ vixelInfo.desc }}</p>
          </div>

          <div>
            <span class="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-3 block">Initiated By</span>
            
            <a :href="vixelInfo.links[1].url" target="_blank" class="flex items-center gap-4 group w-full md:w-fit bg-white/5 pr-6 p-1.5 rounded-full border border-white/10 hover:border-cyan-400/50 transition-all">
              <div class="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                <img v-if="!imageError" :src="vixelInfo.photo" @error="handleImgError" class="w-full h-full object-cover">
                <span v-else class="text-cyan-400 font-bold text-sm">AW</span>
              </div>
              
              <div class="py-1">
                <p class="font-bold text-white group-hover:text-cyan-400 transition-colors text-[13px] md:text-sm">{{ vixelInfo.founder }}</p>
                <p class="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5">{{ vixelInfo.role }}</p>
              </div>
            </a>
          </div>

          <div class="pt-6 border-t border-white/10">
            <span class="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-4">Connect with Us</span>
            <div class="grid grid-cols-2 gap-3">
              <a v-for="link in vixelInfo.links" :key="link.name" :href="link.url" target="_blank" class="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group">
                <svg class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" /></svg>
                <span class="font-bold text-[11px] md:text-xs text-gray-300 group-hover:text-white">{{ link.name }}</span>
              </a>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  </div>
</template>
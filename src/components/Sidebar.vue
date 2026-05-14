<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useTheme } from '../theme'

const props = defineProps(['isOpen'])
const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const userName = ref('')
const userEmail = ref('')
const vendorLogo = ref('')
const userInitial = ref('')
const imageError = ref(false)

const vendorPlan = ref('free')
const isAdmin = ref(false)

const adminEmails = [
  'amd.wildanabdillah@gmail.com',
  'vixelcreative.id@gmail.com',
  'lensapictura.graduate@gmail.com'
]

const menuItems = [
  { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/dashboard' },
  { name: 'Pipeline', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', path: '/pipeline' },
  { name: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/calendar' },
  { name: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', path: '/clients' },
  { name: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/invoices' },
  { name: 'Vendor Settings', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', path: '/vendor' },
  { name: 'System Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/settings' },
]

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userName.value = user.displayName || 'User'
      userEmail.value = user.email
      userInitial.value = userName.value.charAt(0).toUpperCase()
      isAdmin.value = adminEmails.includes(user.email)
      
      try {
        const docSnap = await getDoc(doc(db, 'vendors', user.uid))
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.logoUrl) vendorLogo.value = data.logoUrl
          if (data.plan) vendorPlan.value = data.plan
        }
      } catch (error) {
        console.error("Gagal narik logo/plan", error)
      }
    }
  })
})

const handleLogout = async () => {
  await signOut(auth)
  router.push('/login')
}

const handleImageError = () => { imageError.value = true }
</script>

<template>
  <div v-if="isOpen" @click="emit('close')" class="fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

  <aside :class="[
    isOpen ? 'translate-x-0' : '-translate-x-[120%]', 
    'fixed top-4 bottom-4 left-4 w-64 flex flex-col z-50 transition-transform duration-500 md:translate-x-0',
    'bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2rem]',
    'shadow-2xl shadow-slate-200/40 dark:shadow-black/50'
  ]">
    
    <div class="p-6 flex items-center px-7">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-cyan-400 to-blue-500">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
        </svg>
      </div>
      <span class="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">Shotflow</span>
    </div>

    <nav class="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar pb-4">
      <p class="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-2">Main Menu</p>
      <router-link v-for="item in menuItems" :key="item.name" :to="item.path" @click="emit('close')" 
        class="flex items-center px-4 py-3.5 text-[13px] font-medium rounded-2xl transition-all group" 
        :class="[route.path === item.path ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-100 dark:border-cyan-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white']">
        <svg class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" /></svg>
        {{ item.name }}
      </router-link>

      <router-link v-if="isAdmin" to="/admin" @click="emit('close')"
        class="flex items-center px-4 py-3.5 text-[13px] font-medium rounded-2xl transition-all text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 mt-4 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V22m0-19.056c1.057 0 2.086.167 3.051.477a11.956 11.956 0 014.567 2.537" /></svg>
        Admin Console
      </router-link>
    </nav>

    <div class="p-4 mt-auto">
      
      <div v-if="vendorPlan === 'free'" class="mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-cyan-400/20 blur-xl rounded-full group-hover:bg-cyan-400/40 transition-colors"></div>
        <h4 class="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">Studio Pro</h4>
        <p class="text-[10px] font-medium text-slate-500 dark:text-gray-400 mb-3">Unlimited & Fitur Penuh.</p>
        <a href="https://wa.me/6282232053253?text=Halo%20Vixel!%20Saya%20mau%20upgrade%20akun%20Shotflow%20ke%20Pro%20Lifetime.%20Minta%20nomor%20rekeningnya%20dong!" target="_blank" class="block w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold text-center uppercase tracking-widest rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all">
          Upgrade Sekarang
        </a>
      </div>

      <div v-else class="mb-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
        <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Subscription</h4>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase">{{ vendorPlan }} Account</span>
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      <div class="flex items-center justify-between p-2.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/50 dark:border-white/5 transition-colors shadow-sm">
        <div class="flex items-center flex-1 min-w-0">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-700 dark:text-white font-bold text-xs mr-3 shrink-0 shadow-sm border border-white/60 dark:border-white/10 overflow-hidden">
            <img v-if="vendorLogo && !imageError" :src="vendorLogo" @error="handleImageError" class="w-full h-full object-cover" alt="Logo" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0 pr-2">
            <p class="text-[11px] font-semibold text-slate-800 dark:text-white truncate tracking-tight">{{ userName }}</p>
            <p class="text-[9px] text-slate-500 dark:text-gray-400 font-medium truncate">{{ userEmail }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-1 shrink-0">
          <button @click="toggleTheme" class="p-1.5 text-slate-400 hover:text-amber-500 bg-transparent hover:bg-white dark:hover:bg-white/10 rounded-full transition-all" title="Toggle Theme">
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          </button>
          <button @click="handleLogout" class="p-1.5 text-slate-400 hover:text-rose-500 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-all" title="Logout">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
</style>
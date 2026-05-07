<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import Swal from 'sweetalert2'

defineProps({ isOpen: Boolean })
defineEmits(['close'])

const route = useRoute()
const router = useRouter()

// Variabel penampung data Profil Kiri Bawah
const userName = ref('Memuat...')
const userEmail = ref('...')
const userInitial = ref('V')

onMounted(() => {
  // Narik data siapa yang lagi login dari Firebase
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userName.value = user.displayName || 'Vendor Admin'
      userEmail.value = user.email || 'Admin'
      userInitial.value = userName.value.charAt(0).toUpperCase()
    }
  })
})

// Fungsi buat Logout
const handleLogout = async () => {
  try {
    await signOut(auth)
    Swal.fire({ title: 'Logout Berhasil', text: 'Sampai jumpa kembali!', icon: 'success', timer: 1500, showConfirmButton: false })
    router.push('/login')
  } catch (error) {
    Swal.fire('Gagal Logout', error.message, 'error')
  }
}

const menuItems = [
  { name: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Pipeline', path: '/pipeline', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Calendar', path: '/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Clients', path: '/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'Invoices', path: '/invoices', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { name: 'Vendor & Team', path: '/vendor', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
]
</script>

<template>
  <div v-if="isOpen" @click="$emit('close')" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"></div>

  <aside 
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full', 
      'fixed md:fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 md:translate-x-0'
    ]"
  >
    <div class="h-16 flex items-center px-6 border-b border-slate-100">
      <span class="text-xl font-black tracking-tight text-indigo-600">ShotFlow.</span>
    </div>
    
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <RouterLink 
        v-for="item in menuItems" 
        :key="item.name" 
        :to="item.path"
        @click="$emit('close')"
        class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors group"
        :class="[route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900']"
      >
        <svg class="w-5 h-5 mr-3 transition-colors" :class="[route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        {{ item.name }}
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-slate-100">
      <div class="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50 transition-colors">
        <div class="flex items-center flex-1 min-w-0">
          <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs mr-3 shrink-0 shadow-sm">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0 pr-2">
            <p class="text-xs font-bold text-slate-800 truncate">{{ userName }}</p>
            <p class="text-[10px] text-slate-500 font-medium truncate">{{ userEmail }}</p>
          </div>
        </div>
        
        <button @click="handleLogout" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Keluar Akun">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
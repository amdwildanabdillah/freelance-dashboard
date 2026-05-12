<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useTheme } from '../theme'

const { isDark } = useTheme()

const isLoading = ref(true)
const projects = ref([]) 
const openMenuId = ref(null)
const currentUser = ref(null)

const columns = [
  { id: 'lead', title: 'Lead / Pending', desc: 'Menunggu DP' },
  { id: 'dp', title: 'DP / Half', desc: 'Dijadwalkan' },
  { id: 'booked', title: 'Booked / Full', desc: 'Siap Eksekusi' },
  { id: 'editing', title: 'Editing', desc: 'Pasca Produksi' },
  { id: 'delivered', title: 'Delivered', desc: 'Selesai' },
  { id: 'canceled', title: 'Canceled', desc: 'Batal / Refund' }
]

const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD'
  return timeStr
}

// BUKAN BORDER KIRI LAGI, TAPI JADI WARNA PILL / KAPSUL ALA APPLE
const getPackageBadge = (pkgName) => {
  if (!pkgName) return isDark.value ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'
  const name = pkgName.toLowerCase()
  if (name.includes('gold')) return isDark.value ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
  if (name.includes('silver')) return isDark.value ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-50 text-slate-600 border-slate-200'
  if (name.includes('bronze')) return isDark.value ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'
  return isDark.value ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200' // Default Vixel
}

const fetchProjects = async (uid) => {
  if (!uid) return
  isLoading.value = true
  try {
    const q = collection(db, 'vendors', uid, 'projects')
    const querySnapshot = await getDocs(q)
    
    const loadedProjects = []
    querySnapshot.forEach((doc) => {
      loadedProjects.push({ id: doc.id, ...doc.data() })
    })

    projects.value = loadedProjects.map(p => ({
      id: p.id,
      clientName: p.clientName || 'Tanpa Nama',
      university: p.university || '-',
      package: p.package ? p.package.name : 'Belum pilih paket',
      sessionTime: formatTime(p.sessionTime),
      photographer: p.photographer || 'Belum di-assign',
      status: p.status || 'lead',
      date: p.createdAt || new Date()
    }))
    
    projects.value.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    Swal.fire('Gagal Sinkronisasi', 'Tidak dapat memuat data dari Firebase: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      fetchProjects(user.uid)
    }
  })
})

const startDrag = (event, item) => event.dataTransfer.setData('itemID', item.id)

const onDrop = async (event, newStatus) => {
  const itemID = event.dataTransfer.getData('itemID')
  const item = projects.value.find(i => i.id == itemID)
  
  if (item && item.status !== newStatus) {
    const oldStatus = item.status 
    item.status = newStatus 
    
    try {
      const docRef = doc(db, 'vendors', currentUser.value.uid, 'projects', itemID)
      await updateDoc(docRef, { status: newStatus })
    } catch (error) {
      item.status = oldStatus
      Swal.fire('Error Database', 'Gagal memindah status.', 'error')
    }
  }
}
</script>

<template>
  <div class="h-[calc(100vh-100px)] flex flex-col overflow-hidden animate-in fade-in duration-500">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pipeline Board</h2>
        <p class="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">Manage and track your client sessions seamlessly.</p>
      </div>
      <button @click="fetchProjects(currentUser?.uid)" class="w-fit flex items-center bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Sync Board
      </button>
    </div>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>

    <div v-else class="flex-1 flex space-x-6 overflow-x-auto pb-8 pt-2 items-start custom-scrollbar snap-x snap-mandatory touch-pan-x px-2" @click="openMenuId = null">
      
      <div v-for="col in columns" :key="col.id" class="flex-shrink-0 w-[320px] flex flex-col max-h-full" @drop="onDrop($event, col.id)" @dragover.prevent @dragenter.prevent>
        
        <div class="mb-4 px-2 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider">{{ col.title }}</h3>
            <p class="text-[10px] text-slate-500 dark:text-gray-500 font-medium mt-0.5">{{ col.desc }}</p>
          </div>
          <span class="bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] px-3 py-1 rounded-full font-bold">{{ projects.filter(p => p.status === col.id).length }}</span>
        </div>

        <div class="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[2rem] p-3.5 flex-1 overflow-y-auto space-y-3.5 min-h-[200px] shadow-inner">
          
          <div v-if="projects.filter(p => p.status === col.id).length === 0" class="text-center py-12">
            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">No Projects</p>
          </div>

          <div v-for="item in projects.filter(p => p.status === col.id)" :key="item.id" draggable="true" @dragstart="startDrag($event, item)" 
               class="bg-white dark:bg-[#111]/80 dark:backdrop-blur-md p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60 dark:border-white/10 cursor-grab active:cursor-grabbing transition-all group relative hover:shadow-md hover:border-cyan-500/30 dark:hover:border-cyan-400/30">
            
            <button @click.stop="openMenuId = openMenuId === item.id ? null : item.id" class="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
            
            <div v-if="openMenuId === item.id" class="absolute top-11 right-4 w-36 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/10 py-1.5 z-20">
              <RouterLink :to="`/project/${item.id}`" class="flex items-center w-full px-4 py-2 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <svg class="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                Edit / Detail
              </RouterLink>
            </div>

            <h4 class="font-semibold text-slate-900 dark:text-white text-sm leading-tight pr-8 mb-1">{{ item.clientName }}</h4>
            <p class="text-[10px] text-slate-500 dark:text-gray-400 font-medium mb-4">{{ item.university }}</p>

            <div class="space-y-2.5 mb-4">
              <div class="flex items-center">
                <span class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border" :class="getPackageBadge(item.package)">
                  {{ item.package }}
                </span>
              </div>
              
              <div class="flex items-center text-[10px] font-medium text-slate-600 dark:text-slate-300">
                <svg class="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Time: <span class="ml-1 text-slate-900 dark:text-white font-semibold">{{ item.sessionTime }}</span>
              </div>
              
              <div class="flex items-center text-[10px] font-medium text-slate-600 dark:text-slate-300">
                <svg class="w-3.5 h-3.5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                FG: <span class="ml-1 font-semibold" :class="item.photographer === 'Belum di-assign' ? 'text-rose-500' : 'text-slate-900 dark:text-white'">{{ item.photographer }}</span>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
              <RouterLink :to="`/project/${item.id}`" class="text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-full transition-all flex items-center">
                Open <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar sangat tipis dan subtle ala Mac */
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #cbd5e1; 
  border-radius: 10px; 
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #334155; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: #94a3b8; 
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: #475569; 
}
</style>
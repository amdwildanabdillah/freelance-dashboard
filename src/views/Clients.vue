<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useTheme } from '../theme'

const { isDark } = useTheme()

const isLoading = ref(true)
const projects = ref([])
const searchQuery = ref('')
const currentUser = ref(null)

// AMBIL DATA DARI FIREBASE BUKAN GOOGLE SCRIPT LAGI
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

    projects.value = loadedProjects.map(p => {
      // Prioritas ambil tanggal
      let shootDateDisplay = 'TBD'
      const targetDate = p.date || p.shootDate || p.createdAt
      if (targetDate) {
        const d = new Date(targetDate)
        if (!isNaN(d)) {
          shootDateDisplay = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        }
      }

      return {
        id: p.id,
        clientName: p.clientName || 'Tanpa Nama',
        university: p.university || '-',
        package: p.package?.name || p.package || '-',
        shootDate: shootDateDisplay,
        sessionTime: p.sessionTime || 'TBD',
        status: p.status || 'lead',
        
        // Link deliverables (kalau struktur objectnya beda, sesuaikan ya bos)
        linkMaster: p.links?.master || p.linkMaster || '',
        linkRaw: p.links?.raw || p.linkRaw || '',
        linkFinal: p.links?.final || p.linkFinal || '',
        linkCanva: p.links?.canva || p.linkCanva || ''
      }
    })
    
    // Reverse biar terbaru di atas
    projects.value.sort((a, b) => new Date(b.shootDate) - new Date(a.shootDate)).reverse()

  } catch (error) {
    Swal.fire('Gagal Sync', 'Gagal menarik data klien dari Firebase.', 'error')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      fetchProjects(user.uid)
    } else {
      isLoading.value = false
    }
  })
})

const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(p => 
    p.clientName.toLowerCase().includes(query) || 
    p.id.toLowerCase().includes(query) ||
    p.university.toLowerCase().includes(query)
  )
})

const getStatusBadge = (status) => {
  const isD = isDark.value
  const styles = {
    'lead': { text: 'LEAD', class: isD ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200' },
    'dp': { text: 'DP / HALF', class: isD ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200' },
    'booked': { text: 'BOOKED', class: isD ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    'editing': { text: 'EDITING', class: isD ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200' },
    'delivered': { text: 'DELIVERED', class: isD ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    'canceled': { text: 'CANCELED', class: isD ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200' }
  }
  return styles[status] || styles['lead']
}
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Master Clients</h2>
        <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Overview semua project dan akses cepat link file deliverables.</p>
      </div>
      
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative w-full md:w-72">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input type="text" v-model="searchQuery" placeholder="Cari nama, ID, kampus..." 
                 class="block w-full pl-10 pr-4 py-2.5 border rounded-full text-sm font-medium outline-none transition-all shadow-sm"
                 :class="isDark ? 'bg-[#1a1a1a] border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10'">
        </div>

        <button @click="fetchProjects(currentUser?.uid)" class="p-2.5 rounded-full border transition-all shadow-sm flex items-center justify-center shrink-0" :class="isDark ? 'bg-[#1a1a1a] border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
          <svg :class="{'animate-spin': isLoading}" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>
      
    <div v-else>
      <div v-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-4 rounded-[2rem] border border-dashed border-slate-300 dark:border-white/20">
        <svg class="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        <h3 class="font-bold text-lg text-slate-800 dark:text-white">Tidak ada data</h3>
        <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">Coba kata kunci pencarian yang lain.</p>
      </div>

      <div class="md:hidden space-y-4">
        <div v-for="p in filteredProjects" :key="p.id" class="bg-white dark:bg-[#111] p-5 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/10 relative">
          
          <div class="flex justify-between items-start mb-3">
            <div>
              <p class="text-[9px] font-mono text-cyan-500 mb-1">ID: {{ p.id.substring(0,6) }}</p>
              <h4 class="text-base font-bold text-slate-900 dark:text-white leading-tight">{{ p.clientName }}</h4>
              <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-0.5">{{ p.university }}</p>
            </div>
            <span class="inline-flex px-2 py-1 text-[9px] font-bold border rounded-full uppercase tracking-wider" :class="getStatusBadge(p.status).class">
              {{ getStatusBadge(p.status).text }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
            <div>
              <p class="text-[9px] text-slate-400 dark:text-gray-500 font-semibold mb-0.5">Jadwal</p>
              <p class="text-[11px] font-bold text-slate-700 dark:text-gray-300">{{ p.shootDate }}</p>
              <p class="text-[10px] font-medium text-slate-500">{{ p.sessionTime }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-400 dark:text-gray-500 font-semibold mb-0.5">Paket</p>
              <p class="text-[11px] font-bold text-slate-700 dark:text-gray-300">{{ p.package }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
            <div class="flex items-center gap-2">
              <a v-if="p.linkMaster" :href="p.linkMaster" target="_blank" class="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 flex items-center justify-center"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></a>
              <a v-if="p.linkRaw" :href="p.linkRaw" target="_blank" class="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></a>
              <a v-if="p.linkFinal" :href="p.linkFinal" target="_blank" class="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></a>
              <a v-if="p.linkCanva" :href="p.linkCanva" target="_blank" class="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></a>
            </div>
            
            <RouterLink :to="`/project/${p.id}`" class="px-4 py-2 rounded-full text-[10px] font-bold transition-colors text-white bg-slate-900 dark:bg-white dark:text-black">
              Detail &rarr;
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="hidden md:block bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 rounded-[2rem] shadow-sm overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="min-w-full text-left">
            <thead class="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th scope="col" class="py-5 pl-8 pr-3 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">ID & Klien</th>
                <th scope="col" class="px-3 py-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Jadwal Sesi</th>
                <th scope="col" class="px-3 py-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Paket</th>
                <th scope="col" class="px-3 py-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Links (Drive/Canva)</th>
                <th scope="col" class="px-3 py-5 text-center text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th scope="col" class="relative py-5 pl-3 pr-8"><span class="sr-only">Aksi</span></th>
              </tr>
            </thead>
            
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              <tr v-for="p in filteredProjects" :key="p.id" class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                
                <td class="whitespace-nowrap py-4 pl-8 pr-3">
                  <div class="flex items-center">
                    <div class="h-10 w-10 shrink-0 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold uppercase border border-cyan-100 dark:border-cyan-500/20">
                      {{ p.clientName.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{{ p.clientName }}</div>
                      <div class="text-[10px] font-medium text-slate-500 dark:text-gray-400 mt-0.5">ID: {{ p.id.substring(0,6) }} • {{ p.university }}</div>
                    </div>
                  </div>
                </td>
                
                <td class="whitespace-nowrap px-3 py-4">
                  <div class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ p.shootDate }}</div>
                  <div class="text-[10px] font-medium text-slate-400 dark:text-gray-500 mt-0.5">{{ p.sessionTime }} WIB</div>
                </td>
                
                <td class="whitespace-nowrap px-3 py-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-100 dark:border-white/10">
                    <svg class="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    {{ p.package }}
                  </span>
                </td>
                
                <td class="whitespace-nowrap px-3 py-4">
                  <div class="flex items-center gap-2">
                    <a :href="p.linkMaster || '#'" target="_blank" title="Master Folder" class="w-8 h-8 rounded-full flex items-center justify-center transition-all" :class="p.linkMaster ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 hover:scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 pointer-events-none'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </a>
                    <a :href="p.linkRaw || '#'" target="_blank" title="RAW Backup" class="w-8 h-8 rounded-full flex items-center justify-center transition-all" :class="p.linkRaw ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 pointer-events-none'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </a>
                    <a :href="p.linkFinal || '#'" target="_blank" title="Final Edit" class="w-8 h-8 rounded-full flex items-center justify-center transition-all" :class="p.linkFinal ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 pointer-events-none'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </a>
                    <a :href="p.linkCanva || '#'" target="_blank" title="Canva Design" class="w-8 h-8 rounded-full flex items-center justify-center transition-all" :class="p.linkCanva ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 hover:scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 pointer-events-none'">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    </a>
                  </div>
                </td>

                <td class="whitespace-nowrap px-3 py-4 text-center">
                  <span class="inline-flex px-2.5 py-1 text-[9px] font-bold border rounded-full tracking-wider" :class="getStatusBadge(p.status).class">
                    {{ getStatusBadge(p.status).text }}
                  </span>
                </td>
                
                <td class="whitespace-nowrap py-4 pl-3 pr-8 text-right">
                  <RouterLink :to="`/project/${p.id}`" class="text-cyan-600 dark:text-cyan-400 font-bold text-xs bg-cyan-50 dark:bg-cyan-500/10 px-4 py-2 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors inline-flex items-center">
                    Detail <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px;}
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
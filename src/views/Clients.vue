<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const projects = ref([])
const searchQuery = ref('')

// WAJIB GANTI PAKE URL DEPLOY TERBARUMU!
const API_URL = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"

const fetchProjects = async () => {
  isLoading.value = true
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'GET_PROJECTS' })
    })
    const result = await response.json()
    if (result.status === 'success') {
      projects.value = result.data.map(p => ({
        id: p.ID,
        clientName: p.Client_Name || 'Tanpa Nama',
        university: p.University || '-',
        package: p.Package || '-',
        shootDate: p.Shoot_Date ? new Date(p.Shoot_Date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD',
        sessionTime: formatTime(p.Session_Time),
        status: p.Status || 'lead',
        // Tarik semua link buat Quick Access
        linkMaster: p.Link_Master || '',
        linkRaw: p.Link_RAW || '',
        linkFinal: p.Link_Final || '',
        linkCanva: p.Link_Canva || ''
      })).reverse() // Di-reverse biar project terbaru ada di atas
    }
  } catch (error) {
    Swal.fire('Gagal Sync', 'Gagal menarik data klien.', 'error')
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD'
  const str = String(timeStr)
  if (str.includes('1899') || str.includes('T')) {
    try { return new Date(str).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } catch(e) { return str }
  }
  return str
}

// Fitur Pencarian Real-time
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(p => 
    p.clientName.toLowerCase().includes(query) || 
    p.id.toLowerCase().includes(query) ||
    p.university.toLowerCase().includes(query)
  )
})

// Bikin warna badge status jadi dinamis
const getStatusBadge = (status) => {
  const styles = {
    'lead': { text: 'LEAD', class: 'bg-slate-100 text-slate-600 border-slate-200' },
    'dp': { text: 'DP / HALF', class: 'bg-blue-50 text-blue-600 border-blue-200' },
    'booked': { text: 'BOOKED', class: 'bg-amber-50 text-amber-600 border-amber-200' },
    'editing': { text: 'EDITING', class: 'bg-purple-50 text-purple-600 border-purple-200' },
    'delivered': { text: 'DELIVERED', class: 'bg-green-50 text-green-600 border-green-200' },
    'canceled': { text: 'CANCELED', class: 'bg-red-50 text-red-600 border-red-200' }
  }
  return styles[status] || styles['lead']
}

onMounted(() => fetchProjects())
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    
    <!-- Header & Search Bar -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Master Clients</h2>
        <p class="text-slate-500 text-sm mt-1">Overview semua project, paket, dan akses cepat link file deliverables.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Kotak Pencarian -->
        <div class="relative w-full md:w-64">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input type="text" v-model="searchQuery" placeholder="Cari nama, ID, kampus..." class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm">
        </div>

        <button @click="fetchProjects" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center h-[38px] w-[38px]">
          <svg :class="{'animate-spin': isLoading}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>
    </div>

    <!-- Tabel Master -->
    <div class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
      
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      
      <div v-else class="overflow-x-auto touch-pan-x custom-scrollbar">
        <table class="min-w-full divide-y divide-slate-100">
          <thead class="bg-slate-50/80">
            <tr>
              <th scope="col" class="py-4 pl-6 pr-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">ID & Klien</th>
              <th scope="col" class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Jadwal Sesi</th>
              <th scope="col" class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Paket</th>
              <th scope="col" class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Quick Links (Drive/Canva)</th>
              <th scope="col" class="px-3 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
              <th scope="col" class="relative py-4 pl-3 pr-6"><span class="sr-only">Aksi</span></th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-slate-50 bg-white">
            <tr v-if="filteredProjects.length === 0">
              <td colspan="6" class="text-center py-12 text-sm text-slate-400 font-bold">Tidak ada klien yang cocok dengan pencarian.</td>
            </tr>
            
            <tr v-for="p in filteredProjects" :key="p.id" class="hover:bg-slate-50/50 transition-colors group">
              <!-- Info Klien -->
              <td class="whitespace-nowrap py-4 pl-6 pr-3">
                <div class="flex items-center">
                  <div class="h-10 w-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold uppercase border border-indigo-100">
                    {{ p.clientName.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <div class="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{{ p.clientName }}</div>
                    <div class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{{ p.id }} • {{ p.university }}</div>
                  </div>
                </div>
              </td>
              
              <!-- Jadwal -->
              <td class="whitespace-nowrap px-3 py-4">
                <div class="text-sm font-semibold text-slate-700">{{ p.shootDate }}</div>
                <div class="text-[10px] font-bold text-slate-400 mt-0.5">{{ p.sessionTime }} WIB</div>
              </td>
              
              <!-- Paket -->
              <td class="whitespace-nowrap px-3 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                  <svg class="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  {{ p.package }}
                </span>
              </td>
              
              <!-- Deretan Quick Links Sakti -->
              <td class="whitespace-nowrap px-3 py-4">
                <div class="flex items-center gap-1.5">
                  <a :href="p.linkMaster || '#'" target="_blank" title="Master Folder" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" :class="p.linkMaster ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-slate-50 text-slate-300 pointer-events-none'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  </a>
                  <a :href="p.linkRaw || '#'" target="_blank" title="RAW Backup" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" :class="p.linkRaw ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 pointer-events-none'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </a>
                  <a :href="p.linkFinal || '#'" target="_blank" title="Final Edit" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" :class="p.linkFinal ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-slate-50 text-slate-300 pointer-events-none'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </a>
                  <a :href="p.linkCanva || '#'" target="_blank" title="Canva Design" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" :class="p.linkCanva ? 'bg-purple-50 text-purple-500 hover:bg-purple-100' : 'bg-slate-50 text-slate-300 pointer-events-none'">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </a>
                </div>
              </td>

              <!-- Status -->
              <td class="whitespace-nowrap px-3 py-4 text-center">
                <span class="inline-flex px-2.5 py-1 text-[10px] font-bold border rounded-md" :class="getStatusBadge(p.status).class">
                  {{ getStatusBadge(p.status).text }}
                </span>
              </td>
              
              <!-- Detail Button -->
              <td class="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                <RouterLink :to="`/project/${p.id}`" class="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Detail &rarr;</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px;}
.custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
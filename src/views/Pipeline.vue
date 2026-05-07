<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const projects = ref([]) 
const openMenuId = ref(null)

const columns = [
  { id: 'lead', title: 'Lead / Pending', desc: 'Menunggu Konfirmasi DP' },
  { id: 'dp', title: 'DP / Half', desc: 'Terkonfirmasi & Dijadwalkan' },
  { id: 'booked', title: 'Booked / Full', desc: 'Siap Eksekusi' },
  { id: 'editing', title: 'Editing', desc: 'Proses Pasca Produksi' },
  { id: 'delivered', title: 'Delivered', desc: 'Project Selesai' },
  { id: 'canceled', title: 'Canceled', desc: 'Batal / Refund' }
]

const API_URL = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"

const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD'
  const str = String(timeStr)
  if (str.includes('1899') || str.includes('T')) {
    try {
      const d = new Date(str)
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } catch(e) { return str }
  }
  return str
}

// LOGIKA HIGHLIGHT WARNA PAKET
const getPackageColor = (pkgName) => {
  if (!pkgName) return 'border-l-slate-200'
  const name = pkgName.toLowerCase()
  if (name.includes('gold')) return 'border-l-[6px] border-l-amber-400'
  if (name.includes('silver')) return 'border-l-[6px] border-l-slate-400'
  if (name.includes('bronze')) return 'border-l-[6px] border-l-orange-400'
  return 'border-l-[6px] border-l-indigo-400' // Default
}

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
        whatsapp: p.WhatsApp || '',
        package: p.Package || 'Belum pilih paket',
        sessionTime: formatTime(p.Session_Time),
        photographer: p.Photographer_ID || 'Belum di-assign',
        status: p.Status || 'lead',
      }))
    }
  } catch (error) {
    console.error("Detail Error API Pipeline:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => fetchProjects())

const startDrag = (event, item) => event.dataTransfer.setData('itemID', item.id)

const onDrop = async (event, newStatus) => {
  const itemID = event.dataTransfer.getData('itemID')
  const item = projects.value.find(i => i.id == itemID)
  if (item && item.status !== newStatus) {
    const oldStatus = item.status 
    item.status = newStatus 
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPDATE_STATUS', projectId: itemID, newStatus: newStatus })
      })
    } catch (error) {
      item.status = oldStatus
      Swal.fire('Error Jaringan', 'Gagal menyambung ke server.', 'error')
    }
  }
}
</script>

<template>
  <div class="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
    <div class="flex items-center justify-between mb-6 px-2">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Pipeline Management</h2>
        <p class="text-slate-500 text-sm">Track progress klien dari pendaftaran sampai serah terima file.</p>
      </div>
      <button @click="fetchProjects" class="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Sync Data
      </button>
    </div>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- Kanban Board -->
    <div v-else class="flex-1 flex space-x-6 overflow-x-auto pb-6 pt-2 items-start custom-scrollbar snap-x snap-mandatory touch-pan-x" @click="openMenuId = null">
      <div v-for="col in columns" :key="col.id" class="flex-shrink-0 w-80 flex flex-col max-h-full" @drop="onDrop($event, col.id)" @dragover.prevent @dragenter.prevent>
        
        <div class="mb-4 px-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest">{{ col.title }}</h3>
            <span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{{ projects.filter(p => p.status === col.id).length }}</span>
          </div>
        </div>

        <div class="bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-3xl p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
          <div v-if="projects.filter(p => p.status === col.id).length === 0" class="text-center py-8">
            <p class="text-xs font-bold text-slate-300">Kosong</p>
          </div>

          <!-- KARTU PROJECT (Sekarang ada fungsi warnanya!) -->
          <div v-for="item in projects.filter(p => p.status === col.id)" :key="item.id" draggable="true" @dragstart="startDrag($event, item)" 
               class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-all group relative"
               :class="getPackageColor(item.package)">
            
            <button @click.stop="openMenuId = openMenuId === item.id ? null : item.id" class="absolute top-3 right-3 text-slate-300 hover:text-slate-600 p-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
            <div v-if="openMenuId === item.id" class="absolute top-9 right-4 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20">
              <RouterLink :to="`/project/${item.id}`" class="block w-full px-4 py-1.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600">✏️ Edit / Detail</RouterLink>
            </div>

            <h4 class="font-bold text-slate-800 text-sm leading-tight pr-6 mb-1">{{ item.clientName }}</h4>
            <p class="text-[10px] text-slate-500 font-medium mb-3">{{ item.university }}</p>

            <div class="bg-slate-50 rounded-xl p-2.5 mb-3 space-y-2">
              <div class="flex items-center text-[10px] font-bold text-slate-600">
                <svg class="w-3.5 h-3.5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span class="truncate">{{ item.package }}</span>
              </div>
              <div class="flex items-center text-[10px] font-bold text-slate-600">
                <svg class="w-3.5 h-3.5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Jam: {{ item.sessionTime }}
              </div>
              <div class="flex items-center text-[10px] font-bold text-slate-600">
                <svg class="w-3.5 h-3.5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                FG: <span :class="item.photographer === 'Belum di-assign' ? 'text-red-400 ml-1' : 'text-indigo-600 ml-1'">{{ item.photographer }}</span>
              </div>
            </div>

            <div class="flex items-center justify-end pt-1">
              <RouterLink :to="`/project/${item.id}`" class="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md transition-colors">Detail &rarr;</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #f1f5f9; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
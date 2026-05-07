<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const projects = ref([])
const activeTab = ref('schedule') 
const viewMode = ref('grid') // 'timeline' atau 'grid'

// State buat Kalender Grid
const currentDate = ref(new Date())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const dayNames = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

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
      projects.value = result.data.map(p => {
        // Ambil YYYY-MM-DD buat logic Calendar Grid
        let rawStr = ''
        if (p.Shoot_Date) {
          const d = new Date(p.Shoot_Date)
          if (!isNaN(d)) rawStr = d.toISOString().split('T')[0]
        }
        
        return {
          id: p.ID,
          clientName: p.Client_Name || 'Tanpa Nama',
          university: p.University || '-',
          package: p.Package || 'Belum pilih paket',
          rawDate: rawStr,
          shootDate: formatDateForDisplay(p.Shoot_Date),
          sessionTime: formatTime(p.Session_Time),
          location: p.Location || 'Belum diatur',
          whatsapp: p.WhatsApp || '',
          photographer: p.Photographer_ID || 'Belum di-assign',
          status: p.Status || 'lead',
        }
      })
    }
  } catch (error) {
    Swal.fire('Gagal Sync', 'Gagal menarik data jadwal.', 'error')
  } finally {
    isLoading.value = false
  }
}

// FORMATTER JAM & TANGGAL
const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD'
  const str = String(timeStr)
  if (str.includes('1899') || str.includes('T')) {
    try { return new Date(str).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } catch(e) { return str }
  }
  return str
}

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'Tanggal Belum Diatur'
  const d = new Date(dateStr)
  if (isNaN(d)) return 'Invalid Date'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

const getPackageColor = (pkgName) => {
  if (!pkgName) return 'bg-slate-100 text-slate-600 border-slate-200'
  const name = pkgName.toLowerCase()
  if (name.includes('gold')) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (name.includes('silver')) return 'bg-slate-100 text-slate-700 border-slate-300'
  if (name.includes('bronze')) return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-indigo-50 text-indigo-700 border-indigo-200' // Default
}

// -------------------------------------------------------------
// LOGIKA KALENDER GRID
// -------------------------------------------------------------
const nextMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1) }
const prevMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1) }

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  // Slot kosong di awal bulan
  for (let i = 0; i < firstDay; i++) {
    days.push({ empty: true })
  }
  
  // Tanggal asli
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    
    // Cari project yang tanggalnya sama dan belum selesai/batal
    const dayProjects = projects.value.filter(p => p.rawDate === dateStr && !['delivered', 'canceled'].includes(p.status))
    
    days.push({ 
      empty: false, 
      date: i, 
      fullDate: dateStr, 
      projects: dayProjects,
      isToday: dateStr === new Date().toISOString().split('T')[0]
    })
  }
  return days
})

// -------------------------------------------------------------
// LOGIKA TIMELINE (List View)
// -------------------------------------------------------------
const upcomingShoots = computed(() => {
  let active = projects.value.filter(p => !['delivered', 'canceled'].includes(p.status) && p.rawDate)
  active.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
  
  const grouped = {}
  active.forEach(p => {
    if(!grouped[p.shootDate]) grouped[p.shootDate] = []
    grouped[p.shootDate].push(p)
  })

  return Object.keys(grouped).map(dateStr => ({
    date: dateStr,
    sessions: grouped[dateStr]
  }))
})

const editingDeadlines = computed(() => projects.value.filter(p => p.status === 'editing'))

onMounted(() => fetchProjects())
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-12">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Calendar & Schedule</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau jadwal sesi foto wisuda dan deadline editing tim kamu.</p>
      </div>
      <div class="flex gap-2">
        <button @click="fetchProjects" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center">
          <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Sync Data
        </button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="border-b border-slate-200 overflow-x-auto">
      <nav class="-mb-px flex space-x-8 min-w-max px-1">
        <button @click="activeTab = 'schedule'" :class="[activeTab === 'schedule' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300', 'whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors']">
          Jadwal Sesi Foto
        </button>
        <button @click="activeTab = 'deadlines'" :class="[activeTab === 'deadlines' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300', 'whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2']">
          Deadline Editing
          <span class="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold">{{ editingDeadlines.length }}</span>
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else>
      <!-- ========================================== -->
      <!-- TAB 1: JADWAL SESI FOTO (GRID & TIMELINE)  -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'schedule'" class="space-y-6">
        
        <!-- Toggle View Mode & Bulan Navigasi -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          
          <!-- Tombol Kiri-Kanan Bulan (Cuma muncul di mode Grid) -->
          <div v-if="viewMode === 'grid'" class="flex items-center gap-4">
            <button @click="prevMonth" class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 class="text-lg font-black text-slate-800 w-36 text-center">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div v-else class="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Timeline View</div>

          <!-- Switch Mode -->
          <div class="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Grid
            </button>
            <button @click="viewMode = 'timeline'" :class="viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Timeline
            </button>
          </div>
        </div>

        <!-- MODE 1: GRID KALENDER -->
        <div v-if="viewMode === 'grid'" class="overflow-x-auto touch-pan-x pb-4">
          <div class="min-w-[750px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <!-- Header Hari -->
            <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              <div v-for="day in dayNames" :key="day" class="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 last:border-r-0">
                {{ day }}
              </div>
            </div>
            
            <!-- Kotak Tanggal -->
            <div class="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
              <div v-for="(day, index) in calendarDays" :key="index" class="min-h-[120px] bg-white p-2 flex flex-col hover:bg-slate-50 transition-colors">
                <!-- Tanggal Angka -->
                <div v-if="!day.empty" class="text-right mb-2">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" 
                        :class="day.isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'">
                    {{ day.date }}
                  </span>
                </div>
                
                <!-- List Klien di Tanggal tsb -->
                <div v-if="!day.empty" class="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 max-h-[100px]">
                  <RouterLink v-for="p in day.projects" :key="p.id" :to="`/project/${p.id}`" 
                              class="block p-1.5 rounded-lg border text-left hover:opacity-80 transition-opacity"
                              :class="getPackageColor(p.package)">
                    <div class="text-[9px] font-black truncate leading-tight">{{ p.clientName }}</div>
                    <div class="text-[8px] font-semibold opacity-80 mt-0.5">{{ p.sessionTime }} • {{ p.photographer }}</div>
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODE 2: TIMELINE (Kaya kemaren) -->
        <div v-if="viewMode === 'timeline'" class="space-y-8 animate-fade-in">
          <div v-if="upcomingShoots.length === 0" class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p class="text-slate-400 font-bold">Belum ada jadwal pemotretan aktif.</p>
          </div>

          <div v-for="day in upcomingShoots" :key="day.date" class="relative">
            <div class="sticky top-0 z-10 bg-[#f8fafc]/90 backdrop-blur-sm py-2 mb-4 rounded-xl px-2">
              <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center">
                <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {{ day.date }}
              </h3>
            </div>
            
            <div class="space-y-3 px-2">
              <RouterLink v-for="session in day.sessions" :key="session.id" :to="`/project/${session.id}`"
                   class="block bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <!-- Jam -->
                  <div class="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 sm:w-28 flex-shrink-0 text-center">
                    <p class="text-lg font-black text-slate-800">{{ session.sessionTime }}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">WIB</p>
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{{ session.clientName }}</h4>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md" :class="getPackageColor(session.package)">{{ session.package }}</span>
                      <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md truncate max-w-[150px]">📍 {{ session.university }}</span>
                      <span class="text-[10px] font-bold border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">📸 {{ session.photographer }}</span>
                    </div>
                  </div>
                  <div class="hidden sm:flex text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================== -->
      <!-- TAB 2: DEADLINE EDITING                    -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'deadlines'" class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        <div class="overflow-x-auto touch-pan-x custom-scrollbar">
          <div v-if="editingDeadlines.length === 0" class="text-center py-16 min-w-[600px]">
            <p class="text-slate-400 font-bold">Yeay! Tidak ada antrean editing saat ini.</p>
          </div>
          <table v-else class="min-w-[600px] w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/50">
              <tr>
                <th class="py-4 pl-6 pr-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klien</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fakultas</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fotografer</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="task in editingDeadlines" :key="task.id" class="hover:bg-slate-50 transition-colors">
                <td class="py-4 pl-6 pr-3">
                  <p class="text-sm font-bold text-slate-800">{{ task.clientName }}</p>
                  <p class="text-[10px] font-mono text-slate-400">{{ task.id }}</p>
                </td>
                <td class="px-3 py-4 text-xs text-slate-600 font-semibold">{{ task.university }}</td>
                <td class="px-3 py-4 text-xs text-slate-600 font-semibold">📸 {{ task.photographer }}</td>
                <td class="px-3 py-4">
                  <RouterLink :to="`/project/${task.id}`" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors inline-block uppercase tracking-wider">
                    Kerjakan &rarr;
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
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px;}
.custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
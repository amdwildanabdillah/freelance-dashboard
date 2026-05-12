<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const applyGlobalTheme = () => {
  if (isDarkMode.value) { document.body.style.backgroundColor = '#0a0a0a'; document.body.style.color = '#ffffff' }
  else { document.body.style.backgroundColor = '#f8fafc'; document.body.style.color = '#0f172a' }
}
applyGlobalTheme()
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
  <div class="min-h-screen w-full transition-colors duration-500" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
    <div class="max-w-6xl mx-auto p-6 md:p-10 space-y-6">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black uppercase tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Calendar & Schedule</h2>
        <p class="text-sm mt-1 font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Pantau jadwal sesi foto wisuda dan deadline editing tim kamu.</p>
      </div>
      <div class="flex gap-2">
        <button @click="fetchProjects" class="px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm transition-all flex items-center border border-slate-200" :class="isDarkMode ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white text-slate-900 hover:bg-slate-50'">
          <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="border-b overflow-x-auto transition-colors" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
      <nav class="-mb-px flex space-x-8 min-w-max px-1">
        <button @click="activeTab = 'schedule'" :class="[activeTab === 'schedule' ? (isDarkMode ? 'border-cyan-400 text-cyan-400' : 'border-indigo-500 text-indigo-600') : (isDarkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-white/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'), 'whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors']">
          Jadwal Sesi Foto
        </button>
        <button @click="activeTab = 'deadlines'" :class="[activeTab === 'deadlines' ? (isDarkMode ? 'border-cyan-400 text-cyan-400' : 'border-indigo-500 text-indigo-600') : (isDarkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-white/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'), 'whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2']">
          Deadline Editing
          <span class="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold">{{ editingDeadlines.length }}</span>
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" :class="isDarkMode ? 'border-cyan-500' : 'border-slate-900'"></div>
    </div>

    <div v-else>
      <!-- ========================================== -->
      <!-- TAB 1: JADWAL SESI FOTO (GRID & TIMELINE)  -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'schedule'" class="space-y-6">
        
        <!-- Toggle View Mode & Bulan Navigasi -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
          
          <!-- Tombol Kiri-Kanan Bulan (Cuma muncul di mode Grid) -->
          <div v-if="viewMode === 'grid'" class="flex items-center gap-4">
            <button @click="prevMonth" class="p-2 rounded-lg transition-colors" :class="isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 class="text-lg font-black w-36 text-center" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="p-2 rounded-lg transition-colors" :class="isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div v-else class="text-sm font-bold uppercase tracking-widest pl-2" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Timeline View</div>

          <!-- Switch Mode -->
          <div class="flex p-1 rounded-xl w-full sm:w-auto" :class="isDarkMode ? 'bg-black/30' : 'bg-slate-100'">
            <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? (isDarkMode ? 'bg-[#1a1a1a] text-cyan-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')" class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Grid
            </button>
            <button @click="viewMode = 'timeline'" :class="viewMode === 'timeline' ? (isDarkMode ? 'bg-[#1a1a1a] text-cyan-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')" class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Timeline
            </button>
          </div>
        </div>

        <!-- MODE 1: GRID KALENDER -->
        <div v-if="viewMode === 'grid'" class="overflow-x-auto touch-pan-x pb-4">
          <div class="min-w-[750px] rounded-2xl border overflow-hidden shadow-sm transition-colors" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'">
            <!-- Header Hari -->
            <div class="grid grid-cols-7 border-b" :class="isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'">
              <div v-for="day in dayNames" :key="day" class="py-3 text-center text-[10px] font-black uppercase tracking-widest border-r last:border-r-0" :class="isDarkMode ? 'text-gray-500 border-white/10' : 'text-slate-400 border-slate-200'">
                {{ day }}
              </div>
            </div>
            
            <!-- Kotak Tanggal -->
            <div class="grid grid-cols-7 gap-px border-b" :class="isDarkMode ? 'bg-white/10 border-white/10' : 'bg-slate-200 border-slate-200'">
              <div v-for="(day, index) in calendarDays" :key="index" class="min-h-[120px] p-2 flex flex-col transition-colors" :class="isDarkMode ? 'bg-[#1a1a1a] hover:bg-white/5' : 'bg-white hover:bg-slate-50'">
                <!-- Tanggal Angka -->
                <div v-if="!day.empty" class="text-right mb-2">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" 
                        :class="day.isToday ? (isDarkMode ? 'bg-cyan-500 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md') : (isDarkMode ? 'text-gray-500' : 'text-slate-500')">
                    {{ day.date }}
                  </span>
                </div>
                
                <!-- List Klien di Tanggal tsb -->
                <div v-if="!day.empty" class="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 max-h-[100px]">
                  <RouterLink v-for="p in day.projects" :key="p.id" :to="`/project/${p.id}`" 
                              class="block p-1.5 rounded-lg border text-left hover:opacity-80 transition-opacity"
                              :class="isDarkMode ? 'bg-white/10 border-white/20 text-gray-300' : getPackageColor(p.package)">
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
          <div v-if="upcomingShoots.length === 0" class="text-center py-12 rounded-3xl border border-dashed" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/20' : 'bg-white border-slate-200'">
            <p class="font-bold" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Belum ada jadwal pemotretan aktif.</p>
          </div>

          <div v-for="day in upcomingShoots" :key="day.date" class="relative">
            <div class="sticky top-0 z-10 backdrop-blur-sm py-2 mb-4 rounded-xl px-2" :class="isDarkMode ? 'bg-[#0a0a0a]/90' : 'bg-[#f8fafc]/90'">
              <h3 class="text-sm font-bold uppercase tracking-widest flex items-center" :class="isDarkMode ? 'text-white' : 'text-slate-700'">
                <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {{ day.date }}
              </h3>
            </div>
            
            <div class="space-y-3 px-2">
              <RouterLink v-for="session in day.sessions" :key="session.id" :to="`/project/${session.id}`"
                   class="block rounded-2xl p-4 border shadow-sm transition-all group" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <!-- Jam -->
                  <div class="px-4 py-2.5 rounded-xl border sm:w-28 flex-shrink-0 text-center" :class="isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-100'">
                    <p class="text-lg font-black" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ session.sessionTime }}</p>
                    <p class="text-[9px] font-bold uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">WIB</p>
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-bold transition-colors truncate" :class="isDarkMode ? 'text-white group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-indigo-600'">{{ session.clientName }}</h4>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md" :class="isDarkMode ? 'bg-white/10 text-gray-300' : getPackageColor(session.package)">{{ session.package }}</span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[150px]" :class="isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600'">{{ session.university }}</span>
                      <span class="text-[10px] font-bold border px-2 py-0.5 rounded-md" :class="isDarkMode ? 'border-white/20 text-gray-400' : 'border-slate-200 text-slate-600'">{{ session.photographer }}</span>
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
      <div v-if="activeTab === 'deadlines'" class="rounded-[2.5rem] border shadow-sm overflow-hidden animate-fade-in" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
        <div class="overflow-x-auto touch-pan-x custom-scrollbar">
          <div v-if="editingDeadlines.length === 0" class="text-center py-16 min-w-[600px]">
            <p class="font-bold" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Yeay! Tidak ada antrean editing saat ini.</p>
          </div>
          <table v-else class="min-w-[600px] w-full divide-y" :class="isDarkMode ? 'divide-white/5' : 'divide-slate-100'">
            <thead :class="isDarkMode ? 'bg-black/20' : 'bg-slate-50/50'">
              <tr>
                <th class="py-6 pl-8 pr-3 text-left text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Klien</th>
                <th class="px-3 py-6 text-left text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Fakultas</th>
                <th class="px-3 py-6 text-left text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Fotografer</th>
                <th class="px-3 py-6 text-left text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="isDarkMode ? 'divide-white/5' : 'divide-slate-100'">
              <tr v-for="task in editingDeadlines" :key="task.id" class="transition-colors" :class="isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'">
                <td class="py-4 pl-8 pr-3">
                  <p class="text-sm font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ task.clientName }}</p>
                  <p class="text-[10px] font-mono" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">{{ task.id }}</p>
                </td>
                <td class="px-3 py-4 text-xs font-semibold" :class="isDarkMode ? 'text-gray-400' : 'text-slate-600'">{{ task.university }}</td>
                <td class="px-3 py-4 text-xs font-semibold" :class="isDarkMode ? 'text-gray-400' : 'text-slate-600'">{{ task.photographer }}</td>
                <td class="px-3 py-4">
                  <RouterLink :to="`/project/${task.id}`" class="px-4 py-2 rounded-xl text-[10px] font-black transition-colors inline-block uppercase tracking-wider shadow-sm" :class="isDarkMode ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'">
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
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
const activeTab = ref('schedule') 
const viewMode = ref('grid') 
const currentUser = ref(null)

const currentDate = ref(new Date())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

// COMPUTED BUAT NATIVE MONTH PICKER DI HP
const monthPickerValue = computed({
  get: () => `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`,
  set: (val) => {
    if (val) {
      const [year, month] = val.split('-')
      currentDate.value = new Date(year, month - 1, 1)
    }
  }
})

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] // Disingkat dikit biar pas di HP

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
      let rawStr = ''
      const targetDate = p.date || p.shootDate || p.createdAt
      if (targetDate) {
        rawStr = new Date(targetDate).toISOString().split('T')[0]
      }
      
      return {
        id: p.id,
        clientName: p.clientName || 'Tanpa Nama',
        university: p.university || '-',
        package: p.package?.name || p.package || 'Belum pilih paket',
        rawDate: rawStr,
        shootDate: formatDateForDisplay(rawStr),
        sessionTime: formatTime(p.sessionTime),
        location: p.location || 'Basecamp',
        photographer: p.photographer || 'Belum di-assign',
        status: p.status || 'lead',
      }
    })
  } catch (error) {
    Swal.fire('Gagal Sync', 'Gagal menarik data dari Firebase.', 'error')
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

const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD'
  return timeStr 
}

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'Tanggal Belum Diatur'
  const d = new Date(dateStr)
  if (isNaN(d)) return 'Invalid Date'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

const getPackageColor = (pkgName) => {
  if (!pkgName) return isDark.value ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'
  const name = pkgName.toLowerCase()
  if (name.includes('gold')) return isDark.value ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
  if (name.includes('silver')) return isDark.value ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-50 text-slate-600 border-slate-200'
  if (name.includes('bronze')) return isDark.value ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'
  return isDark.value ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
}

const nextMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1) }
const prevMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1) }

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) {
    days.push({ empty: true })
  }
  
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayProjects = projects.value.filter(p => p.rawDate === dateStr && !['delivered', 'canceled'].includes(p.status))
    const todayStr = new Date().toLocaleDateString('en-CA').split('T')[0] 
    
    days.push({ 
      empty: false, 
      date: i, 
      fullDate: dateStr, 
      projects: dayProjects,
      isToday: dateStr === todayStr
    })
  }
  return days
})

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
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Calendar</h2>
        <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Pantau jadwal dan post-produksi.</p>
      </div>
      <button @click="fetchProjects(currentUser?.uid)" class="w-fit flex items-center bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Sync Data
      </button>
    </div>

    <div class="flex items-center p-1.5 rounded-[1.25rem] w-full md:w-fit bg-slate-200/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
      <button @click="activeTab = 'schedule'" :class="activeTab === 'schedule' ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'" class="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all">
        Sesi Foto
      </button>
      <button @click="activeTab = 'deadlines'" :class="activeTab === 'deadlines' ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'" class="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all flex justify-center items-center gap-2">
        Editing
        <span class="bg-rose-500 text-white py-0.5 px-2 rounded-full text-[9px] font-bold">{{ editingDeadlines.length }}</span>
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>

    <div v-else class="animate-in fade-in duration-300">
      
      <div v-if="activeTab === 'schedule'" class="space-y-6">
        
        <div v-if="viewMode === 'grid'" class="flex items-center justify-between gap-2 bg-white dark:bg-[#111] p-1.5 rounded-[1.25rem] border border-slate-200/60 dark:border-white/10 shadow-sm w-full md:w-fit mx-auto md:mx-0">
          <button @click="prevMonth" class="p-3 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div class="relative flex-1 text-center px-4 hover:bg-slate-50 dark:hover:bg-white/5 py-2 rounded-lg cursor-pointer transition-colors overflow-hidden">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white tracking-tight">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <input type="month" v-model="monthPickerValue" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>

          <button @click="nextMonth" class="p-3 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div v-if="viewMode === 'grid'" class="overflow-x-auto touch-pan-x pb-4">
          <div class="min-w-[700px] md:min-w-full rounded-[2rem] border overflow-hidden shadow-sm transition-colors bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
            
            <div class="grid grid-cols-7 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <div v-for="day in dayNames" :key="day" class="py-3 md:py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 border-r border-slate-100 dark:border-white/5 last:border-r-0">
                {{ day }}
              </div>
            </div>
            
            <div class="grid grid-cols-7 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0a]">
              <div v-for="(day, index) in calendarDays" :key="index" class="min-h-[100px] md:min-h-[120px] p-1 md:p-2 flex flex-col transition-colors border-r border-b border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/5" :class="day.empty ? 'bg-slate-100/50 dark:bg-black/20' : 'bg-white dark:bg-[#111]'">
                
                <div v-if="!day.empty" class="text-right mb-1 mt-1 mr-1">
                  <span class="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-[11px] md:text-xs font-semibold" 
                        :class="day.isToday ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/20' : 'text-slate-500 dark:text-gray-400'">
                    {{ day.date }}
                  </span>
                </div>
                
                <div v-if="!day.empty" class="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 max-h-[80px]">
                  <RouterLink v-for="p in day.projects" :key="p.id" :to="`/project/${p.id}`" 
                              class="block p-1.5 md:p-2 rounded-lg md:rounded-xl border text-left hover:opacity-80 transition-opacity"
                              :class="getPackageColor(p.package)">
                    <div class="text-[9px] md:text-[10px] font-bold truncate leading-tight text-slate-800 dark:text-white">{{ p.clientName }}</div>
                    <div class="text-[8px] md:text-[9px] font-medium opacity-80 mt-0.5 truncate">{{ p.sessionTime }}</div>
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="viewMode === 'timeline'" class="space-y-6">
          <div v-if="upcomingShoots.length === 0" class="text-center py-16 rounded-[2rem] border border-dashed bg-transparent border-slate-300 dark:border-white/20">
            <p class="font-medium text-sm text-slate-500 dark:text-gray-400">Belum ada jadwal pemotretan aktif.</p>
          </div>

          <div v-for="day in upcomingShoots" :key="day.date" class="relative">
            <div class="sticky top-0 z-10 backdrop-blur-xl py-2.5 mb-3 rounded-2xl px-4 bg-white/70 dark:bg-[#0a0a0a]/70 border border-slate-200/50 dark:border-white/10 shadow-sm w-fit">
              <h3 class="text-xs font-bold tracking-widest text-slate-800 dark:text-white flex items-center">
                <svg class="w-4 h-4 mr-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {{ day.date }}
              </h3>
            </div>
            
            <div class="space-y-3">
              <RouterLink v-for="session in day.sessions" :key="session.id" :to="`/project/${session.id}`"
                   class="block rounded-[2rem] p-5 border shadow-sm transition-all group bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 hover:border-cyan-400/50 hover:shadow-md">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5">
                  
                  <div class="px-5 py-3 rounded-2xl border flex-shrink-0 text-center bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 w-full sm:w-32 flex sm:flex-col justify-between sm:justify-center items-center">
                    <p class="text-xl font-bold text-slate-900 dark:text-white">{{ session.sessionTime }}</p>
                    <p class="text-[9px] font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-0 sm:mt-0.5">WIB</p>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-bold transition-colors truncate text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{{ session.clientName }}</h4>
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                      <span class="text-[10px] font-bold px-2.5 py-1 rounded-md border" :class="getPackageColor(session.package)">{{ session.package }}</span>
                      <span class="text-[10px] font-medium px-2.5 py-1 rounded-md truncate max-w-[150px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300">{{ session.university }}</span>
                      <span class="text-[10px] font-medium px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/20 text-slate-600 dark:text-gray-400 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {{ session.photographer }}
                      </span>
                    </div>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'deadlines'" class="space-y-4 animate-fade-in">
        
        <div v-if="editingDeadlines.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-4 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/20">
          <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-500/20 text-2xl">
            🎉
          </div>
          <h3 class="font-bold text-lg text-slate-800 dark:text-white">Yeay! Antrean Kosong</h3>
          <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">Tidak ada project yang butuh editing saat ini.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="task in editingDeadlines" :key="task.id" class="bg-white dark:bg-[#111] p-5 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/10 transition-all hover:border-cyan-400/50">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="text-[10px] font-mono text-cyan-500 mb-1">ID: {{ task.id.substring(0,6) }}</p>
                <h4 class="text-base font-bold text-slate-900 dark:text-white leading-tight">{{ task.clientName }}</h4>
                <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-1">{{ task.university }}</p>
              </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
              <div class="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-sm"></span>
                {{ task.photographer }}
              </div>
              <RouterLink :to="`/project/${task.id}`" class="px-4 py-2 rounded-full text-[10px] font-bold transition-colors text-white bg-slate-900 dark:bg-white dark:text-black hover:scale-95">
                Kerjakan
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div v-if="activeTab === 'schedule'" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all">
      <div class="flex p-1.5 rounded-full bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 shadow-2xl shadow-slate-300/50 dark:shadow-black/60">
        <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'" class="px-6 py-2.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Grid
        </button>
        <button @click="viewMode = 'timeline'" :class="viewMode === 'timeline' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'" class="px-6 py-2.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          List
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px;}
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
</style>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Swal from 'sweetalert2'

const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const applyGlobalTheme = () => {
  if (isDarkMode.value) { document.body.style.backgroundColor = '#0a0a0a'; document.body.style.color = '#ffffff' }
  else { document.body.style.backgroundColor = '#f8fafc'; document.body.style.color = '#0f172a' }
}
applyGlobalTheme() // Paksa background dashboard mengikuti mode

const isLoading = ref(true)
const projects = ref([])
const userName = ref('Memuat...')
const currentUser = ref(null)

const fetchProjects = async (uid) => {
  if (!uid) return
  isLoading.value = true
  try {
    const q = collection(db, 'vendors', uid, 'projects')
    const querySnapshot = await getDocs(q)
    
    const loadedProjects = []
    querySnapshot.forEach((doc) => {
      // Kita gabungin ID document Firebase sama isinya
      loadedProjects.push({ id: doc.id, ...doc.data() })
    })

    // Map datanya biar sesuai sama UI Dashboard kamu
    projects.value = loadedProjects.map(p => ({
      id: p.id,
      clientName: p.clientName || 'Tanpa Nama',
      university: p.university || '-',
      package: p.package || '',
      status: p.status || 'lead',
      date: p.createdAt || new Date()
    }))
    
    // Sortir dari yang terbaru
    projects.value.sort((a, b) => new Date(b.date) - new Date(a.date))
    
  } catch (error) {
    Swal.fire('Gagal Sinkronisasi', 'Tidak dapat memuat data dari Firebase: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Sistem bakal ngecek otomatis siapa yang lagi login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Kalau berhasil narik nama dari Google, tampilkan!
      userName.value = user.displayName || 'Bosku'
      currentUser.value = user
      // Tarik data klien dari Firebase sesuai ID orang ini
      fetchProjects(user.uid)
    } else {
      userName.value = 'Tamu'
      isLoading.value = false
      // Harusnya ditendang ke /login, tapi nanti kita urus pakai Router Guard
    }
  })
})

const parsePrice = (pkgString) => {
  if (!pkgString) return 0
  const match = pkgString.match(/Rp\s*([\d.]+)/i)
  if (match) {
    return parseInt(match[1].replace(/\./g, ''))
  }
  return 0
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

const totalClients = computed(() => projects.value.length)
const totalRevenue = computed(() => projects.value.reduce((total, p) => total + parsePrice(p.package), 0))
const pendingLeads = computed(() => projects.value.filter(p => p.status === 'lead').length)
const completedProjects = computed(() => projects.value.filter(p => p.status === 'delivered').length)

const recentProjects = computed(() => {
  return projects.value.slice(0, 5)
})
</script>

<template>
  <div class="min-h-screen w-full transition-colors duration-500" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
    <div class="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl transition-all duration-500" :class="isDarkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-slate-900'">
        <div class="relative z-10">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dashboard Operasional</p>
          <h2 class="text-3xl font-black tracking-tight mb-2 uppercase">Welcome, {{ userName }}.</h2>
        </div>
        <div class="relative z-10 flex flex-wrap gap-3">
          <button @click="fetchProjects(currentUser?.uid)" class="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all flex items-center">
            <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh Data
          </button>
          <RouterLink to="/book" target="_blank" class="bg-white text-slate-900 px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center">
            Booking Form
          </RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" :class="isDarkMode ? 'border-cyan-500' : 'border-slate-900'"></div>
      </div>

      <div v-else class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" :class="isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Total Omset Kasar</p>
            <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ formatRupiah(totalRevenue) }}</h3>
          </div>

          <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" :class="isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Total Klien</p>
            <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ totalClients }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Project</span></h3>
          </div>

          <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" :class="isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Menunggu DP</p>
            <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ pendingLeads }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Klien</span></h3>
          </div>

          <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" :class="isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg></div>
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Project Selesai</p>
            <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ completedProjects }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Klien</span></h3>
          </div>
        </div>
    </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" :class="isDarkMode ? 'border-cyan-500' : 'border-slate-900'"></div>
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
          <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Total Omset Kasar</p>
          <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ formatRupiah(totalRevenue) }}</h3>
        </div>

        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
          <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Total Klien</p>
          <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ totalClients }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Project</span></h3>
        </div>

        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
          <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Menunggu DP</p>
          <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ pendingLeads }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Klien</span></h3>
        </div>

        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'">
          <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Project Selesai</p>
          <h3 class="text-2xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ completedProjects }} <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Klien</span></h3>
        </div>
      </div>

      <div class="rounded-[2.5rem] border shadow-sm overflow-hidden transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
        <div class="p-8 border-b flex items-center justify-between" :class="isDarkMode ? 'border-white/10' : 'border-slate-100'">
          <div>
            <h3 class="text-lg font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Booking Terbaru</h3>
            <p class="text-xs font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">5 klien terakhir yang masuk ke sistem</p>
          </div>
          <RouterLink to="/pipeline" class="text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-sm" :class="isDarkMode ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'">Lihat Semua &rarr;</RouterLink>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr :class="isDarkMode ? 'bg-black/20' : 'bg-slate-50/50'">
                <th class="p-6 text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">ID Project</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Nama Klien</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Universitas</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Status Terkini</th>
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-right" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="isDarkMode ? 'divide-white/5' : 'divide-slate-100'">
              <tr v-if="recentProjects.length === 0">
                <td colspan="5" class="p-12 text-center">
                  <p class="text-sm font-bold" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Belum ada data klien terbaru.</p>
                </td>
              </tr>
              <tr v-for="project in recentProjects" :key="project.id" class="transition-colors group" :class="isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'">
                <td class="p-6 text-xs font-bold font-mono" :class="isDarkMode ? 'text-gray-500' : 'text-slate-500'">{{ project.id }}</td>
                <td class="p-6 text-sm font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ project.clientName }}</td>
                <td class="p-6 text-xs font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">{{ project.university }}</td>
                <td class="p-6">
                  <span class="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                        :class="{
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400': project.status === 'lead',
                          'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400': project.status === 'dp' || project.status === 'booked',
                          'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400': project.status === 'editing',
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400': project.status === 'delivered',
                          'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400': project.status === 'canceled'
                        }">
                    {{ project.status }}
                  </span>
                </td>
                <td class="p-6 text-right">
                  <RouterLink :to="`/project/${project.id}`" class="text-[10px] font-black px-4 py-2.5 rounded-xl transition-colors shadow-sm" :class="isDarkMode ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'">
                    Detail &rarr;
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
<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const projects = ref([])
const userName = ref('Memuat...')
const currentUser = ref(null)

const fetchProjects = async (uid) => {
  if (!uid) return
  isLoading.value = true
  try {
    // Kita cuma narik data project milik vendor yang lagi login!
    const q = query(collection(db, 'projects'), where('vendorId', '==', uid))
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
  <div class="max-w-6xl mx-auto pb-12 space-y-8">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
      <div class="relative z-10">
        <h2 class="text-3xl font-bold mb-2">Halo, {{ userName }}! 👋</h2>
        <p class="text-indigo-100 text-sm">Berikut adalah ringkasan performa bisnismu hari ini.</p>
      </div>
      <div class="relative z-10 flex flex-wrap gap-3">
        <RouterLink to="/calendar" class="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center">
          📅 Kalender
        </RouterLink>
        <button @click="fetchProjects(currentUser?.uid)" class="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center">
          <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh Data
        </button>
        <RouterLink to="/book" target="_blank" class="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center">
          Preview Form
        </RouterLink>
      </div>
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div class="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -z-10 group-hover:bg-green-100 transition-all"></div>
          <div class="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Omset Kasar</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ formatRupiah(totalRevenue) }}</h3>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div class="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:bg-blue-100 transition-all"></div>
          <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Klien / Project</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ totalClients }} <span class="text-sm font-medium text-slate-400">Project</span></h3>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div class="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:bg-amber-100 transition-all"></div>
          <div class="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Menunggu DP (Lead)</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ pendingLeads }} <span class="text-sm font-medium text-slate-400">Klien</span></h3>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div class="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 group-hover:bg-purple-100 transition-all"></div>
          <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg></div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Selesai</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ completedProjects }} <span class="text-sm font-medium text-slate-400">Klien</span></h3>
        </div>
      </div>

      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Booking Terbaru</h3>
            <p class="text-xs text-slate-500">5 klien terakhir yang masuk ke sistem</p>
          </div>
          <RouterLink to="/pipeline" class="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">Lihat Semua Pipeline &rarr;</RouterLink>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Project</th>
                <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Klien</th>
                <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Universitas</th>
                <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Terkini</th>
                <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="recentProjects.length === 0">
                <td colspan="5" class="p-12 text-center">
                  <p class="text-sm font-bold text-slate-500">Belum ada data klien.</p>
                  <p class="text-xs font-medium text-slate-400 mt-1">Data Anda yang lama masih ada di Google Sheets, tapi belum masuk ke Firebase.</p>
                </td>
              </tr>
              <tr v-for="project in recentProjects" :key="project.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="p-4 text-xs font-bold text-slate-500 font-mono">{{ project.id }}</td>
                <td class="p-4 text-sm font-bold text-slate-800">{{ project.clientName }}</td>
                <td class="p-4 text-xs font-medium text-slate-500">{{ project.university }}</td>
                <td class="p-4">
                  <span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg"
                        :class="{
                          'bg-amber-100 text-amber-700': project.status === 'lead',
                          'bg-blue-100 text-blue-700': project.status === 'dp' || project.status === 'booked',
                          'bg-purple-100 text-purple-700': project.status === 'editing',
                          'bg-emerald-100 text-emerald-700': project.status === 'delivered',
                          'bg-red-100 text-red-700': project.status === 'canceled'
                        }">
                    {{ project.status }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <RouterLink :to="`/project/${project.id}`" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
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
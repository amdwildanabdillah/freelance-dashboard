<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, getDocs } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useTheme } from '../theme'

const { isDark } = useTheme()

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
      loadedProjects.push({ id: doc.id, ...doc.data() })
    })

    projects.value = loadedProjects.map(p => ({
      id: p.id,
      clientName: p.clientName || 'Tanpa Nama',
      university: p.university || '-',
      package: p.package || '',
      status: p.status || 'lead',
      date: p.createdAt || new Date()
    }))
    
    projects.value.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error("Gagal load data", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userName.value = user.displayName || 'Bosku'
      currentUser.value = user
      fetchProjects(user.uid)
    } else {
      userName.value = 'Tamu'
      isLoading.value = false
    }
  })
})

const parsePrice = (pkgString) => {
  if (!pkgString) return 0
  const match = pkgString.match(/Rp\s*([\d.]+)/i)
  if (match) return parseInt(match[1].replace(/\./g, ''))
  return 0
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

const totalClients = computed(() => projects.value.length)
const totalRevenue = computed(() => projects.value.reduce((total, p) => total + parsePrice(p.package), 0))
const pendingLeads = computed(() => projects.value.filter(p => p.status === 'lead').length)
const completedProjects = computed(() => projects.value.filter(p => p.status === 'delivered').length)

const recentProjects = computed(() => projects.value.slice(0, 5))
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-10 rounded-[2rem] relative overflow-hidden transition-all duration-500 bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/30 dark:shadow-none">
        
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-400/10 dark:bg-cyan-500/10 blur-3xl rounded-full pointer-events-none transition-all"></div>
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none transition-all"></div>

        <div class="relative z-10">
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight mb-1.5 text-slate-900 dark:text-white">Welcome back, {{ userName }}.</h2>
          <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400">Here's what's happening with your studio today.</p>
        </div>
        
        <div class="relative z-10 flex items-center gap-3">
          <button @click="fetchProjects(currentUser?.uid)" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all text-slate-600 dark:text-slate-300 shadow-sm" title="Refresh Data">
            <svg :class="{'animate-spin': isLoading}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          <RouterLink to="/book" target="_blank" class="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Public Booking Link
          </RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-cyan-500"></div>
      </div>

      <div v-else class="space-y-6 md:space-y-8">
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Total Revenue</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ formatRupiah(totalRevenue) }}</h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Total Clients</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ totalClients }} <span class="text-xs font-medium text-slate-400">Projects</span></h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Pending Leads</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ pendingLeads }} <span class="text-xs font-medium text-slate-400">Clients</span></h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Completed</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ completedProjects }} <span class="text-xs font-medium text-slate-400">Clients</span></h3>
          </div>
        </div>

        <div class="rounded-[2rem] border shadow-sm overflow-hidden bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
          <div class="p-6 md:p-8 border-b flex items-center justify-between border-slate-100 dark:border-white/10">
            <div>
              <h3 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Bookings</h3>
              <p class="text-xs font-medium mt-1 text-slate-500 dark:text-gray-400">The latest 5 clients added to your pipeline.</p>
            </div>
            
            <RouterLink to="/pipeline" class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center group">
              View all
              <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </RouterLink>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Client Details</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Institution</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-if="recentProjects.length === 0">
                  <td colspan="4" class="p-12 text-center text-sm font-medium text-slate-500">
                    No recent bookings found.
                  </td>
                </tr>
                <tr v-for="project in recentProjects" :key="project.id" class="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td class="p-4 md:p-6 whitespace-nowrap">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ project.clientName }}</p>
                    <p class="text-[10px] font-medium text-slate-400 dark:text-gray-500 mt-0.5">ID: {{ project.id.substring(0,6) }}</p>
                  </td>
                  <td class="p-4 md:p-6 text-xs font-medium text-slate-600 dark:text-slate-400">{{ project.university }}</td>
                  <td class="p-4 md:p-6">
                    <span class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md"
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
                  <td class="p-4 md:p-6 text-right">
                    <RouterLink :to="`/project/${project.id}`" class="text-[10px] font-semibold px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                      Open
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
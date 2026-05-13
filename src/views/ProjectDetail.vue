<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useTheme } from '../theme'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()
const projectId = route.params.id

const isLoading = ref(true)
const isSaving = ref(false)
const isEditingClient = ref(false) 

const project = ref({
  clientName: 'Memuat...', university: '', package: '', shootDate: '', sessionTime: '', location: '',
  instagram: '', whatsapp: '', paymentProofUrl: '', note: '', status: '', participants: '1 Orang' 
})

const teamDb = ref([]) 
const assignedPhotographerName = ref('Belum di-assign')
const gearChecklist = ref([])
const projectLinks = ref({ master: '', raw: '', final: '', canva: '' })

// Checklist Editing (Otomatis ngambil dari template kalau kosong)
const tasks = ref([])

const progressPercentage = computed(() => {
  if(tasks.value.length === 0) return 0
  const done = tasks.value.filter(t => t.completed).length
  return Math.round((done / tasks.value.length) * 100)
})

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'Belum diatur'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getWaLink = () => {
  let phone = project.value.whatsapp
  if (!phone) return '#'
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1)
  const msg = `Halo Kak ${project.value.clientName}, ini admin studio.\n\nIzin konfirmasi untuk sesi pemotretan:\nTanggal: ${formatDateForDisplay(project.value.shootDate)}\nJam: ${project.value.sessionTime} WIB\nLokasi: ${project.value.location}\nTim Bertugas: Mas/Mbak ${assignedPhotographerName.value}\n\nSampai jumpa!`
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
}

const fetchProjectDetail = async () => {
  const user = auth.currentUser
  if (!user) return
  
  try {
    // Tarik data vendor buat dapet template SOP
    let vendorTemplate = []
    const vendorRef = doc(db, 'vendors', user.uid)
    const vendorSnap = await getDoc(vendorRef)
    if (vendorSnap.exists()) {
      if(vendorSnap.data().team) teamDb.value = vendorSnap.data().team
      if(vendorSnap.data().workflowTemplate) {
        // Konversi dari template vendor jadi checklist yang bisa diklik (completed: false)
        vendorTemplate = vendorSnap.data().workflowTemplate.map(t => ({
          title: t.title,
          completed: false
        }))
      }
    }

    // Tarik data project
    const docRef = doc(db, 'vendors', user.uid, 'projects', projectId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const p = docSnap.data()
      project.value = {
        clientName: p.clientName || 'Tanpa Nama',
        university: p.university || '',
        package: p.package?.name || p.package || '', 
        shootDate: p.shootDate || '',
        sessionTime: p.sessionTime || '',
        location: p.location || '',
        instagram: p.instagram || '',
        whatsapp: p.whatsapp || '',
        note: p.note || '',
        participants: p.participants || '1 Orang',
        paymentProofUrl: p.paymentProofUrl || '',
        status: p.status || 'lead'
      }
      
      assignedPhotographerName.value = p.photographer || 'Belum di-assign'
      
      if (p.links) projectLinks.value = p.links
      else projectLinks.value = { master: p.linkMaster||'', raw: p.linkRaw||'', final: p.linkFinal||'', canva: p.linkCanva||'' }
      
      // LOGIKA SAKTI: Kalau project ini belum punya task (baru masuk), pake template dari vendor.
      // Kalau udah pernah disave, pake data dari database project ini.
      if (p.tasks && p.tasks.length > 0) {
        tasks.value = p.tasks
      } else if (vendorTemplate.length > 0) {
        tasks.value = vendorTemplate
      }

      updateGearList() 
    } else {
      Swal.fire('Error', 'Project tidak ditemukan!', 'error')
      router.push('/pipeline')
    }
  } catch (error) {
    Swal.fire('Error', 'Gagal menarik data project.', 'error')
  } finally {
    isLoading.value = false
  }
}

const updateGearList = () => {
  const fg = teamDb.value.find(t => t.name === assignedPhotographerName.value)
  if (fg) {
    const gears = []
    if(fg.eqBody) gears.push(`Body: ${fg.eqBody}`)
    if(fg.eqLens) gears.push(`Lensa: ${fg.eqLens}`)
    if(fg.eqFlash) gears.push(`Lighting: ${fg.eqFlash}`)
    gearChecklist.value = gears.map(item => ({ item, done: false }))
  } else gearChecklist.value = []
}

const saveChanges = async () => {
  isSaving.value = true
  try {
    const docRef = doc(db, 'vendors', auth.currentUser.uid, 'projects', projectId)
    await updateDoc(docRef, {
      ...project.value,
      photographer: assignedPhotographerName.value,
      links: projectLinks.value,
      tasks: tasks.value // SIMPAN TASK YANG UDAH DIEDIT KE PROJECT INI
    })
    isEditingClient.value = false 
    Swal.fire({ title: 'Tersimpan!', icon: 'success', timer: 1500, showConfirmButton: false })
  } catch (error) {
    Swal.fire('Gagal Menyimpan', error.message, 'error')
  } finally {
    isSaving.value = false
  }
}

const deleteProject = async () => {
  const result = await Swal.fire({
    title: 'Hapus Project?', text: "Data yang dihapus tidak bisa dikembalikan!", icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
  })
  if (result.isConfirmed) {
    await deleteDoc(doc(db, 'vendors', auth.currentUser.uid, 'projects', projectId))
    router.push('/pipeline')
  }
}

onMounted(() => fetchProjectDetail())
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
    <div v-if="isLoading" class="flex justify-center py-20"><div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div></div>

    <div v-else class="max-w-5xl mx-auto space-y-6">
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center space-x-4">
          <button @click="router.back()" class="p-2.5 rounded-full border border-slate-200/60 dark:border-white/10 shadow-sm transition-all bg-white dark:bg-[#111] text-slate-500 dark:text-gray-400 hover:text-cyan-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-width="2" /></svg></button>
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ project.clientName }}</h2>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-0.5">ID: {{ projectId.substring(0,8) }} &bull; {{ project.package }}</p>
          </div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button @click="deleteProject" class="p-3 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-200 dark:border-rose-500/20 shadow-sm shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2"/></svg></button>
          <button @click="saveChanges" :disabled="isSaving" class="flex-1 md:flex-none px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex justify-center items-center">
            <span v-if="isSaving" class="animate-spin text-base mr-2">⏳</span>{{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white dark:bg-[#111] p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all" :class="isEditingClient ? 'ring-2 ring-cyan-500/50' : ''">
            <div class="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Informasi Klien & Event</h3>
              <button @click="isEditingClient = !isEditingClient" class="text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors" :class="isEditingClient ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:text-cyan-500'">{{ isEditingClient ? 'Tutup Edit' : 'Edit Data' }}</button>
            </div>

            <div v-if="!isEditingClient" class="animate-fade-in">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
                <div class="space-y-4">
                  <a :href="getWaLink()" target="_blank" class="flex items-center text-sm font-semibold hover:text-emerald-500 transition-all group p-1.5 -ml-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer text-slate-800 dark:text-white">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-3 group-hover:scale-105 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                    {{ project.whatsapp }}
                    <span class="ml-auto px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all">Chat &rarr;</span>
                  </a>
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>@{{ project.instagram || '-' }}</div>
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg></div>{{ project.university || '-' }}</div>
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>{{ project.participants || '1 Orang' }}</div>
                </div>
                <div class="space-y-4">
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>{{ formatDateForDisplay(project.shootDate) }}</div>
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>{{ project.sessionTime }} WIB</div>
                  <div class="flex items-center text-sm font-semibold text-slate-800 dark:text-white"><div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>{{ project.location }}</div>
                </div>
              </div>
              <div class="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl relative"><p class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center"><svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Catatan Klien</p><p class="text-sm text-amber-800 dark:text-amber-200 font-medium italic">"{{ project.note || 'Tidak ada catatan khusus.' }}"</p></div>
            </div>

            <div v-else class="animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama</label><input v-model="project.clientName" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp</label><input v-model="project.whatsapp" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Instagram</label><input v-model="project.instagram" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Universitas</label><input v-model="project.university" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Paket</label><input v-model="project.package" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Jml Peserta</label><input v-model="project.participants" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Tanggal</label><input type="date" v-model="project.shootDate" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white dark:[color-scheme:dark]"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Jam</label><input type="time" v-model="project.sessionTime" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white dark:[color-scheme:dark]"></div>
              <div class="sm:col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Lokasi Detail</label><input v-model="project.location" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></div>
              <div class="sm:col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Catatan Khusus</label><textarea v-model="project.note" rows="2" class="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-sm outline-none text-slate-900 dark:text-white"></textarea></div>
              <div class="sm:col-span-2 pt-2"><button @click="saveChanges" class="w-full py-3 rounded-xl text-xs font-bold transition-colors bg-cyan-500 text-white hover:bg-cyan-600">Simpan Edit Klien</button></div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#111] p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Penugasan Fotografer</h3>
              <select v-model="assignedPhotographerName" @change="updateGearList" class="text-xs font-bold border rounded-lg p-2.5 outline-none bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer w-full sm:w-auto">
                <option value="Belum di-assign">Pilih Kru Bertugas</option>
                <option v-for="fg in teamDb" :key="fg.name" :value="fg.name">{{ fg.name }}</option>
              </select>
            </div>
            <div v-if="gearChecklist.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="(gear, index) in gearChecklist" :key="index" class="flex items-center p-3 rounded-xl border bg-slate-50/50 dark:bg-white/5 border-slate-200/60 dark:border-white/10">
                <input type="checkbox" v-model="gear.done" class="w-4 h-4 rounded mr-3 text-cyan-500 cursor-pointer">
                <span class="text-[11px] font-bold text-slate-700 dark:text-gray-300" :class="{'line-through opacity-50': gear.done}">{{ gear.item }}</span>
              </div>
            </div>
            <p v-else class="text-[11px] text-slate-400 dark:text-gray-500 font-medium text-center py-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/20">Pilih kru di atas untuk melihat checklist alat yang harus dibawa.</p>
          </div>

          <div class="bg-white dark:bg-[#111] p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm space-y-5 transition-all">
            <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4">Akses File & Cloud</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-1.5 ml-1">Master Folder</label>
                <div class="flex gap-2">
                  <input type="text" v-model="projectLinks.master" placeholder="Paste link drive..." class="flex-1 border bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-orange-500/50">
                  <a :href="projectLinks.master || '#'" target="_blank" class="px-3.5 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors" :class="!projectLinks.master ? 'opacity-50 pointer-events-none' : ''"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                </div>
              </div>
              <div>
                <label class="block text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 ml-1">RAW Backup</label>
                <div class="flex gap-2">
                  <input type="text" v-model="projectLinks.raw" placeholder="Paste link drive..." class="flex-1 border bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-blue-500/50">
                  <a :href="projectLinks.raw || '#'" target="_blank" class="px-3.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors" :class="!projectLinks.raw ? 'opacity-50 pointer-events-none' : ''"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                </div>
              </div>
              <div>
                <label class="block text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Final Edit</label>
                <div class="flex gap-2">
                  <input type="text" v-model="projectLinks.final" placeholder="Paste link drive..." class="flex-1 border bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-emerald-500/50">
                  <a :href="projectLinks.final || '#'" target="_blank" class="px-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors" :class="!projectLinks.final ? 'opacity-50 pointer-events-none' : ''"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                </div>
              </div>
              <div>
                <label class="block text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-1.5 ml-1">Canva Assets</label>
                <div class="flex gap-2">
                  <input type="text" v-model="projectLinks.canva" placeholder="Paste link canva..." class="flex-1 border bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-purple-500/50">
                  <a :href="projectLinks.canva || '#'" target="_blank" class="px-3.5 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-100 transition-colors" :class="!projectLinks.canva ? 'opacity-50 pointer-events-none' : ''"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          
          <div class="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm space-y-4">
            <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Pipeline Status</h3>
            <select v-model="project.status" @change="saveChanges" class="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-2xl outline-none text-sm font-bold border border-slate-200/60 dark:border-white/10 appearance-none cursor-pointer text-slate-900 dark:text-white">
              <option value="lead">LEAD / PENDING</option>
              <option value="dp">DP / HALF</option>
              <option value="booked">BOOKED / FULL</option>
              <option value="editing">EDITING</option>
              <option value="delivered">DELIVERED</option>
              <option value="canceled">CANCELED</option>
            </select>
            <div class="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 p-3.5 rounded-xl text-[10px] font-medium leading-relaxed border border-cyan-100 dark:border-cyan-500/20">
              Perubahan status otomatis memindah kartu di papan Pipeline.
            </div>
          </div>

          <div class="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm">
            <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4">Payment Proof</h3>
            <div class="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 h-48 mb-3 flex items-center justify-center group bg-slate-50 dark:bg-white/5">
              <img v-if="project.paymentProofUrl" :src="project.paymentProofUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <span v-else class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Belum Ada Bukti</span>
            </div>
            <a v-if="project.paymentProofUrl" :href="project.paymentProofUrl" target="_blank" class="w-full flex items-center justify-center py-3 text-[10px] font-bold rounded-xl transition-colors text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20">
              LIHAT FULL SCREEN
            </a>
          </div>

          <div class="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Task Progress</h3>
              <span class="text-[10px] font-bold px-2 py-1 rounded-md" :class="progressPercentage === 100 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-500/10'">{{ progressPercentage }}%</span>
            </div>
            <div class="w-full rounded-full h-1.5 mb-5 overflow-hidden bg-slate-100 dark:bg-white/10">
              <div class="h-1.5 rounded-full transition-all duration-500" :class="progressPercentage === 100 ? 'bg-emerald-500' : 'bg-cyan-500'" :style="`width: ${progressPercentage}%`"></div>
            </div>
            
            <div class="space-y-2.5">
              <div v-for="(task, idx) in tasks" :key="idx" class="flex items-center group gap-2">
                <div class="flex flex-1 items-center p-2.5 rounded-xl border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5" @click="task.completed = !task.completed">
                  <input type="checkbox" v-model="task.completed" @click.stop class="w-4 h-4 rounded mr-3 text-cyan-500 cursor-pointer">
                  <input v-model="task.title" @click.stop placeholder="Tulis task..." class="flex-1 bg-transparent text-[11px] font-semibold outline-none text-slate-700 dark:text-gray-300" :class="task.completed ? 'text-slate-400 dark:text-gray-600 line-through' : ''">
                </div>
                <button @click="tasks.splice(idx, 1)" class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5"/></svg>
                </button>
              </div>
            </div>
            <button @click="tasks.push({ title: '', completed: false })" class="w-full mt-4 py-2 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-400 hover:text-cyan-500 hover:border-cyan-500/50 transition-all">
              + Tambah Task Khusus
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted, computed, watch } from 'vue'
import Swal from 'sweetalert2'

const route = useRoute()
const projectId = route.params.id

const isLoading = ref(true)
const isSaving = ref(false)
const isEditingClient = ref(false) 

const project = ref({
  clientName: 'Memuat...', university: '', package: '', shootDate: '', sessionTime: '', location: '',
  instagram: '', whatsapp: '', paymentProof: '', note: '', status: '', participants: '1 Orang' // TAMBAHAN BARU
})

const teamDb = [
  { id: 1, name: 'Wildan', ig: '@wildan_abd', gearList: ['Sony A7III', 'Lensa Viltrox 85mm', 'Baterai Cadangan', 'Flash / Godox'] },
  { id: 2, name: 'Andi', ig: '@andi_shoots', gearList: ['Canon R6', 'Lensa 50mm', 'Baterai (Full)', 'Reflektor'] },
  { id: 3, name: 'Dicky', ig: '@dicky_mq', gearList: ['Lumix S5', 'Lensa 24-70mm', 'Gimbal', 'Audio Recorder'] }
]

const assignedPhotographerName = ref('Belum di-assign')
const gearChecklist = ref([])
const projectLinks = ref({ master: '', raw: '', final: '', canva: '' })

const tasks = ref([
  { id: 1, title: 'Backup & Sortir Folder (Vid, .arw, .jpg)', completed: true },
  { id: 2, title: 'Upload RAW ke Drive & Share Link', completed: false },
  { id: 3, title: 'Klien selesai milih foto (Target 30 foto)', completed: false },
  { id: 4, title: 'Editing (Retouch & Color Grading)', completed: false },
  { id: 5, title: 'Export & Backup Final ke Drive', completed: false }
])

const progressPercentage = computed(() => {
  const done = tasks.value.filter(t => t.completed).length
  return Math.round((done / tasks.value.length) * 100)
})

const API_URL = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'Belum diatur'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

// LOGIKA DIRECT WHATSAPP PINTAR
const getWaLink = () => {
  let phone = project.value.whatsapp
  if (!phone) return '#'
  
  // Bersihin karakter aneh, ubah 08 jadi 628
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }

  // Siapin teks otomatis
  const fg = teamDb.find(t => t.name === assignedPhotographerName.value)
  const fgIg = fg ? fg.ig : '-'
  const msg = `Halo Kak ${project.value.clientName}, ini admin vendor foto. 👋\n\nIzin konfirmasi untuk sesi foto wisuda:\n📅 ${formatDateForDisplay(project.value.shootDate)}\n⏰ ${project.value.sessionTime} WIB\n📍 ${project.value.location}\n📸 FG: Mas ${assignedPhotographerName.value} (${fgIg})\n\nSampai jumpa! ✨`
  
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
}

const fetchProjectDetail = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'GET_PROJECT_DETAIL', projectId: projectId })
    })
    const result = await response.json()
    if (result.status === 'success') {
      const p = result.data
      let rawDate = ''
      if(p.Shoot_Date) {
        const d = new Date(p.Shoot_Date)
        rawDate = d.toISOString().split('T')[0] 
      }

      project.value = {
        clientName: p.Client_Name || 'Tanpa Nama',
        university: p.University || '',
        package: p.Package || '',
        shootDate: rawDate,
        sessionTime: formatTime(p.Session_Time),
        location: p.Location || '',
        instagram: p.Instagram || '',
        whatsapp: p.WhatsApp || '',
        note: p.Note || '',
        participants: '1 Orang', // Nanti kita benerin Apps Script nya buat nyimpen ini
        paymentProof: p.Payment_Proof || 'https://via.placeholder.com/300x500?text=Belum+Ada+Bukti+TF',
        status: p.Status || 'lead'
      }
      assignedPhotographerName.value = p.Photographer_ID || 'Belum di-assign'
      projectLinks.value = { master: p.Link_Master || '', raw: p.Link_RAW || '', final: p.Link_Final || '', canva: p.Link_Canva || '' }
      updateGearList()
    } else {
      Swal.fire('Data Gagal Ditarik', result.message || 'Project tidak ditemukan', 'error')
    }
  } catch (error) {
    Swal.fire('Error Jaringan', 'Gagal connect ke Database!', 'error')
  } finally {
    isLoading.value = false
  }
}

const saveChanges = async () => {
  isSaving.value = true
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'UPDATE_PROJECT_DETAILS',
        projectId: projectId,
        projectData: project.value, 
        photographer: assignedPhotographerName.value,
        links: projectLinks.value
      })
    })
    const result = await response.json()
    if(result.status === 'success') {
      isEditingClient.value = false 
      Swal.fire({ title: 'Tersimpan!', text: 'Semua detail berhasil diupdate.', icon: 'success', timer: 1500, showConfirmButton: false })
    }
  } catch (error) {
    Swal.fire('Gagal Menyimpan', 'Periksa koneksi internet Anda.', 'error')
  } finally {
    isSaving.value = false
  }
}

const updateGearList = () => {
  const fg = teamDb.find(t => t.name === assignedPhotographerName.value)
  if (fg) {
    gearChecklist.value = fg.gearList.map(item => ({ item, done: false }))
  } else {
    gearChecklist.value = []
  }
}
watch(assignedPhotographerName, updateGearList)

onMounted(() => { fetchProjectDetail() })
</script>

<template>
  <div class="max-w-6xl mx-auto pb-12">
    
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-64">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-sm font-bold text-slate-500 animate-pulse">Menarik data dari database...</p>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <router-link to="/pipeline" class="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </router-link>
          <div>
            <h2 class="text-2xl font-bold text-slate-900">{{ project.clientName }}</h2>
            <p class="text-slate-500 text-sm font-medium uppercase tracking-tighter">ID: {{ projectId }} &bull; {{ project.package }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <!-- Tombol Save -->
          <button @click="saveChanges" :disabled="isSaving" class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center disabled:opacity-70">
            <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Kolom Kiri -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- INFO KLIEN -->
          <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative transition-all" :class="{'ring-2 ring-indigo-100': isEditingClient}">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Klien & Event</h3>
              <button @click="isEditingClient = !isEditingClient" class="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors" :class="isEditingClient ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'">
                {{ isEditingClient ? 'Batal Edit ✖' : 'Edit Data ✏️' }}
              </button>
            </div>

            <!-- MODE BACA -->
            <div v-if="!isEditingClient" class="animate-fade-in">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <!-- Data Diri -->
                <div class="space-y-4">
                  <div class="space-y-3">
                    <!-- WhatsApp Link Direct! -->
                    <a :href="getWaLink()" target="_blank"
                      class="flex items-center text-slate-700 text-sm font-semibold hover:text-green-600 transition-all group p-1.5 -ml-1.5 rounded-xl hover:bg-green-50/50 cursor-pointer">
                      <div
                        class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 shadow-sm group-hover:bg-green-200 group-hover:scale-105 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      {{ project.whatsapp }}
                      <!-- Label ini sekarang warnanya lebih pop-up dan selalu muncul -->
                      <span
                        class="ml-3 px-2.5 py-1 bg-green-500 text-white text-[9px] font-bold rounded-md uppercase tracking-wider shadow-sm group-hover:bg-green-600 group-hover:shadow transition-all">
                        Chat WA &rarr;
                      </span>
                    </a>
                    
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      @{{ project.instagram || '-' }}
                    </div>
                    
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg></div>
                      {{ project.university || '-' }}
                    </div>

                    <!-- Jumlah Peserta Baru! -->
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                      {{ project.participants || '1 Orang' }} (Jumlah Peserta)
                    </div>
                  </div>
                </div>

                <!-- Event Info -->
                <div class="space-y-4">
                  <div class="space-y-3">
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      {{ formatDateForDisplay(project.shootDate) }}
                    </div>
                    
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                      {{ project.sessionTime }} WIB
                    </div>
                    
                    <div class="flex items-center text-slate-700 text-sm font-semibold">
                      <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center mr-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                      {{ project.location }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Catatan -->
              <div class="p-4 bg-amber-50 border border-amber-100 rounded-2xl relative overflow-hidden">
                <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Request / Catatan Khusus
                </p>
                <p class="text-sm text-amber-800 font-medium italic">"{{ project.note || 'Tidak ada catatan.' }}"</p>
              </div>
            </div>

            <!-- MODE EDIT FORM -->
            <div v-else class="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Nama</label><input v-model="project.clientName" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">WhatsApp</label><input v-model="project.whatsapp" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Instagram</label><input v-model="project.instagram" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Universitas</label><input v-model="project.university" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Paket</label><input v-model="project.package" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Jumlah Orang</label><input v-model="project.participants" placeholder="Misal: 4 Orang" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label><input type="date" v-model="project.shootDate" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div><label class="text-[10px] font-bold text-slate-500 uppercase">Jam</label><input type="time" v-model="project.sessionTime" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div class="md:col-span-2"><label class="text-[10px] font-bold text-slate-500 uppercase">Lokasi Detail</label><input v-model="project.location" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></div>
              <div class="md:col-span-2"><label class="text-[10px] font-bold text-slate-500 uppercase">Catatan / Request Klien</label><textarea v-model="project.note" rows="2" class="w-full mt-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none"></textarea></div>
              <div class="md:col-span-2 pt-2"><button @click="saveChanges" class="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">Simpan Perubahan Data</button></div>
            </div>
          </div>

          <!-- FG Assignment -->
          <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Penugasan Fotografer</h3>
              <select v-model="assignedPhotographerName" class="text-sm font-bold border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:border-indigo-500">
                <option value="Belum di-assign">Belum di-assign</option>
                <option v-for="fg in teamDb" :key="fg.id" :value="fg.name">{{ fg.name }}</option>
              </select>
            </div>
            <div v-if="gearChecklist.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(gear, index) in gearChecklist" :key="index" class="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input type="checkbox" v-model="gear.done" class="w-4 h-4 rounded text-indigo-600 border-slate-300 mr-3">
                <span class="text-xs font-bold text-slate-600" :class="{'line-through opacity-50': gear.done}">{{ gear.item }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-slate-400 font-medium text-center py-4">Pilih fotografer untuk melihat checklist alat.</p>
          </div>
        </div>

        <!-- Kolom Kanan -->
        <div class="space-y-6">
          
          <!-- Bukti TF (HOTFIX BALIK LAGI WKWK) -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Proof</h3>
            
            <div class="relative rounded-2xl overflow-hidden border border-slate-100 h-40 mb-3 bg-slate-50 flex items-center justify-center group">
              <!-- Render gambar kalau link bukan placeholder/kosong -->
              <img v-if="project.paymentProof && !project.paymentProof.includes('Belum+Ada')" :src="project.paymentProof" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              
              <!-- Teks fallback kalau kosong -->
              <span v-else class="text-xs font-bold text-slate-400">Preview Belum Tersedia</span>
            </div>
            
            <!-- Tombol buat lihat full screen di tab baru -->
            <a v-if="project.paymentProof && !project.paymentProof.includes('Belum+Ada')" :href="project.paymentProof" target="_blank" class="w-full flex items-center justify-center py-2.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
              LIHAT FULL SCREEN
            </a>
          </div>

          <!-- Manage Links -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <h3 class="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2">Manage File Links</h3>
            
            <div>
              <label class="block text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Master Folder</label>
              <div class="flex gap-2">
                <input type="text" v-model="projectLinks.master" placeholder="Paste link..." class="flex-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none focus:border-orange-500">
                <a :href="projectLinks.master || '#'" target="_blank" class="px-3 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors" :class="!projectLinks.master ? 'opacity-50 pointer-events-none' : ''">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
            
            <div>
              <label class="block text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">RAW Backup</label>
              <div class="flex gap-2">
                <input type="text" v-model="projectLinks.raw" placeholder="Paste link..." class="flex-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-500">
                <a :href="projectLinks.raw || '#'" target="_blank" class="px-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors" :class="!projectLinks.raw ? 'opacity-50 pointer-events-none' : ''">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>

            <div>
              <label class="block text-[9px] font-bold text-green-500 uppercase tracking-widest mb-1.5">Final Edit</label>
              <div class="flex gap-2">
                <input type="text" v-model="projectLinks.final" placeholder="Paste link..." class="flex-1 border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none focus:border-green-500">
                <a :href="projectLinks.final || '#'" target="_blank" class="px-3 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors" :class="!projectLinks.final ? 'opacity-50 pointer-events-none' : ''">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>

            <button @click="saveChanges" class="w-full mt-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
              Simpan Links
            </button>
          </div>

          <!-- Workflow Progress -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Workflow Progress</h3>
              <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{{ progressPercentage }}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
              <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" :style="`width: ${progressPercentage}%`"></div>
            </div>
            <div class="space-y-3">
              <div v-for="task in tasks" :key="task.id" class="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300" @click="task.completed = !task.completed">
                <input type="checkbox" v-model="task.completed" class="w-4 h-4 rounded text-indigo-600 border-slate-300 mr-3 pointer-events-none">
                <span class="text-xs font-medium transition-colors" :class="task.completed ? 'text-slate-400 line-through' : 'text-slate-700'">{{ task.title }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
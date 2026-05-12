<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const isSaving = ref(false)
const isLoading = ref(true)
const currentUser = ref(null)

const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

// State untuk Identitas (diambil dari Firebase)
const settings = ref({
  fullName: '', whatsappOwner: '', igOwner: '', emailAdmin: '',
  vendorName: '', vendorWhatsapp: '', igVendor: '', website: '', address: '', logoUrl: ''
})

const newLogoFile = ref(null)
const logoPreview = ref('')
const isUploadingLogo = ref(false)
const logoUploadSuccess = ref(false)

// Operational Lists
const packages = ref([])
const addons = ref([])
const banks = ref([])
const inventory = ref([]) // Aset milik studio
const team = ref([]) // Anggota tim & Alat mereka

const addListItem = (list, template) => list.push({ id: Date.now(), ...template })
const removeListItem = (list, index) => list.splice(index, 1)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      await fetchAllData()
    }
  })
})

const fetchAllData = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'vendors', currentUser.value.uid))
    if (docSnap.exists()) {
      const data = docSnap.data()
      // Map data sesuai struktur baru
      settings.value = {
        fullName: data.ownerInfo?.fullName || '',
        whatsappOwner: data.ownerInfo?.whatsapp || '',
        igOwner: data.ownerInfo?.instagram || '',
        emailAdmin: data.ownerInfo?.emailAdmin || '',
        vendorName: data.vendorInfo?.name || '',
        vendorWhatsapp: data.vendorInfo?.whatsapp || '',
        igVendor: data.vendorInfo?.instagram || '',
        website: data.vendorInfo?.website || '',
        address: data.vendorInfo?.address || '',
        logoUrl: data.vendorInfo?.logoUrl || ''
      }
      logoPreview.value = data.vendorInfo?.logoUrl || ''
      
      // Load operational data
      packages.value = data.operational?.packages || []
      addons.value = data.operational?.addons || []
      banks.value = data.operational?.banks || []
      inventory.value = data.operational?.inventory || []
      team.value = data.operational?.team || []
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const handleLogoChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  isUploadingLogo.value = true
  logoUploadSuccess.value = false

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `logo_${Date.now()}_${settings.value.vendorName.replace(/\s+/g, '_')}.${fileExt}`
    const { data, error } = await supabase.storage.from('shotflow-storage').upload(fileName, file)
    if (error) throw error
    const { data: urlData } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    settings.value.logoUrl = urlData.publicUrl
    logoPreview.value = urlData.publicUrl
    logoUploadSuccess.value = true
  } catch (e) { Swal.fire('Gagal Upload', e.message, 'error') }
  finally { isUploadingLogo.value = false }
}

const saveSettings = async () => {
  isSaving.value = true
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } })

  try {
    const docRef = doc(db, 'vendors', currentUser.value.uid)
    await setDoc(docRef, {
      ownerInfo: {
        fullName: settings.value.fullName,
        whatsapp: settings.value.whatsappOwner,
        instagram: settings.value.igOwner,
        emailAdmin: settings.value.emailAdmin
      },
      vendorInfo: {
        name: settings.value.vendorName,
        whatsapp: settings.value.vendorWhatsapp,
        instagram: settings.value.igVendor,
        website: settings.value.website,
        address: settings.value.address,
        logoUrl: settings.value.logoUrl
      },
      operational: {
        packages: packages.value,
        addons: addons.value,
        banks: banks.value,
        inventory: inventory.value,
        team: team.value
      }
    }, { merge: true })

    Swal.fire({ icon: 'success', title: 'Data Diperbarui', showConfirmButton: false, timer: 1500 })
  } catch (e) {
    Swal.fire('Gagal', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen relative font-sans transition-colors duration-500 overflow-hidden" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">

    <div class="max-w-6xl mx-auto py-10 px-4 space-y-8">
      
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
        <div>
          <h1 class="text-3xl font-black tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Pengaturan Studio</h1>
          <p class="text-sm font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Kelola identitas, layanan, dan ekosistem operasional.</p>
        </div>
        <button @click="saveSettings" :disabled="isSaving || isUploadingLogo" class="px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2" :class="isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-black'">
           {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-20 font-bold" :class="isDarkMode ? 'text-white/30' : 'text-slate-300'">Memuat Data Sistem...</div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
          <!-- Identitas Card -->
          <div class="p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
             <h3 class="text-[10px] font-black uppercase tracking-widest mb-8" :class="isDarkMode ? 'text-cyan-400' : 'text-indigo-500'">01. Identitas Owner & Vendor</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2 flex items-center gap-6 mb-4">
                   <div class="w-20 h-20 rounded-full border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors relative" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/20' : 'bg-slate-50 border-slate-300'">
                      <div v-if="isUploadingLogo" class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm"><span class="animate-spin text-white">⚙️</span></div>
                      <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-2">
                   </div>
                   <div>
                     <label class="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer transition-all border inline-block" :class="isDarkMode ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black' : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'">
                        {{ isUploadingLogo ? 'Mengunggah...' : 'Ganti Logo' }}
                        <input type="file" @change="handleLogoChange" class="hidden" :disabled="isUploadingLogo">
                     </label>
                     <p v-if="logoUploadSuccess" class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">Berhasil Diunggah ✓</p>
                   </div>
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Nama Owner</label>
                  <input v-model="settings.fullName" placeholder="Nama Lengkap" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-sm transition-all" :class="isDarkMode ? 'border-white/10 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-indigo-500 text-slate-900 placeholder-slate-400'">
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Nama Studio</label>
                  <input v-model="settings.vendorName" placeholder="Nama Brand" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-sm transition-all" :class="isDarkMode ? 'border-white/10 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-indigo-500 text-slate-900 placeholder-slate-400'">
                </div>
                <div class="md:col-span-2">
                  <label class="text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Alamat Lengkap</label>
                  <input v-model="settings.address" placeholder="Jalan, Kota, Provinsi" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-sm transition-all" :class="isDarkMode ? 'border-white/10 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-indigo-500 text-slate-900 placeholder-slate-400'">
                </div>
             </div>
          </div>

          <!-- Inventaris Card -->
          <div class="p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
            <h3 class="text-[10px] font-black uppercase tracking-widest mb-6" :class="isDarkMode ? 'text-blue-400' : 'text-purple-500'">02. Aset Inventaris Studio</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(item, idx) in inventory" :key="item.id" class="flex items-center gap-3 p-4 rounded-2xl border transition-colors" :class="isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/50'">
                <div class="flex-1">
                  <input v-model="item.name" placeholder="Nama Alat (Sony, dll)" class="w-full bg-transparent text-sm font-bold outline-none" :class="isDarkMode ? 'text-white placeholder-gray-600' : 'text-slate-900 placeholder-slate-400'">
                  <select v-model="item.type" class="text-[9px] font-black uppercase bg-transparent outline-none" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">
                    <option value="Kamera">Kamera</option>
                    <option value="Lensa">Lensa</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
                <button @click="removeListItem(inventory, idx)" class="hover:text-red-500" :class="isDarkMode ? 'text-white/30' : 'text-slate-300'">×</button>
              </div>
              <button @click="addListItem(inventory, {name: '', type: 'Kamera'})" class="w-full py-4 border border-dashed font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all" :class="isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'">+ Tambah Aset</button>
            </div>
          </div>

          <!-- Manajemen Tim Card -->
          <div class="p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
            <h3 class="text-[10px] font-black uppercase tracking-widest mb-6" :class="isDarkMode ? 'text-emerald-400' : 'text-emerald-500'">03. Manajemen Tim & Peralatan</h3>
            <div class="space-y-4">
              <div v-for="(member, idx) in team" :key="member.id" class="p-6 rounded-[2rem] border space-y-4 transition-colors" :class="isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/50'">
                <div class="flex justify-between items-start">
                  <div class="flex-1 grid grid-cols-2 gap-4">
                     <input v-model="member.name" placeholder="Nama Member" class="w-full p-3 rounded-xl text-sm font-bold outline-none border transition-colors" :class="isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder-gray-600 focus:border-emerald-400' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'">
                     <select v-model="member.role" class="w-full p-3 rounded-xl text-sm font-bold outline-none border transition-colors cursor-pointer" :class="isDarkMode ? 'bg-black/40 border-white/10 text-white focus:border-emerald-400' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'">
                       <option value="Owner">Owner</option>
                       <option value="Admin">Admin</option>
                       <option value="FG">Photographer (FG)</option>
                       <option value="VG">Videographer (VG)</option>
                       <option value="Editor">Editor</option>
                     </select>
                  </div>
                  <button @click="removeListItem(team, idx)" class="ml-4 hover:text-red-500" :class="isDarkMode ? 'text-white/30' : 'text-slate-300'">Hapus</button>
                </div>
              </div>
              <button @click="addListItem(team, {name: '', role: 'FG', eqStatus: 'Bawa Sendiri', eqDetails: ''})" class="w-full py-4 border border-dashed font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all" :class="isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'">+ Tambah Anggota</button>
            </div>
          </div>
        </div>

        <div class="space-y-8">
           <!-- Layanan Card -->
           <div class="p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
              <h3 class="text-[10px] font-black uppercase tracking-widest mb-6" :class="isDarkMode ? 'text-amber-400' : 'text-amber-500'">04. Layanan & Paket</h3>
              <div class="space-y-3 mb-6">
                 <div v-for="(p, idx) in packages" :key="p.id" class="flex gap-2 items-center">
                    <input v-model="p.name" placeholder="Nama Paket" class="flex-1 text-xs font-bold outline-none border-b bg-transparent py-2" :class="isDarkMode ? 'border-white/10 focus:border-amber-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-amber-500 text-slate-900 placeholder-slate-400'">
                    <input v-model="p.price" @input="p.price = p.price.replace(/\D/g, '')" type="text" placeholder="Rp" class="w-24 text-xs font-bold outline-none border-b bg-transparent py-2" :class="isDarkMode ? 'border-white/10 focus:border-amber-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-amber-500 text-slate-900 placeholder-slate-400'">
                    <button @click="removeListItem(packages, idx)" class="hover:text-red-500 px-2" :class="isDarkMode ? 'text-white/30' : 'text-slate-300'">×</button>
                 </div>
                 <button @click="addListItem(packages, {name: '', price: ''})" class="w-full py-3 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-dashed" :class="isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'">+ Tambah Paket</button>
              </div>
           </div>
  
           <!-- Rekening Card -->
           <div class="p-8 rounded-[2rem] shadow-xl backdrop-blur-2xl transition-all duration-300" :class="isDarkMode ? 'bg-[#1a1a1a]/60 border border-white/10' : 'bg-white/60 border border-white/50'">
              <h3 class="text-[10px] font-black uppercase tracking-widest mb-6" :class="isDarkMode ? 'text-rose-400' : 'text-rose-500'">05. Rekening Pembayaran</h3>
              <div class="space-y-4">
                 <div v-for="(b, idx) in banks" :key="b.id" class="p-4 rounded-2xl relative group border transition-colors" :class="isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/50'">
                    <input v-model="b.bankName" placeholder="Bank (BCA/BRI)" class="w-full bg-transparent text-[10px] font-black uppercase mb-1 outline-none" :class="isDarkMode ? 'text-rose-400 placeholder-gray-600' : 'text-rose-600 placeholder-slate-400'">
                    <input v-model="b.number" @input="b.number = b.number.replace(/\D/g, '')" type="text" placeholder="Nomor Rekening" class="w-full bg-transparent text-sm font-bold outline-none mb-1" :class="isDarkMode ? 'text-white placeholder-gray-600' : 'text-slate-900 placeholder-slate-400'">
                    <input v-model="b.owner" placeholder="Atas Nama" class="w-full bg-transparent text-[10px] font-bold uppercase outline-none" :class="isDarkMode ? 'text-gray-400 placeholder-gray-600' : 'text-slate-400 placeholder-slate-300'">
                    <button @click="removeListItem(banks, idx)" class="absolute top-3 right-3 hover:text-red-500" :class="isDarkMode ? 'text-white/30' : 'text-slate-300'">×</button>
                 </div>
                 <button @click="addListItem(banks, {bankName: '', number: '', owner: ''})" class="w-full py-3 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-dashed" :class="isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'">+ Tambah Rekening</button>
              </div>
           </div>
        </div>
  
      </div>
    </div>
  </div>
</template>
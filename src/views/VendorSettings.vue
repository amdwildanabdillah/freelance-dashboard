<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged, deleteUser } from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import { useTheme } from '../theme'
import Swal from 'sweetalert2'

const { isDark } = useTheme()
const isSaving = ref(false)
const isLoading = ref(true)
const currentUser = ref(null)

const settings = ref({
  ownerName: '', ownerWhatsapp: '', ownerInstagram: '', ownerEmail: '',
  vendorName: '', vendorWhatsapp: '', vendorInstagram: '', vendorEmail: '', address: '', logoUrl: ''
})

const newLogoFile = ref(null)
const logoPreview = ref('')

const packages = ref([])
const addons = ref([])
const banks = ref([])
const inventory = ref([])
const team = ref([])
const workflowTemplate = ref([])

const addListItem = (list, template) => list.push({ id: Date.now(), ...template })
const removeListItem = (list, index) => list.splice(index, 1)

const filterNumber = (field) => {
  settings.value[field] = settings.value[field].replace(/\D/g, '')
}

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
      
      settings.value = {
        ownerName: data.ownerName || data.ownerInfo?.fullName || '',
        ownerWhatsapp: data.ownerWhatsapp || data.ownerInfo?.whatsapp || '',
        ownerInstagram: data.ownerInstagram || data.ownerInfo?.instagram || '',
        ownerEmail: data.ownerEmail || data.ownerInfo?.email || '',
        
        vendorName: data.vendorName || data.vendorInfo?.name || '',
        vendorWhatsapp: data.vendorWhatsapp || data.vendorInfo?.whatsapp || '',
        vendorInstagram: data.vendorInstagram || data.vendorInfo?.instagram || '',
        vendorEmail: data.vendorEmail || data.vendorInfo?.email || '',
        address: data.address || data.vendorInfo?.address || '',
        logoUrl: data.logoUrl || data.vendorInfo?.logoUrl || ''
      }
      
      logoPreview.value = settings.value.logoUrl
      
      packages.value = data.packages || data.operational?.packages || []
      addons.value = data.addons || data.operational?.addons || []
      banks.value = data.banks || data.operational?.banks || []
      inventory.value = data.inventory || data.operational?.inventory || []
      team.value = data.team || data.operational?.team || []
      
      workflowTemplate.value = data.workflowTemplate || [
        { id: 1, title: 'Backup & Sortir Folder (Vid, .arw, .jpg)' },
        { id: 2, title: 'Upload RAW ke Drive & Share Link' },
        { id: 3, title: 'Klien selesai milih foto' },
        { id: 4, title: 'Editing (Retouch & Color Grading)' },
        { id: 5, title: 'Export & Backup Final ke Drive' }
      ]
    }
  } catch (e) { 
    console.error(e) 
  } finally { 
    isLoading.value = false 
  }
}

const uploadLogo = async () => {
  if (!newLogoFile.value) return settings.value.logoUrl
  const fileExt = newLogoFile.value.name.split('.').pop()
  const fileName = `logo_${currentUser.value.uid}.${fileExt}`
  
  try {
    const { error } = await supabase.storage.from('shotflow-storage').upload(fileName, newLogoFile.value, {
      cacheControl: '3600',
      upsert: true 
    })
    if (error) throw error
    const { data } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    return data.publicUrl
  } catch (e) { 
    return settings.value.logoUrl 
  }
}

const saveSettings = async () => {
  isSaving.value = true
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

  try {
    const finalLogo = await uploadLogo()
    const docRef = doc(db, 'vendors', currentUser.value.uid)
    
    await setDoc(docRef, {
      ownerName: settings.value.ownerName,
      ownerWhatsapp: settings.value.ownerWhatsapp,
      ownerInstagram: settings.value.ownerInstagram,
      ownerEmail: settings.value.ownerEmail,
      
      vendorName: settings.value.vendorName,
      vendorWhatsapp: settings.value.vendorWhatsapp,
      whatsapp: settings.value.vendorWhatsapp, 
      vendorInstagram: settings.value.vendorInstagram,
      vendorEmail: settings.value.vendorEmail,
      address: settings.value.address,
      logoUrl: finalLogo || settings.value.logoUrl,
      
      packages: packages.value,
      addons: addons.value,
      banks: banks.value,
      inventory: inventory.value,
      team: team.value,
      workflowTemplate: workflowTemplate.value
    }, { merge: true })

    Swal.fire({ icon: 'success', title: 'Tersimpan!', showConfirmButton: false, timer: 1500 })
    newLogoFile.value = null
    logoPreview.value = finalLogo || settings.value.logoUrl
  } catch (e) { 
    Swal.fire('Gagal', e.message, 'error') 
  } finally { 
    isSaving.value = false 
  }
}

const deleteAccount = async () => {
  const result = await Swal.fire({
    title: 'Hapus Akun Permanen?',
    text: 'Seluruh profil, data klien, dan transaksi akan dihapus. Tindakan ini tidak dapat dibatalkan.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#1e293b',
    confirmButtonText: 'Hapus Sekarang',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    try {
      const user = auth.currentUser
      if (!user) return
      
      await deleteDoc(doc(db, 'vendors', user.uid))
      await deleteUser(user)
      
      window.location.href = '/'
    } catch (error) {
      Swal.fire('Gagal', 'Sistem membutuhkan autentikasi ulang. Silakan logout dan login kembali sebelum menghapus akun.', 'error')
    }
  }
}
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-28">
    <header>
      <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vendor Settings</h2>
      <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Konfigurasi operasional, profil, dan layanan studio Anda.</p>
    </header>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      
      <div class="lg:col-span-2 space-y-6 md:space-y-8">
        
        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-8 shadow-sm">
          <div class="flex items-center gap-5 pb-6 border-b border-slate-100 dark:border-white/5">
            <div class="relative w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-200/60 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-all hover:border-cyan-400/50">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-2 bg-white dark:bg-transparent">
              <div v-else class="text-center text-slate-400">
                <svg class="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <span class="text-[9px] font-semibold">Upload</span>
              </div>
              <input type="file" accept="image/*" @change="e => { newLogoFile = e.target.files[0]; logoPreview = URL.createObjectURL(newLogoFile) }" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            </div>
            <div>
              <p class="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Logo Studio</p>
              <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400">Digunakan pada kop surat Invoice (.png/.jpg)</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-4">Profil Owner</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Nama Lengkap</label><input v-model="settings.ownerName" placeholder="Nama asli owner" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">WA Pribadi</label><input v-model="settings.ownerWhatsapp" @input="filterNumber('ownerWhatsapp')" placeholder="08..." class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Email Pribadi</label><input v-model="settings.ownerEmail" type="email" placeholder="email@domain.com" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Instagram Pribadi</label><input v-model="settings.ownerInstagram" placeholder="@username" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 dark:border-white/5">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-4">Profil Studio</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Nama Studio / Brand</label><input v-model="settings.vendorName" placeholder="Cth: Lensa Pictura" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-bold text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">WA Admin Studio</label><input v-model="settings.vendorWhatsapp" @input="filterNumber('vendorWhatsapp')" placeholder="08..." class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Email Studio</label><input v-model="settings.vendorEmail" type="email" placeholder="admin@studio.com" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Instagram Studio</label><input v-model="settings.vendorInstagram" placeholder="@studio" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 px-4 rounded-xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white"></div>
              <div class="md:col-span-2 space-y-1.5"><label class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Alamat Basecamp</label><textarea v-model="settings.address" placeholder="Tuliskan alamat lengkap studio..." class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-4 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-medium text-slate-900 dark:text-white" rows="2"></textarea></div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-8 shadow-sm">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-4">Daftar Paket Layanan</h3>
            <div class="space-y-4 mb-4">
              <div v-for="(pkg, idx) in packages" :key="pkg.id" class="flex flex-col sm:flex-row gap-3 items-start sm:items-center group bg-slate-50/50 dark:bg-white/5 p-4 border border-slate-200/60 dark:border-white/10 rounded-2xl relative">
                <button @click="removeListItem(packages, idx)" class="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-rose-500 rounded-lg shadow-sm sm:static sm:bg-transparent sm:border-none sm:shadow-none sm:text-slate-400 sm:hover:text-rose-500 transition-colors z-10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                <div class="w-full sm:flex-1 space-y-1"><label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 sm:hidden">Nama Paket</label><input v-model="pkg.name" placeholder="Nama Paket (Cth: Graduation Gold)" class="w-full bg-white dark:bg-[#1a1a1a] sm:bg-transparent p-3 sm:p-1 rounded-xl sm:rounded-none border border-slate-200/60 dark:border-white/10 sm:border-none outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400"></div>
                <div class="w-full sm:w-48 space-y-1"><label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 sm:hidden">Harga</label><div class="flex items-center w-full bg-white dark:bg-[#1a1a1a] px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 focus-within:border-cyan-500/50 transition-colors"><span class="text-[11px] font-bold text-slate-400 mr-2">Rp</span><input v-model="pkg.price" type="number" placeholder="0" class="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white"></div></div>
              </div>
            </div>
            <button @click="addListItem(packages, { name: '', price: '' })" class="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Paket Baru</button>
          </div>
          
          <div class="pt-6 border-t border-slate-100 dark:border-white/5">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-4">Layanan Tambahan (Add-ons)</h3>
            <div class="space-y-4 mb-4">
              <div v-for="(addon, idx) in addons" :key="addon.id" class="flex flex-col sm:flex-row gap-3 items-start sm:items-center group bg-slate-50/50 dark:bg-white/5 p-4 border border-slate-200/60 dark:border-white/10 rounded-2xl relative">
                <button @click="removeListItem(addons, idx)" class="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-rose-500 rounded-lg shadow-sm sm:static sm:bg-transparent sm:border-none sm:shadow-none sm:text-slate-400 sm:hover:text-rose-500 transition-colors z-10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                <div class="w-full sm:flex-1 space-y-1"><label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 sm:hidden">Nama Layanan</label><input v-model="addon.name" placeholder="Cth: Tambah Cetak 12R" class="w-full bg-white dark:bg-[#1a1a1a] sm:bg-transparent p-3 sm:p-1 rounded-xl sm:rounded-none border border-slate-200/60 dark:border-white/10 sm:border-none outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400"></div>
                <div class="w-full sm:w-48 space-y-1"><label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 sm:hidden">Harga Tambahan</label><div class="flex items-center w-full bg-white dark:bg-[#1a1a1a] px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 focus-within:border-cyan-500/50 transition-colors"><span class="text-[11px] font-bold text-slate-400 mr-2">Rp</span><input v-model="addon.price" type="number" placeholder="0" class="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white"></div></div>
              </div>
            </div>
            <button @click="addListItem(addons, { name: '', price: '' })" class="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Add-ons</button>
          </div>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-2">Data Anggota Tim</h3>
          <div class="space-y-4 mb-4">
            <div v-for="(member, idx) in team" :key="member.id" class="p-5 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4 relative group">
              <button @click="removeListItem(team, idx)" class="absolute top-3 right-3 p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-md text-slate-400 hover:text-rose-500 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
              <div class="flex flex-col md:flex-row gap-3 pr-8">
                <input v-model="member.name" placeholder="Nama Tim" class="flex-1 bg-white dark:bg-[#1a1a1a] p-3 px-4 rounded-xl text-sm font-semibold outline-none border border-slate-200/60 dark:border-white/10 focus:border-cyan-400/50 text-slate-900 dark:text-white">
                <input v-model="member.whatsapp" @input="filterNumber(member, 'whatsapp')" placeholder="No. WhatsApp" class="flex-1 bg-white dark:bg-[#1a1a1a] p-3 px-4 rounded-xl text-sm font-medium outline-none border border-slate-200/60 dark:border-white/10 focus:border-cyan-400/50 text-slate-900 dark:text-white">
                <select v-model="member.role" class="bg-white dark:bg-[#1a1a1a] p-3 px-4 rounded-xl text-sm font-semibold outline-none border border-slate-200/60 dark:border-white/10 focus:border-cyan-400/50 cursor-pointer text-slate-900 dark:text-white">
                  <option value="FG">Photographer</option>
                  <option value="VG">Videographer</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                </select>
              </div>
              <div v-if="['FG', 'VG'].includes(member.role)" class="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-slate-200/60 dark:border-white/10 space-y-4">
                <div class="flex flex-wrap gap-1.5 w-full bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                  <button v-for="opt in ['Bawa Sendiri', 'Pinjam Studio', 'Sewa']" :key="opt" @click="member.eqStatus = opt" :class="member.eqStatus === opt ? 'bg-white dark:bg-[#111] text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-500 dark:text-gray-400'" class="px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all flex-1 md:flex-none">{{ opt }}</button>
                </div>
                <div v-if="['Bawa Sendiri', 'Sewa'].includes(member.eqStatus)" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div><label class="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Kamera (Body)</label><input v-model="member.eqBody" placeholder="Cth: Sony A7III" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 px-4 rounded-xl mt-1.5 text-xs font-medium outline-none focus:border-cyan-400 text-slate-900 dark:text-white"></div>
                  <div><label class="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Lighting / Flash</label><input v-model="member.eqFlash" placeholder="Cth: Godox V860II" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 px-4 rounded-xl mt-1.5 text-xs font-medium outline-none focus:border-cyan-400 text-slate-900 dark:text-white"></div>
                  <div class="md:col-span-2"><label class="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Lensa Detail</label><input v-model="member.eqLens" placeholder="Cth: 24-70mm f/2.8, 50mm f/1.8" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 px-4 rounded-xl mt-1.5 text-xs font-medium outline-none focus:border-cyan-400 text-slate-900 dark:text-white"></div>
                </div>
              </div>
            </div>
          </div>
          <button @click="addListItem(team, { name: '', whatsapp: '', role: 'FG', eqStatus: 'Bawa Sendiri', eqBody: '', eqLens: '', eqFlash: '' })" class="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Anggota Kru</button>
        </div>
      </div>

      <div class="space-y-6 md:space-y-8">
        
        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-2">Rekening Pembayaran</h3>
          <div class="space-y-4 mb-4">
            <div v-for="(bank, idx) in banks" :key="bank.id" class="p-5 bg-slate-50/50 dark:bg-white/5 rounded-2xl relative border border-slate-200/60 dark:border-white/10 group space-y-3">
              <button @click="removeListItem(banks, idx)" class="absolute top-3 right-3 p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-md text-slate-400 hover:text-rose-500 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bank / E-Wallet</label>
                <input v-model="bank.bankName" placeholder="Cth: BCA / DANA" class="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase outline-none focus:border-cyan-500/50 mt-1">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nomor Rekening</label>
                <input v-model="bank.number" placeholder="Masukkan nomor" class="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-white/10 p-3 rounded-xl font-mono font-bold text-sm outline-none text-slate-900 dark:text-white focus:border-cyan-500/50 mt-1">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Atas Nama</label>
                <input v-model="bank.owner" placeholder="Nama pemilik" class="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-white/10 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase outline-none focus:border-cyan-500/50 mt-1">
              </div>
            </div>
          </div>
          <button @click="addListItem(banks, { bankName: '', number: '', owner: '' })" class="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Rekening</button>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-4 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-2">Workflow (SOP)</h3>
          <p class="text-[10px] text-slate-500 dark:text-gray-400 mb-4">Template checklist otomatis untuk project baru.</p>
          <div class="space-y-3 mb-4">
            <div v-for="(task, idx) in workflowTemplate" :key="task.id" class="flex gap-2 items-center bg-slate-50/50 dark:bg-white/5 p-2 border border-slate-200/60 dark:border-white/10 rounded-xl">
              <span class="text-[10px] font-bold text-slate-400 ml-2">{{ idx + 1 }}</span>
              <input v-model="task.title" placeholder="Nama step" class="flex-1 bg-transparent px-2 outline-none text-xs font-medium text-slate-900 dark:text-white">
              <button @click="removeListItem(workflowTemplate, idx)" class="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          </div>
          <button @click="addListItem(workflowTemplate, { title: '' })" class="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 text-slate-500 dark:text-gray-400 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Step</button>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm lg:sticky lg:top-24">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-white mb-2">Inventaris Studio</h3>
          <div class="space-y-2 mb-4">
            <div v-for="(item, idx) in inventory" :key="item.id" class="flex gap-2 items-center bg-slate-50 dark:bg-white/5 p-2 px-3 rounded-xl border border-slate-200/60 dark:border-white/10">
              <input v-model="item.name" placeholder="Nama Alat" class="flex-1 bg-transparent p-1.5 text-xs font-medium outline-none text-slate-900 dark:text-white">
              <select v-model="item.type" class="bg-white dark:bg-[#1a1a1a] text-[9px] font-bold text-slate-600 dark:text-gray-300 outline-none cursor-pointer p-2 rounded-lg border border-slate-200/60 dark:border-white/10">
                <option value="Body">Body Kamera</option>
                <option value="Lens">Lensa</option>
                <option value="Flash">Flash / Lampu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <button @click="removeListItem(inventory, idx)" class="text-slate-300 hover:text-rose-500 p-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          </div>
          <button @click="addListItem(inventory, { name: '', type: 'Body' })" class="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 text-slate-500 dark:text-gray-400 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+ Tambah Aset</button>
        </div>

      </div>
    </div>

    <div class="mt-12 pt-8 border-t border-rose-100 dark:border-rose-900/30 px-2">
      <h3 class="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Danger Zone</h3>
      <p class="text-[11px] text-slate-500 dark:text-gray-400 mb-4">Tindakan ini akan menghapus seluruh data studio secara permanen.</p>
      <button @click.prevent="deleteAccount" class="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all">
        Hapus Akun Studio
      </button>
    </div>

    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all w-[90%] max-w-sm">
      <button @click="saveSettings" :disabled="isSaving" class="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-white transition-all shadow-2xl disabled:opacity-70" :class="isDark ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/20' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30 active:scale-95'">
        <span v-if="isSaving" class="animate-spin text-base">⏳</span>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
      </button>
    </div>
  </div>
</template>
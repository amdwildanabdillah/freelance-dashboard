<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import { useTheme } from '../theme'
import Swal from 'sweetalert2'

const { isDark } = useTheme()
const isSaving = ref(false)
const isLoading = ref(true)
const currentUser = ref(null)

// Sesuaikan field dengan Onboarding biar datanya ketarik!
const settings = ref({
  ownerName: '', whatsappOwner: '', igOwner: '', emailAdmin: '',
  vendorName: '', vendorWhatsapp: '', igVendor: '', website: '', address: '', logoUrl: ''
})

const newLogoFile = ref(null)
const logoPreview = ref('')

// Semua array fiturnya
const packages = ref([])
const addons = ref([])
const banks = ref([])
const inventory = ref([])
const team = ref([])

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

const filterNumber = (field) => {
  settings.value[field] = settings.value[field].replace(/\D/g, '')
}

const fetchAllData = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'vendors', currentUser.value.uid))
    if (docSnap.exists()) {
      const data = docSnap.data()
      
      // BACA DATA FLAT (Dari Onboarding) ATAU NESTED (Jaga-jaga)
      settings.value = {
        ownerName: data.ownerName || data.ownerInfo?.fullName || '',
        whatsappOwner: data.ownerWhatsapp || data.whatsapp || data.ownerInfo?.whatsapp || '',
        igOwner: data.igOwner || data.ownerInfo?.instagram || '',
        emailAdmin: data.emailAdmin || data.ownerInfo?.emailAdmin || '',
        
        vendorName: data.vendorName || data.vendorInfo?.name || '',
        vendorWhatsapp: data.vendorWhatsapp || data.whatsapp || data.vendorInfo?.whatsapp || '',
        igVendor: data.igVendor || data.vendorInfo?.instagram || '',
        website: data.website || data.vendorInfo?.website || '',
        address: data.address || data.vendorInfo?.address || '',
        logoUrl: data.logoUrl || data.vendorInfo?.logoUrl || ''
      }
      
      logoPreview.value = settings.value.logoUrl
      
      packages.value = data.packages || data.operational?.packages || []
      addons.value = data.addons || data.operational?.addons || []
      banks.value = data.banks || data.operational?.banks || []
      inventory.value = data.inventory || data.operational?.inventory || data.equipments || []
      team.value = data.team || data.operational?.team || []
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
  const fileName = `logo_${currentUser.value.uid}.${fileExt}` // Pake UID biar unik tapi rapi
  
  try {
    // TAMBAHIN upsert: true BIAR BISA NIBAN LOGO LAMA
    const { error } = await supabase.storage.from('shotflow-storage').upload(fileName, newLogoFile.value, {
      cacheControl: '3600',
      upsert: true 
    })
    
    if (error) throw error
    
    const { data } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    return data.publicUrl
  } catch (e) { 
    console.error("Gagal Upload ke Supabase:", e)
    return settings.value.logoUrl 
  }
}

const saveSettings = async () => {
  isSaving.value = true
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

  try {
    const finalLogo = await uploadLogo()
    const docRef = doc(db, 'vendors', currentUser.value.uid)
    
    // SIMPAN FLAT STRUCTURE BIAR DASHBOARD & PIPELINE GAK RUSAK
    await setDoc(docRef, {
      ownerName: settings.value.ownerName,
      ownerWhatsapp: settings.value.whatsappOwner,
      igOwner: settings.value.igOwner,
      emailAdmin: settings.value.emailAdmin,
      
      vendorName: settings.value.vendorName,
      vendorWhatsapp: settings.value.vendorWhatsapp,
      whatsapp: settings.value.vendorWhatsapp, // Fallback
      igVendor: settings.value.igVendor,
      website: settings.value.website,
      address: settings.value.address,
      logoUrl: finalLogo || '',
      
      packages: packages.value,
      addons: addons.value,
      banks: banks.value,
      inventory: inventory.value,
      team: team.value
    }, { merge: true })

    Swal.fire({ icon: 'success', title: 'Tersimpan!', showConfirmButton: false, timer: 1500 })
    newLogoFile.value = null
    logoPreview.value = finalLogo // Update preview setelah save
  } catch (e) { 
    Swal.fire('Gagal', e.message, 'error') 
  } finally { 
    isSaving.value = false 
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto py-10 px-6 space-y-12 pb-40 animate-in fade-in duration-500">
    
    <header>
      <h1 class="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-slate-900 dark:text-white">Vendor Settings</h1>
      <p class="text-sm text-slate-500 dark:text-gray-400 font-medium">Konfigurasi operasional, identitas studio, dan layanan Anda.</p>
    </header>

    <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center space-y-4">
      <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-500 font-bold">Sinkronisasi Data...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-8">
        
        <div class="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-8 shadow-sm">
          <div class="flex items-center gap-6">
            <div class="relative w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-2 bg-white dark:bg-transparent">
              <span v-else class="text-xs font-bold text-slate-400">No Logo</span>
              <input type="file" accept="image/*" @change="e => { newLogoFile = e.target.files[0]; logoPreview = URL.createObjectURL(newLogoFile) }" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
            <div>
              <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Logo Studio</p>
              <p class="text-xs font-bold text-slate-400">Klik kotak di samping untuk mengganti logo.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Owner</label>
              <input v-model="settings.ownerName" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">WA Owner (Pribadi)</label>
              <input v-model="settings.whatsappOwner" @input="filterNumber('whatsappOwner')" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Studio / Vendor</label>
              <input v-model="settings.vendorName" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">WA Admin (Publik)</label>
              <input v-model="settings.vendorWhatsapp" @input="filterNumber('vendorWhatsapp')" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Alamat Lengkap</label>
              <textarea v-model="settings.address" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 px-5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-8 shadow-sm">
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs font-black uppercase tracking-widest text-amber-500">Daftar Paket</h3>
              <button @click="addListItem(packages, { name: '', price: '' })" class="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors">+ Tambah</button>
            </div>
            <div class="space-y-3">
              <div v-for="(pkg, idx) in packages" :key="pkg.id" class="flex gap-3">
                <input v-model="pkg.name" placeholder="Nama Paket (Cth: Bronze)" class="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm">
                <input v-model="pkg.price" type="number" placeholder="Harga" class="w-1/3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm">
                <button @click="removeListItem(packages, idx)" class="text-slate-300 hover:text-red-500 px-2 font-bold">×</button>
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs font-black uppercase tracking-widest text-amber-500">Add-ons</h3>
              <button @click="addListItem(addons, { name: '', price: '' })" class="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors">+ Tambah</button>
            </div>
            <div class="space-y-3">
              <div v-for="(addon, idx) in addons" :key="addon.id" class="flex gap-3">
                <input v-model="addon.name" placeholder="Layanan (Cth: Cetak 12R)" class="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm">
                <input v-model="addon.price" type="number" placeholder="Harga" class="w-1/3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3.5 px-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm">
                <button @click="removeListItem(addons, idx)" class="text-slate-300 hover:text-red-500 px-2 font-bold">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-black uppercase tracking-widest text-emerald-500">Manajemen Tim</h3>
            <button @click="addListItem(team, { name: '', whatsapp: '', role: 'FG', eqStatus: 'Bawa Sendiri' })" class="text-xs font-black text-indigo-500">+ Tambah Anggota</button>
          </div>
          
          <div class="space-y-4">
            <div v-for="(member, idx) in team" :key="member.id" class="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-4 relative group">
              <button @click="removeListItem(team, idx)" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-all">×</button>
              
              <div class="flex flex-col md:flex-row gap-4 pr-6">
                <input v-model="member.name" placeholder="Nama Member" class="flex-1 bg-white dark:bg-black/20 p-3.5 px-5 rounded-xl text-sm font-bold outline-none border border-slate-200 dark:border-white/10 focus:border-emerald-500">
                <input v-model="member.whatsapp" @input="member.whatsapp = member.whatsapp.replace(/\D/g, '')" placeholder="WhatsApp" class="flex-1 bg-white dark:bg-black/20 p-3.5 px-5 rounded-xl text-sm font-bold outline-none border border-slate-200 dark:border-white/10 focus:border-emerald-500">
                <select v-model="member.role" class="bg-white dark:bg-black/20 p-3.5 px-5 rounded-xl text-sm font-bold outline-none border border-slate-200 dark:border-white/10 focus:border-emerald-500 cursor-pointer">
                  <option value="FG">Photographer</option>
                  <option value="VG">Videographer</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                </select>
              </div>
              
              <div v-if="['FG', 'VG'].includes(member.role)" class="bg-white/50 dark:bg-black/40 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center border border-slate-100 dark:border-white/5">
                <div class="flex flex-wrap gap-2 w-full md:w-auto">
                  <button v-for="opt in ['Bawa Sendiri', 'Pinjam Studio', 'Sewa']" :key="opt" @click="member.eqStatus = opt" :class="member.eqStatus === opt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex-1 md:flex-none">
                    {{ opt }}
                  </button>
                </div>
                <input v-if="['Bawa Sendiri', 'Sewa'].includes(member.eqStatus)" v-model="member.eqDetails" placeholder="Detail alat (Cth: Sony A7III)" class="flex-1 bg-transparent border-b border-slate-200 dark:border-white/10 p-2 text-xs font-bold outline-none focus:border-emerald-500 w-full">
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="space-y-8">
        
        <div class="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-black uppercase tracking-widest text-rose-500">Rekening</h3>
            <button @click="addListItem(banks, { bankName: '', number: '', owner: '' })" class="text-xs font-black text-indigo-500">+ Tambah</button>
          </div>
          <div class="space-y-4">
            <div v-for="(bank, idx) in banks" :key="bank.id" class="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl relative border border-slate-100 dark:border-white/5 group">
              <button @click="removeListItem(banks, idx)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold">×</button>
              <input v-model="bank.bankName" placeholder="Bank (BCA)" class="w-full bg-transparent text-[10px] font-black text-rose-500 uppercase outline-none mb-1">
              <input v-model="bank.number" placeholder="No. Rekening" class="w-full bg-transparent font-mono font-black text-lg outline-none mb-1 text-slate-800 dark:text-white">
              <input v-model="bank.owner" placeholder="Atas Nama" class="w-full bg-transparent text-[10px] font-bold text-slate-400 uppercase outline-none">
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-sm lg:sticky lg:top-8">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-black uppercase tracking-widest text-purple-500">Inventaris Studio</h3>
            <button @click="addListItem(inventory, { name: '', type: 'Body' })" class="text-xs font-black text-indigo-500">+ Tambah</button>
          </div>
          <div class="space-y-3">
            <div v-for="(item, idx) in inventory" :key="item.id" class="flex gap-2 items-center bg-slate-50 dark:bg-white/5 p-2 px-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <input v-model="item.name" placeholder="Nama Alat" class="flex-1 bg-transparent text-xs font-bold outline-none text-slate-800 dark:text-white">
              <select v-model="item.type" class="bg-transparent text-[9px] font-black uppercase text-purple-500 outline-none cursor-pointer">
                <option value="Body">Body</option>
                <option value="Lens">Lens</option>
                <option value="Flash">Flash</option>
                <option value="Lainnya">Misc</option>
              </select>
              <button @click="removeListItem(inventory, idx)" class="text-slate-300 hover:text-red-500 font-bold px-1">×</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <footer class="fixed bottom-0 left-0 right-0 p-6 md:p-8 z-40 flex justify-center pointer-events-none">
      <div class="max-w-6xl w-full flex justify-end pointer-events-auto">
        <button @click="saveSettings" :disabled="isSaving" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-500">
          <span v-if="isSaving" class="animate-spin text-lg">⏳</span>
          {{ isSaving ? 'Memproses...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </footer>

  </div>
</template>
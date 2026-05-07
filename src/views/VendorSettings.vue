<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const isSaving = ref(false)
const isLoading = ref(true)
const currentUser = ref(null)

// Penampung Data Gabungan
const settings = ref({
  // Owner Identity
  ownerName: '',
  ownerWhatsapp: '',
  ownerInstagram: '',
  ownerEmail: '',
  
  // Studio Identity
  vendorName: '',
  vendorTagline: '',
  vendorWhatsapp: '',
  vendorInstagram: '',
  vendorTiktok: '',
  vendorWebsite: '',
  vendorAddress: '',
  logoUrl: '',
})

// STATE LOGO YANG AMAN DARI BUG "LINK PALSU"
const newLogoFile = ref(null)
const logoPreview = ref('')

// Dynamic Lists
const packages = ref([])
const addons = ref([])
const team = ref([])
const accounts = ref([])
const equipments = ref([]) // <-- FITUR BARU INVENTARIS ALAT

// Helper Functions buat List
const addItem = (list, template) => list.push({ id: Date.now(), ...template })
const removeItem = (list, index) => list.splice(index, 1)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      await fetchSettings()
    }
  })
})

const fetchSettings = async () => {
  try {
    const docRef = doc(db, 'vendors', currentUser.value.uid)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      
      settings.value = {
        ownerName: data.ownerName || '',
        ownerWhatsapp: data.ownerWhatsapp || '',
        ownerInstagram: data.igOwner || '',
        ownerEmail: data.emailAdmin || currentUser.value.email,
        
        vendorName: data.vendorName || '',
        vendorTagline: data.tagline || '',
        vendorWhatsapp: data.whatsapp || '',
        vendorInstagram: data.igVendor || '',
        vendorTiktok: data.tiktok || '',
        vendorWebsite: data.website || '',
        vendorAddress: data.address || '',
        logoUrl: data.logoUrl || ''
      }
      
      // Tampilkan logo dari Firebase ke preview
      logoPreview.value = data.logoUrl || ''
      
      packages.value = data.packages || []
      addons.value = data.addons || []
      team.value = data.team || []
      accounts.value = data.banks || []
      equipments.value = data.equipments || [] // Narik data alat
    }
  } catch (error) {
    console.error(error)
    Swal.fire('Error', 'Gagal memuat data settings.', 'error')
  } finally {
    isLoading.value = false
  }
}

// Cuma ubah preview lokal, database aman
const handleLogoChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    newLogoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }
}

// Upload Logo Diperbaiki (Lebih Tahan Banting)
const uploadLogo = async () => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(newLogoFile.value)
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const resp = await fetch(import.meta.env.VITE_GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'UPLOAD_FILE',
            vendorName: settings.value.vendorName || 'Studio_Baru',
            fileName: `LOGO_${Date.now()}.png`,
            mimeType: newLogoFile.value.type,
            base64: base64
          })
        })
        const res = await resp.json()
        if (res.status === 'success') {
          resolve(res.url)
        } else {
          console.error("GAS Error:", res.msg)
          resolve('') // Kalau error GAS, kembaliin kosong
        }
      } catch (e) { 
        console.error("Fetch Error:", e)
        resolve('') // Kalau error Jaringan, kembaliin kosong
      }
    }
  })
}

const saveAll = async () => {
  if (!settings.value.vendorName || !settings.value.ownerName) {
    return Swal.fire('Oops', 'Nama Owner dan Vendor wajib diisi!', 'warning')
  }

  isSaving.value = true
  
  // Munculin Loading Gede biar user ga close tab pas proses bikin folder & upload
  Swal.fire({
    title: 'Menyimpan Data...',
    text: 'Mohon tunggu sebentar, sedang sinkronisasi dengan database dan storage.',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading() }
  })

  try {
    // 1. PERINTAH PAKSA BIKIN FOLDER STORAGE DI DRIVE
    await fetch(import.meta.env.VITE_GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'CREATE_VENDOR_FOLDER',
        vendorName: settings.value.vendorName
      })
    });

    const docRef = doc(db, 'vendors', currentUser.value.uid)
    
    // Ambil URL lama dulu
    let finalLogo = settings.value.logoUrl 

    // Kalau ada file baru, upload ke Drive
    if (newLogoFile.value) {
      const uploadedUrl = await uploadLogo()
      if (uploadedUrl) {
        finalLogo = uploadedUrl // Timpa pake link asli Google Drive
      } else {
        Swal.fire('Peringatan', 'Gagal upload Logo ke Drive, tapi data lain tersimpan.', 'warning')
      }
    }

    // 2. SIMPAN SEMUA DATA KE FIREBASE
    await updateDoc(docRef, {
      ownerName: settings.value.ownerName,
      ownerWhatsapp: settings.value.ownerWhatsapp,
      igOwner: settings.value.ownerInstagram,
      emailAdmin: settings.value.ownerEmail,
      
      vendorName: settings.value.vendorName,
      tagline: settings.value.vendorTagline,
      whatsapp: settings.value.vendorWhatsapp,
      igVendor: settings.value.vendorInstagram,
      tiktok: settings.value.vendorTiktok,
      website: settings.value.vendorWebsite,
      address: settings.value.vendorAddress,
      logoUrl: finalLogo || '', 
      
      packages: packages.value.map(p => ({ ...p, price: Number(p.price) })),
      addons: addons.value.map(a => ({ ...a, price: Number(a.price) })),
      // Map ulang team & gears biar formatnya bersih masuk database (sesuai bahasan)
      team: team.value.map(t => ({
        id: t.id, name: t.name, role: t.role, status: t.status,
        gears: t.gears ? t.gears.map(g => ({ name: g.name, type: g.type })) : []
      })),
      banks: accounts.value,
      equipments: equipments.value // Simpan data alat studio
    })

    Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Pengaturan studio berhasil diupdate.', timer: 2000, showConfirmButton: false })
    newLogoFile.value = null // Reset file baru
    settings.value.logoUrl = finalLogo // Sinkronisasi state internal

  } catch (e) {
    Swal.fire('Gagal Menyimpan', e.message, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 pb-20 px-4 mt-8 font-sans">
    
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[50vh]">
      <div class="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
      <p class="text-slate-400 font-bold">Sinkronisasi Database...</p>
    </div>

    <div v-else class="space-y-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 class="text-2xl font-black text-slate-900">Vendor Management</h2>
          <p class="text-sm text-slate-500 font-medium">Konfigurasi identitas, tim kreatif, dan aset inventaris studio.</p>
        </div>
        <button @click="saveAll" :disabled="isSaving" class="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center">
          <span v-if="isSaving" class="animate-spin mr-2">⏳</span>
          {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">01. Owner Identity (Private)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nama Lengkap Owner</label>
                <input v-model="settings.ownerName" type="text" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email Admin / SaaS</label>
                <input v-model="settings.ownerEmail" type="email" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">WA Pribadi Owner</label>
                <input v-model="settings.ownerWhatsapp" type="tel" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Instagram Pribadi</label>
                <input v-model="settings.ownerInstagram" type="text" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all">
              </div>
            </div>
          </div>

          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6">02. Studio Identity (Public)</h3>
            <div class="space-y-6">
              <div class="flex items-center gap-6">
                <div class="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden p-2 flex items-center justify-center">
                  <img v-if="logoPreview" :src="logoPreview" class="object-contain w-full h-full">
                </div>
                <label class="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer transition-all">
                  Upload Logo
                  <input type="file" class="hidden" @change="handleLogoChange" accept="image/*">
                </label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="md:col-span-2">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nama Studio / Brand</label>
                  <input v-model="settings.vendorName" type="text" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">WA Official Studio</label>
                  <input v-model="settings.vendorWhatsapp" type="tel" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Official Website</label>
                  <input v-model="settings.vendorWebsite" type="text" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tagline / Alamat Studio</label>
                  <textarea v-model="settings.vendorAddress" rows="2" class="w-full border-2 border-slate-50 p-3.5 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6">03. Packages & Add-ons</h3>
            <div class="space-y-8">
              <div>
                <p class="text-xs font-bold text-slate-800 mb-4">Daftar Paket Utama</p>
                <div class="space-y-3">
                  <div v-for="(p, i) in packages" :key="p.id" class="flex gap-3">
                    <input v-model="p.name" placeholder="Nama Paket" class="flex-1 border-2 border-slate-50 p-3 rounded-xl bg-slate-50 text-sm font-bold focus:bg-white focus:border-amber-400 outline-none">
                    <input v-model="p.price" type="number" placeholder="Harga" class="w-1/3 border-2 border-slate-50 p-3 rounded-xl bg-slate-50 text-sm font-bold focus:bg-white focus:border-amber-400 outline-none">
                    <button @click="removeItem(packages, i)" class="text-slate-300 hover:text-red-500 transition-colors">×</button>
                  </div>
                  <button @click="addItem(packages, {name: '', price: ''})" class="w-full py-3 border-2 border-dashed border-amber-100 text-amber-600 font-bold text-[10px] rounded-xl hover:bg-amber-50 transition-all">+ TAMBAH PAKET</button>
                </div>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800 mb-4">Layanan Tambahan (Add-ons)</p>
                <div class="space-y-3">
                  <div v-for="(a, i) in addons" :key="a.id" class="flex gap-3">
                    <input v-model="a.name" placeholder="Cth: Cetak 12R" class="flex-1 border-2 border-slate-50 p-3 rounded-xl bg-slate-50 text-sm font-bold focus:bg-white focus:border-amber-400 outline-none">
                    <input v-model="a.price" type="number" placeholder="Harga" class="w-1/3 border-2 border-slate-50 p-3 rounded-xl bg-slate-50 text-sm font-bold focus:bg-white focus:border-amber-400 outline-none">
                    <button @click="removeItem(addons, i)" class="text-slate-300 hover:text-red-500 transition-colors">×</button>
                  </div>
                  <button @click="addItem(addons, {name: '', price: ''})" class="w-full py-3 border-2 border-dashed border-amber-100 text-amber-600 font-bold text-[10px] rounded-xl hover:bg-amber-50 transition-all">+ TAMBAH ADD-ON</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          
          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-6">04. Inventaris Studio</h3>
            <p class="text-[10px] text-slate-400 font-bold mb-4">Kelola aset kamera/alat yang bisa dipinjamkan.</p>
            <div class="space-y-4">
              <div v-for="(gear, i) in equipments" :key="gear.id" class="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 relative group">
                <button @click="removeItem(equipments, i)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100">×</button>
                <input v-model="gear.name" placeholder="Nama Alat (Cth: Sony A7III)" class="w-full bg-transparent font-bold text-sm outline-none border-b border-transparent focus:border-purple-300 mb-2">
                <div class="flex gap-2">
                  <select v-model="gear.type" class="w-1/2 bg-white text-[10px] font-bold text-slate-600 p-2 rounded-lg border border-slate-200 outline-none">
                    <option value="Kamera">Kamera</option>
                    <option value="Lensa">Lensa</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <select v-model="gear.owner" class="w-1/2 bg-white text-[10px] font-bold text-slate-600 p-2 rounded-lg border border-slate-200 outline-none">
                    <option value="Milik Studio">Milik Studio</option>
                    <option value="Milik Tim">Milik Tim</option>
                    <option value="Sewa Luar">Sewa Luar</option>
                  </select>
                </div>
              </div>
              <button @click="addItem(equipments, {name: '', type: 'Kamera', owner: 'Milik Studio'})" class="w-full py-3 border-2 border-dashed border-purple-100 text-purple-600 font-bold text-[10px] rounded-xl hover:bg-purple-50 transition-all">+ TAMBAH ALAT</button>
            </div>
          </div>

          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6">05. Creative Team</h3>
            <div class="space-y-4">
              <div v-for="(t, i) in team" :key="t.id" class="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 relative group">
                <button @click="removeItem(team, i)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100">×</button>
                <input v-model="t.name" placeholder="Nama Member" class="w-full bg-transparent font-bold text-sm outline-none border-b border-transparent focus:border-emerald-300 mb-1">
                <input v-model="t.role" placeholder="Role (Cth: Lead Photo)" class="w-full bg-transparent text-[10px] font-black text-slate-400 uppercase outline-none border-b border-transparent focus:border-emerald-300">
              </div>
              <button @click="addItem(team, {name: '', role: '', status: 'Active'})" class="w-full py-3 border-2 border-dashed border-emerald-100 text-emerald-600 font-bold text-[10px] rounded-xl hover:bg-emerald-50 transition-all">+ TAMBAH TIM</button>
            </div>
          </div>

          <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 class="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6">06. Payment Accounts</h3>
            <div class="space-y-4">
              <div v-for="(b, i) in accounts" :key="b.id" class="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 group relative">
                <button @click="removeItem(accounts, i)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100">×</button>
                <input v-model="b.bank" placeholder="Bank" class="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mb-2 outline-none uppercase">
                <input v-model="b.number" placeholder="Nomor Rekening" class="w-full bg-transparent font-mono font-bold text-sm outline-none mb-1">
                <input v-model="b.owner" placeholder="Atas Nama" class="w-full bg-transparent text-[10px] font-bold text-slate-400 uppercase outline-none">
              </div>
              <button @click="addItem(accounts, {bank: '', number: '', owner: ''})" class="w-full py-3 border-2 border-dashed border-rose-100 text-rose-600 font-bold text-[10px] rounded-xl hover:bg-rose-50 transition-all">+ TAMBAH REKENING</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
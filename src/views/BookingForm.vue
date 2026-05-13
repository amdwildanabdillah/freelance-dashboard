<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const route = useRoute()
const isSubmitting = ref(false)
const isFetching = ref(true)

const vendorData = ref({
  vendorName: '',
  logoUrl: '',
  banks: [],
  packages: []
})

const proofFile = ref(null)

const form = ref({
  clientName: '',
  university: '',
  whatsapp: '',
  instagram: '',
  selectedPackage: '', 
  shootDate: '',
  sessionTime: '',
  location: '',
  note: '',
  paymentMethod: 'Transfer DP',
  selectedBank: '', 
  paymentProofUrl: '' 
})

let currentVendorId = route.params.vendorId || null

onMounted(() => {
  if (!currentVendorId) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentVendorId = user.uid
        await fetchVendorData()
      } else {
        Swal.fire('Error', 'Vendor ID tidak ditemukan. Link tidak valid.', 'error')
      }
    })
  } else {
    fetchVendorData()
  }
})

const fetchVendorData = async () => {
  try {
    const docRef = doc(db, 'vendors', currentVendorId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      vendorData.value = docSnap.data()
      if(vendorData.value.packages?.length > 0) form.value.selectedPackage = vendorData.value.packages[0]
      if(vendorData.value.banks?.length > 0) form.value.selectedBank = vendorData.value.banks[0]
    } else {
      Swal.fire('Not Found', 'Data Studio tidak ditemukan!', 'error')
    }
  } catch (error) {
    console.error("Error fetching vendor:", error)
  } finally {
    isFetching.value = false
  }
}

const handleFileUpload = (event) => {
  proofFile.value = event.target.files[0]
}

const uploadProofToSupabase = async () => {
  if (!proofFile.value) return ''

  const fileExt = proofFile.value.name.split('.').pop()
  const fileName = `TF_${form.value.clientName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`
  try {
    const { data, error } = await supabase.storage.from('shotflow-storage').upload(fileName, proofFile.value)
    if (error) throw error
    const { data: urlData } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    return urlData.publicUrl
  } catch (err) {
    console.error(err)
    return ''
  }
}

const submitBooking = async () => {
  if (!form.value.clientName || !form.value.whatsapp || !form.value.shootDate) {
    return Swal.fire('Data Belum Lengkap!', 'Nama, WhatsApp, dan Tanggal Sesi wajib diisi.', 'warning')
  }

  isSubmitting.value = true

  try {
    let uploadedUrl = ''
    if (proofFile.value && form.value.paymentMethod !== 'Cash') {
      uploadedUrl = await uploadProofToSupabase()
    }

    const projectData = {
      clientName: form.value.clientName,
      university: form.value.university,
      whatsapp: form.value.whatsapp,
      instagram: form.value.instagram,
      package: form.value.selectedPackage, 
      shootDate: form.value.shootDate,
      sessionTime: form.value.sessionTime,
      location: form.value.location,
      note: form.value.note,
      paymentMethod: form.value.paymentMethod,
      bankDestination: form.value.paymentMethod !== 'Cash' ? form.value.selectedBank : null,
      paymentProofUrl: uploadedUrl,
      status: 'lead', // Sesuai standarisasi pipeline baru
      createdAt: new Date().toISOString()
    }

    await addDoc(collection(db, 'vendors', currentVendorId, 'projects'), projectData)

    Swal.fire({
      title: 'Booking Terkirim!',
      text: 'Admin kami akan mengecek ketersediaan jadwal dan segera menghubungi Anda via WhatsApp.',
      icon: 'success',
      confirmButtonColor: '#06b6d4' 
    })
    
    form.value.clientName = ''
    form.value.university = ''
    proofFile.value = null

  } catch (error) {
    Swal.fire('Gagal Menyimpan', 'Sistem sedang sibuk: ' + error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#f4f5f7] dark:bg-[#050505] flex flex-col font-sans relative overflow-x-hidden transition-colors duration-500">
    
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-cyan-400/20 blur-[120px] mix-blend-normal"></div>
      <div class="absolute top-[40%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-500/20 blur-[120px] mix-blend-normal"></div>
    </div>

    <main class="relative z-10 w-full max-w-2xl mx-auto px-6 py-12 md:py-20">
      
      <div v-if="isFetching" class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500 dark:text-gray-400 font-bold animate-pulse">Menyiapkan Form Booking...</p>
      </div>

      <div v-else class="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
        
        <div class="text-center mb-10">
          <div class="w-20 h-20 mx-auto mb-4 rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 shadow-xl shadow-cyan-500/10 flex items-center justify-center bg-white dark:bg-[#111]">
            <img v-if="vendorData.logoUrl" :src="vendorData.logoUrl" class="w-full h-full object-contain p-1">
            <span v-else class="font-black text-2xl text-cyan-500">{{ vendorData.vendorName?.charAt(0) || 'V' }}</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">{{ vendorData.vendorName || 'Formulir Booking' }}</h1>
          <p class="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-1">Reservation Form</p>
        </div>

        <form @submit.prevent="submitBooking" class="bg-white/70 dark:bg-[#111]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/60 space-y-10">
          
          <div class="space-y-5">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-cyan-500">01. Informasi Klien</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input v-model="form.clientName" placeholder="Nama Lengkap & Gelar" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all text-sm font-semibold text-slate-900 dark:text-white">
              <input v-model="form.university" placeholder="Universitas / Instansi" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all text-sm font-semibold text-slate-900 dark:text-white">
              <input v-model="form.whatsapp" @input="form.whatsapp = form.whatsapp.replace(/\D/g, '')" type="tel" placeholder="Nomor WhatsApp" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all text-sm font-semibold text-slate-900 dark:text-white">
              <input v-model="form.instagram" placeholder="Instagram (@username)" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all text-sm font-semibold text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="space-y-5">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-cyan-500">02. Detail Sesi Foto</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2 relative">
                <select v-model="form.selectedPackage" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold appearance-none cursor-pointer text-slate-900 dark:text-white">
                  <option value="" disabled selected>Pilih Paket Layanan</option>
                  <option v-for="(pkg, idx) in vendorData.packages" :key="idx" :value="pkg">{{ pkg.name }} — {{ formatRupiah(pkg.price) }}</option>
                </select>
                <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 dark:text-white">▼</div>
              </div>
              <input v-model="form.shootDate" type="date" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold text-slate-900 dark:text-white dark:[color-scheme:dark]">
              <input v-model="form.sessionTime" type="time" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold text-slate-900 dark:text-white dark:[color-scheme:dark]">
              <div class="md:col-span-2">
                <input v-model="form.location" type="text" placeholder="Titik Kumpul / Lokasi (Detail)" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold text-slate-900 dark:text-white">
              </div>
              <div class="md:col-span-2">
                <textarea v-model="form.note" rows="2" placeholder="Catatan Tambahan (Opsional)..." class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold text-slate-900 dark:text-white"></textarea>
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-cyan-500">03. Pembayaran</h3>
            
            <div class="relative">
              <select v-model="form.paymentMethod" class="w-full bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-4 px-5 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold appearance-none cursor-pointer text-slate-900 dark:text-white">
                <option value="Transfer DP">Transfer - DP (Booking Fee)</option>
                <option value="Transfer Lunas">Transfer - Lunas</option>
                <option value="Cash">Bayar Tunai di Lokasi (Cash)</option>
              </select>
              <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 dark:text-white">▼</div>
            </div>

            <div v-if="form.paymentMethod !== 'Cash'" class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              
              <div class="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl p-5 flex flex-col justify-center">
                <p class="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Transfer Ke Rekening</p>
                <select v-model="form.selectedBank" class="w-full mb-3 border border-cyan-200/50 dark:border-cyan-500/30 p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] outline-none font-bold text-xs text-slate-700 dark:text-white cursor-pointer">
                  <option v-for="(bank, idx) in vendorData.banks" :key="idx" :value="bank">
                    {{ bank.bankName }} - A.N {{ bank.owner }}
                  </option>
                </select>
                <div v-if="form.selectedBank" class="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-cyan-100 dark:border-cyan-500/20 shadow-sm">
                  <p class="font-mono font-bold text-slate-800 dark:text-white text-base tracking-wider">{{ form.selectedBank.number }}</p>
                  <button type="button" @click="() => { navigator.clipboard.writeText(form.selectedBank.number); alert('Tersalin!') }" class="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1.5 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors">SALIN</button>
                </div>
              </div>

              <div>
                <div class="relative w-full border-2 border-dashed border-slate-300 dark:border-white/20 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 text-center hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all cursor-pointer flex flex-col justify-center h-full min-h-[140px]">
                  <input type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                  <svg v-if="!proofFile" class="w-6 h-6 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span class="text-xs font-semibold" :class="proofFile ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-gray-400'">
                    {{ proofFile ? proofFile.name : 'Klik / Drop Foto Bukti TF' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" :disabled="isSubmitting" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-cyan-500/30 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
              <span v-if="isSubmitting" class="animate-spin text-xl mr-2">⏳</span>
              {{ isSubmitting ? 'Mengirim Data...' : 'Kirim Reservasi' }}
            </button>
          </div>

        </form>

        <footer class="text-center pb-8">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Shotflow.</p>
          <p class="text-[9px] text-slate-400/60 mt-1">Sistem Manajemen Studio Visual by VIXEL CREATIVE</p>
        </footer>
      </div>
    </main>
  </div>
</template>
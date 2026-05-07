<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const route = useRoute()
const isSubmitting = ref(false)
const isFetching = ref(true)

// Data Vendor (Ditarik dari Firebase)
const vendorData = ref({
  vendorName: '',
  banks: [],
  packages: []
})

// Penampung File Bukti Bayar
const proofFile = ref(null)

const form = ref({
  clientName: '',
  university: '',
  whatsapp: '',
  instagram: '',
  selectedPackage: '', // Nanti isinya object {name, price}
  shootDate: '',
  sessionTime: '',
  location: '',
  note: '',
  paymentMethod: 'Transfer DP',
  selectedBank: '', // Bank tujuan transfer
  paymentProofUrl: '' 
})

// Deteksi Vendor ID (Dari URL parameter atau user login untuk preview)
let currentVendorId = route.params.vendorId || null

onMounted(() => {
  if (!currentVendorId) {
    // Mode Preview (Ambil dari user login)
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentVendorId = user.uid
        await fetchVendorData()
      } else {
        Swal.fire('Error', 'Vendor ID tidak ditemukan. Link tidak valid.', 'error')
      }
    })
  } else {
    // Mode Public Link
    fetchVendorData()
  }
})

// Tarik data profil vendor dari Firebase
const fetchVendorData = async () => {
  try {
    const docRef = doc(db, 'vendors', currentVendorId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      vendorData.value = docSnap.data()
      // Set default pilihan pertama
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

// Upload file ke Drive pakai API Gateway yang baru
const uploadProofToDrive = async () => {
  if (!proofFile.value) return ''

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(proofFile.value)
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const resp = await fetch(import.meta.env.VITE_GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'UPLOAD_FILE',
            vendorName: vendorData.value.vendorName,
            fileName: `TF_${form.value.clientName.replace(/\s+/g, '_')}_${Date.now()}.${proofFile.value.type.split('/')[1]}`,
            mimeType: proofFile.value.type,
            base64: base64
          })
        })
        const res = await resp.json()
        resolve(res.status === 'success' ? res.url : '')
      } catch (err) {
        console.error("Gagal upload bukti:", err)
        resolve('')
      }
    }
  })
}

// Eksekusi Form Booking
const submitBooking = async () => {
  if (!form.value.clientName || !form.value.whatsapp || !form.value.shootDate) {
    return Swal.fire('Data Belum Lengkap!', 'Nama, WhatsApp, dan Tanggal Sesi wajib diisi.', 'warning')
  }

  isSubmitting.value = true

  try {
    // 1. Upload Bukti Transfer ke Drive (Kalau ada)
    let uploadedUrl = ''
    if (proofFile.value && form.value.paymentMethod !== 'Cash') {
      uploadedUrl = await uploadProofToDrive()
    }

    // 2. Format Data untuk disimpan di Pipeline
    const projectData = {
      clientName: form.value.clientName,
      university: form.value.university,
      whatsapp: form.value.whatsapp,
      instagram: form.value.instagram,
      package: form.value.selectedPackage, // Object: {name, price}
      shootDate: form.value.shootDate,
      sessionTime: form.value.sessionTime,
      location: form.value.location,
      note: form.value.note,
      paymentMethod: form.value.paymentMethod,
      bankDestination: form.value.paymentMethod !== 'Cash' ? form.value.selectedBank : null,
      paymentProofUrl: uploadedUrl,
      status: 'Menunggu DP', // Status awal masuk Pipeline
      createdAt: new Date().toISOString()
    }

    // 3. Simpan ke Firestore (Sub-collection 'projects' di dalam dokumen vendor)
    await addDoc(collection(db, 'vendors', currentVendorId, 'projects'), projectData)

    Swal.fire({
      title: 'Booking Terkirim! 🎉',
      text: 'Admin kami akan mengecek ketersediaan jadwal dan segera menghubungi Anda via WhatsApp.',
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    })
    
    // Reset manual setelah sukses
    form.value.clientName = ''
    form.value.university = ''
    proofFile.value = null

  } catch (error) {
    Swal.fire('Waduh Gagal', 'Sistem sedang sibuk: ' + error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
    
    <div v-if="isFetching" class="flex flex-col items-center justify-center min-h-[60vh]">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p class="text-slate-500 font-bold animate-pulse">Menyiapkan Form Booking...</p>
    </div>

    <div v-else class="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      
      <div class="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
        <div class="relative z-10 flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-black mb-2 tracking-tight">{{ vendorData.vendorName || 'Formulir Booking' }}</h2>
            <p class="text-indigo-100 text-sm font-medium">Amankan jadwal momen berhargamu.</p>
          </div>
          <img v-if="vendorData.logoUrl" :src="vendorData.logoUrl" class="w-16 h-16 object-contain bg-white rounded-xl p-1 shadow-lg" alt="Logo">
        </div>
        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
      </div>

      <form @submit.prevent="submitBooking" class="p-8 space-y-8">
        
        <div>
          <h3 class="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">01. Informasi Klien</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Nama Lengkap & Gelar</label>
              <input v-model="form.clientName" type="text" placeholder="Masukkan nama..." class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Universitas / Instansi</label>
              <input v-model="form.university" type="text" placeholder="Nama kampus/sekolah..." class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">No. WhatsApp Aktif</label>
              <input v-model="form.whatsapp" type="tel" placeholder="08xxxxxxxxxx" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Instagram</label>
              <input v-model="form.instagram" type="text" placeholder="@username" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm">
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">02. Detail Sesi Foto</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Pilih Paket Layanan</label>
              <select v-model="form.selectedPackage" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-amber-400 transition-all font-bold text-sm text-slate-700 cursor-pointer">
                <option v-for="(pkg, idx) in vendorData.packages" :key="idx" :value="pkg">
                  {{ pkg.name }} — {{ formatRupiah(pkg.price) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Tanggal Sesi</label>
              <input v-model="form.shootDate" type="date" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-amber-400 transition-all font-bold text-sm text-slate-700">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Waktu / Jam Sesi</label>
              <input v-model="form.sessionTime" type="time" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-amber-400 transition-all font-bold text-sm text-slate-700">
            </div>
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Titik Kumpul / Lokasi</label>
              <input v-model="form.location" type="text" placeholder="Detail lokasi..." class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-amber-400 transition-all font-bold text-sm">
            </div>
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Catatan Tambahan</label>
              <textarea v-model="form.note" rows="2" placeholder="Permintaan khusus..." class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-amber-400 transition-all font-bold text-sm"></textarea>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">03. Pembayaran</h3>
          
          <div class="mb-5">
            <select v-model="form.paymentMethod" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold text-sm text-slate-700 cursor-pointer">
              <option value="Transfer DP">Transfer - DP (Booking Fee)</option>
              <option value="Transfer Lunas">Transfer - Lunas</option>
              <option value="Cash">Bayar Tunai di Lokasi (Cash)</option>
            </select>
          </div>

          <div v-if="form.paymentMethod !== 'Cash'" class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
            <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 h-full flex flex-col justify-center">
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Transfer Ke Rekening</p>
              
              <select v-model="form.selectedBank" class="w-full mb-3 border border-emerald-200 p-2 rounded-lg bg-white outline-none font-bold text-xs text-slate-700 cursor-pointer">
                <option v-for="(bank, idx) in vendorData.banks" :key="idx" :value="bank">
                  {{ bank.bank }} - A.N {{ bank.owner }}
                </option>
              </select>

              <div v-if="form.selectedBank" class="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <div>
                  <p class="font-mono font-black text-slate-800 text-lg tracking-wider">{{ form.selectedBank.number }}</p>
                </div>
                <button type="button" @click="() => { navigator.clipboard.writeText(form.selectedBank.number); alert('Tersalin!') }" class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">SALIN</button>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Upload Bukti Transfer</label>
              <div class="relative w-full border-2 border-dashed border-slate-300 p-3 rounded-2xl bg-slate-50 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col justify-center h-[120px]">
                <input type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                <svg v-if="!proofFile" class="w-6 h-6 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span class="text-xs font-bold" :class="proofFile ? 'text-emerald-600' : 'text-slate-500'">
                  {{ proofFile ? proofFile.name : 'Klik / Drop Foto Bukti' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" :disabled="isSubmitting" class="w-full bg-slate-900 text-white font-black text-sm uppercase tracking-wider py-5 rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSubmitting ? 'Mengirim Data...' : 'Kirim Form Booking' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
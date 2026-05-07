<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2'

const isSubmitting = ref(false)

// SIMULASI DATA DARI VENDOR SETTINGS (Nanti ditarik dari Database)
const vendorSettings = ref({
  bankName: 'BCA',
  accountNumber: '8221081234',
  accountName: 'Ahmad Wildan Abdillah'
})

const form = ref({
  clientName: '',
  university: '',
  whatsapp: '',
  instagram: '',
  package: 'Graduation BRONZE (Rp 250.000)',
  shootDate: '',
  sessionTime: '',
  location: '',
  note: '',
  paymentMethod: 'Transfer DP', // Default baru
  paymentProofName: '' 
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.paymentProofName = file.name
  }
}

const submitBooking = async () => {
  if (!form.value.clientName || !form.value.whatsapp) {
    Swal.fire('Data Belum Lengkap!', 'Nama dan WhatsApp wajib diisi.', 'warning')
    return
  }

  isSubmitting.value = true

  try {
    const url = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'SAVE_BOOKING',
        data: form.value
      })
    })

    const result = await response.json()

    if (result.status === 'success') {
      Swal.fire({
        title: 'Booking Terkirim! 🎉',
        text: 'Mohon tunggu, Admin kami akan mengecek ketersediaan jadwal dan segera menghubungi Anda via WhatsApp.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      })
      
      // Reset form
      form.value = {
        clientName: '', university: '', whatsapp: '', instagram: '',
        package: 'Graduation BRONZE (Rp 250.000)', shootDate: '', sessionTime: '', location: '', note: '', paymentMethod: 'Transfer DP', paymentProofName: ''
      }
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    Swal.fire('Waduh Gagal', 'Sistem sedang sibuk: ' + error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      
      <!-- Header Branding -->
      <div class="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
        <div class="relative z-10">
          <h2 class="text-3xl font-bold mb-2">Formulir Booking Sesi</h2>
          <p class="text-indigo-100 text-sm">Amankan jadwal momen berhargamu. Mohon isi data dengan lengkap dan benar.</p>
        </div>
        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
      </div>

      <form @submit.prevent="submitBooking" class="p-8 space-y-8">
        
        <!-- SECTION 1 & 2 (Sama seperti sebelumnya, aku persingkat di sini biar rapi) -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 border-b pb-2 mb-4">1. Informasi Klien</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nama Lengkap beserta Gelar</label>
              <input v-model="form.clientName" type="text" placeholder="Masukkan nama lengkap..." class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Universitas / Instansi</label>
              <input v-model="form.university" type="text" placeholder="Masukkan nama instansi..." class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">No. WhatsApp Aktif</label>
              <input v-model="form.whatsapp" type="tel" placeholder="08xxxxxxxxxx" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Username Instagram</label>
              <input v-model="form.instagram" type="text" placeholder="Tanpa @ (Opsional)" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold text-slate-800 border-b pb-2 mb-4">2. Detail Sesi Foto</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Pilih Paket Layanan</label>
              <select v-model="form.package" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700">
                <option>Graduation BRONZE (Rp 250.000)</option>
                <option>Graduation SILVER (Rp 400.000)</option>
                <option>Graduation GOLD (Rp 600.000)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tanggal Sesi</label>
              <input v-model="form.shootDate" type="date" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Waktu / Jam Sesi</label>
              <input v-model="form.sessionTime" type="time" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Titik Kumpul / Lokasi Detail</label>
              <input v-model="form.location" type="text" placeholder="Masukkan lokasi detail pertemuan..." class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Catatan Tambahan (Opsional)</label>
              <textarea v-model="form.note" rows="3" placeholder="Tuliskan permintaan khusus, jumlah keluarga yang ikut, dll..." class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"></textarea>
            </div>
          </div>
        </div>

        <!-- SECTION 3: Pembayaran Dinamis -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 border-b pb-2 mb-4">3. Metode Pembayaran</h3>
          
          <div class="mb-6">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Sistem Pembayaran</label>
            <select v-model="form.paymentMethod" class="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700">
              <option value="Transfer DP">Transfer - DP (Down Payment)</option>
              <option value="Transfer Lunas">Transfer - Lunas (Full Payment)</option>
              <option value="Cash">Cash / Tunai di Lokasi Sesi</option>
            </select>
          </div>

          <!-- Bagian ini HANYA MUNCUL kalau klien milih Transfer (DP / Lunas) -->
          <div v-if="form.paymentMethod !== 'Cash'" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <!-- Info Rekening Dinamis dari vendorSettings -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 h-full flex flex-col justify-center">
              <p class="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-3">Rekening Vendor</p>
              <div class="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">{{ vendorSettings.bankName }}</div>
                  <div>
                    <p class="font-bold text-slate-800 text-sm">{{ vendorSettings.accountNumber }}</p>
                    <p class="text-xs text-slate-500">a.n {{ vendorSettings.accountName }}</p>
                  </div>
                </div>
                <button type="button" @click="() => { navigator.clipboard.writeText(vendorSettings.accountNumber); alert('No. Rekening disalin!') }" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">SALIN</button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Upload Bukti Transfer</label>
              <div class="relative w-full border-2 border-dashed border-slate-300 p-3 rounded-xl bg-slate-50 text-center hover:border-indigo-400 transition-colors cursor-pointer flex flex-col justify-center h-full min-h-[90px]">
                <input type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                <span class="text-xs font-medium text-slate-500 px-4">
                  {{ form.paymentProofName || '+ Klik / Drop Bukti (Opsional jika bayar nanti)' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4">
          <button type="submit" :disabled="isSubmitting" class="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed">
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? 'Memproses Data...' : 'Kirim Form Booking' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
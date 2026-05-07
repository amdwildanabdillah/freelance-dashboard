<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const step = ref(1)
const isLoading = ref(false)
const currentUser = ref(null)

const vendorData = ref({
  vendorName: '', 
  ownerName: '',
  whatsapp: '',
  instagram: '',
  emailAdmin: '' 
})

// Tambahan buat melengkapi setup awal
const packages = ref([{ id: 1, name: 'Graduation Gold', price: 600000 }])
const banks = ref([{ id: 1, bankName: 'BRI', accountNumber: '', accountOwner: '' }])

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      vendorData.value.ownerName = user.displayName || ''
      vendorData.value.emailAdmin = user.email || ''
    } else {
      router.push('/login')
    }
  })
})

const createSystem = async () => {
  if (!vendorData.value.vendorName || !vendorData.value.whatsapp) {
    return Swal.fire('Eits!', 'Nama Vendor & WhatsApp wajib diisi ya bos.', 'warning')
  }

  isLoading.value = true
  try {
    // ID Vendor pake UID dari Firebase Auth (KTP Unik)
    const vendorId = currentUser.value.uid
    
    // Simpan data ke Collection 'vendors'
    await setDoc(doc(db, 'vendors', vendorId), {
      ...vendorData.value,
      packages: packages.value.map(p => ({ name: p.name, price: p.price })),
      banks: banks.value.map(b => ({ bank: b.bankName, number: b.accountNumber, owner: b.accountOwner })),
      role: 'owner',
      isSetupComplete: true,
      createdAt: new Date().toISOString()
    })

    // Berhasil! Pindah ke step sukses
    step.value = 2
  } catch (error) {
    Swal.fire('Gagal Activate', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-indigo-600 flex items-center justify-center p-6 font-sans">
    <div class="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
      
      <div v-if="step === 1" class="p-8 md:p-12">
        <h2 class="text-2xl font-black text-slate-800 mb-2">Setup Vendor Baru</h2>
        <p class="text-slate-500 text-sm mb-8">Lengkapi data di bawah untuk mengaktifkan sistem ShotFlow kamu.</p>
        
        <div class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Vendor / Studio</label>
              <input v-model="vendorData.vendorName" type="text" placeholder="Contoh: Storydesto" class="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none focus:border-indigo-500/20 focus:bg-white transition-all font-bold">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Pemilik</label>
              <input v-model="vendorData.ownerName" type="text" class="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none font-semibold">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. WhatsApp</label>
              <input v-model="vendorData.whatsapp" type="tel" placeholder="08..." class="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none font-semibold">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label class="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Paket Utama (Contoh)</label>
              <input v-model="packages[0].name" type="text" class="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none text-sm font-bold">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Harga Paket (Rp)</label>
              <input v-model="packages[0].price" type="number" class="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none text-sm font-bold">
            </div>
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-emerald-400 uppercase mb-1">Info Rekening Pembayaran (Bank | No. Rek | A.N)</label>
              <div class="flex gap-2">
                 <input v-model="banks[0].bankName" placeholder="Bank" class="w-1/4 border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none text-xs font-bold">
                 <input v-model="banks[0].accountNumber" placeholder="Norek" class="flex-1 border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none text-xs font-bold">
                 <input v-model="banks[0].accountOwner" placeholder="Nama" class="w-1/3 border-2 border-slate-100 p-3 rounded-xl bg-slate-50 outline-none text-xs font-bold">
              </div>
            </div>
          </div>
        </div>

        <button @click="createSystem" :disabled="isLoading" class="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center">
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isLoading ? 'Generating Database...' : 'Generate My System' }}
        </button>
      </div>

      <div v-else class="p-12 text-center">
        <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 class="text-3xl font-black text-slate-800">System Activated!</h2>
        <p class="text-slate-500 text-sm mt-2 mb-8">Database terisolasi untuk **{{ vendorData.vendorName }}** sudah siap digunakan.</p>
        
        <div class="bg-indigo-50 p-5 rounded-2xl mb-8 border border-indigo-100">
          <p class="text-[10px] font-bold text-indigo-400 uppercase mb-1">Your Vendor ID</p>
          <p class="font-mono text-indigo-700 font-bold break-all">{{ currentUser?.uid }}</p>
        </div>

        <button @click="router.push('/')" class="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-all">
          Masuk ke Dashboard
        </button>
      </div>

    </div>
  </div>
</template>
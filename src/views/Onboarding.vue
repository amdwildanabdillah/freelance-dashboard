<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const router = useRouter()
const step = ref(1)
const isLoading = ref(false)
const currentUser = ref(null)

// 1. Data Profil Lengkap (Produksi)
const vendorData = ref({
  vendorName: '',
  ownerName: '',
  whatsapp: '',
  igVendor: '',
  igOwner: '',
  logoUrl: '', 
  emailAdmin: ''
})

const logoFile = ref(null)

// 2. Data Paket Dinamis
const packages = ref([{ id: Date.now(), name: '', price: '' }])
const addPackage = () => packages.value.push({ id: Date.now(), name: '', price: '' })
const removePackage = (index) => packages.value.length > 1 ? packages.value.splice(index, 1) : null

// 3. Data Rekening Dinamis
const banks = ref([{ id: Date.now(), bankName: '', accountNumber: '', accountOwner: '' }])
const addBank = () => banks.value.push({ id: Date.now(), bankName: '', accountNumber: '', accountOwner: '' })
const removeBank = (index) => banks.value.length > 1 ? banks.value.splice(index, 1) : null

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

const uploadLogoToDrive = async () => {
  if (!logoFile.value) return '';
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(logoFile.value);
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const resp = await fetch(import.meta.env.VITE_GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'UPLOAD_FILE',
            vendorName: vendorData.value.vendorName,
            fileName: `LOGO_${vendorData.value.vendorName.replace(/\s+/g, '_')}.png`,
            mimeType: logoFile.value.type,
            base64: base64
          })
        });
        const res = await resp.json();
        resolve(res.status === 'success' ? res.url : ''); 
      } catch (err) {
        resolve('');
      }
    };
  });
}

// FUNGSI UTAMA: Save Setup (Udah Pake Logika Paksa Bikin Folder)
const saveSetup = async () => {
  if (!vendorData.value.vendorName || !vendorData.value.whatsapp || !vendorData.value.ownerName) {
    return Swal.fire('Data Belum Lengkap', 'Nama Vendor, Owner, & WhatsApp wajib diisi.', 'warning');
  }

  isLoading.value = true;
  
  // Loading gede biar gak diclose pas lagi bikin folder
  Swal.fire({
    title: 'Membangun Ekosistem...',
    text: 'Sedang membuat Cloud Storage & Database untuk studiomu.',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading() }
  });

  try {
    const uid = currentUser.value.uid;

    // 1. PAKSA BIKIN FOLDER KE DRIVE DULUAN
    await fetch(import.meta.env.VITE_GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'CREATE_VENDOR_FOLDER',
        vendorName: vendorData.value.vendorName
      })
    });

    // 2. UPLOAD LOGO KALAU ADA
    let finalLogoUrl = '';
    if (logoFile.value) {
      finalLogoUrl = await uploadLogoToDrive();
    }

    // 3. SIMPAN KE FIREBASE
    const finalData = {
      ...vendorData.value,
      logoUrl: finalLogoUrl || '',
      packages: packages.value.map(p => ({ name: p.name, price: Number(p.price) })),
      banks: banks.value.map(b => ({ bank: b.bankName, number: b.accountNumber, owner: b.accountOwner })),
      isSetupComplete: true,
      role: 'owner',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'vendors', uid), finalData);

    // 4. LOG KE SHEET ADMIN
    await fetch(import.meta.env.VITE_GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'LOG_NEW_VENDOR',
        vendorName: vendorData.value.vendorName,
        ownerName: vendorData.value.ownerName,
        email: vendorData.value.emailAdmin,
        whatsapp: vendorData.value.whatsapp
      })
    });

    Swal.close();
    step.value = 2;
  } catch (error) {
    Swal.fire('Error Production', error.message, 'error');
  } finally {
    isLoading.value = false;
  }
}

const handleFileChange = (e) => {
  logoFile.value = e.target.files[0];
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
    <div class="max-w-3xl mx-auto">
      
      <div v-if="step === 1" class="space-y-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Setup Your Studio</h2>
          <p class="mt-2 text-sm text-slate-500 font-medium">Lengkapi profil sistem manajemen vendor Anda.</p>
        </div>

        <div class="bg-white shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden border border-slate-100">
          
          <div class="p-8 md:p-10 border-b border-slate-50">
            <h3 class="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">01. Studio Identity</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-400 mb-2">Nama Vendor / Brand</label>
                <input v-model="vendorData.vendorName" type="text" placeholder="Contoh: Storydesto" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 mb-2">Nama Pemilik / Founder</label>
                <input v-model="vendorData.ownerName" type="text" placeholder="Nama Lengkap" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 mb-2">WhatsApp Admin</label>
                <input v-model="vendorData.whatsapp" type="tel" placeholder="08..." class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-sm">
              </div>
              <div class="md:col-span-2 mt-2">
                <label class="block text-xs font-bold text-slate-400 mb-2">Upload Logo Studio</label>
                <input @change="handleFileChange" type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-colors border-2 border-dashed border-slate-200 p-2 rounded-xl">
              </div>
            </div>
          </div>

          <div class="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30">
            <h3 class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6">02. Social Media</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                 <label class="block text-xs font-bold text-slate-400 mb-2">Instagram Vendor</label>
                 <input v-model="vendorData.igVendor" type="text" placeholder="@storydesto" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-white focus:border-blue-500 outline-none transition-all font-semibold text-sm">
              </div>
              <div>
                 <label class="block text-xs font-bold text-slate-400 mb-2">Instagram Pemilik</label>
                 <input v-model="vendorData.igOwner" type="text" placeholder="@username" class="w-full border-2 border-slate-100 p-3.5 rounded-xl bg-white focus:border-blue-500 outline-none transition-all font-semibold text-sm">
              </div>
            </div>
          </div>

          <div class="p-8 md:p-10 border-b border-slate-50">
            <h3 class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6">03. Service Packages</h3>
            <div class="space-y-3">
              <div v-for="(pkg, idx) in packages" :key="idx" class="flex gap-3">
                <input v-model="pkg.name" placeholder="Nama Paket (Contoh: Gold Package)" class="flex-1 border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-amber-400 outline-none font-bold text-sm transition-all">
                <input v-model="pkg.price" type="number" placeholder="Harga (Rp)" class="w-1/3 border-2 border-slate-100 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-amber-400 outline-none font-bold text-sm transition-all">
                <button @click="removePackage(idx)" class="p-3.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <button @click="addPackage" class="w-full mt-3 py-3.5 border-2 border-dashed border-amber-200 text-amber-600 font-bold text-xs rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center">
                + Tambah Paket Layanan
              </button>
            </div>
          </div>

          <div class="p-8 md:p-10 bg-slate-50/50">
            <h3 class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6">04. Payment Account</h3>
            <div class="space-y-4">
              <div v-for="(bank, idx) in banks" :key="idx" class="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white border-2 border-slate-100 rounded-2xl relative shadow-sm">
                <div class="md:col-span-3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank</label>
                  <input v-model="bank.bankName" placeholder="BCA / BRI" class="w-full border-b-2 border-slate-50 py-2 outline-none focus:border-emerald-500 font-bold text-sm uppercase">
                </div>
                <div class="md:col-span-4">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. Rekening</label>
                  <input v-model="bank.accountNumber" placeholder="1234567890" class="w-full border-b-2 border-slate-50 py-2 outline-none focus:border-emerald-500 font-mono font-bold text-sm">
                </div>
                <div class="md:col-span-4">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Atas Nama</label>
                  <input v-model="bank.accountOwner" placeholder="Nama Lengkap" class="w-full border-b-2 border-slate-50 py-2 outline-none focus:border-emerald-500 font-bold text-sm uppercase">
                </div>
                <div class="md:col-span-1 flex justify-end items-center">
                  <button @click="removeBank(idx)" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <button @click="addBank" class="w-full mt-2 py-3.5 border-2 border-dashed border-emerald-200 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center">
                + Tambah Rekening Baru
              </button>
            </div>
          </div>

          <div class="p-8 md:p-10 bg-white border-t border-slate-100">
            <button @click="saveSetup" :disabled="isLoading" class="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center text-sm uppercase tracking-wide">
              {{ isLoading ? 'Deploying System...' : 'Generate System & Start Dashboard' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 px-6">
        <div class="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg class="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 class="text-3xl font-black text-slate-900 mb-3 tracking-tight">System Activated!</h2>
        <p class="text-slate-500 text-sm mb-10 max-w-sm mx-auto leading-relaxed">Database vendor <strong class="text-slate-800">{{ vendorData.vendorName }}</strong> berhasil diisolasi dan siap digunakan.</p>
        <button @click="router.push('/')" class="w-full max-w-xs mx-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all text-sm block">
          Buka Dashboard
        </button>
      </div>

    </div>
  </div>
</template>
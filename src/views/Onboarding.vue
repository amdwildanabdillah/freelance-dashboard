<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import Swal from 'sweetalert2'

const router = useRouter()
const step = ref(1)
const isLoading = ref(false)
const currentUser = ref(null)

// Tema & Preferensi
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// Data yang disederhanakan untuk Onboarding
const setupData = ref({
  // Owner Info (Private)
  ownerName: '',
  ownerWhatsapp: '',
  ownerInstagram: '',
  emailAdmin: '', // Email kontak bisnis
  
  // Vendor Info (Public)
  vendorName: '',
  vendorWhatsapp: '',
  vendorInstagram: '',
  vendorWebsite: '',
  vendorAddress: '',
  logoUrl: ''
})

const logoFile = ref(null)
const isUploadingLogo = ref(false)
const logoUploadSuccess = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      setupData.value.ownerName = user.displayName || ''
      setupData.value.emailAdmin = user.email || ''
    } else {
      router.push('/login')
    }
  })
})

const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (!setupData.value.vendorName) {
    return Swal.fire('Perhatian', 'Isi Nama Vendor terlebih dahulu sebelum upload logo.', 'warning')
  }

  logoFile.value = file
  isUploadingLogo.value = true
  logoUploadSuccess.value = false
  
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `logo_${Date.now()}_${setupData.value.vendorName.replace(/\s+/g, '_')}.${fileExt}`
    const { data, error } = await supabase.storage
      .from('shotflow-storage')
      .upload(fileName, file)

    if (error) throw error
    const { data: publicUrlData } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    setupData.value.logoUrl = publicUrlData.publicUrl
    logoUploadSuccess.value = true
  } catch (error) {
    Swal.fire('Gagal Upload', error.message, 'error')
    logoFile.value = null
  } finally {
    isUploadingLogo.value = false
  }
}

const saveSetup = async () => {
  // Validasi Dasar
  if (!setupData.value.ownerName || !setupData.value.vendorName || !setupData.value.ownerWhatsapp) {
    return Swal.fire('Data Belum Lengkap', 'Nama Pemilik, Nama Vendor, dan WhatsApp Pemilik wajib diisi.', 'warning')
  }

  isLoading.value = true
  Swal.fire({ title: 'Membangun Ekosistem...', text: 'Sedang mendaftarkan studio Anda.', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } })

  try {
    const payload = {
      ownerInfo: {
        fullName: setupData.value.ownerName,
        whatsapp: setupData.value.ownerWhatsapp,
        instagram: setupData.value.ownerInstagram,
        emailAdmin: setupData.value.emailAdmin,
        emailLogin: currentUser.value.email
      },
      vendorInfo: {
        name: setupData.value.vendorName,
        whatsapp: setupData.value.vendorWhatsapp,
        instagram: setupData.value.vendorInstagram,
        website: setupData.value.vendorWebsite,
        address: setupData.value.vendorAddress,
        logoUrl: setupData.value.logoUrl
      },
      // Inisialisasi array kosong untuk operasional yang diisi di settings
      operational: {
        packages: [],
        addons: [],
        banks: [],
        inventory: [],
        team: []
      },
      isSetupComplete: true,
      createdAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'vendors', currentUser.value.uid), payload)
    
    Swal.close()
    step.value = 4 // Langsung ke Success Step
  } catch (error) {
    Swal.fire('Gagal', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen relative font-sans transition-colors duration-500 overflow-hidden flex flex-col" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-slate-900'">
    
    <!-- Top Bar -->
    <div class="w-full px-6 py-5 flex justify-between items-center relative z-50 border-b transition-colors" :class="isDarkMode ? 'border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md' : 'border-slate-100 bg-white/80 backdrop-blur-md'">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br" :class="isDarkMode ? 'from-cyan-400 to-blue-500' : 'from-slate-800 to-slate-900'">
          <span class="text-white font-black text-xs">S</span>
        </div>
        <h1 class="text-lg font-black tracking-tight uppercase" :class="isDarkMode ? 'text-white' : 'text-slate-900'">ShotFlow</h1>
      </div>
      <button @click="toggleTheme" class="p-2 rounded-full border transition-all" :class="isDarkMode ? 'bg-white/10 text-cyan-400 hover:bg-white/20 border-white/10' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'">
        <svg v-if="isDarkMode" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      </button>
    </div>

    <div class="flex-grow w-full max-w-xl mx-auto relative z-10 px-6 py-10 pb-32 flex flex-col justify-center">
      
      <!-- Step 1 -->
      <div v-if="step === 1" class="w-full transition-all duration-300 animate-fade-in">
        <div class="mb-8">
          <h2 class="text-3xl font-black tracking-tight uppercase" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Data Pemilik</h2>
          <p class="text-sm font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Informasi internal untuk manajemen akun Anda.</p>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Nama Lengkap Pemilik</label>
            <input v-model="setupData.ownerName" type="text" placeholder="Masukkan nama sesuai identitas" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">WhatsApp Pribadi</label>
              <input v-model="setupData.ownerWhatsapp" @input="setupData.ownerWhatsapp = setupData.ownerWhatsapp.replace(/\D/g, '')" type="tel" placeholder="08..." class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Instagram Pribadi</label>
              <input v-model="setupData.ownerInstagram" type="text" placeholder="@username" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2" class="w-full transition-all duration-300 animate-fade-in">
        <div class="mb-8">
          <h2 class="text-3xl font-black tracking-tight uppercase" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Identitas Studio</h2>
          <p class="text-sm font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Profil publik yang akan tampil di form booking dan invoice.</p>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Nama Vendor / Brand</label>
            <input v-model="setupData.vendorName" type="text" placeholder="Masukkan nama brand studio" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">WhatsApp Admin</label>
              <input v-model="setupData.vendorWhatsapp" @input="setupData.vendorWhatsapp = setupData.vendorWhatsapp.replace(/\D/g, '')" type="tel" placeholder="Nomor kontak pelanggan" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Email Admin</label>
              <input v-model="setupData.emailAdmin" type="email" placeholder="email@bisnis.com" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest mb-2" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Alamat Lengkap Studio</label>
            <textarea v-model="setupData.vendorAddress" placeholder="Jalan, No Rumah, Kec, Kota/Kab" class="w-full border-b-2 py-3 bg-transparent outline-none font-bold text-base transition-all" :class="isDarkMode ? 'border-white/20 focus:border-cyan-400 text-white placeholder-gray-600' : 'border-slate-200 focus:border-slate-900 text-slate-900 placeholder-slate-400'" rows="2"></textarea>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div v-else-if="step === 3" class="w-full transition-all duration-300 animate-fade-in text-center">
        <h2 class="text-3xl font-black tracking-tight uppercase mb-2" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Upload Logo</h2>
        <p class="text-sm font-medium mb-10" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Identitas visual akan muncul otomatis di Invoice.</p>
        
        <div class="mb-10">
          <div class="w-32 h-32 border-2 border-dashed rounded-full mx-auto flex items-center justify-center overflow-hidden mb-6 transition-all relative" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/20' : 'bg-slate-50 border-slate-300'">
             <div v-if="isUploadingLogo" class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
               <span class="animate-spin text-white">⚙️</span>
             </div>
             <img v-if="setupData.logoUrl" :src="setupData.logoUrl" class="w-full h-full object-contain p-4">
             <span v-else class="text-4xl" :class="isDarkMode ? 'text-white/20' : 'text-slate-300'">+</span>
          </div>
          <label class="inline-block px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest cursor-pointer transition-all border" :class="isDarkMode ? 'bg-transparent text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-black' : 'bg-transparent text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white'">
            {{ isUploadingLogo ? 'Mengunggah...' : 'Pilih Logo' }}
            <input type="file" @change="handleFileChange" accept="image/*" class="hidden" :disabled="isUploadingLogo">
          </label>
          
          <div v-if="logoUploadSuccess" class="mt-4 text-xs font-bold text-emerald-500 uppercase tracking-widest">Logo Terunggah ✓</div>
        </div>
      </div>

      <!-- Step 4: Success -->
      <div v-else class="text-center w-full transition-all duration-300 animate-fade-in py-10">
        <div class="w-20 h-20 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl text-emerald-500">✓</div>
        <h2 class="text-3xl font-black tracking-tight uppercase mb-2" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Selesai</h2>
        <p class="mb-10 font-medium" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Ekosistem {{ setupData.vendorName }} telah dibangun.</p>
      </div>

    </div>

    <!-- Bottom Navigation Bar -->
    <div v-if="step < 4" class="fixed bottom-0 left-0 w-full px-6 py-6 border-t flex justify-between items-center z-50 backdrop-blur-md" :class="isDarkMode ? 'bg-[#0a0a0a]/90 border-white/10' : 'bg-white/90 border-slate-100'">
      <!-- Progress Dots -->
      <div class="flex gap-3">
        <div class="w-2 h-2 rounded-full transition-all" :class="step === 1 ? (isDarkMode ? 'bg-cyan-400 w-6' : 'bg-slate-900 w-6') : (isDarkMode ? 'bg-white/20' : 'bg-slate-200')"></div>
        <div class="w-2 h-2 rounded-full transition-all" :class="step === 2 ? (isDarkMode ? 'bg-cyan-400 w-6' : 'bg-slate-900 w-6') : (isDarkMode ? 'bg-white/20' : 'bg-slate-200')"></div>
        <div class="w-2 h-2 rounded-full transition-all" :class="step === 3 ? (isDarkMode ? 'bg-cyan-400 w-6' : 'bg-slate-900 w-6') : (isDarkMode ? 'bg-white/20' : 'bg-slate-200')"></div>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-4">
        <button v-if="step > 1" @click="step--" class="text-xs font-bold uppercase tracking-widest px-4 transition-colors" :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'">Kembali</button>
        
        <button v-if="step < 3" @click="step++" class="px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center gap-2" :class="isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-black'">
          Lanjut <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>

        <button v-if="step === 3" @click="saveSetup" :disabled="isLoading || isUploadingLogo" class="px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center gap-2" :class="isDarkMode ? 'bg-cyan-500 text-white hover:bg-cyan-400' : 'bg-slate-900 text-white hover:bg-black'">
          {{ isLoading ? 'Memproses...' : 'Selesaikan' }}
        </button>
      </div>
    </div>

    <div v-if="step === 4" class="fixed bottom-0 left-0 w-full px-6 py-6 z-50 flex justify-center backdrop-blur-md" :class="isDarkMode ? 'bg-[#0a0a0a]/90' : 'bg-white/90'">
        <button @click="router.push('/')" class="w-full max-w-xl px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all" :class="isDarkMode ? 'bg-cyan-500 text-white hover:bg-cyan-400' : 'bg-slate-900 text-white hover:bg-black'">Masuk Dashboard</button>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
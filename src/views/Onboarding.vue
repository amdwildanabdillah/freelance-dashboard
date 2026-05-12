<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { supabase } from '../supabase'
import { useTheme } from '../theme'
import Swal from 'sweetalert2'

const router = useRouter()
const { isDark } = useTheme()
const step = ref(1)
const isLoading = ref(false)
const currentUser = ref(null)

const setupData = ref({
  ownerName: '', ownerWhatsapp: '', ownerInstagram: '', emailAdmin: '',
  vendorName: '', vendorWhatsapp: '', vendorInstagram: '', vendorWebsite: '', vendorAddress: '', logoUrl: ''
})

const logoFile = ref(null)
const logoPreview = ref('')

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

const filterNumber = (field) => {
  setupData.value[field] = setupData.value[field].replace(/\D/g, '')
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }
}

const uploadLogoToSupabase = async () => {
  if (!logoFile.value) return ''
  const fileExt = logoFile.value.name.split('.').pop()
  const safeName = setupData.value.vendorName ? setupData.value.vendorName.replace(/\s+/g, '_') : 'Studio'
  const fileName = `logo_${currentUser.value.uid}_${safeName}.${fileExt}`
  
  try {
    const { error } = await supabase.storage.from('shotflow-storage').upload(fileName, logoFile.value, {
      cacheControl: '3600',
      upsert: true
    })
    if (error) throw error
    const { data } = supabase.storage.from('shotflow-storage').getPublicUrl(fileName)
    return data.publicUrl
  } catch (error) { 
    console.error(error)
    return '' 
  }
}

const saveSetup = async () => {
  if (!setupData.value.ownerName || !setupData.value.vendorName || !setupData.value.ownerWhatsapp) {
    return Swal.fire('Data Belum Lengkap', 'Nama Pemilik, Vendor, dan WA wajib diisi.', 'warning')
  }
  isLoading.value = true
  Swal.fire({ title: 'Membangun Ekosistem...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

  try {
    let finalLogoUrl = ''
    if (logoFile.value) finalLogoUrl = await uploadLogoToSupabase()

    const payload = {
      ownerName: setupData.value.ownerName,
      ownerWhatsapp: setupData.value.ownerWhatsapp,
      igOwner: setupData.value.ownerInstagram,
      emailAdmin: setupData.value.emailAdmin,
      emailLogin: currentUser.value.email,
      
      vendorName: setupData.value.vendorName,
      vendorWhatsapp: setupData.value.vendorWhatsapp,
      igVendor: setupData.value.vendorInstagram,
      website: setupData.value.vendorWebsite,
      address: setupData.value.vendorAddress,
      logoUrl: finalLogoUrl,
      
      packages: [], addons: [], banks: [], inventory: [], team: [],
      isSetupComplete: true, createdAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'vendors', currentUser.value.uid), payload, { merge: true })
    Swal.close()
    step.value = 4
  } catch (error) {
    Swal.fire('Gagal', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col font-sans overflow-hidden relative transition-colors duration-300" :class="isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
    
    <div class="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center z-0 mix-blend-overlay" :class="isDark ? 'opacity-30' : 'opacity-10'"></div>

    <nav class="fixed top-0 w-full backdrop-blur-xl border-b z-20 flex justify-between items-center px-6 py-4" :class="isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-slate-200'">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-full shadow-lg shadow-cyan-500/20 bg-gradient-to-br" :class="isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-500 to-blue-600'">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
          </svg>
        </div>
        <h1 class="text-xl font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">Shotflow<span :class="isDark ? 'text-cyan-400' : 'text-cyan-600'">.</span></h1>
      </div>
      
      <div v-if="step < 4" class="flex gap-2">
        <div class="w-2 h-2 rounded-full transition-all duration-300" :class="step >= 1 ? (isDark ? 'bg-cyan-400' : 'bg-cyan-500') : (isDark ? 'bg-white/20' : 'bg-slate-300')"></div>
        <div class="w-2 h-2 rounded-full transition-all duration-300" :class="step >= 2 ? (isDark ? 'bg-cyan-400' : 'bg-cyan-500') : (isDark ? 'bg-white/20' : 'bg-slate-300')"></div>
        <div class="w-2 h-2 rounded-full transition-all duration-300" :class="step >= 3 ? (isDark ? 'bg-cyan-400' : 'bg-cyan-500') : (isDark ? 'bg-white/20' : 'bg-slate-300')"></div>
      </div>
    </nav>

    <main class="relative z-10 w-full max-w-lg mx-auto px-6 pt-32 pb-40 min-h-screen flex flex-col justify-center">
      
      <div class="backdrop-blur-2xl border p-8 md:p-12 rounded-[2.5rem] shadow-xl transition-all duration-300" :class="isDark ? 'bg-[#0a0a0a]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200/50'">
        
        <section v-if="step === 1" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <header class="text-center mb-8">
            <h2 class="text-2xl font-bold tracking-tight mb-2">Identitas Pemilik</h2>
            <p class="text-xs font-medium" :class="isDark ? 'text-gray-400' : 'text-slate-500'">Lengkapi informasi dasar profil Anda.</p>
          </header>
          <div class="space-y-4">
            <input v-model="setupData.ownerName" type="text" placeholder="Nama Lengkap Owner" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            <input v-model="setupData.ownerWhatsapp" @input="filterNumber('ownerWhatsapp')" type="tel" inputmode="numeric" placeholder="WhatsApp Pribadi (08...)" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            <input v-model="setupData.ownerInstagram" type="text" placeholder="Username Instagram (@...)" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
          </div>
        </section>

        <section v-else-if="step === 2" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <header class="text-center mb-8">
            <h2 class="text-2xl font-bold tracking-tight mb-2">Profil Studio</h2>
            <p class="text-xs font-medium" :class="isDark ? 'text-gray-400' : 'text-slate-500'">Merek yang akan dilihat oleh klien.</p>
          </header>
          <div class="space-y-4">
            <input v-model="setupData.vendorName" type="text" placeholder="Nama Brand / Studio" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            <input v-model="setupData.vendorWhatsapp" @input="filterNumber('vendorWhatsapp')" type="tel" inputmode="numeric" placeholder="WhatsApp Admin Studio" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            <textarea v-model="setupData.vendorAddress" placeholder="Alamat Basecamp Studio" class="w-full border p-5 px-6 rounded-[2rem] text-sm font-medium outline-none transition-all" :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'" rows="3"></textarea>
          </div>
        </section>

        <section v-else-if="step === 3" class="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <header class="mb-8">
            <h2 class="text-2xl font-bold tracking-tight mb-2">Logo Studio</h2>
            <p class="text-xs font-medium" :class="isDark ? 'text-gray-400' : 'text-slate-500'">Gunakan PNG transparan untuk hasil terbaik.</p>
          </header>
          
          <div class="relative w-40 h-40 mx-auto group">
            <div class="absolute inset-0 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all shadow-sm" :class="isDark ? 'bg-white/5 border-white/20 group-hover:border-cyan-400/50' : 'bg-slate-50 border-slate-300 group-hover:border-cyan-500/50'">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-4" :class="isDark ? 'bg-transparent' : 'bg-white'">
              <div v-else class="text-center" :class="isDark ? 'text-gray-500' : 'text-slate-400'">
                <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <span class="text-[10px] font-semibold tracking-widest uppercase">Upload</span>
              </div>
            </div>
            <input type="file" @change="handleFileChange" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
          </div>
          
          <div v-if="logoFile" class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border" :class="isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ logoFile.name }}
          </div>
        </section>

        <section v-else class="text-center space-y-6 animate-in zoom-in">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl bg-gradient-to-br" :class="isDark ? 'from-cyan-400 to-blue-500 shadow-cyan-500/20' : 'from-cyan-500 to-blue-600 shadow-cyan-500/30'">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <h2 class="text-2xl font-bold tracking-tight mb-2">Semua Siap!</h2>
            <p class="text-xs font-medium" :class="isDark ? 'text-gray-400' : 'text-slate-500'">Studio Anda telah diisolasi di cloud.</p>
          </div>
        </section>
      </div>

    </main>

    <footer class="fixed bottom-0 w-full backdrop-blur-xl border-t z-20 px-6 py-6 pb-8" :class="isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-slate-200'">
      <div class="max-w-lg mx-auto flex justify-between gap-4">
        
        <button v-if="step > 1 && step < 4" @click="step--" class="w-14 h-14 rounded-full flex items-center justify-center border active:scale-95 transition-all shadow-sm" :class="isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div v-else class="w-14 h-14"></div> <button v-if="step < 3" @click="step++" class="flex-1 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-r text-white active:scale-[0.98] transition-all shadow-lg" :class="isDark ? 'from-cyan-400 to-blue-500 shadow-cyan-500/20' : 'from-cyan-500 to-blue-600 shadow-cyan-500/30'">
          Lanjut
          <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        
        <button v-if="step === 3" @click="saveSetup" :disabled="isLoading" class="flex-1 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-r text-white active:scale-[0.98] transition-all shadow-lg disabled:opacity-70" :class="isDark ? 'from-cyan-400 to-blue-500 shadow-cyan-500/20' : 'from-cyan-500 to-blue-600 shadow-cyan-500/30'">
          <span v-if="isLoading" class="animate-spin text-lg mr-2">⏳</span>
          {{ isLoading ? 'Memproses...' : 'Selesaikan Setup' }}
        </button>

        <button v-if="step === 4" @click="router.push('/')" class="w-full h-14 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-r text-white active:scale-[0.98] transition-all shadow-lg" :class="isDark ? 'from-cyan-400 to-blue-500 shadow-cyan-500/20' : 'from-cyan-500 to-blue-600 shadow-cyan-500/30'">
          Masuk Dashboard
        </button>
      </div>
    </footer>

  </div>
</template>
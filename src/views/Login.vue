<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const router = useRouter()
const isLoading = ref(false)
const isLoginMode = ref(true)
const isDarkMode = ref(false)

const email = ref('')
const password = ref('')
const ownerName = ref('')

const provider = new GoogleAuthProvider()

const handleSignIn = async () => {
  if (!email.value || !password.value) return Swal.fire('Error', 'Isi email dan password!', 'warning')
  isLoading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/dashboard') 
  } catch (error) {
    Swal.fire('Gagal', 'Email atau password salah.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (!email.value || !password.value || !ownerName.value) return Swal.fire('Error', 'Lengkapi semua data!', 'warning')
  isLoading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)
    await setDoc(doc(db, 'vendors', cred.user.uid), {
      ownerInfo: { fullName: ownerName.value, emailLogin: email.value, role: 'owner' },
      isSetupComplete: false, createdAt: new Date().toISOString()
    })
    router.push('/onboarding')
  } catch (error) {
    Swal.fire('Gagal', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const loginWithGoogle = async () => {
  isLoading.value = true
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const vendorRef = doc(db, 'vendors', user.uid)
    const vendorSnap = await getDoc(vendorRef)

    if (vendorSnap.exists()) {
      router.push('/dashboard')
    } else {
      await setDoc(vendorRef, {
        ownerInfo: { fullName: user.displayName, emailLogin: user.email, role: 'owner' },
        isSetupComplete: false, createdAt: new Date().toISOString()
      })
      router.push('/onboarding')
    }
  } catch (error) {
    Swal.fire('Error', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden relative transition-colors duration-300" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
      
      <!-- Mode Toggle Button -->
      <button @click="isDarkMode = !isDarkMode" class="absolute top-6 right-6 z-50 p-2.5 rounded-full backdrop-blur-md border transition-all" :class="isDarkMode ? 'bg-white/10 text-cyan-400 hover:bg-white/20 border-white/10' : 'bg-white/80 text-slate-600 hover:bg-white shadow-sm border-slate-200'">
        <svg v-if="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      </button>

      <div class="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center z-0 mix-blend-overlay" :class="isDarkMode ? 'opacity-30' : 'opacity-10'"></div>

      <div class="relative z-10 w-full md:w-5/12 p-8 md:p-16 flex flex-col justify-center min-h-[30vh] md:min-h-screen border-b md:border-b-0 md:border-r backdrop-blur-xl" :class="isDarkMode ? 'border-white/10 bg-[#0a0a0a]/80' : 'border-slate-200 bg-white/80'">
        
        <div class="w-full max-w-md mx-auto md:mx-0">
          <div class="flex items-center gap-3 mb-8">
            <div class="p-3 rounded-full shadow-lg shadow-cyan-500/20 bg-gradient-to-br" :class="isDarkMode ? 'from-cyan-400 to-blue-500' : 'from-cyan-500 to-blue-600'">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
              </svg>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Shotflow<span :class="isDarkMode ? 'text-cyan-400' : 'text-cyan-600'">.</span></h1>
          </div>
          
          <h2 class="text-xl md:text-2xl font-bold leading-tight mb-4" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
            Manage your creative studio, <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r" :class="isDarkMode ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-600'">seamlessly.</span>
          </h2>
          
          <p class="text-sm md:text-base leading-relaxed mb-10 border-b pb-8" :class="isDarkMode ? 'text-gray-400 border-white/10' : 'text-slate-500 border-slate-200'">
            Platform manajemen eksklusif untuk Creative Agency & Photography Vendor.
          </p>

          <div class="space-y-4">
            <div class="flex items-center gap-4 border p-4 rounded-2xl transition" :class="isDarkMode ? 'bg-white/5 border-white/10 hover:border-cyan-400/50' : 'bg-white border-slate-200 shadow-sm hover:border-cyan-500/50'">
              <i class="ph ph-kanban text-xl" :class="isDarkMode ? 'text-cyan-400' : 'text-cyan-600'"></i>
              <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-300' : 'text-slate-700'">Pipeline Klien Otomatis</span>
            </div>
            <div class="flex items-center gap-4 border p-4 rounded-2xl transition" :class="isDarkMode ? 'bg-white/5 border-white/10 hover:border-cyan-400/50' : 'bg-white border-slate-200 shadow-sm hover:border-cyan-500/50'">
              <i class="ph ph-receipt text-xl" :class="isDarkMode ? 'text-cyan-400' : 'text-cyan-600'"></i>
              <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-300' : 'text-slate-700'">Generate Invoice Instan</span>
            </div>
            <div class="flex items-center gap-4 border p-4 rounded-2xl transition" :class="isDarkMode ? 'bg-white/5 border-white/10 hover:border-cyan-400/50' : 'bg-white border-slate-200 shadow-sm hover:border-cyan-500/50'">
              <i class="ph ph-calendar-check text-xl" :class="isDarkMode ? 'text-cyan-400' : 'text-cyan-600'"></i>
              <span class="text-sm font-medium" :class="isDarkMode ? 'text-gray-300' : 'text-slate-700'">Smart Calendar & Tim</span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 w-full md:w-7/12 px-6 py-12 md:px-24 flex flex-col justify-center min-h-[70vh] md:min-h-screen backdrop-blur-2xl" :class="isDarkMode ? 'bg-[#0a0a0a]/90' : 'bg-white/90'">
        
        <div class="w-full max-w-md mx-auto">
          <div class="mb-10 text-center md:text-left">
            <h2 class="text-2xl md:text-3xl font-bold tracking-tight mb-2" :class="isDarkMode ? 'text-white' : 'text-slate-900'">{{ isLoginMode ? 'Welcome Back' : 'Get Started' }}</h2>
            <p class="text-sm" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">{{ isLoginMode ? 'Akses dashboard operasional studio Anda.' : 'Buat akun manajemen khusus Owner.' }}</p>
          </div>
          
          <button @click="loginWithGoogle" :disabled="isLoading" class="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-full border active:scale-[0.98] transition-all duration-300 mb-8 text-sm" :class="isDarkMode ? 'bg-white text-black border-transparent hover:bg-gray-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Lanjutkan dengan Google
          </button>

          <div class="relative flex items-center py-2 mb-8">
            <div class="flex-grow border-t" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'"></div>
            <span class="flex-shrink-0 mx-4 text-[10px] font-bold tracking-widest uppercase" :class="isDarkMode ? 'text-gray-500' : 'text-slate-400'">Atau dengan Email</span>
            <div class="flex-grow border-t" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'"></div>
          </div>

          <div class="space-y-5">
            <div v-if="!isLoginMode">
              <input v-model="ownerName" type="text" placeholder="Nama Lengkap Owner" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            </div>
            <div>
              <input v-model="email" type="email" placeholder="Email Akses (nama@domain.com)" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            </div>
            <div>
              <input v-model="password" type="password" placeholder="Password (Min. 6 Karakter)" class="w-full border p-4 px-6 rounded-full text-sm font-medium outline-none transition-all" :class="isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500/50'">
            </div>
            
            <button @click="isLoginMode ? handleSignIn() : handleRegister()" :disabled="isLoading" class="w-full py-4 mt-4 bg-gradient-to-r text-white rounded-full text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center shadow-lg shadow-cyan-500/20" :class="isDarkMode ? 'from-cyan-400 to-blue-500' : 'from-cyan-500 to-blue-600'">
              <span v-if="isLoading" class="animate-spin mr-2">⏳</span>
              {{ isLoginMode ? 'Masuk Sekarang' : 'Daftar Studio' }}
            </button>
          </div>

          <p class="text-center text-sm font-medium mt-10" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">
            {{ isLoginMode ? 'Belum mendaftarkan studio?' : 'Sudah punya akun operasional?' }}
            <button @click="isLoginMode = !isLoginMode" class="font-bold transition-colors ml-1" :class="isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'">
              {{ isLoginMode ? 'Buat Akun' : 'Masuk di sini' }}
            </button>
          </p>

        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Aku pakai ikon Phosphor (ph) yang sama dengan di Home.jsx Vixel kamu */
@import url('https://unpkg.com/@phosphor-icons/web/src/regular/style.css');
</style>
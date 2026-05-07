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

const email = ref('')
const password = ref('')
const joinCode = ref('')

const provider = new GoogleAuthProvider()

// 1. LOGIN / REGISTER PAKAI GOOGLE (Khusus Owner)
const loginWithGoogle = async () => {
  isLoading.value = true
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    
    const vendorRef = doc(db, 'vendors', user.uid)
    const vendorSnap = await getDoc(vendorRef)

    if (vendorSnap.exists()) {
      Swal.fire({ title: 'Welcome Back!', text: `Halo, ${user.displayName}`, icon: 'success', timer: 1500, showConfirmButton: false })
      router.push('/')
    } else {
      Swal.fire({ title: 'Akun Baru Terdeteksi', text: 'Mari setup profil Vendor Anda.', icon: 'info', timer: 2000, showConfirmButton: false })
      await setDoc(vendorRef, {
        ownerName: user.displayName,
        email: user.email,
        role: 'owner',
        createdAt: new Date().toISOString(),
        isSetupComplete: false
      })
      router.push('/onboarding')
    }
  } catch (error) {
    Swal.fire('Login Gagal', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// 2. LOGIN / REGISTER PAKAI EMAIL (Buat Admin)
const handleEmailAuth = async () => {
  if (!email.value || !password.value) return Swal.fire('Error', 'Isi email dan password!', 'warning')
  isLoading.value = true
  
  try {
    if (isLoginMode.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
      Swal.fire({ title: 'Login Berhasil', icon: 'success', timer: 1500, showConfirmButton: false })
      router.push('/') 
    } else {
      if (!joinCode.value) {
        Swal.fire('Error', 'Masukkan Kode Undangan (Join Code) dari Owner!', 'error')
        isLoading.value = false
        return
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      const user = userCredential.user
      
      await setDoc(doc(db, 'staff', user.uid), {
        email: user.email,
        role: 'admin',
        vendorJoinCode: joinCode.value,
        createdAt: new Date().toISOString()
      })
      
      Swal.fire({ title: 'Pendaftaran Berhasil', text: 'Anda tergabung sebagai Admin.', icon: 'success', timer: 2000, showConfirmButton: false })
      router.push('/')
    }
  } catch (error) {
    Swal.fire('Gagal', error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// 3. FUNGSI JALUR VVIP: AKUN DEMO
const loginAsDemo = async () => {
  isLoading.value = true
  const demoEmail = 'demo@shotflow.id'
  const demoPass = 'cobagratis123' 
  
  try {
    // Coba Login duluan
    await signInWithEmailAndPassword(auth, demoEmail, demoPass)
    Swal.fire({ title: 'Masuk Mode Demo', icon: 'success', timer: 1500, showConfirmButton: false })
    router.push('/')
  } catch (error) {
    // Kalau ternyata error gara-gara akunnya belum ada, KITA BIKININ OTOMATIS!
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass)
        await setDoc(doc(db, 'vendors', cred.user.uid), {
          ownerName: 'Demo User',
          email: demoEmail,
          role: 'owner',
          createdAt: new Date().toISOString(),
          isSetupComplete: true, // Biar ga dilempar ke onboarding
          vendorName: 'Demo Vendor Studio'
        })
        Swal.fire({ title: 'Akun Demo Siap!', text: 'Otomatis masuk ke Dashboard...', icon: 'success', timer: 1500, showConfirmButton: false })
        router.push('/')
      } catch (err) {
        Swal.fire('Gagal Bikin Demo', err.message, 'error')
      }
    } else {
      Swal.fire('Error Demo', error.message, 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
    <div class="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
      
      <div class="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-800 opacity-90"></div>
        <div class="absolute -top-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
          <h1 class="text-4xl font-black tracking-tight mb-4">ShotFlow.</h1>
          <p class="text-indigo-100 text-lg mb-8 font-medium">SaaS Management Platform khusus untuk Creative Agency & Photography Vendor.</p>
          
          <div class="space-y-5">
            <div class="flex items-center text-indigo-100 text-sm font-medium">
              <div class="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center mr-4 shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              Kelola Pipeline Klien Otomatis
            </div>
            <div class="flex items-center text-indigo-100 text-sm font-medium">
              <div class="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center mr-4 shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402-2.599-1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              Generate Invoice & Bagi Hasil
            </div>
            <div class="flex items-center text-indigo-100 text-sm font-medium">
              <div class="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center mr-4 shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              Smart Calendar & Penugasan Tim
            </div>
          </div>
        </div>
      </div>

      <div class="md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white relative">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900">{{ isLoginMode ? 'Selamat Datang Kembali' : 'Gabung ke Vendor' }}</h2>
          <p class="text-slate-500 text-sm mt-2">{{ isLoginMode ? 'Masuk ke dashboard manajemen Anda.' : 'Daftar sebagai Admin/Staff dengan kode undangan.' }}</p>
        </div>

        <button v-if="isLoginMode" @click="loginWithGoogle" :disabled="isLoading" class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all mb-6 disabled:opacity-50">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Masuk sebagai Owner Vendor
        </button>

        <div v-if="isLoginMode" class="relative flex items-center py-4">
          <div class="flex-grow border-t border-slate-200"></div>
          <span class="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Atau Login Manual</span>
          <div class="flex-grow border-t border-slate-200"></div>
        </div>

        <div class="space-y-4">
          <div v-if="!isLoginMode">
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Kode Undangan (Join Code)</label>
            <input v-model="joinCode" type="text" placeholder="Contoh: VIX-98A2" class="w-full border border-slate-200 p-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all uppercase">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email Akses</label>
            <input v-model="email" type="email" placeholder="nama@vendoranda.com" class="w-full border border-slate-200 p-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Password</label>
            <input v-model="password" type="password" placeholder="Minimal 6 karakter" class="w-full border border-slate-200 p-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
          </div>
          
          <button @click="handleEmailAuth" :disabled="isLoading" class="w-full py-3 mt-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center">
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isLoginMode ? 'Masuk ke Dashboard' : 'Daftar Staff Baru' }}
          </button>
        </div>

        <div class="mt-8 space-y-4">
          <p class="text-center text-xs font-medium text-slate-500">
            {{ isLoginMode ? 'Karyawan baru?' : 'Sudah punya akun Staff?' }}
            <button @click="isLoginMode = !isLoginMode" class="font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1">
              {{ isLoginMode ? 'Daftar pakai Join Code' : 'Login ke Dashboard' }}
            </button>
          </p>
          
          <div class="pt-4 border-t border-slate-100 flex justify-center">
            <button @click="loginAsDemo" :disabled="isLoading" class="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center">
              <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Ingin lihat-lihat? Coba Akun Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
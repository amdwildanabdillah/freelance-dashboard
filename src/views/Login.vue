<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithCredential // Tambahkan ini
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core' // Tambahkan ini
import { FirebaseAuthentication } from '@capacitor-firebase/authentication' // Plugin Capawesome
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
    let user;

    if (Capacitor.isNativePlatform()) {
      // CARA NATIVE (ANDROID/APK)
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      user = userCredential.user;
    } else {
      // CARA WEB (CHROME/VITE)
      const result = await signInWithPopup(auth, provider);
      user = result.user;
    }

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
    console.error(error)
    Swal.fire('Error', 'Gagal login Google: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>
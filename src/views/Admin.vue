<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const vendors = ref([])
const isLoading = ref(true)

const adminEmails = [
  'amd.wildanabdillah@gmail.com',
  'vixelcreative.id@gmail.com',
  'lensapictura.graduate@gmail.com'
]

const fetchVendors = async () => {
  isLoading.value = true
  const querySnapshot = await getDocs(collection(db, 'vendors'))
  vendors.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  isLoading.value = false
}

const updatePlan = async (vendorId, newPlan) => {
  try {
    await updateDoc(doc(db, 'vendors', vendorId), { plan: newPlan })
    Swal.fire({
      title: 'Success',
      text: `Plan updated to ${newPlan.toUpperCase()}`,
      icon: 'success',
      confirmButtonColor: '#000'
    })
    fetchVendors()
  } catch (e) {
    Swal.fire('Error', e.message, 'error')
  }
}

// FUNGSI BARU: Hapus Data Vendor dari Firestore
const deleteVendorData = async (vendorId) => {
  const result = await Swal.fire({
    title: 'Hapus Data Studio?',
    text: 'Data profil studio ini akan hilang dari database Admin.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#1e293b',
    confirmButtonText: 'Ya, Hapus'
  })

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, 'vendors', vendorId))
      Swal.fire('Terhapus', 'Data vendor berhasil dibersihkan.', 'success')
      fetchVendors()
    } catch (e) {
      Swal.fire('Error', e.message, 'error')
    }
  }
}

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user && adminEmails.includes(user.email)) {
      fetchVendors()
    } else {
      window.location.href = '/'
    }
  })
})
</script>

<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto dark:text-white animate-fade-in pb-20 font-sans">
    <header class="mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Vendor Management</h2>
      <p class="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage subscriptions, roles, and clean up test data.</p>
    </header>
    
    <div v-if="isLoading" class="flex justify-center p-10">
      <div class="animate-spin w-6 h-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full"></div>
    </div>

    <div v-else class="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-white/10">
              <th class="p-4 md:p-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Vendor Profile</th>
              <th class="p-4 md:p-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Current Plan</th>
              <th class="p-4 md:p-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="v in vendors" :key="v.id" class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <td class="p-4 md:p-5">
                <div class="font-medium text-sm text-slate-900 dark:text-white tracking-tight">{{ v.vendorName || 'Untitled Studio' }}</div>
                <div class="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{{ v.ownerEmail || 'No Email Registered' }}</div>
                <div class="text-[9px] text-slate-400 font-mono mt-1">UID: {{ v.id }}</div>
              </td>
              <td class="p-4 md:p-5">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase border"
                      :class="{
                        'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900': v.plan === 'dev',
                        'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20': v.plan === 'lifetime',
                        'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20': v.plan === 'pro',
                        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10': !['pro', 'lifetime', 'dev'].includes(v.plan)
                      }">
                  {{ v.plan || 'Free' }}
                </span>
              </td>
              <td class="p-4 md:p-5">
                <div class="flex items-center justify-end gap-2">
                  <select 
                    :value="v.plan || 'free'" 
                    @change="updatePlan(v.id, $event.target.value)"
                    class="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-[10px] font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-400 dark:focus:border-white/30 transition-all cursor-pointer appearance-none text-center"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="lifetime">Lifetime</option>
                    <option value="dev">Dev</option>
                  </select>

                  <button 
                    @click="deleteVendorData(v.id)" 
                    class="p-1.5 bg-white dark:bg-transparent border border-rose-200 dark:border-rose-500/30 text-rose-500 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    title="Hapus Data"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
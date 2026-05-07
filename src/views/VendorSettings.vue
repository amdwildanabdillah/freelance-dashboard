<script setup>
import { ref } from 'vue'

// 1. Branding Identity - Data ini akan muncul di Invoice PDF & Form Booking
const vendorBranding = ref({
  name: 'BAMS MOMENT',
  tagline: 'Wisuda UINSA Specialist',
  logoUrl: 'https://via.placeholder.com/150', 
  address: 'Jl. Ahmad Yani No. 117, Surabaya (Area Kampus UINSA)[cite: 1]',
  website: 'www.vixelcreative.my.id',
  instagram: '@bams.moment',
  tiktok: '@bams.moment'
})

// 2. Daftar Tim Fotografer - Sinkron dengan pilihan di Pipeline[cite: 1]
const team = ref([
  { id: 1, name: 'Wildan[cite: 1]', role: 'Lead Photographer', status: 'Active' },
  { id: 2, name: 'Andi', role: 'Second Photographer', status: 'Active' },
  { id: 3, name: 'Bima', role: 'Editor / Content Creator', status: 'Active' }
])

// 3. Daftar Rekening - Untuk ditampilkan di Form Booking agar klien bisa Copy[cite: 2]
const accounts = ref([
  { id: 1, bank: 'BCA[cite: 2]', number: '1234567890', owner: 'Wildan Abdillah' },
  { id: 2, bank: 'Bank JAGO[cite: 2]', number: '987654321', owner: 'VIXEL Creative' }
])

const saveSettings = () => {
  alert('Settings Berhasil Disimpan! Data branding sudah terupdate untuk Invoice.')
}
</script>

<template>
  <div class="max-w-5xl space-y-8 pb-12 font-sans text-slate-900">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-2xl font-bold">Vendor & Team</h2>
        <p class="text-slate-500 text-sm mt-1">Kelola identitas brand, tim fotografer, dan rekening vendor.</p>
      </div>
      <button @click="saveSettings" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95">
        Simpan Perubahan
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- KOLOM KIRI: BRANDING -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">Branding & Identity</h3>
          <div class="space-y-6">
            <div class="flex items-center space-x-6">
              <div class="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                <img v-if="vendorBranding.logoUrl" :src="vendorBranding.logoUrl" class="object-cover w-full h-full">
              </div>
              <div>
                <button class="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Upload New Logo</button>
                <p class="text-[10px] text-slate-400 mt-2 font-medium">Recomended: Square 512x512px (PNG/JPG)</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nama Vendor</label>
                <input v-model="vendorBranding.name" type="text" class="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Official Website</label>
                <input v-model="vendorBranding.website" type="text" class="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              </div>
              <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Alamat Studio / Kantor</label>
                <input v-model="vendorBranding.address" type="text" class="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Instagram</label>
                <input v-model="vendorBranding.instagram" type="text" class="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">TikTok</label>
                <input v-model="vendorBranding.tiktok" type="text" class="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
              </div>
            </div>
          </div>
        </div>

        <!-- Section Rekening -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-bold text-indigo-600 uppercase tracking-widest">Metode Pembayaran (Norek)</h3>
            <button class="text-xs font-bold text-indigo-600 hover:underline">+ Tambah Rekening</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="acc in accounts" :key="acc.id" class="p-5 rounded-2xl border border-slate-100 bg-slate-50 group hover:border-indigo-200 transition-all">
              <div class="flex justify-between items-start mb-3">
                <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{{ acc.bank }}[cite: 2]</span>
                <button class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" /></svg>
                </button>
              </div>
              <p class="text-xl font-mono font-bold text-slate-800 tracking-wider mb-1">{{ acc.number }}[cite: 2]</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A.N. {{ acc.owner }}[cite: 2]</p>
            </div>
          </div>
        </div>
      </div>

      <!-- KOLOM KANAN: TEAM -->
      <div class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">Tim Fotografer</h3>
          <div class="space-y-4">
            <div v-for="member in team" :key="member.id" class="flex items-center p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
              <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold mr-4">
                {{ member.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-800 truncate">{{ member.name }}[cite: 1]</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ member.role }}</p>
              </div>
              <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            </div>
          </div>
          <button class="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
            + Tambah Anggota Tim
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
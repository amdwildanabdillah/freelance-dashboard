<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'

const isLoading = ref(true)
const projects = ref([])
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

const ownerName = 'Wildan'
const managementFeePercent = 0.20 // 20% Potongan buat vendor

const fetchProjects = async (uid) => {
  if (!uid) return
  isLoading.value = true
  try {
    const q = collection(db, 'vendors', uid, 'projects')
    const querySnapshot = await getDocs(q)
    const rawData = []
    querySnapshot.forEach(doc => rawData.push({ id: doc.id, ...doc.data() }))

    const validStatuses = ['dp', 'booked', 'editing', 'delivered', 'Menunggu DP']
      
    projects.value = rawData
        .filter(p => validStatuses.includes(p.status))
        .map(p => {
          const rawPrice = extractPrice(p.package?.price || '0')
          const fg = p.photographer || 'Belum di-assign'
          
          let myProfit = 0
          let teamFee = 0
          
          if (fg === ownerName || fg === 'Belum di-assign') {
            myProfit = rawPrice 
          } else {
            myProfit = rawPrice * managementFeePercent 
            teamFee = rawPrice - myProfit 
          }

          return {
            id: p.id,
            clientName: p.clientName || 'Tanpa Nama',
            package: p.package?.name || 'Belum pilih paket',
            photographer: fg,
            status: p.status,
            totalPrice: rawPrice,
            netProfit: myProfit,
            fgFee: teamFee,
            shootDate: p.shootDate || new Date()
          }
        }).reverse()
  } catch (error) {
    Swal.fire('Error', 'Gagal menarik data keuangan.', 'error')
  } finally {
    isLoading.value = false
  }
}

const extractPrice = (pkgString) => {
  if (!pkgString) return 0
  const match = String(pkgString).match(/([\d.]+)/)
  if (match) return parseInt(match[1].replace(/\./g, ''))
  return 0
}

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

// -------------------------------------------------------------------
// 1. FUNGSI CETAK INVOICE KLIEN (DESAIN ALA AGENCY ELITE)
// -------------------------------------------------------------------
const printInvoiceClient = (p) => {
  const d = new Date(p.shootDate)
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${p.clientName} (${p.id})</title>
        <style>
          body { font-family: 'Inter', Helvetica, sans-serif; padding: 0; color: #1e293b; max-width: 800px; margin: auto; background: #fff; }
          .invoice-container { padding: 40px; }
          
          /* Header Hitam Elegan */
          .header-top { background: #0f172a; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
          .header-top h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
          .header-top p { margin: 5px 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .header-accent { background: #4f46e5; height: 8px; width: 100%; }

          /* Info Klien (To) */
          .info-section { display: flex; justify-content: space-between; padding: 40px 40px 20px; }
          .info-box { font-size: 12px; line-height: 1.8; color: #475569; }
          .info-box span.label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
          .info-box strong { color: #0f172a; font-size: 14px; text-transform: uppercase; }

          /* Tabel Rincian */
          table { width: calc(100% - 80px); margin: 0 40px 30px; border-collapse: collapse; }
          th { background: #0f172a; color: white; text-transform: uppercase; font-size: 10px; padding: 12px 15px; text-align: left; letter-spacing: 1px; }
          th.center, td.center { text-align: center; }
          th.right, td.right { text-align: right; }
          td { padding: 15px; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #334155; }
          .subtotal-row td { border-bottom: none; padding-top: 30px; font-weight: 600; }
          .total-row td { font-weight: 800; font-size: 16px; color: #0f172a; border-bottom: none; }

          /* Payment Info & Footer */
          .footer-section { padding: 10px 40px 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .payment-info h4 { margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; font-weight: 800; }
          .bank-details { display: flex; align-items: center; margin-bottom: 10px; }
          .bank-logo { width: 32px; height: 22px; background: #f8fafc; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 9px; font-weight: 800; border: 1px solid #e2e8f0; }
          .bank-logo.bri { color: #0284c7; }
          .bank-logo.jago { color: #f59e0b; }
          .bank-text { font-size: 11px; line-height: 1.4; color: #0f172a; font-weight: 700; text-transform: uppercase; }
          .bank-text span { display: block; font-weight: 600; color: #64748b; font-size: 10px; font-family: monospace; letter-spacing: 1px; margin-top: 2px;}

          .signature { text-align: right; font-size: 12px; color: #0f172a; font-style: italic; font-weight: 600; letter-spacing: 1px; }
          .signature-line { width: 60px; height: 1px; background: #0f172a; margin-left: auto; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header-top">
          <div>
            <h1>VIXEL CREATIVE</h1>
            <p>Social Media Management | Visual Branding & Production<br>Based in Surabaya, Indonesia</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin:0; font-size: 24px; letter-spacing: 3px; font-weight: 900;">INVOICE</h2>
            <p style="color: #94a3b8; font-family: monospace; font-size: 12px; margin-top: 5px;">#${p.id}</p>
          </div>
        </div>
        <div class="header-accent"></div>

        <div class="info-section">
          <div class="info-box">
            <span class="label">To:</span>
            <strong>${p.clientName}</strong><br>
            Phone: ${p.whatsapp || '-'}<br>
            Instagram: ${p.instagram || '-'}<br>
            Status: <span style="color: #4f46e5; font-weight: 800;">${p.status}</span>
          </div>
          <div class="info-box" style="text-align: right;">
            <span class="label">University / Location:</span>
            <strong>${p.university || '-'}</strong><br><br>
            <span class="label">Shoot Date:</span>
            <strong style="color: #4f46e5;">${dateStr}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product Description</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong style="font-size: 13px; color: #0f172a; text-transform: uppercase;">Graduation Photoshoot</strong><br>
                <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: inline-block;">${p.package}</span>
              </td>
              <td class="center">1</td>
              <td class="right">${formatRupiah(p.totalPrice)}</td>
              <td class="right">${formatRupiah(p.totalPrice)}</td>
            </tr>
            <!-- Baris Kosong ala Destograph buat nyatet Add-ons Manual (Opsional) -->
            <tr>
              <td style="color: #94a3b8; font-style: italic;">Akomodasi / Fast Track (Include di atas)</td>
              <td class="center">-</td>
              <td class="right">-</td>
              <td class="right">-</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="3" class="right">Subtotal Product</td>
              <td class="right">${formatRupiah(p.totalPrice)}</td>
            </tr>
            <tr>
              <td colspan="3" class="right" style="color: #64748b; border-bottom: none;">Discount</td>
              <td class="right" style="color: #64748b; border-bottom: none;">-</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" class="right">TOTAL</td>
              <td class="right" style="color: #4f46e5;">${formatRupiah(p.totalPrice)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer-section">
          <div class="payment-info">
            <h4>Payment Information</h4>
            <!-- Rekening Langsung Nembak Pakai Data Asli! -->
            <div class="bank-details">
              <div class="bank-logo bri">BRI</div>
              <div class="bank-text">
                AHMAD WILDAN ABDILLAH
                <span>6177010XXXXXXX</span>
              </div>
            </div>
            <div class="bank-details">
              <div class="bank-logo jago">JAGO</div>
              <div class="bank-text">
                WILDAN ABDILLAH
                <span>5004XXXXXXXXXX</span>
              </div>
            </div>
          </div>
          <div class="signature">
            <p>create the moment<br>with us</p>
            <div class="signature-line"></div>
          </div>
        </div>

        <script>window.onload = function() { window.print(); }<\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

// -------------------------------------------------------------------
// 2. FUNGSI CETAK SLIP FEE FOTOGRAFER
// -------------------------------------------------------------------
const printInvoiceFG = (p) => {
  const d = new Date(p.shootDate)
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Fee Slip - ${p.photographer} (${p.id})</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 32px; }
          .brand h1 { margin: 0; color: #f97316; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
          .brand p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; letter-spacing: 2px;}
          .invoice-title p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
          .client-box { background: #fff7ed; padding: 20px; border-radius: 12px; margin-bottom: 32px; border: 1px solid #ffedd5; }
          .client-box p { margin: 4px 0; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 16px 12px; text-align: left; font-size: 15px; }
          th { background-color: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;}
          .total-row td { font-weight: 900; font-size: 18px; color: #0f172a; border-bottom: none; border-top: 2px solid #cbd5e1;}
          .footer { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <h1>PAYMENT SLIP.</h1>
            <p>VIXEL Management</p>
          </div>
          <div class="invoice-title">
            <h2>FEE EKSEKUTOR</h2>
            <p>Project ID: ${p.id}</p>
            <p>Tanggal Terbit: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
        
        <div class="client-box">
          <p style="color: #f97316; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Dibayarkan Kepada:</p>
          <p style="font-size: 20px; font-weight: bold; color: #0f172a;">${p.photographer}</p>
          <p>Tugas: <strong style="color: #ea580c;">Fotografer Eksekusi Lapangan</strong></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Rincian Pekerjaan</th>
              <th style="text-align: right;">Nominal Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Klien: <strong>${p.clientName}</strong><br>
                <span style="font-size: 13px; color: #64748b;">Tanggal Sesi: ${dateStr}</span><br>
                <span style="font-size: 13px; color: #64748b;">Paket: ${p.package}</span>
              </td>
              <td style="text-align: right; vertical-align: top;">${formatRupiah(p.fgFee)}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: right; padding-right: 24px;">TOTAL FEE DITERIMA</td>
              <td style="text-align: right; color: #ea580c;">${formatRupiah(p.fgFee)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Terima kasih atas kerja keras tim. Jaga selalu kualitas visual VIXEL!</p>
          <p>Dokumen ini adalah bukti pencairan fee internal yang sah.</p>
        </div>
        
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

const summary = computed(() => {
  let gross = 0; let net = 0; let team = 0
  projects.value.forEach(p => { gross += p.totalPrice; net += p.netProfit; team += p.fgFee })
  return { gross, net, team }
})

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchProjects(user.uid)
    }
  })
})
</script>

<template>
  <div class="min-h-screen font-sans transition-colors duration-500" :class="isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'">
    <div class="max-w-6xl mx-auto pb-12 pt-6 px-4 space-y-8">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black tracking-tight uppercase" :class="isDarkMode ? 'text-white' : 'text-slate-900'">Finance & Invoices</h2>
        <p class="text-sm font-medium mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-slate-500'">Pantau total omset, profit bersih, dan operasional.</p>
      </div>
      <button @click="fetchProjects(auth.currentUser?.uid)" class="px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm transition-all flex items-center border border-slate-200" :class="isDarkMode ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white text-slate-900 hover:bg-slate-50'">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-8">
      
      <!-- Widget Ringkasan Keuangan (3 Kartu) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100 shadow-sm'">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Omset (Gross)</p>
          <h3 class="text-3xl font-black text-slate-800 relative z-10">{{ formatRupiah(summary.gross) }}</h3>
          <p class="text-xs font-medium text-slate-400 mt-2 relative z-10">Total uang masuk dari klien.</p>
        </div>
        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-slate-900 border-black shadow-lg'">
          <p class="text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Net Profit (Owner)</p>
          <h3 class="text-3xl font-black relative z-10 text-white">{{ formatRupiah(summary.net) }}</h3>
          <p class="text-xs font-medium mt-2 relative z-10" :class="isDarkMode ? 'text-gray-400' : 'text-slate-400'">Omset dikurangi bagi hasil tim.</p>
        </div>
        <div class="p-8 rounded-[2rem] border relative overflow-hidden group transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100 shadow-sm'">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Beban Fee Tim / FG</p>
          <h3 class="text-3xl font-black text-orange-600 relative z-10">{{ formatRupiah(summary.team) }}</h3>
          <p class="text-xs font-medium text-slate-400 mt-2 relative z-10">Total fee yang harus dibayar ke FG.</p>
        </div>
      </div>

      <!-- Tabel Rincian Keuangan per Project -->
      <div class="rounded-[2.5rem] border shadow-sm overflow-hidden transition-all" :class="isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'">
        <div class="p-8 border-b flex items-center justify-between" :class="isDarkMode ? 'border-white/10' : 'border-slate-50'">
          <h3 class="text-sm font-black uppercase tracking-widest" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Rincian Keuangan Project</h3>
          <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg" :class="isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'">Management Fee: {{ managementFeePercent * 100 }}%</span>
        </div>
        
        <div class="overflow-x-auto custom-scrollbar">
          <table class="min-w-[900px] w-full divide-y" :class="isDarkMode ? 'divide-white/5' : 'divide-slate-100'">
            <thead :class="isDarkMode ? 'bg-black/20' : 'bg-slate-50/50'">
              <tr>
                <th class="py-6 pl-8 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Package</th>
                <th class="px-3 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Harga</th>
                <th class="px-3 py-6 text-left text-[10px] font-black uppercase tracking-widest" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-900'">Profit (Owner)</th>
                <th class="px-3 py-6 text-right text-[10px] font-black text-orange-500 uppercase tracking-widest">Fee (FG / Tim)</th>
                <th class="px-3 py-6 pr-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Print Dokumen</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="isDarkMode ? 'divide-white/5' : 'divide-slate-50'">
              
              <tr v-if="projects.length === 0">
                <td colspan="6" class="text-center py-12 text-sm text-slate-400 font-bold">Belum ada project aktif yang bisa dihitung.</td>
              </tr>

              <tr v-for="p in projects" :key="p.id" class="transition-colors group" :class="isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'">
                <td class="py-4 pl-8 pr-3">
                  <p class="text-sm font-bold transition-colors" :class="isDarkMode ? 'text-white' : 'text-slate-800'">{{ p.clientName }}</p>
                  <p class="text-[10px] font-medium mt-0.5 truncate max-w-[200px]" :class="isDarkMode ? 'text-gray-500' : 'text-slate-500'">{{ p.package }}</p>
                </td>
                
                <td class="px-3 py-4">
                  <span class="text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider" 
                        :class="p.status === 'delivered' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                    {{ p.status }}
                  </span>
                </td>

                <td class="px-3 py-4">
                  <span class="text-sm font-bold text-slate-700" :class="p.totalPrice === 0 ? 'text-red-400' : ''">
                    {{ p.totalPrice === 0 ? 'Cek Harga' : formatRupiah(p.totalPrice) }}
                  </span>
                </td>

                <td class="px-3 py-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-black" :class="isDarkMode ? 'text-white' : 'text-slate-900'">{{ formatRupiah(p.netProfit) }}</span>
                    <span v-if="p.photographer === ownerName || p.photographer === 'Belum di-assign'" class="text-[9px] font-bold uppercase tracking-widest mt-0.5" :class="isDarkMode ? 'text-cyan-400' : 'text-slate-400'">Eksekusi Sendiri (100%)</span>
                    <span v-else class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Broker Fee ({{ managementFeePercent * 100 }}%)</span>
                  </div>
                </td>

                <td class="px-3 py-4 text-right">
                  <div class="flex flex-col items-end">
                    <span class="text-sm font-black" :class="p.fgFee > 0 ? 'text-orange-600' : 'text-slate-300'">{{ formatRupiah(p.fgFee) }}</span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                      {{ p.fgFee > 0 ? `Ke: ${p.photographer}` : '-' }}
                    </span>
                  </div>
                </td>

                <!-- Tombol Cetak Dokumen -->
                <td class="px-3 py-4 pr-8 text-center">
                  <div class="flex justify-center gap-2">
                    <!-- Tombol Invoice Klien -->
                    <button @click="printInvoiceClient(p)" class="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all" title="Cetak Invoice Klien">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Klien
                    </button>
                    
                    <!-- Tombol Slip Fee FG (MUNCUL KALO DI-SUBKON AJA) -->
                    <button v-if="p.photographer !== ownerName && p.photographer !== 'Belum di-assign'" @click="printInvoiceFG(p)" class="inline-flex items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all" title="Cetak Slip Fee Eksekutor">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      FG
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px;}
.custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
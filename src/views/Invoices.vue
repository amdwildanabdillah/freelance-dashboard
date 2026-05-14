<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { useTheme } from '../theme'
import html2pdf from 'html2pdf.js'

const { isDark } = useTheme()
const isLoading = ref(true)
const projects = ref([])
const currentUser = ref(null)

const ownerName = ref('Wildan') 
const managementFeePercent = ref(0.20) 
const vendorInfo = ref({})

const fetchVendorSettings = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'vendors', uid))
    if (docSnap.exists()) {
      const data = docSnap.data()
      ownerName.value = data.ownerName || data.ownerInfo?.fullName || 'Wildan'
      vendorInfo.value = {
        name: data.vendorName || data.vendorInfo?.name || 'VIXEL CREATIVE',
        whatsapp: data.vendorWhatsapp || data.vendorInfo?.whatsapp || '',
        instagram: data.igVendor || data.vendorInfo?.instagram || '',
        address: data.address || data.vendorInfo?.address || '',
        banks: data.banks || data.operational?.banks || [],
        logoUrl: data.logoUrl || data.vendorInfo?.logoUrl || '' // LOGO SEKARANG DITARIK
      }
    }
  } catch (error) {
    console.error("Gagal load setting vendor:", error)
  }
}

const fetchProjects = async (uid) => {
  if (!uid) return
  isLoading.value = true
  
  await fetchVendorSettings(uid) 
  
  try {
    const q = collection(db, 'vendors', uid, 'projects')
    const querySnapshot = await getDocs(q)
    const rawData = []
    querySnapshot.forEach(doc => rawData.push({ id: doc.id, ...doc.data() }))

    const validStatuses = ['dp', 'booked', 'editing', 'delivered']
      
    projects.value = rawData
        .filter(p => validStatuses.includes(p.status) || p.status === 'Menunggu DP')
        .map(p => {
          const rawPrice = extractPrice(p.package?.price || p.package || '0')
          const fg = p.photographer || 'Belum di-assign'
          
          let myProfit = 0
          let teamFee = 0
          
          if (fg === ownerName.value || fg === 'Belum di-assign') {
            myProfit = rawPrice 
          } else {
            myProfit = rawPrice * managementFeePercent.value 
            teamFee = rawPrice - myProfit 
          }

          let shootDateDisplay = 'TBD'
          const targetDate = p.date || p.shootDate || p.createdAt
          if (targetDate) {
            const d = new Date(targetDate)
            if (!isNaN(d)) {
              shootDateDisplay = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            }
          }

          return {
            id: p.id,
            clientName: p.clientName || 'Tanpa Nama',
            whatsapp: p.whatsapp || '-',
            university: p.university || '-',
            package: p.package?.name || p.package || 'Custom',
            photographer: fg,
            status: p.status || 'lead',
            totalPrice: rawPrice,
            netProfit: myProfit,
            fgFee: teamFee,
            shootDate: shootDateDisplay,
            rawDateForPrint: targetDate || new Date()
          }
        }).sort((a, b) => new Date(b.rawDateForPrint) - new Date(a.rawDateForPrint))
        
  } catch (error) {
    Swal.fire('Error', 'Gagal menarik data keuangan.', 'error')
    console.error(error)
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

const summary = computed(() => {
  let gross = 0; let net = 0; let team = 0
  projects.value.forEach(p => { gross += p.totalPrice; net += p.netProfit; team += p.fgFee })
  return { gross, net, team }
})

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user
      fetchProjects(user.uid)
    } else {
      isLoading.value = false
    }
  })
})

// ===================================================================
// EXPORT PDF INVOICE KLIEN (DIRECT DOWNLOAD A4)
// ===================================================================
const printInvoiceClient = (p) => {
  const d = new Date(p.rawDateForPrint)
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  
  let banksHtml = ''
  if (vendorInfo.value.banks && vendorInfo.value.banks.length > 0) {
    vendorInfo.value.banks.forEach(b => {
      banksHtml += `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 40px; height: 24px; background: #f8fafc; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 9px; font-weight: 800; border: 1px solid #e2e8f0; color: #0f172a;">${b.bankName}</div>
          <div style="font-size: 11px; line-height: 1.4; color: #0f172a; font-weight: 700; text-transform: uppercase;">
            ${b.owner}
            <span style="display: block; font-weight: 600; color: #64748b; font-size: 10px; font-family: monospace; letter-spacing: 1px; margin-top: 2px;">${b.number}</span>
          </div>
        </div>
      `
    })
  } else {
    banksHtml = '<p style="font-size:11px; color:#64748b;">Belum ada rekening yang diatur.</p>'
  }

  // Cek apakah ada logo, jika ya pakai logo img tag dengan CORS, jika tidak pakai teks h1
  const logoHeader = vendorInfo.value.logoUrl 
    ? `<img src="${vendorInfo.value.logoUrl}" crossorigin="anonymous" style="max-height: 45px; object-fit: contain; margin-bottom: 5px;" />`
    : `<h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${vendorInfo.value.name}</h1>`;
  
  const htmlContent = `
    <div style="width: 800px; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; box-sizing: border-box;">
      <div style="background: #0f172a; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          ${logoHeader}
          <p style="margin: 5px 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">${vendorInfo.value.address || 'Photography & Videography Services'}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin:0; font-size: 24px; letter-spacing: 3px; font-weight: 900;">INVOICE</h2>
          <p style="color: #94a3b8; font-family: monospace; font-size: 12px; margin-top: 5px;">#${p.id.substring(0,8).toUpperCase()}</p>
        </div>
      </div>
      <div style="background: #06b6d4; height: 6px; width: 100%;"></div>

      <div style="display: flex; justify-content: space-between; padding: 40px 40px 20px;">
        <div style="font-size: 12px; line-height: 1.8; color: #475569;">
          <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">To:</span>
          <strong style="color: #0f172a; font-size: 14px; text-transform: uppercase;">${p.clientName}</strong><br>
          Phone: ${p.whatsapp}<br>
          Status: <span style="color: #06b6d4; font-weight: 800;">${p.status.toUpperCase()}</span>
        </div>
        <div style="font-size: 12px; line-height: 1.8; color: #475569; text-align: right;">
          <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Location / Univ:</span>
          <strong style="color: #0f172a; font-size: 14px; text-transform: uppercase;">${p.university}</strong><br><br>
          <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Shoot Date:</span>
          <strong style="color: #0f172a;">${dateStr}</strong>
        </div>
      </div>

      <table style="width: calc(100% - 80px); margin: 0 40px 30px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="background: #0f172a; color: white; text-transform: uppercase; font-size: 10px; padding: 12px 15px; text-align: left; letter-spacing: 1px;">Product Description</th>
            <th style="background: #0f172a; color: white; text-transform: uppercase; font-size: 10px; padding: 12px 15px; text-align: center; letter-spacing: 1px;">Qty</th>
            <th style="background: #0f172a; color: white; text-transform: uppercase; font-size: 10px; padding: 12px 15px; text-align: right; letter-spacing: 1px;">Price</th>
            <th style="background: #0f172a; color: white; text-transform: uppercase; font-size: 10px; padding: 12px 15px; text-align: right; letter-spacing: 1px;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 15px; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #334155;">
              <strong style="font-size: 13px; color: #0f172a; text-transform: uppercase;">Documentation Service</strong><br>
              <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: inline-block;">Package: ${p.package}</span>
            </td>
            <td style="padding: 15px; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #334155; text-align: center;">1</td>
            <td style="padding: 15px; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #334155; text-align: right;">${formatRupiah(p.totalPrice)}</td>
            <td style="padding: 15px; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #334155; text-align: right;">${formatRupiah(p.totalPrice)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 15px; padding-top: 30px; font-size: 12px; font-weight: 600; text-align: right;">Subtotal</td>
            <td style="padding: 15px; padding-top: 30px; font-size: 12px; font-weight: 600; text-align: right;">${formatRupiah(p.totalPrice)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 15px; font-weight: 800; font-size: 16px; color: #0f172a; text-align: right;">TOTAL</td>
            <td style="padding: 15px; font-weight: 800; font-size: 16px; color: #06b6d4; text-align: right;">${formatRupiah(p.totalPrice)}</td>
          </tr>
        </tbody>
      </table>

      <div style="padding: 10px 40px 40px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h4 style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; font-weight: 800;">Payment Methods</h4>
          ${banksHtml}
        </div>
        <div style="text-align: right; font-size: 12px; color: #0f172a; font-style: italic; font-weight: 600; letter-spacing: 1px;">
          <p>create the moment<br>with us</p>
          <div style="width: 60px; height: 1px; background: #0f172a; margin-left: auto; margin-top: 15px;"></div>
        </div>
      </div>
    </div>
  `

  const opt = {
    margin:       0,
    filename:     `Invoice_${p.clientName}_${p.id.substring(0,8)}.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  Swal.fire({ title: 'Menyimpan PDF...', text: 'Tunggu sebentar ya', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
  
  // Element temp untuk dirender html2pdf
  const element = document.createElement('div')
  element.innerHTML = htmlContent
  
  html2pdf().set(opt).from(element).save().then(() => Swal.close())
}

// ===================================================================
// EXPORT PDF SLIP FEE FOTOGRAFER
// ===================================================================
const printInvoiceFG = (p) => {
  const d = new Date(p.rawDateForPrint)
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const htmlContent = `
    <div style="width: 800px; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 32px;">
        <div>
          <h1 style="margin: 0; color: #f97316; font-size: 28px; font-weight: 900; letter-spacing: -1px;">PAYMENT SLIP.</h1>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 600;">${vendorInfo.value.name.toUpperCase()} MGMT</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">FEE EKSEKUTOR</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">ID: ${p.id.substring(0,8).toUpperCase()}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Terbit: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
      
      <div style="background: #fff7ed; padding: 20px; border-radius: 12px; margin-bottom: 32px; border: 1px solid #ffedd5;">
        <p style="color: #f97316; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Dibayarkan Kepada:</p>
        <p style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0;">${p.photographer}</p>
        <p style="font-weight: 500; color: #475569; margin: 4px 0;">Tugas: <strong style="color: #ea580c;">Eksekusi Lapangan (FG/VG)</strong></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <thead>
          <tr>
            <th style="background-color: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding: 16px 12px; text-align: left;">Rincian Pekerjaan</th>
            <th style="background-color: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding: 16px 12px; text-align: right;">Nominal Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 16px 12px; font-size: 14px;">
              Klien: <strong style="color: #0f172a;">${p.clientName} (${p.university})</strong><br>
              <span style="font-size: 12px; color: #64748b; margin-top: 4px; display: inline-block;">Tanggal Sesi: ${dateStr}</span><br>
              <span style="font-size: 12px; color: #64748b;">Paket: ${p.package}</span>
            </td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 16px 12px; font-size: 14px; text-align: right; vertical-align: top; font-weight: 600;">${formatRupiah(p.fgFee)}</td>
          </tr>
          <tr>
            <td style="padding: 16px 12px; font-weight: 900; font-size: 16px; color: #0f172a; border-top: 2px solid #cbd5e1; text-align: right; padding-right: 24px;">TOTAL FEE DITERIMA</td>
            <td style="padding: 16px 12px; font-weight: 900; font-size: 16px; color: #ea580c; border-top: 2px solid #cbd5e1; text-align: right;">${formatRupiah(p.fgFee)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 60px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">
        <p>Terima kasih atas kerja keras tim. Jaga selalu kualitas visual ${vendorInfo.value.name}!</p>
        <p>Dokumen ini adalah bukti pencairan fee internal yang sah.</p>
      </div>
    </div>
  `

  const opt = {
    margin:       0,
    filename:     `Fee_${p.photographer}_${p.id.substring(0,8)}.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  Swal.fire({ title: 'Menyimpan PDF...', text: 'Tunggu sebentar ya', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
  
  const element = document.createElement('div')
  element.innerHTML = htmlContent
  
  html2pdf().set(opt).from(element).save().then(() => Swal.close())
}
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Finance & Invoices</h2>
        <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Pantau total omset, profit bersih, dan cetak dokumen klien.</p>
      </div>
      <button @click="fetchProjects(currentUser?.uid)" class="w-fit flex items-center bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Recalculate
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-8">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        <div class="p-6 md:p-8 rounded-[2rem] border relative overflow-hidden group transition-all bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm">
          <p class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 relative z-10">Total Omset (Gross)</p>
          <h3 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white relative z-10">{{ formatRupiah(summary.gross) }}</h3>
          <p class="text-xs font-medium text-slate-400 dark:text-gray-500 mt-2 relative z-10">Total uang masuk dari klien.</p>
        </div>
        
        <div class="p-6 md:p-8 rounded-[2rem] border border-transparent relative overflow-hidden group transition-all shadow-xl shadow-cyan-500/20 bg-gradient-to-br from-cyan-500 to-blue-600">
          <div class="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          <p class="text-[10px] font-bold uppercase tracking-widest mb-1.5 relative z-10 text-cyan-100">Net Profit (Owner)</p>
          <h3 class="text-2xl md:text-3xl font-bold tracking-tight relative z-10 text-white">{{ formatRupiah(summary.net) }}</h3>
          <p class="text-xs font-medium mt-2 relative z-10 text-cyan-100/80">Omset bersih studio (setelah potong fee FG).</p>
        </div>
        
        <div class="p-6 md:p-8 rounded-[2rem] border relative overflow-hidden group transition-all bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm">
          <p class="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 relative z-10">Beban Fee Tim / FG</p>
          <h3 class="text-2xl md:text-3xl font-bold tracking-tight text-orange-500 dark:text-orange-400 relative z-10">{{ formatRupiah(summary.team) }}</h3>
          <p class="text-xs font-medium text-slate-400 dark:text-gray-500 mt-2 relative z-10">Porsi 80% yang dibayar ke tim.</p>
        </div>
      </div>

      <div v-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-4 rounded-[2rem] border border-dashed border-slate-300 dark:border-white/20">
        <svg class="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 class="font-bold text-lg text-slate-800 dark:text-white">Belum ada transaksi</h3>
        <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">Data keuangan akan muncul setelah ada project yang booking.</p>
      </div>

      <div v-else>
        
        <div class="md:hidden space-y-4">
          <div v-for="p in projects" :key="p.id" class="bg-white dark:bg-[#111] p-5 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/10 relative">
            
            <div class="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <p class="text-[9px] font-mono text-cyan-500 mb-1">INV: {{ p.id.substring(0,8).toUpperCase() }}</p>
                <h4 class="text-base font-bold text-slate-900 dark:text-white leading-tight">{{ p.clientName }}</h4>
                <p class="text-[10px] font-medium text-slate-500 dark:text-gray-400 mt-0.5">{{ p.package }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold" :class="p.totalPrice === 0 ? 'text-red-400' : 'text-slate-900 dark:text-white'">
                  {{ p.totalPrice === 0 ? 'Cek Harga' : formatRupiah(p.totalPrice) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-5">
              <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                <p class="text-[9px] text-slate-400 dark:text-gray-500 font-semibold mb-0.5">Profit Studio</p>
                <p class="text-sm font-bold text-cyan-600 dark:text-cyan-400">{{ formatRupiah(p.netProfit) }}</p>
              </div>
              <div class="bg-orange-50/50 dark:bg-orange-500/5 p-3 rounded-2xl border border-orange-100/50 dark:border-orange-500/10">
                <p class="text-[9px] text-slate-400 dark:text-gray-500 font-semibold mb-0.5 truncate">Fee {{ p.photographer }}</p>
                <p class="text-sm font-bold text-orange-500 dark:text-orange-400">{{ formatRupiah(p.fgFee) }}</p>
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="printInvoiceClient(p)" class="flex-1 inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200 py-3 rounded-full text-[11px] font-bold transition-all shadow-sm">
                <svg class="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Invoice Klien
              </button>
              
              <button v-if="p.photographer !== ownerName && p.photographer !== 'Belum di-assign'" @click="printInvoiceFG(p)" class="flex-1 inline-flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 py-3 rounded-full text-[11px] font-bold transition-all border border-orange-200/50 dark:border-orange-500/20">
                Slip Fee FG
              </button>
            </div>
          </div>
        </div>

        <div class="hidden md:block rounded-[2.5rem] border shadow-sm overflow-hidden bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
          <div class="p-6 md:p-8 border-b flex items-center justify-between border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/5">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Rincian Transaksi</h3>
            <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-gray-300 border border-slate-300/30 dark:border-white/10">
              Agency Cut: {{ managementFeePercent * 100 }}%
            </span>
          </div>
          
          <div class="overflow-x-auto custom-scrollbar">
            <table class="min-w-[900px] w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th class="py-5 pl-8 pr-3 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Client & Details</th>
                  <th class="px-3 py-5 text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Gross Income</th>
                  <th class="px-3 py-5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Net Profit (Studio)</th>
                  <th class="px-3 py-5 text-right text-[10px] font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-widest">Team Fee</th>
                  <th class="px-3 py-5 pr-8 text-center text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Documents</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-for="p in projects" :key="p.id" class="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td class="py-5 pl-8 pr-3">
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ p.clientName }}</p>
                    <p class="text-[10px] font-medium mt-0.5 text-slate-500 dark:text-gray-400">#{{ p.id.substring(0,8).toUpperCase() }} • {{ p.package }}</p>
                  </td>
                  
                  <td class="px-3 py-5">
                    <span class="text-sm font-bold" :class="p.totalPrice === 0 ? 'text-red-400' : 'text-slate-800 dark:text-slate-200'">
                      {{ p.totalPrice === 0 ? 'Cek Harga' : formatRupiah(p.totalPrice) }}
                    </span>
                  </td>

                  <td class="px-3 py-5">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400">{{ formatRupiah(p.netProfit) }}</span>
                      <span v-if="p.photographer === ownerName || p.photographer === 'Belum di-assign'" class="text-[9px] font-semibold text-slate-400 dark:text-gray-500 mt-1">100% (No Subcon)</span>
                      <span v-else class="text-[9px] font-semibold text-slate-400 dark:text-gray-500 mt-1">Management Cut ({{ managementFeePercent * 100 }}%)</span>
                    </div>
                  </td>

                  <td class="px-3 py-5 text-right">
                    <div class="flex flex-col items-end">
                      <span class="text-sm font-bold" :class="p.fgFee > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-gray-600'">{{ formatRupiah(p.fgFee) }}</span>
                      <span class="text-[9px] font-semibold text-slate-500 dark:text-gray-500 mt-1 truncate max-w-[150px]">
                        {{ p.fgFee > 0 ? `To: ${p.photographer}` : '-' }}
                      </span>
                    </div>
                  </td>

                  <td class="px-3 py-5 pr-8 text-center">
                    <div class="flex justify-center gap-2">
                      <button @click="printInvoiceClient(p)" class="inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-95 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm" title="Cetak Invoice">
                        Klien
                      </button>
                      <button v-if="p.photographer !== ownerName && p.photographer !== 'Belum di-assign'" @click="printInvoiceFG(p)" class="inline-flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 border border-orange-200/50 dark:border-orange-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all" title="Cetak Slip Fee">
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
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px;}
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
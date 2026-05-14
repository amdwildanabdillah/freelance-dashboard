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
        banks: data.banks || data.operational?.banks || []
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
// EXPORT PDF INVOICE KLIEN (DIRECT DOWNLOAD & MOBILE SUPPORT)
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
  
  const htmlContent = `
    <div style="width: 800px; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; box-sizing: border-box;">
      <div style="background: #0f172a; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${vendorInfo.value.name}</h1>
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
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  Swal.fire({ title: 'Membuat PDF...', text: 'Mohon tunggu sebentar', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
  html2pdf().set(opt).from(htmlContent).save().then(() => Swal.close())
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
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  Swal.fire({ title: 'Membuat PDF...', text: 'Mohon tunggu sebentar', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
  html2pdf().set(opt).from(htmlContent).save().then(() => Swal.close())
}
</script>

<template>
  <div class="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-10 rounded-[2rem] relative overflow-hidden transition-all duration-500 bg-white dark:bg-[#111] border border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/30 dark:shadow-none">
        
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-400/10 dark:bg-cyan-500/10 blur-3xl rounded-full pointer-events-none transition-all"></div>
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none transition-all"></div>

        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-1.5 flex-wrap">
            <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back, {{ userName }}.</h2>
            
            <span v-if="vendorPlan === 'dev'" class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md shadow-sm border border-slate-700">Developer</span>
            <span v-else-if="vendorPlan === 'lifetime'" class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-md shadow-sm">Lifetime Pro</span>
            <span v-else-if="vendorPlan === 'pro'" class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-500/20">Pro Bulanan</span>
            <span v-else class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400 rounded-md border border-slate-200 dark:border-white/10">Free Starter</span>
          </div>
          
          <p class="text-xs md:text-sm font-medium text-slate-500 dark:text-gray-400">Here's what's happening with your studio today.</p>
        </div>
        
        <div class="relative z-10 flex items-center gap-3">
          <button @click="fetchProjects(currentUser?.uid)" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all text-slate-600 dark:text-slate-300 shadow-sm" title="Refresh Data">
            <svg :class="{'animate-spin': isLoading}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          
          <button @click="copyBookingLink" class="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center cursor-pointer">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Copy Booking Link
          </button>

          <button @click="addManualProject" class="bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center cursor-pointer">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Input Manual
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-cyan-500"></div>
      </div>

      <div v-else class="space-y-6 md:space-y-8">
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Total Revenue</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ formatRupiah(totalRevenue) }}</h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Total Clients</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ totalClients }} <span class="text-xs font-medium text-slate-400">Projects</span></h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Pending Leads</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ pendingLeads }} <span class="text-xs font-medium text-slate-400">Clients</span></h3>
          </div>

          <div class="p-6 md:p-7 rounded-[2rem] border bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Completed</p>
            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ completedProjects }} <span class="text-xs font-medium text-slate-400">Clients</span></h3>
          </div>
        </div>

        <div class="rounded-[2rem] border shadow-sm overflow-hidden bg-white dark:bg-[#111] border-slate-200/60 dark:border-white/10">
          <div class="p-6 md:p-8 border-b flex items-center justify-between border-slate-100 dark:border-white/10">
            <div>
              <h3 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Bookings</h3>
              <p class="text-xs font-medium mt-1 text-slate-500 dark:text-gray-400">The latest 5 clients added to your pipeline.</p>
            </div>
            
            <RouterLink to="/pipeline" class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center group">
              View all
              <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </RouterLink>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Client Details</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Institution</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                  <th class="p-4 md:p-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-if="recentProjects.length === 0">
                  <td colspan="4" class="p-12 text-center text-sm font-medium text-slate-500">
                    No recent bookings found.
                  </td>
                </tr>
                <tr v-for="project in recentProjects" :key="project.id" class="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td class="p-4 md:p-6 whitespace-nowrap">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ project.clientName }}</p>
                    <p class="text-[10px] font-medium text-slate-400 dark:text-gray-500 mt-0.5">ID: {{ project.id.substring(0,6) }}</p>
                  </td>
                  <td class="p-4 md:p-6 text-xs font-medium text-slate-600 dark:text-slate-400">{{ project.university }}</td>
                  <td class="p-4 md:p-6">
                    <span class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md"
                          :class="{
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400': project.status === 'lead',
                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400': project.status === 'dp' || project.status === 'booked',
                            'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400': project.status === 'editing',
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400': project.status === 'delivered',
                            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400': project.status === 'canceled'
                          }">
                      {{ project.status }}
                    </span>
                  </td>
                  <td class="p-4 md:p-6 text-right">
                    <RouterLink :to="`/project/${project.id}`" class="text-[10px] font-semibold px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                      Open
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

const isLoading = ref(true)
const projects = ref([])

// WAJIB GANTI PAKE URL DEPLOY TERBARUMU!
const API_URL = "https://script.google.com/macros/s/AKfycbxKFE-i7dPdpIV0G_vctDH-e9YwhinomFxIQIuaMxSGPAFLORZx6TVKMPsralxKZuo/exec"

const ownerName = 'Wildan'
const managementFeePercent = 0.20 // 20% Potongan buat vendor

const fetchProjects = async () => {
  isLoading.value = true
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'GET_PROJECTS' })
    })
    const result = await response.json()
    if (result.status === 'success') {
      const validStatuses = ['dp', 'booked', 'editing', 'delivered']
      
      projects.value = result.data
        .filter(p => validStatuses.includes(p.Status?.toLowerCase()))
        .map(p => {
          const rawPrice = extractPrice(p.Package)
          const fg = p.Photographer_ID || 'Belum di-assign'
          
          let myProfit = 0
          let teamFee = 0
          
          if (fg === ownerName || fg === 'Belum di-assign') {
            myProfit = rawPrice 
          } else {
            myProfit = rawPrice * managementFeePercent 
            teamFee = rawPrice - myProfit 
          }

          return {
            id: p.ID,
            clientName: p.Client_Name || 'Tanpa Nama',
            package: p.Package || 'Belum pilih paket',
            photographer: fg,
            status: p.Status,
            totalPrice: rawPrice,
            netProfit: myProfit,
            fgFee: teamFee,
            shootDate: p.Shoot_Date || new Date()
          }
        }).reverse()
    }
  } catch (error) {
    Swal.fire('Error', 'Gagal menarik data keuangan.', 'error')
  } finally {
    isLoading.value = false
  }
}

const extractPrice = (pkgString) => {
  if (!pkgString) return 0
  const match = pkgString.match(/Rp\s*([\d.]+)/i)
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

onMounted(() => fetchProjects())
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8 pb-12">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Finance & Invoices</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau total omset, profit bersih (net), dan fee untuk tim fotografer.</p>
      </div>
      <button @click="fetchProjects" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center">
        <svg :class="{'animate-spin': isLoading}" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Refresh Data
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-8">
      
      <!-- Widget Ringkasan Keuangan (3 Kartu) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Omset (Gross)</p>
          <h3 class="text-3xl font-black text-slate-800 relative z-10">{{ formatRupiah(summary.gross) }}</h3>
          <p class="text-xs font-medium text-slate-400 mt-2 relative z-10">Total uang masuk dari klien.</p>
        </div>
        <div class="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl border border-indigo-500 shadow-md relative overflow-hidden group">
          <p class="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Net Profit (Vixel / Owner)</p>
          <h3 class="text-3xl font-black text-white relative z-10">{{ formatRupiah(summary.net) }}</h3>
          <p class="text-xs font-medium text-indigo-200 mt-2 relative z-10">Omset dikurangi bagi hasil tim.</p>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Beban Fee Tim / FG</p>
          <h3 class="text-3xl font-black text-orange-600 relative z-10">{{ formatRupiah(summary.team) }}</h3>
          <p class="text-xs font-medium text-slate-400 mt-2 relative z-10">Total fee yang harus dibayar ke FG.</p>
        </div>
      </div>

      <!-- Tabel Rincian Keuangan per Project -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Rincian Bagi Hasil Project (Aktif)</h3>
          <span class="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">Management Fee: {{ managementFeePercent * 100 }}%</span>
        </div>
        
        <div class="overflow-x-auto custom-scrollbar">
          <table class="min-w-[900px] w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/50">
              <tr>
                <th class="py-4 pl-6 pr-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client & Package</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Harga</th>
                <th class="px-3 py-4 text-left text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Profit (Owner)</th>
                <th class="px-3 py-4 text-right text-[10px] font-bold text-orange-500 uppercase tracking-widest">Fee (FG / Tim)</th>
                <th class="px-3 py-4 pr-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Print Dokumen</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              
              <tr v-if="projects.length === 0">
                <td colspan="6" class="text-center py-12 text-sm text-slate-400 font-bold">Belum ada project aktif yang bisa dihitung.</td>
              </tr>

              <tr v-for="p in projects" :key="p.id" class="hover:bg-slate-50 transition-colors group">
                <td class="py-4 pl-6 pr-3">
                  <p class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ p.clientName }}</p>
                  <p class="text-[10px] font-medium text-slate-500 mt-0.5 truncate max-w-[200px]">{{ p.package }}</p>
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
                    <span class="text-sm font-black text-indigo-600">{{ formatRupiah(p.netProfit) }}</span>
                    <span v-if="p.photographer === ownerName || p.photographer === 'Belum di-assign'" class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">📸 Eksekusi Sendiri (100%)</span>
                    <span v-else class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">💼 Broker Fee ({{ managementFeePercent * 100 }}%)</span>
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
                <td class="px-3 py-4 pr-6 text-center">
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
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px;}
.custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase' // Panggil satpam Firebase

// Import semua halaman
import Dashboard from '../views/Dashboard.vue'
import Pipeline from '../views/Pipeline.vue'
import Calendar from '../views/Calendar.vue'
import Clients from '../views/Clients.vue'
import Invoices from '../views/Invoices.vue'
import Settings from '../views/Settings.vue'
import ProjectDetail from '../views/ProjectDetail.vue'
import BookingForm from '../views/BookingForm.vue'
import VendorSettings from '../views/VendorSettings.vue'

const routes = [
  // RUTE PUBLIK (Tampil di depan, tanpa login)
  { path: '/', name: 'Landing', component: () => import('../views/Landing.vue'), meta: { public: true } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  // Tambahin :vendorId? biar sistem tau link ini buat vendor siapa
  { path: '/book/:vendorId?', name: 'Form Booking Klien', component: BookingForm, meta: { public: true } }, 

  // RUTE PRIVATE / ADMIN (Butuh Login & Pake Sidebar)
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } }, // <-- Pindah ke /dashboard
  { path: '/pipeline', name: 'Pipeline Management', component: Pipeline, meta: { requiresAuth: true } },
  { path: '/calendar', name: 'Calendar & Schedule', component: Calendar, meta: { requiresAuth: true } },
  { path: '/clients', name: 'Client Database', component: Clients, meta: { requiresAuth: true } },
  { path: '/invoices', name: 'Invoices & Billing', component: Invoices, meta: { requiresAuth: true } },
  { path: '/settings', name: 'System Settings', component: Settings, meta: { requiresAuth: true } },
  { path: '/project/:id', name: 'Project Detail', component: ProjectDetail, meta: { requiresAuth: true } },
  { path: '/vendor', name: 'Vendor Settings', component: VendorSettings, meta: { requiresAuth: true } },
  { path: '/onboarding', name: 'Setup Vendor', component: () => import('../views/Onboarding.vue'), meta: { public: true } },

  // HALAMAN RAHASIA ADMIN VIXEL
  { path: '/admin', name: 'Admin Panel', component: () => import('../views/Admin.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// SATPAM PRODUCTION (Navigation Guard)
router.beforeEach(async (to, from, next) => {
  // Tunggu Firebase ngecek KTP user sebentar
  await auth.authStateReady() 
  const user = auth.currentUser

  // Aturan 1: Kalau mau masuk ruang rahasia tapi belum login -> Tendang ke /login
  if (to.meta.requiresAuth && !user) {
    next('/login')
  } 
  // Aturan 2: Kalau UDAH login tapi malah buka halaman login -> Tendang ke Dashboard
  else if (to.path === '/login' && user) {
    next('/')
  } 
  // Aturan 3: Bebas masuk (Form Booking atau rute normal yang sah)
  else {
    next()
  }
})

export default router
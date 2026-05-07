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
  // Rute Admin (Butuh Login & Pake Sidebar)
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/pipeline', name: 'Pipeline Management', component: Pipeline, meta: { requiresAuth: true } },
  { path: '/calendar', name: 'Calendar & Schedule', component: Calendar, meta: { requiresAuth: true } },
  { path: '/clients', name: 'Client Database', component: Clients, meta: { requiresAuth: true } },
  { path: '/invoices', name: 'Invoices & Billing', component: Invoices, meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings & Profile', component: Settings, meta: { requiresAuth: true } },
  { path: '/project/:id', name: 'Project Detail', component: ProjectDetail, meta: { requiresAuth: true } },
  { path: '/vendor', name: 'Vendor & Team', component: VendorSettings, meta: { requiresAuth: true } },
  { path: '/onboarding', name: 'Setup Vendor', component: () => import('../views/Onboarding.vue'), meta: { public: true } },
  
  // Rute Publik Klien & Auth (Tanpa Sidebar)
  { path: '/book', name: 'Form Booking Klien', component: BookingForm, meta: { public: true } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } }
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
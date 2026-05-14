import { createRouter, createWebHistory } from 'vue-router' // <-- INI UDAH BENER
import { auth } from '../firebase' // Panggil satpam Firebase

// PERHATIKAN: Gak ada lagi import static (import Dashboard dll) di sini.
// Semuanya langsung di-load pas halamannya dipencet (Lazy Loading).

const routes = [
  // RUTE PUBLIK (Tampil di depan, tanpa login)
  { path: '/', name: 'Landing', component: () => import('../views/Landing.vue'), meta: { public: true } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/book/:vendorId?', name: 'Form Booking Klien', component: () => import('../views/BookingForm.vue'), meta: { public: true } }, 
  { path: '/onboarding', name: 'Setup Vendor', component: () => import('../views/Onboarding.vue'), meta: { public: true } },

  // RUTE PRIVATE / ADMIN (Butuh Login & Pake Sidebar)
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/pipeline', name: 'Pipeline Management', component: () => import('../views/Pipeline.vue'), meta: { requiresAuth: true } },
  { path: '/calendar', name: 'Calendar & Schedule', component: () => import('../views/Calendar.vue'), meta: { requiresAuth: true } },
  { path: '/clients', name: 'Client Database', component: () => import('../views/Clients.vue'), meta: { requiresAuth: true } },
  { path: '/invoices', name: 'Invoices & Billing', component: () => import('../views/Invoices.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'System Settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/project/:id', name: 'Project Detail', component: () => import('../views/ProjectDetail.vue'), meta: { requiresAuth: true } },
  { path: '/vendor', name: 'Vendor Settings', component: () => import('../views/VendorSettings.vue'), meta: { requiresAuth: true } },

  // HALAMAN RAHASIA ADMIN
  { path: '/admin', name: 'Admin Panel', component: () => import('../views/Admin.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(), // <-- INI SEKARANG UDAH SINKRON SAMA YANG DI ATAS
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

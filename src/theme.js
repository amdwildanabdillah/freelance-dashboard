// src/theme.js
import { ref } from 'vue'

const isDark = ref(
  localStorage.getItem('theme') === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

export const initTheme = () => {
  if (isDark.value) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

export const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  initTheme() 
}

export const useTheme = () => ({ isDark, toggleTheme })
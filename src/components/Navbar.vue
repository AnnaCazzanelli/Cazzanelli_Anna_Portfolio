<script setup>
import { RouterLink } from 'vue-router'
import { ref, watch, onMounted } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

/* Stato UI e Lingua */
const isMobileMenuOpen = ref(false)
const isDarkMode = ref(false)
const { currentLang, toggleLanguage } = useLanguage()

/* Menu mobile */
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

/* Tema */
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
}

/* Applica/rimuove classe tema sul <body> */
watch(isDarkMode, (val) => {
  if (val) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
})

/* Ripristina preferenza tema */
onMounted(() => {
  const saved = localStorage.getItem('isDarkMode')
  if (saved) {
    isDarkMode.value = JSON.parse(saved)
  }
})

/* Persiste preferenza tema */
watch(
  isDarkMode,
  (val) => {
    localStorage.setItem('isDarkMode', JSON.stringify(val))
  },
  { deep: true }
)
</script>

<template>
  <header class="header-container w-full">
    <div class="header-content">

      <!-- Navigazione Desktop -->
      <nav class="desktop-nav" aria-label="Navigazione principale">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/publications">{{ currentLang === 'en' ? 'Publications' : 'Pubblicazioni' }}</RouterLink>
        <RouterLink to="/projects">{{ currentLang === 'en' ? 'Projects' : 'Progetti' }}</RouterLink>
        <RouterLink to="/illustrations">{{ currentLang === 'en' ? 'Illustrations' : 'Illustrazioni' }}</RouterLink>
        <RouterLink to="/contacts">{{ currentLang === 'en' ? 'Contacts' : 'Contatti' }}</RouterLink>
      </nav>

      <!-- Area Controlli (Desktop & Base Mobile) -->
      <div class="controls-wrapper">
        <!-- Toggle Lingua Desktop -->
        <button class="lang-toggle hidden-mobile" type="button" @click="toggleLanguage" aria-label="Cambia lingua">
          <span :class="{ 'active-lang': currentLang === 'it' }">ITA</span>
          <span class="lang-sep">/</span>
          <span :class="{ 'active-lang': currentLang === 'en' }">ENG</span>
        </button>

        <!-- Toggle Tema con SVG Mascherato Dinamico -->
        <button class="theme-toggle" type="button" @click="toggleDarkMode" aria-label="Cambia tema">
          <span v-if="isDarkMode" class="mode-icn icon-moon" aria-label="Dark Mode"></span>
          <span v-else class="mode-icn icon-sun" aria-label="Light Mode"></span>
        </button>

        <!-- Icona Hamburger Mobile -->
        <button class="menu-icon" type="button" @click="toggleMobileMenu" aria-label="Apri menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- Navigazione Mobile Overlay -->
      <nav class="mobile-nav" :class="{ 'is-open': isMobileMenuOpen }" aria-label="Navigazione mobile">
        <button class="close-menu-icon" type="button" @click="closeMobileMenu" aria-label="Chiudi menu">
          <img src="/icone/icon-cross.svg" alt="" aria-hidden="true" />
        </button>

        <div class="mobile-links flex flex-col items-center">
          <RouterLink to="/" @click="closeMobileMenu">Home</RouterLink>
          <RouterLink to="/about" @click="closeMobileMenu">About</RouterLink>
          <RouterLink to="/publications" @click="closeMobileMenu">{{ currentLang === 'en' ? 'Publications' :
            'Pubblicazioni' }}</RouterLink>
          <RouterLink to="/projects" @click="closeMobileMenu">{{ currentLang === 'en' ? 'Projects' : 'Progetti' }}
          </RouterLink>
          <RouterLink to="/illustrations" @click="closeMobileMenu">{{ currentLang === 'en' ? 'Illustrations' :
            'Illustrazioni' }}</RouterLink>
          <RouterLink to="/contacts" @click="closeMobileMenu">{{ currentLang === 'en' ? 'Contacts' : 'Contatti' }}
          </RouterLink>
        </div>

        <!-- Toggle Lingua dentro il Menu Mobile -->
        <button class="lang-toggle mobile-lang-btn" type="button" @click="toggleLanguage" aria-label="Cambia lingua">
          <span :class="{ 'active-lang': currentLang === 'it' }">ITA</span>
          <span class="lang-sep">/</span>
          <span :class="{ 'active-lang': currentLang === 'en' }">ENG</span>
        </button>
      </nav>

    </div>
  </header>
</template>

<style scoped>
/* Header container */
.header-container {
  border-bottom: 2px solid var(--color-accent);
}

.header-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px var(--margin-desktop);
  gap: clamp(12px, 2vw, 24px);
}

/* Nav Desktop */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: clamp(14px, 1.8vw, 24px);
}

.desktop-nav a {
  font-size: clamp(13pt, 1.2vw, 16pt);
  line-height: 1.2;
  font-family: 'Forma DJR Micro', 'Lato', sans-serif;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-text);
  transition: color 0.2s ease;
  white-space: nowrap;
}

.desktop-nav a:hover {
  color: var(--color-hover);
}

/* Gruppo Utility (Linea separatrice + Lingua + Tema) */
.controls-wrapper {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.2vw, 16px);
  padding-left: clamp(12px, 1.5vw, 20px);
  height: 20px;
  border-left: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
}

/* --- TOGGLE LINGUA (Scalato, Discreto e Dinamico) --- */
.lang-toggle {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  cursor: pointer;
  font-family: 'Forma DJR Micro', 'Lato', sans-serif;
  font-size: clamp(0.75rem, 0.9vw, 0.95rem);
  font-weight: 600;
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  line-height: 1;
  appearance: none;
  -webkit-appearance: none;
}

.lang-toggle span {
  color: var(--color-text);
  opacity: 0.35;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.lang-toggle span.active-lang {
  opacity: 1;
  color: var(--color-accent);
  font-weight: 700;
}

.lang-toggle:hover span:not(.active-lang) {
  opacity: 0.75;
}

.lang-sep {
  opacity: 0.25 !important;
  margin: 0 1px;
}

/* --- TOGGLE TEMA --- */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mode-icn {
  width: 20px;
  height: 20px;
  display: block;
  background-color: var(--color-accent);
  transition: background-color 0.2s ease, transform 0.2s ease;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.icon-moon {
  -webkit-mask-image: url('/icone/icon-moon.svg');
  mask-image: url('/icone/icon-moon.svg');
}

.icon-sun {
  -webkit-mask-image: url('/icone/icon-sun.svg');
  mask-image: url('/icone/icon-sun.svg');
}

.theme-toggle:hover .mode-icn {
  background-color: var(--color-hover);
  transform: translateY(-1px);
}

/* Icona Hamburger Mobile */
.menu-icon {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.menu-icon span {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--color-text);
  margin: 3px 0;
}

/* Pulsante Chiusura Menu Mobile */
.close-menu-icon {
  position: absolute;
  top: 20px;
  right: var(--margin-mobile);
  background: none;
  border: none;
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.close-menu-icon img {
  width: 28px;
  height: 28px;
}

/* Navigazione Mobile Overlay */
.mobile-nav {
  display: none;
}

/* Mobile Responsive */
@media (max-width: 900px) {

  .desktop-nav,
  .hidden-mobile {
    display: none !important;
  }

  .controls-wrapper {
    border-left: none;
    padding-left: 0;
    gap: 12px;
    height: auto;
  }

  .menu-icon {
    display: flex;
  }

  .mobile-nav {
    position: fixed;
    top: 0;
    right: -100%;
    width: 100%;
    height: 100vh;
    background-color: var(--color-surface);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 40px;
    transition: right 0.3s ease-in-out;
    z-index: 999;
  }

  .mobile-nav.is-open {
    display: flex;
    right: 0;
  }

  .mobile-links a {
    font-size: 1.81rem;
    line-height: 2.31rem;
    font-weight: 700;
    text-decoration: none;
    color: var(--color-text);
    margin: 12px 0;
  }

  .mobile-lang-btn {
    font-size: 14pt;
    margin-top: 10px;
  }
}
</style>
<script setup>
import { RouterLink } from 'vue-router'
import { ref, watch, onMounted } from 'vue'

/* Stato UI */
const isMobileMenuOpen = ref(false)
const isDarkMode = ref(false)

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
        <RouterLink to="/publications">Pubblicazioni</RouterLink>
        <RouterLink to="/projects">Progetti</RouterLink>
        <RouterLink to="/illustrations">Illustrazioni</RouterLink>
        <RouterLink to="/contacts">Contatti</RouterLink>
      </nav>

      <!-- Area Controlli (Desktop & Base Mobile) -->
      <div class="controls-wrapper">
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
          <RouterLink to="/publications" @click="closeMobileMenu">Pubblicazioni</RouterLink>
          <RouterLink to="/projects" @click="closeMobileMenu">Progetti</RouterLink>
          <RouterLink to="/illustrations" @click="closeMobileMenu">Illustrazioni</RouterLink>
          <RouterLink to="/contacts" @click="closeMobileMenu">Contatti</RouterLink>
        </div>
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
  padding: 20px var(--margin-desktop);
  gap: 24px;
}

/* Nav Desktop */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.desktop-nav a {
  font-size: 16pt;
  line-height: 19pt;
  font-family: 'Forma DJR Micro', 'Lato', sans-serif;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-text);
  transition: color 0.2s ease;
}

.desktop-nav a:hover {
  color: var(--color-hover);
}

/* Area utility */
.controls-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* --- TOGGLE TEMA (SVG dinamici mascherati) --- */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mode-icn {
  width: 24px;
  height: 24px;
  display: block;
  background-color: var(--color-accent);
  /* Prende automaticamente il colore d'accento */
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
  /* Cambia colore al passaggio del mouse */
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
  .desktop-nav {
    display: none !important;
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
}
</style>
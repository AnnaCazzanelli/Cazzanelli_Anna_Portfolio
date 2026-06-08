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
  <div class="header-container w-full">
    <div class="header-content">
      <nav class="desktop-nav" aria-label="Navigazione principale">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/publications">Pubblicazioni</RouterLink>
        <RouterLink to="/projects">Progetti</RouterLink>
        <RouterLink to="/illustrations">Illustrazioni</RouterLink>
        <RouterLink to="/contacts">Contatti</RouterLink>
      </nav>

      <button class="theme-toggle" type="button" @click="toggleDarkMode" aria-label="Cambia tema">
        <img v-if="isDarkMode" src="/icone/icon-moon.svg" class="mode-icn" alt="Dark Mode" />
        <img v-else src="/icone/icon-sun.svg" class="mode-icn" alt="Light Mode" />
      </button>

      <button class="menu-icon" type="button" @click="toggleMobileMenu" aria-label="Apri menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="mobile-nav" :class="{ 'is-open': isMobileMenuOpen }" aria-label="Navigazione mobile">
        <button class="close-menu-icon" type="button" @click="closeMobileMenu" aria-label="Chiudi menu">
          <img src="/icone/icon-cross.svg" alt="" aria-hidden="true" />
        </button>

        <RouterLink to="/" @click="closeMobileMenu">Home</RouterLink>
        <RouterLink to="/about" @click="closeMobileMenu">About</RouterLink>
        <RouterLink to="/publications" @click="closeMobileMenu">Pubblicazioni</RouterLink>
        <RouterLink to="/projects" @click="closeMobileMenu">Progetti</RouterLink>
        <RouterLink to="/illustrations" @click="closeMobileMenu">Illustrazioni</RouterLink>
        <RouterLink to="/contacts" @click="closeMobileMenu">Contatti</RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
/* Header globale adattato */
.header-container {
  border-bottom: 2px solid var(--color-accent);
}

.header-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px var(--margin-desktop);
}

/* Nav desktop */
.desktop-nav a {
  font-size: 16pt;
  line-height: 19pt;
  font-family: 'Forma DJR Micro', 'Lato', sans-serif;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-text);
  margin-left: 20px;
}

.desktop-nav a:hover {
  color: var(--color-hover);
}

/* Toggle tema */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 10px;
}

.theme-toggle img {
  width: 28px;
  height: 28px;
}

.mode-icn:hover {
  opacity: 1;
  transform: translateY(-1px);
  color: var(--color-hover);
}

/* Icona hamburger - CORRETTA da div a button senza perdere lo stile */
.menu-icon {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 10px;
  padding: 0;
}

.menu-icon span {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--color-text);
  margin: 5px 0;
}

/* Posizionamento e dimensioni della X - CORRETTA da div a button */
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

/* Nav mobile */
.mobile-nav {
  display: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
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
    transition: right 0.3s ease-in-out;
    z-index: 999;
  }

  .mobile-nav.is-open {
    display: flex;
    right: 0;
  }

  .mobile-nav a {
    font-size: 1.81rem;
    line-height: 2.31rem;
    font-weight: 700;
    text-decoration: none;
    color: var(--color-text);
    margin: 15px 0;
  }

  .mobile-nav a:hover {
    color: var(--color-hover);
  }
}
</style>
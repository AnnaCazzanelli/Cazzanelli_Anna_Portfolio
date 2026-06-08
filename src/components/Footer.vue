<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="site-footer text-text border-t-2" :style="{ borderColor: 'var(--color-accent)' }">
    <div class="mx-auto max-w-[1280px] px-desktop md:py-6 py-5 flex flex-col gap-3 md:gap-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">

        <!-- CORRETTO (Punto 29 & Best Practice 7): Sostituito tag <nav> con <div> e rimossi i "title" ridondanti dai link testuali -->
        <div
          class="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6 text-[13px] sm:text-[14px] md:text-base">
          <RouterLink to="/" class="footer-link hover:text-hover">Home</RouterLink>

          <RouterLink to="/about" class="footer-link hover:text-hover">About</RouterLink>

          <RouterLink to="/publications" class="footer-link hover:text-hover">Pubblicazioni</RouterLink>

          <RouterLink to="/projects" class="footer-link hover:text-hover">Progetti</RouterLink>

          <RouterLink to="/illustrations" class="footer-link hover:text-hover">Illustrazioni</RouterLink>

          <RouterLink to="/contacts" class="footer-link hover:text-hover">Contatti</RouterLink>
        </div>

        <!-- CORRETTO (Best Practice 5 & 7): Aggiornata l'etichetta mail per avvisare del comportamento esterno e ripuliti i title social -->
        <div class="flex items-center gap-4 md:gap-4 justify-center md:justify-end w-full md:w-auto"
          aria-label="Canali Social">
          <a href="mailto:anna.cazzanelli1@gmail.com" target="_blank" rel="noopener" class="footer-link"
            aria-label="Invia una email a Anna Cazzanelli (apre il client di posta elettronica)">
            <img src="/icone/icon-email.svg" alt="" class="social-icn" aria-hidden="true" />
          </a>

          <a href="https://www.instagram.com/annaredpan/" target="_blank" rel="noopener" class="footer-link"
            aria-label="Profilo Instagram di Anna Cazzanelli">
            <img src="/icone/icon-instagram.svg" alt="" class="social-icn" aria-hidden="true" />
          </a>

          <a href="https://www.linkedin.com/in/anna-cazzanelli-a193a6276/" target="_blank" rel="noopener"
            class="footer-link" aria-label="Profilo LinkedIn di Anna Cazzanelli">
            <img src="/icone/icon-linkedin.svg" alt="" class="social-icn" aria-hidden="true" />
          </a>

          <a href="https://www.behance.net/cazzanellianna" target="_blank" rel="noopener" class="footer-link"
            aria-label="Profilo Behance di Anna Cazzanelli">
            <img src="/icone/icon-behance.svg" alt="" class="social-icn" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div class="text-center">
        <p class="copyright">
          © 2026 Anna Cazzanelli — Tutti i diritti riservati
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fondo footer */
.site-footer {
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* Link footer */
.footer-link {
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-hover);
}

/* Icone social */
.social-icn {
  width: 20px;
  height: 20px;
  display: block;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.12s ease;
}

.footer-link:hover .social-icn {
  opacity: 1;
  transform: translateY(-1px);
  color: var(--color-hover);
}

/* Copyright */
.copyright {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.75;
}

@media (min-width: 768px) {
  .copyright {
    font-size: 16px;
  }
}

@media (max-width: 360px) {
  .copyright {
    font-size: 12px;
  }
}
</style>
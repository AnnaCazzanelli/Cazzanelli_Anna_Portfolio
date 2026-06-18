<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="site-footer text-text border-t-2" :style="{ borderColor: 'var(--color-accent)' }">
    <div class="mx-auto max-w-[1280px] px-desktop md:py-6 py-5 flex flex-col gap-3 md:gap-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">

        <!-- Navigazione interna -->
        <div
          class="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6 text-[13px] sm:text-[14px] md:text-base">
          <RouterLink to="/" class="footer-link hover:text-hover">Home</RouterLink>

          <RouterLink to="/about" class="footer-link hover:text-hover">About</RouterLink>

          <RouterLink to="/publications" class="footer-link hover:text-hover">Pubblicazioni</RouterLink>

          <RouterLink to="/projects" class="footer-link hover:text-hover">Progetti</RouterLink>

          <RouterLink to="/illustrations" class="footer-link hover:text-hover">Illustrazioni</RouterLink>

          <RouterLink to="/contacts" class="footer-link hover:text-hover">Contatti</RouterLink>
        </div>

        <!-- Social -->
        <div class="flex items-center gap-4 md:gap-4 justify-center md:justify-end w-full md:w-auto"
          aria-label="Canali Social">
          <a href="mailto:anna.cazzanelli1@gmail.com" class="footer-link"
            aria-label="Invia un email a Anna Cazzanelli - Apre il client di posta">
            <img src="/icone/icon-email.svg" alt="Email" class="social-icn" />
          </a>

          <a href="https://www.instagram.com/annaredpan/" target="_blank" rel="noopener" class="footer-link"
            aria-label="Profilo Instagram di Anna Cazzanelli - Si apre in una nuova scheda">
            <img src="/icone/icon-instagram.svg" alt="Instagram" class="social-icn" />
          </a>

          <a href="https://www.linkedin.com/in/anna-cazzanelli-a193a6276/" target="_blank" rel="noopener"
            class="footer-link" aria-label="Profilo LinkedIn di Anna Cazzanelli - Si apre in una nuova scheda">
            <img src="/icone/icon-linkedin.svg" alt="LinkedIn" class="social-icn" />
          </a>

          <a href="https://www.behance.net/cazzanellianna" target="_blank" rel="noopener" class="footer-link"
            aria-label="Profilo Behance di Anna Cazzanelli - Si apre in una nuova scheda">
            <img src="/icone/icon-behance.svg" alt="Behance" class="social-icn" />
          </a>
        </div>
      </div>

      <!-- SEZIONE COPYRIGHT & LINK LEGALI -->
      <div class="text-center flex flex-col gap-1 md:gap-2">
        <p class="copyright">
          © 2026 Anna Cazzanelli — Tutti i diritti riservati
        </p>

        <!-- Link Iubenda inseriti qui -->
        <div class="legal-links text-[12px] sm:text-[13px] md:text-[14px]">
          <a href="https://www.iubenda.com/privacy-policy/22335353" class="footer-link iubenda-noiframe iubenda-embed"
            title="Privacy Policy">Privacy Policy</a>
          <span class="mx-2 opacity-50">|</span>
          <a href="https://www.iubenda.com/privacy-policy/22335353/cookie-policy"
            class="footer-link iubenda-noiframe iubenda-embed" title="Cookie Policy">Cookie Policy</a>
        </div>
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

/* Stile per distanziare e sfumare leggermente i link legali rispetto al copyright principale */
.legal-links {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.legal-links:hover {
  opacity: 1;
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
<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section role="region" aria-labelledby="cta-title" class="relative mx-auto grid place-content-center justify-items-center gap-6
           px-4 py-6 md:px-8 md:py-10
           bg-surface text-text
           border-t-2 border-[var(--color-accent)]
           min-h-[clamp(260px,32vh,420px)] md:min-h-[clamp(220px,40vh,360px)]">
    <h2 id="cta-title" class="sr-only">Contatti</h2>

    <p class="cta-text m-0 text-center opacity-90">
      Per lavori su commissione, collaborazioni...
    </p>

    <RouterLink to="/contacts" class="cta-btn inline-block px-7 py-4 leading-none
             text-[18px] border border-[var(--color-accent)] no-underline
             transition-[transform,background-color,color,font-weight] duration-200" title="Contattami">
      Contattami ora
    </RouterLink>

  </section>
</template>

<style scoped>
/* Testo principale */
.cta-text {
  font-size: clamp(16px, 1.4vw, 18px) !important;
  line-height: 1.7;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .cta-text {
    white-space: normal;
  }
}

/* Pulsante principale */
.cta-btn {
  font-weight: 700;
  background-color: color-mix(in srgb, var(--color-accent) 70%, transparent);
  color: var(--color-text);
}

.cta-btn:hover {
  font-weight: 700;
  background-color: var(--color-hover);
  color: var(--color-surface);
}

.cta-btn:active {
  transform: scale(0.98);
}

.cta-btn:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}

/* Link secondari */
.cta-link {
  color: var(--color-text);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  padding-bottom: 2px;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.cta-link:hover {
  color: var(--color-hover);
  border-color: var(--color-hover);
}

/* Accessibilità (contenuto solo visivo) */
.sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
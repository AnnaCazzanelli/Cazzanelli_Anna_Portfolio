<script setup>
/**
 * Routing e Stato Lingua
 */
import { RouterLink } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'

const { currentLang } = useLanguage()

/* ==========================================================================
   Scroll iniziale
   ========================================================================== */
window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
</script>

<template>
  <main id="main-content" tabindex="-1" class="bg-surface text-text py-12 px-mobile md:px-desktop"
    aria-labelledby="about-title">
    <div id="about-intro"
      class="mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-[72px] items-start">

      <div class="portrait-wrapper">
        <picture>
          <img src="/images/about/about_lightmode.png" :alt="currentLang === 'en'
            ? 'Illustration depicting a hand holding a photograph of the designer'
            : 'Illustrazione che raffigura una mano che tiene fotografia della designer'"
            class="portrait-img block w-full" />
        </picture>
      </div>

      <article class="bio max-w-[68ch]">

        <h1 id="about-title" class="m-0 mb-4 text-accent leading-[1.1] whitespace-nowrap
                   text-[28px] xs:text-[30px] sm:text-[36px]
                   md:text-[clamp(32px,4vw,48px)]">
          {{ currentLang === 'en' ? 'About me' : 'About me' }}
        </h1>

        <!-- Contenuto in Inglese -->
        <template v-if="currentLang === 'en'">
          <p>
            I am Anna Cazzanelli, an illustrator and digital communication designer. <br />
            Graduated in 2018 in <strong>Visual Arts</strong> from the <em>A. Vittoria Art High School</em> in Trento.
            I subsequently earned a Bachelor's degree in <strong>New Technologies of Art</strong> at the <em>G.
              Cignaroli Academy of Fine Arts</em> in Verona.
            <br /> In February 2026, I completed my Master's degree in <strong>Design &amp; Communication</strong> at
            <em>LABA, Free Academy of Fine Arts</em> in Brescia.
          </p>

          <p>
            My academic and artistic journey has led me to develop skills ranging from editorial illustration to digital
            design, UI/UX for websites and mobile applications, motion graphics, as well as visual identity and
            multimedia communication strategies.
          </p>

          <p>
            In every project, I strive to combine <strong>creativity</strong>, <strong>functionality</strong>, and
            <strong>accessibility</strong>, bringing to life visual solutions that are both effective and
            context-aware.<br />
            Within this portfolio, you can explore a curated selection of the most significant and representative works
            from my creative and professional path.
          </p>
        </template>

        <!-- Contenuto in Italiano -->
        <template v-else>
          <p>
            Sono Anna Cazzanelli, illustratrice e digital communication designer. <br />
            Diplomata nel 2018 in <strong>Arti Figurative</strong> presso il Liceo Artistico <em>A.Vittoria di
              Trento</em>.
            Ho successivamente conseguito la laurea triennale in <strong>Nuove Tecnologie dell’Arte</strong>
            all’Accademia di Belle Arti <em>G. Cignaroli</em> di Verona.
            <br /> A febbraio 2026 ho concluso il mio percorso accademico magistrale in <strong>Design &amp;
              Communication</strong> alla <em>LABA, Libera Accademia di Belle Arti</em> di Brescia.
          </p>

          <p>
            Il mio percorso mi ha portata a sviluppare competenze che spaziano dall’illustrazione editoriale alla
            progettazione digitale, dal design di siti web e applicazioni, alla motion graphic, fino alla creazione di
            identità visive e strategie di comunicazione multimediale.
          </p>

          <p>
            In ogni progetto cerco di coniugare <strong>creatività</strong>, <strong>funzionalità</strong> e
            <strong>accessibilità</strong> dando vita a soluzioni visive efficaci e coerenti con il contesto.<br />
            All'interno di questo sito portfolio, potrai esplorare una selezione dei lavori più significativi e
            rappresentativi della mia produzione creativa e professionale.
          </p>
        </template>

      </article>
    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   Accessibilità
   ========================================================================== */
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

/* ==========================================================================
   Immagine di presentazione
   ========================================================================== */
.portrait-wrapper {
  width: 100%;
}

.portrait-img {
  width: 100%;
  height: 600px;
  object-fit: contain;
  object-position: top left;
  content: url('/images/about/about_lightmode.png');
}

/* Variante dark */
body.dark-mode .portrait-img {
  content: url('/images/about/about_darkmode.png');
}

@media (max-width: 900px) {
  .portrait-img {
    height: 320px;
    object-position: center;
  }
}

/* ==========================================================================
   Tipografia contenuti
   ========================================================================== */
.bio p {
  margin: 0 0 16px;
  color: var(--color-text);
  font-size: clamp(16px, 1.05vw, 18px);
  line-height: 1.85;
}

/* ==========================================================================
   Titolo H1 (responsivo)
   ========================================================================== */
@media (max-width: 1024px) and (min-width: 769px) {
  #about-title {
    font-size: 3.3rem;
    line-height: 4.15rem;
  }
}

@media (max-width: 768px) {
  #about-title {
    font-size: 2.3rem;
    line-height: 3rem;
    white-space: normal;
  }
}

/* ==========================================================================
   Utility di padding orizzontale
   ========================================================================== */
:global(.px-mobile) {
  padding-left: var(--margin-mobile);
  padding-right: var(--margin-mobile);
}

@media (min-width: 768px) {
  :global(.px-desktop) {
    padding-left: var(--margin-desktop);
    padding-right: var(--margin-desktop);
  }
}
</style>
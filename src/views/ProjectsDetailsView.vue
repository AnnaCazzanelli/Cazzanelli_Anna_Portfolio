<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'

const route = useRoute()
const project = ref(null)
const loading = ref(true)
const notFound = ref(false)

const showMobileInfo = ref(false)
let lastActiveElement = null

function openMobileInfo() {
  lastActiveElement = document.activeElement
  showMobileInfo.value = true
  document.documentElement.style.overflow = 'hidden'
}

function closeMobileInfo() {
  showMobileInfo.value = false
  document.documentElement.style.overflow = ''
  if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
    lastActiveElement.focus()
  }
}

function trapMobileInfoFocus(e) {
  if (!showMobileInfo.value) return
  if (e.key === 'Tab') {
    const modal = document.querySelector('.mobile-info-card')
    if (!modal) return
    const focusable = modal.querySelectorAll('button, a, [tabindex="0"]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === last) {
        first.focus()
        e.preventDefault()
      }
    }
  }
}

watch(showMobileInfo, async (newVal) => {
  if (newVal) {
    await nextTick()
    const closeBtn = document.querySelector('.mobile-info-close-btn')
    if (closeBtn) closeBtn.focus()
  }
})

const activeLightboxImage = ref(null)

function openLightbox(url) {
  activeLightboxImage.value = url
  document.documentElement.style.overflow = 'hidden'
}

function closeLightbox() {
  activeLightboxImage.value = null
  if (!showMobileInfo.value) {
    document.documentElement.style.overflow = ''
  }
}

const orderedIds = ref([])
const currentIndexInList = computed(() => {
  return orderedIds.value.indexOf(String(route.params.id || '').trim())
})
const nextProjectId = computed(() => {
  if (currentIndexInList.value !== -1 && currentIndexInList.value < orderedIds.value.length - 1) {
    return orderedIds.value[currentIndexInList.value + 1]
  }
  return null
})

const mediaItems = computed(() => {
  const g = project.value?.gallery
  if (!Array.isArray(g)) return []
  return g
    .map((it) => {
      if (it && typeof it === 'object') {
        const hi = (it.high_res || '').trim()
        const lo = (it.low_res || '').trim()
        const caption = (it.caption || '').trim()
        const isVideo = hi.includes('youtube.com') || hi.includes('youtu.be')
        return {
          type: isVideo ? 'video' : 'image',
          hi,
          lo: lo || hi,
          caption
        }
      }
      if (typeof it === 'string') {
        const s = it.trim()
        const isVideo = s.includes('youtube.com') || s.includes('youtu.be')
        return { type: isVideo ? 'video' : 'image', hi: s, lo: s, caption: '' }
      }
      return null
    })
    .filter((item) => item && (item.hi || item.lo))
})

const normalizedLinks = computed(() => {
  if (!project.value?.links || !Array.isArray(project.value.links)) return []
  return project.value.links.map(lnk => {
    if (!lnk) return null
    const labelKey = Object.keys(lnk).find(k => k.trim() === 'label')
    const urlKey = Object.keys(lnk).find(k => k.trim() === 'url')
    return {
      label: labelKey ? lnk[labelKey] : 'Vedi materiale',
      url: urlKey ? lnk[urlKey] : '#'
    }
  }).filter(l => l !== null)
})

const CATEGORY_COLORS = {
  'motion graphics': { bg: '#fff3bf', bd: '#ffd43b', fg: '#7a5b00' },
  'web design': { bg: '#e7f5ff', bd: '#74c0fc', fg: '#1c4f80' },
  'communication': { bg: '#ffe3e3', bd: '#ffa8a8', fg: '#7a1f1f' },
  'case studies': { bg: '#e6f4ea', bd: '#81c995', fg: '#137333' },
  'visual design': { bg: '#ffe3f4', bd: '#ffa8dc', fg: '#7a1f5d' },
  'other': { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

const tagStyle = computed(() => {
  const catNormalized = String(project.value?.category || '').trim().toLowerCase()
  const c = CATEGORY_COLORS[catNormalized] || CATEGORY_COLORS['other']
  return {
    background: c.bg,
    borderColor: c.bd,
    color: c.fg
  }
})

async function fetchProjectData() {
  loading.value = true
  notFound.value = false
  project.value = null
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  const id = String(route.params.id || '').trim()

  try {
    const snap = await getDoc(doc(db, 'projects', id))
    if (!snap.exists()) {
      notFound.value = true
      return
    }
    project.value = { id: snap.id, ...snap.data() }

    if (orderedIds.value.length === 0) {
      const colRef = collection(db, 'projects')
      const q = query(colRef, orderBy('order', 'asc'))
      const listSnap = await getDocs(q)
      const ids = []
      listSnap.forEach((doc) => ids.push(doc.id))
      orderedIds.value = ids
    }
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjectData()
  window.addEventListener('keydown', (ev) => {
    if (showMobileInfo.value && ev.key === 'Escape') closeMobileInfo()
    if (showMobileInfo.value) trapMobileInfoFocus(ev)
    if (activeLightboxImage.value && ev.key === 'Escape') closeLightbox()
  })
})
watch(() => route.params.id, fetchProjectData)
</script>

<template>
  <main id="main-content" tabindex="-1" class="page bg-surface text-text">
    <div v-if="loading" class="loading py-40 text-center opacity-80" role="status" aria-live="polite">
      Caricamento progetto…
    </div>

    <div v-else-if="notFound" class="notfound py-40 text-center opacity-80" role="alert">
      <p class="desc text-center">Progetto non trovato.</p>
      <RouterLink to="/projects" class="back-link text-accent">Torna ai progetti</RouterLink>
    </div>

    <div v-else-if="project" class="project-behance-container mx-auto relative">

      <div class="top-nav-bar flex justify-between items-center w-full px-4 md:px-0 mb-8">
        <RouterLink to="/projects" class="back-btn w-12 h-12 inline-flex items-center justify-center bg-transparent"
          aria-label="Torna alla lista progetti" title="Torna alla lista progetti">
          <img src="/icone/icon-arrowsx.svg" alt="" aria-hidden="true" class="w-6 h-6 block" />
          <span class="sr-only">Torna alla lista progetti</span>
        </RouterLink>

        <RouterLink v-if="nextProjectId" :to="{ name: 'project-details', params: { id: nextProjectId } }"
          class="next-project-btn class-link w-12 h-12 inline-flex items-center justify-center bg-transparent"
          aria-label="Vai al progetto successivo" title="Vai al progetto successivo">
          <img src="/icone/icon-arrowdx.svg" alt="" aria-hidden="true" class="w-6 h-6 block" />
          <span class="sr-only">Progetto successivo</span>
        </RouterLink>
      </div>

      <header class="project-header text-center">
        <h1 class="title text-accent text-center">{{ project.title }}</h1>

        <div
          class="project-top-meta-desktop hidden md:flex flex-wrap justify-center items-baseline gap-x-8 gap-y-2 mb-14">
          <div v-if="project.year" class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">Anno:</span>
            <span class="desc-text">{{ project.year }}</span>
          </div>

          <div class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">Categoria:</span>
            <span>
              <span class="pill" :style="tagStyle">{{ project.category || 'Other' }}</span>
            </span>
          </div>

          <div v-if="project.link_url || project.drive_url || normalizedLinks.length" class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">Link esterni:</span>
            <div class="inline-links-flex">
              <template v-if="normalizedLinks.length > 0">
                <a v-for="lnk in normalizedLinks" :key="lnk.url" :href="lnk.url" target="_blank"
                  rel="noopener noreferrer" class="underline-link">
                  {{ lnk.label }}
                </a>
              </template>
              <template v-else>
                <a v-if="project.link_url" :href="project.link_url" target="_blank" rel="noopener noreferrer"
                  class="underline-link">
                  {{ project.link_label || 'Visualizza materiale' }}
                </a>
                <a v-else-if="project.drive_url" :href="project.drive_url" target="_blank" rel="noopener noreferrer"
                  class="underline-link">
                  Materiali aggiuntivi
                </a>
              </template>
            </div>
          </div>
        </div>
      </header>

      <section class="behance-showcase w-full mb-14 flex flex-col items-center"
        aria-label="Galleria opere del progetto">
        <div v-for="(media, index) in mediaItems" :key="index" class="showcase-item w-full flex flex-col items-center">
          <div v-if="media.type === 'video'"
            class="video-wrapper w-full max-w-[1100px] aspect-video overflow-hidden shadow-md">
            <iframe :src="media.hi" title="YouTube video player" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen class="w-full h-full block"></iframe>
          </div>

          <div class="image-wrapper w-full flex justify-center cursor-zoom-in" @click="openLightbox(media.hi)">
            <picture class="block w-full">
              <source media="(max-width: 768px)" :srcset="media.lo" />
              <img :src="media.hi" :alt="`${project.title} - Dettaglio ${index + 1}`"
                class="behance-img block mx-auto w-full h-auto" loading="lazy" />
            </picture>
          </div>

          <p class="desc px-4 italic placeholder-caption-style" v-if="media.caption">
            {{ media.caption }}
          </p>
        </div>
      </section>

      <section class="meta grid gap-12 lg:gap-20 mt-4 px-4 md:px-0" aria-label="Dettagli e specifiche del progetto">

        <div class="mobile-behance-summary md:hidden flex flex-col gap-4">
          <dl class="meta-list flex flex-col gap-6">
            <template v-if="project.year">
              <dt class="meta-label">Anno:</dt>
              <dd>
                <p class="desc">{{ project.year }}</p>
              </dd>
            </template>

            <dt class="meta-label">Categoria:</dt>
            <dd>
              <p><span class="pill" :style="tagStyle">{{ project.category || 'Other' }}</span></p>
            </dd>

            <template v-if="project.link_url || project.drive_url || normalizedLinks.length">
              <dt class="meta-label">Link esterni:</dt>
              <dd>
                <div class="flex flex-wrap gap-2 mt-1">
                  <template v-if="normalizedLinks.length > 0">
                    <a v-for="lnk in normalizedLinks" :key="'mob-' + lnk.url" :href="lnk.url" target="_blank"
                      rel="noopener noreferrer" class="underline-link font-medium">
                      {{ lnk.label }}
                    </a>
                  </template>
                  <template v-else>
                    <a v-if="project.link_url" :href="project.link_url" target="_blank" rel="noopener noreferrer"
                      class="underline-link font-medium">
                      {{ project.link_label || 'Visualizza materiale' }}
                    </a>
                  </template>
                </div>
              </dd>
            </template>
          </dl>

          <div class="col mt-4">
            <h2 class="meta-label section-heading-style">Descrizione</h2>
            <div v-if="project.description" class="project-description leading-relaxed mt-2"
              v-html="project.description"></div>
          </div>

          <button @click="openMobileInfo"
            class="mobile-trigger-info-btn text-left mt-3 border-t border-black/10 dark:border-white/10 pt-4 focus:outline-none"
            aria-haspopup="dialog">
            Mostra maggiori dettagli
          </button>
        </div>

        <div class="hidden md:contents">
          <div class="col">
            <h2 class="meta-label section-heading-style">Descrizione</h2>
            <div v-if="project.description" class="project-description leading-relaxed mt-4"
              v-html="project.description">
            </div>
          </div>

          <div class="info-meta-col h-fit">
            <div class="panel-header-wrapper">
              <h2 class="meta-label section-heading-style panel-border-bottom">Dettagli</h2>
            </div>

            <dl class="meta-list flex flex-col gap-7 mt-6">
              <dt v-if="project.year" class="meta-label">Anno:</dt>
              <dd v-if="project.year">
                <p class="desc">{{ project.year }}</p>
              </dd>

              <dt v-if="project.link_url || project.drive_url || normalizedLinks.length" class="meta-label">Link
                esterni:</dt>
              <dd v-if="project.link_url || project.drive_url || normalizedLinks.length"
                class="flex flex-col gap-2 mt-1">
                <template v-if="normalizedLinks.length > 0">
                  <a v-for="lnk in normalizedLinks" :key="'sidebar-' + lnk.url" :href="lnk.url" target="_blank"
                    rel="noopener noreferrer" class="underline-link w-fit">
                    {{ lnk.label }}
                  </a>
                </template>
                <template v-else>
                  <a v-if="project.link_url" :href="project.link_url" target="_blank" rel="noopener noreferrer"
                    class="underline-link w-fit">
                    {{ project.link_label || 'Visualizza materiale' }}
                  </a>
                </template>
              </dd>

              <dt class="meta-label">Categoria:</dt>
              <dd class="mt-1">
                <span class="pill" :style="tagStyle">{{ project.category || 'Other' }}</span>
              </dd>

              <dt v-if="project.tag?.length" class="meta-label">Tag:</dt>
              <dd v-if="project.tag?.length">
                <ul class="tags mt-1">
                  <li v-for="(t, i) in project.tag" :key="i" class="pill" :style="tagStyle">{{ t }}</li>
                </ul>
              </dd>

              <dt v-if="project.tools" class="meta-label">Tools:</dt>
              <dd v-if="project.tools">
                <p class="desc">{{ project.tools }}</p>
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <div v-if="showMobileInfo" class="mobile-info-overlay fixed inset-0 z-[2000] flex items-end md:hidden"
        role="dialog" aria-modal="true">
        <div class="mobile-info-backdrop absolute inset-0 bg-black/60" @click="closeMobileInfo"></div>

        <div
          class="mobile-info-card relative w-full p-6 text-text border-t border-black/20 dark:border-white/20 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
          <div
            class="mobile-modal-top-bar flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-3">
            <h2 class="meta-label section-heading-style m-0">Dettagli</h2>
            <button @click="closeMobileInfo"
              class="mobile-info-close-btn flex items-center justify-center p-2 focus:outline-none"
              aria-label="Chiudi informazioni">
              <img src="/icone/icon-cross.svg" alt="" aria-hidden="true" class="w-4 h-4 block" />
            </button>
          </div>

          <dl class="meta-list flex flex-col gap-6 m-0">
            <dt class="meta-label">Categoria:</dt>
            <dd class="mt-1">
              <p><span class="pill" :style="tagStyle">{{ project.category || 'Other' }}</span></p>
            </dd>

            <template v-if="project.tag?.length">
              <dt class="meta-label">Tag:</dt>
              <dd>
                <ul class="tags mt-1">
                  <li v-for="(t, i) in project.tag" :key="'mobtag-' + i" class="pill" :style="tagStyle">{{ t }}</li>
                </ul>
              </dd>
            </template>

            <template v-if="project.tools">
              <dt class="meta-label">Tools:</dt>
              <dd>
                <p class="desc">{{ project.tools }}</p>
              </dd>
            </template>
          </dl>
        </div>
      </div>

      <div v-if="activeLightboxImage"
        class="lightbox-overlay fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 p-4 md:p-8"
        @click="closeLightbox">
        <button
          class="lightbox-close-btn absolute top-6 right-6 bg-transparent border-0 w-12 h-12 flex items-center justify-center cursor-pointer transition-transform"
          @click.stop="closeLightbox" aria-label="Chiudi visualizzazione a schermo intero">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 svg-accent-icon"
            aria-hidden="true">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <div class="lightbox-content-wrapper max-w-full max-h-full flex items-center justify-center" @click.stop>
          <img :src="activeLightboxImage" alt="Dettaglio opera ingrandito"
            class="lightbox-image max-w-full max-h-[90vh] object-contain select-none shadow-2xl" />
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
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

.page {
  padding: 40px var(--margin-desktop) 120px;
}

.project-behance-container {
  max-width: 1100px;
}

.title {
  font-size: clamp(2rem, 4.2vw, 4.6rem);
  line-height: 1.1;
  margin: 56px 0 40px;
}

.meta-inline-item-top {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
}

.inline-links-flex {
  display: inline-flex;
  gap: 12px;
  flex-wrap: wrap;
}

.underline-link {
  color: var(--color-link);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease, text-decoration 0.2s ease;
}

.underline-link:hover {
  color: var(--color-hover);
  text-decoration: underline;
}

.behance-showcase {
  display: flex;
  flex-direction: column;
}

.showcase-item {
  width: 100%;
  margin-bottom: 1rem;
}

.showcase-item:last-child {
  margin-bottom: 0;
}

.behance-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 0px !important;
}

.video-wrapper {
  width: 100%;
  max-width: 1100px;
  border-radius: 0px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.video-wrapper iframe {
  border-radius: 0px !important;
}

.meta {
  grid-template-columns: 1.8fr 1fr;
  align-items: start;
}

.meta-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.meta-label,
dt.meta-label {
  font-size: clamp(1.25rem, 1.9vw, 1.35rem) !important;
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-style: normal;
  font-weight: 700;
  color: var(--color-accent);
}

h2.meta-label.section-heading-style {
  font-size: clamp(1.4rem, 2.3vw, 1.85rem) !important;
  margin: 0;
}

.desc,
.meta-list dd p {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
  line-height: 1.8;
  margin: 0 0 14px;
}

.placeholder-caption-style {
  text-align: left;
  margin-top: 1.25rem !important;
  margin-bottom: 0rem !important;
  width: 100%;
}

.project-description :deep(p) {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  white-space: pre-line;
}

.tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  list-style: none;
  padding: 0;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  line-height: normal;
}

.info-meta-col {
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border: 1px solid var(--color-accent);
  border-radius: 0px !important;
  padding: 0;
}

.panel-header-wrapper {
  padding-top: 0;
  padding-left: 2rem;
  padding-right: 2rem;
}

.meta-list {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
}

.panel-border-bottom {
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  padding-bottom: 0.75rem;
}

.mobile-info-card {
  background-color: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface, #fdfdfe));
  border-radius: 0px !important;
}

:global(body.dark-mode) .mobile-info-card {
  background-color: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface, #111113));
}

.mobile-info-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.mobile-info-close-btn:hover {
  opacity: 0.7;
}

.mobile-trigger-info-btn {
  font-size: 15px;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-link);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.mobile-trigger-info-btn:hover {
  color: var(--color-hover);
}

.inline-version {
  font-size: clamp(1rem, 1.3vw, 1.25rem) !important;
  font-weight: 700 !important;
  margin: 0 !important;
  white-space: nowrap;
}

.back-btn img,
.next-project-btn img {
  transition: transform 0.22s ease;
}

.back-btn:hover img {
  transform: translateX(-4px);
}

.next-project-btn:hover img {
  transform: translateX(4px);
}

.svg-accent-icon {
  fill: var(--color-accent);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.lightbox-close-btn:hover .svg-accent-icon {
  transform: scale(1.1);
  opacity: 0.85;
}

.lightbox-overlay {
  animation: fadeIn 0.2s ease-out;
}

.lightbox-image {
  animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 32px var(--margin-mobile) 96px;
  }

  .title {
    font-size: 2.2rem;
    margin: 40px 0 24px;
  }

  h2.meta-label.section-heading-style {
    font-size: 1.75rem !important;
    line-height: 1.3;
    margin-bottom: 14px;
  }

  .panel-header-wrapper {
    padding: 24px 24px 0 24px;
  }

  .meta-list {
    padding-left: 0;
    padding-right: 24px;
    padding-bottom: 24px;
  }

  .underline-link {
    text-decoration: underline !important;
  }

  .behance-img {
    width: 100% !important;
    height: auto !important;
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
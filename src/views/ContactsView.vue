<script setup>
/* ==========================================================================
   Import e configurazione
   ========================================================================== */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import emailjs from '@emailjs/browser'

/* Stato form */
const email = ref('')
const name = ref('')
const message = ref('')

/* Scroll iniziale */
window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

/* Honeypot anti-bot (deve restare vuoto) */
const honeypot = ref('')

/* Stato UI */
const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

/* Modale di conferma */
const showConfirm = ref(false)
let lastActive = null

function openConfirm() {
  lastActive = document.activeElement
  showConfirm.value = true
  document.documentElement.style.overflow = 'hidden'
}

function closeConfirm() {
  showConfirm.value = false
  document.documentElement.style.overflow = ''
  if (lastActive && typeof lastActive.focus === 'function') {
    lastActive.focus()
  }
}

/* GESTIONE FOCUS ACCESSIBILE PER LA MODALE (FOCUS TRAP) */
watch(showConfirm, async (newVal) => {
  if (newVal) {
    await nextTick()
    // Sposta il focus sul pulsante di conferma dentro la modale per l'utente con tastiera
    const confirmBtn = document.querySelector('.modal-btn.confirm')
    if (confirmBtn) confirmBtn.focus()
  }
})

// Impedisce al tasto Tab di uscire dalla modale finché è aperta
function trapFocus(e) {
  if (!showConfirm.value) return
  if (e.key === 'Tab') {
    const modal = document.querySelector('.modal-card')
    if (!modal) return
    const focusableElements = modal.querySelectorAll('button, [tabindex="0"]')
    const firstElements = focusableElements[0]
    const lastElements = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElements) {
        lastElements.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElements) {
        firstElements.focus()
        e.preventDefault()
      }
    }
  }
}

/* User-Agent per diagnostica su Firestore */
function getUserAgent() {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return navigator.userAgent.slice(0, 512)
  }
  return 'unknown'
}

/* Pre-submit: apre la conferma, non invia ancora */
function preSubmit(e) {
  e.preventDefault()
  errorMsg.value = ''
  success.value = false

  if (!email.value || !name.value || !message.value) {
    errorMsg.value = 'Compila tutti i campi obbligatori.'
    return
  }

  if (honeypot.value && honeypot.value.trim() !== '') {
    success.value = true
    email.value = ''
    name.value = ''
    message.value = ''
    honeypot.value = ''
    return
  }

  openConfirm()
}

/* Conferma: invio su Firestore + Notifica Email */
async function confirmSend() {
  loading.value = true
  errorMsg.value = ''

  try {
    const docRef = collection(db, 'contactMessages')
    await addDoc(docRef, {
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
      userAgent: getUserAgent(),
      honeypot: '',
      createdAt: serverTimestamp()
    })

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    const privateKey = import.meta.env.VITE_EMAILJS_PRIVATE_KEY

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      throw new Error("Configurazione EmailJS incompleta nel file delle variabili d'ambiente (.env.local).")
    }

    const templateParams = {
      from_name: name.value.trim(),
      reply_to: email.value.trim(),
      message_html: message.value.trim()
    }

    await emailjs.send(serviceId, templateId, templateParams, {
      publicKey: publicKey,
      privateKey: privateKey
    })

    success.value = true

    email.value = ''
    name.value = ''
    message.value = ''
    honeypot.value = ''
    closeConfirm()

    // Sposta il focus sul messaggio di successo globale
    await nextTick()
    const successBanner = document.getElementById('success-desc')
    if (successBanner) successBanner.focus()
  } catch (err) {
    console.error("Errore durante l'invio:", err)
    errorMsg.value = err?.message || 'Invio non riuscito. Riprova.'
    closeConfirm()
  } finally {
    loading.value = false
  }
}

/* Gestione tastiera globale */
function onKeydown(ev) {
  if (showConfirm.value) {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      closeConfirm()
    }
    trapFocus(ev)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main id="main-content" tabindex="-1"  class="page-content">
    <section class="hero-container relative w-full h-[400px] overflow-hidden" role="region"
      aria-labelledby="page-title">
      <div class="hero-image-container absolute inset-0" aria-hidden="true"></div>

      <div
        class="header-content-wrapper absolute inset-x-0 top-1/2 -translate-y-1/2 text-center w-full px-[var(--margin-desktop)]">
        <h1 id="page-title">Contatti</h1>
      </div>
    </section>

    <section class="contact-form-section" role="region" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title">
        Per lavori su commissione, collaborazioni o altro
      </h2>

      <p class="form-lead">
        Compila il form qui sotto, ti contatterò al più presto.
      </p>

      <p v-if="success" id="success-desc" class="form-success outline-none" role="status" aria-live="polite"
        tabindex="-1">
        ✅ Messaggio inviato, grazie! ti contatterò al più presto.
      </p>

      <p v-if="errorMsg" id="error-desc" class="form-error" role="alert" aria-live="assertive">
        ⚠️ {{ errorMsg }}
      </p>

      <form class="contact-form" @submit="preSubmit" novalidate
        :aria-describedby="success ? 'success-desc' : (errorMsg ? 'error-desc' : null)">

        <div class="hp-wrap" aria-hidden="true">
          <label for="hp">Lascia questo campo vuoto</label>
          <input id="hp" v-model="honeypot" type="text" tabindex="-1" autocomplete="off" />
        </div>

        <div class="form-group">
          <label for="email">Email*</label>
          <input v-model="email" type="email" id="email" required aria-required="true" inputmode="email"
            autocomplete="email" placeholder="La tua email" />
        </div>

        <div class="form-group">
          <label for="name">Nome*</label>
          <input v-model="name" type="text" id="name" required aria-required="true" autocomplete="name"
            placeholder="Il tuo nome" />
        </div>

        <div class="form-group">
          <label for="message">Scrivi qui la tua richiesta*</label>
          <textarea v-model="message" id="message" rows="5" required aria-required="true"
            placeholder="Scrivi qui la tua richiesta…"></textarea>
        </div>

        <button type="submit" class="btn primary-btn" :disabled="loading">
          <span v-if="!loading">Invia</span>
          <span v-else>Invio…</span>
        </button>
      </form>
    </section>

    <div v-if="showConfirm" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title"
      aria-describedby="confirm-desc">
      <div class="modal-card" role="document">
        <h3 id="confirm-title">Confermi l'invio?</h3>

        <p id="confirm-desc" class="modal-text">
          Controlla i dati e premi “Sì, invia”.
        </p>

        <div class="recap">
          <div class="recap-row">
            <span class="recap-label">Email</span>
            <span class="recap-value">{{ email }}</span>
          </div>

          <div class="recap-row">
            <span class="recap-label">Nome</span>
            <span class="recap-value">{{ name }}</span>
          </div>

          <div class="recap-row recap-message">
            <span class="recap-label">Messaggio</span>
            <pre class="recap-value prewrap">{{ message }}</pre>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn modal-btn confirm" @click="confirmSend" :disabled="loading">
            <span v-if="!loading">Sì, invia</span>
            <span v-else>Invio…</span>
          </button>

          <button class="btn modal-btn cancel" @click="closeConfirm" :disabled="loading">
            Annulla
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* --- HERO (DESKTOP) --- */
.hero-container {
  height: 350px;
}

.hero-image-container {
  background-image: url('/images/contacts/contacts_lightmode.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right center;
}

body.dark-mode .hero-image-container {
  background-image: url('/images/contacts/contacts_darkmode.png');
}

.header-content-wrapper h1 {
  font-size: 5.3rem;
  line-height: 1.1;
  color: var(--color-accent);
}

/* --- RESPONSIVE MOBILE --- */
@media (max-width: 768px) {
  .hero-container {
    height: auto;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .hero-image-container {
    position: relative;
    width: 100%;
    height: 250px;
    background-position: center;
    background-size: contain;
    margin-bottom: 20px;
    transform: none;
  }

  .header-content-wrapper {
    position: relative;
    top: 0;
    transform: none;
    padding-inline: var(--margin-mobile);
    margin-bottom: 40px;
  }

  .header-content-wrapper h1 {
    font-size: 2.3rem;
    line-height: 1.2;
  }

  .filters-wrapper {
    justify-content: flex-start;
  }
}

.contact-form-section {
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  max-width: 760px;
  margin: 1rem auto 7rem;
  padding: 2rem;
  border: 1px solid var(--color-accent);
}

.contact-form-section h2 {
  text-align: center;
  margin: 0 0 0.5rem;
  font-size: clamp(18px, 2vw, 22px);
  color: var(--color-accent);
}

.form-lead {
  text-align: center;
  margin: 0 0 1rem;
  font-family: var(--font-body);
  font-size: clamp(13px, 1.4vw, 15px);
  color: var(--color-text);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 620px;
  margin-inline: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font: 600 14px/1.4 var(--font-body);
  color: var(--color-text);
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #ccc;
  font: 400 16px/1.4 var(--font-body);
  background: var(--color-surface);
  color: var(--color-text);
}

input:focus,
textarea:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 25%, transparent);
}

.primary-btn {
  align-self: center;
  background-color: var(--color-accent);
  color: var(--color-surface);
  font-weight: 700;
  font-size: 14px;
  padding: 10px 18px;
  border: 1px solid currentColor;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.primary-btn:hover {
  background-color: var(--color-hover);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hp-wrap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .contact-form-section {
    margin: 1.5rem auto 5rem;
    padding: 1.25rem;
  }

  .contact-form {
    max-width: 100%;
  }
}

.form-success {
  color: #1b7e3c;
  text-align: center;
  margin: 0 0 8px;
}

.form-error {
  color: #b00020;
  text-align: center;
  margin: 0 0 8px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal-card {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-accent);
  width: min(92vw, 480px);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.modal-card h3 {
  margin: 0 0 6px;
  font: 800 20px/1.2 var(--font-heading);
  color: var(--color-accent);
}

.modal-text {
  margin: 0 0 12px;
  font: 400 15px/1.6 var(--font-body);
}

.recap {
  border: 1px solid var(--color-accent);
  padding: 10px;
  margin: 0 0 12px;
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
}

.recap-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 8px;
  align-items: start;
}

.recap-row+.recap-row {
  margin-top: 8px;
}

.recap-label {
  font: 700 13px/1.3 var(--font-body);
  color: var(--color-accent);
}

.recap-value {
  font: 400 14px/1.5 var(--font-body);
  color: var(--color-text);
  word-break: break-word;
}

.prewrap {
  white-space: pre-wrap;
}

.recap-message .recap-value {
  max-height: 160px;
  overflow: auto;
  padding-right: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 14px;
  font: 700 14px/1 var(--font-body);
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
}

.modal-btn.confirm {
  background: var(--color-accent);
  color: var(--color-surface);
}

.modal-btn.confirm:hover {
  background: var(--color-hover);
}

.modal-btn.cancel:hover {
  background: rgba(0, 0, 0, 0.06);
}

.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
</style>
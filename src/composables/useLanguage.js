// src/composables/useLanguage.js
import { ref, watch } from 'vue'

// 1. Rileva la lingua di sistema del dispositivo (es. 'en-US', 'it-IT', 'en')
const getDeviceLanguage = () => {
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language || navigator.userLanguage || 'it'
        return lang.toLowerCase().startsWith('en') ? 'en' : 'it'
    }
    return 'it'
}

// 2. Se l'utente ha salvato una preferenza manuale usa quella, altrimenti legge la lingua del telefono
const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('user_lang') : null
const initialLang = savedLang ? savedLang : getDeviceLanguage()

const currentLang = ref(initialLang)

// 3. Salva ogni cambio manuale successivo nel browser
watch(currentLang, (newLang) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user_lang', newLang)
    }
})

export function useLanguage() {
    const toggleLanguage = () => {
        currentLang.value = currentLang.value === 'it' ? 'en' : 'it'
    }

    return {
        currentLang,
        toggleLanguage
    }
}
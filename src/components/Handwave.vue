<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Rive, Fit, Alignment, Layout } from '@rive-app/canvas'

/**
 * Questo componente NON forza altezza via CSS: il canvas occupa 100% della
 * larghezza del contenitore e mantiene le proporzioni (height:auto).
 * La scalatura avviene dal contenitore .hand-wrap in HomeView.vue
 */

const props = defineProps({
  // Dimensione interna di disegno (alta qualità)
  canvasWidth:   { type: Number, default: 900 },
  canvasHeight:  { type: Number, default: 900 },
  // Nome animazione (se usi State Machine, vedi più sotto)
  animationName: { type: String,  default: 'wave' },
})

const canvasRef = ref(null)
let riveInstance = null
let themeObserver = null
let resizeObserver = null

const isDark = () => document.body.classList.contains('dark-mode')
const srcForTheme = () =>
  isDark()
    ? '/animations/handwave_dark.riv'
    : '/animations/handwave_light.riv'

function cleanup () {
  if (riveInstance) {
    riveInstance.stop()
    riveInstance.cleanup?.()
    riveInstance = null
  }
}

function initRive () {
  cleanup()

  const canvas = canvasRef.value
  if (!canvas) return

  // dimensione interna (pixel reali) per qualità
  canvas.width  = props.canvasWidth
  canvas.height = props.canvasHeight

  riveInstance = new Rive({
    src: srcForTheme(),
    canvas,
    autoplay: true,
    // Se in Rive hai una STATE MACHINE:
    // stateMachines: ['State Machine 1'],
    // Se invece è una semplice animazione:
    animations: [props.animationName],
    layout: new Layout({
      fit: Fit.Contain,           // fondamentale per NON stretchare
      alignment: Alignment.Center // centrata nel canvas
    }),
    onLoad: () => {
      riveInstance.resizeDrawingSurfaceToCanvas()
    },
  })
}

onMounted(() => {
  initRive()

  // Aggiorna Rive quando cambia il tema (classe sul body)
  themeObserver = new MutationObserver(() => initRive())
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })

  // Mantieni nitidezza/proporzioni quando cambia la larghezza del contenitore
  resizeObserver = new ResizeObserver(() => {
    riveInstance?.resizeDrawingSurfaceToCanvas()
  })
  resizeObserver.observe(canvasRef.value?.parentElement ?? document.body)
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  resizeObserver?.disconnect()
  cleanup()
})
</script>

<template>
  <!-- Il canvas riempie la larghezza del contenitore -->
  <canvas ref="canvasRef" ></canvas>
</template>

<style scoped>
/* NESSUNA altezza forzata qui: evita lo stretch */
canvas{
  display: block;
  width: 100%;
  height: auto;
}
</style>

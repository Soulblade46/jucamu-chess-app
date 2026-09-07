<script setup lang="ts">
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import ChessTimer from './components/ChessTimer.vue'
import TournamentManager from './components/TournamentManager.vue'
import type { Screen } from './types'

const screen = ref<Screen>('home')
const showUpdate = ref(false)

const appVersion = '1.0.0'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showUpdate.value = true
  },
  onOfflineReady() {
    // App cached
  },
  onRegisteredSW(_url: string, registration?: ServiceWorkerRegistration) {
    if (registration) registration.update().catch(() => undefined)
  },
  onRegisterError() {
    // Offline-first: ignore update failures
  }
})

const closeApp = () => {
  window.close()
}

const applyUpdate = () => {
  showUpdate.value = false
  updateSW(true)
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button v-if="screen !== 'home'" class="icon-btn" @click="screen = 'home'" aria-label="Indietro">←</button>
      <div class="brand">
        <span class="brand-mark">♛</span>
        <div>
          <strong>ChessApp</strong>
          <small>Tornei · Timer · Offline</small>
        </div>
      </div>
      <div class="top-actions"><span class="status-dot"></span><small>Offline-first</small></div>
    </header>

    <main>
      <section v-if="screen === 'home'" class="home page-enter">
        <div class="hero">
          <span class="eyebrow">SCACCHI, SEMPLICE</span>
          <h1>Gioca, arbitra,<br><em>organizza.</em></h1>
          <p>Un'app PWA veloce per partite e tornei, progettata per funzionare anche senza connessione.</p>
        </div>

        <div class="home-grid">
          <button class="menu-card timer-card" @click="screen = 'timer'">
            <span class="card-icon">◷</span>
            <span><b>Timer Scacchi</b><small>Avvia una partita con tempo e incremento</small></span>
            <span class="arrow">→</span>
          </button>

          <button class="menu-card tournament-card" @click="screen = 'tournament'">
            <span class="card-icon">♜</span>
            <span><b>Gestione Tornei</b><small>Concorrenti, abbinamenti, risultati e classifica</small></span>
            <span class="arrow">→</span>
          </button>

          <button class="menu-card exit-card" @click="closeApp">
            <span class="card-icon">↪</span>
            <span><b>Uscita</b><small>Chiudi l'app quando il sistema lo permette</small></span>
            <span class="arrow">→</span>
          </button>
        </div>
      </section>

      <ChessTimer v-else-if="screen === 'timer'" />
      <TournamentManager v-else />
    </main>

    <footer><span>♟</span> PWA · Offline · Dati salvati sul dispositivo <span>v{{ appVersion }}</span></footer>
    <div v-if="showUpdate" class="update-banner">
      <span><b>Nuova versione disponibile</b><small>L'app si aggiornerà per te.</small></span>
      <button @click="applyUpdate">Aggiorna</button>
    </div>
  </div>
</template>

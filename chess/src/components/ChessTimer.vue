<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

const timer = reactive({
  minutes: 5,
  increment: 0,
  white: 300,
  black: 300,
  active: false,
  turn: 'white' as 'white' | 'black',
  expired: '' as '' | 'white' | 'black',
  lastTick: 0
})

let timerId: number | undefined
const timerPresets = [1, 3, 5, 10, 15, 30]
const isFullscreen = ref(false)

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.max(0, seconds % 60).toString().padStart(2, '0')}`

const resetTimer = () => {
  timer.active = false
  timer.expired = ''
  timer.turn = 'white'
  timer.white = timer.minutes * 60
  timer.black = timer.minutes * 60
  window.clearInterval(timerId)
}

const setPreset = (m: number) => {
  timer.minutes = m
  resetTimer()
}

const tick = () => {
  const now = performance.now()
  if (!timer.lastTick) timer.lastTick = now
  const delta = Math.max(0, (now - timer.lastTick) / 1000)
  timer.lastTick = now
  const side = timer.turn
  timer[side] = Math.max(0, timer[side] - delta)

  if (timer[side] <= 0) {
    timer[side] = 0
    timer.active = false
    timer.expired = side
    window.clearInterval(timerId)
  }
}

const playTimer = () => {
  if (timer.expired) return
  timer.active = true
  timer.lastTick = performance.now()
  window.clearInterval(timerId)
  timerId = window.setInterval(tick, 100)
}

const pauseTimer = () => {
  timer.active = false
  window.clearInterval(timerId)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const pressClock = (side: 'white' | 'black') => {
  if (!timer.active || timer.turn !== side || timer.expired) return
  timer[side] += timer.increment
  timer.turn = side === 'white' ? 'black' : 'white'
  timer.lastTick = performance.now()
}

watch(
  () => [timer.minutes, timer.increment],
  () => resetTimer()
)

</script>

<template>
  <section class="page page-enter" :class="{ 'fullscreen-mode': isFullscreen }">
    <button v-if="isFullscreen" class="fullscreen-back" aria-label="Esci da fullscreen" @click="toggleFullscreen">←</button>
    <div v-if="!isFullscreen" class="page-heading">
      <div><span class="eyebrow">PARTITA</span><h2>Timer Scacchi</h2></div>
      <div class="timer-heading-actions">
        <button class="ghost" @click="resetTimer">Reset</button>
        <button class="ghost" aria-label="Attiva fullscreen" @click="toggleFullscreen">⛶ Fullscreen</button>
      </div>
    </div>

    <div v-if="timer.expired" class="timeout-overlay">
      <div class="timeout-card">
        <div class="burst">⌛</div>
        <span class="eyebrow">TEMPO SCADUTO</span>
        <h2>{{ timer.expired === 'white' ? 'Bianco' : 'Nero' }} ha esaurito il tempo</h2>
        <p>La partita è terminata.</p>
        <button class="primary" @click="resetTimer">Nuova partita</button>
      </div>
    </div>

    <div class="timer-board" :class="{ 'is-playing': timer.active }">
      <button class="clock white-clock" :class="{ active: timer.turn === 'white' && timer.active }" @click="pressClock('white')">
        <span>BIANCO</span>
        <strong>{{ formatTime(Math.ceil(timer.white)) }}</strong>
        <small>{{ timer.turn === 'white' && timer.active ? 'IL TUO TURNO' : 'IN ATTESA' }}</small>
      </button>

      <div class="vs">VS</div>

      <button class="clock black-clock" :class="{ active: timer.turn === 'black' && timer.active }" @click="pressClock('black')">
        <span>NERO</span>
        <strong>{{ formatTime(Math.ceil(timer.black)) }}</strong>
        <small>{{ timer.turn === 'black' && timer.active ? 'IL TUO TURNO' : 'IN ATTESA' }}</small>
      </button>
    </div>

    <div v-if="!isFullscreen" class="timer-controls panel">
      <div class="field">
        <label>Tempo iniziale</label>
        <div class="chips">
          <button v-for="m in timerPresets" :key="m" :class="{ selected: timer.minutes === m }" @click="setPreset(m)">{{ m }}′</button>
        </div>
      </div>

      <label class="select-field">
        <span>Incremento</span>
        <select v-model.number="timer.increment">
          <option :value="0">+0s</option>
          <option :value="1">+1s</option>
          <option :value="2">+2s</option>
          <option :value="3">+3s</option>
          <option :value="5">+5s</option>
          <option :value="10">+10s</option>
        </select>
      </label>
    </div>

    <div class="timer-buttons">
      <button class="play-btn" :disabled="timer.active || !!timer.expired" aria-label="Avvia timer" @click="playTimer">▶</button>
      <button class="round-btn" :disabled="!timer.active" aria-label="Metti in pausa" @click="pauseTimer">Ⅱ</button>
    </div>

    <div v-if="!isFullscreen" class="hint">Premi il grande orologio del giocatore di turno per passare la mossa.</div>
  </section>
</template>

<style scoped>
.fullscreen-mode {
  position: relative;
  display: block;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  padding: 0;
  background: #050d18;
}

.fullscreen-mode .timer-board {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 3.5rem 1fr;
  gap: 0;
  align-items: stretch;
  width: 100%;
  height: 100%;
  max-width: none;
  margin: 0;
}

.fullscreen-back {
  position: absolute;
  top: 50%;
  left: 1rem;
  z-index: 1;
  transform: translateY(-50%);
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0.0625rem solid var(--line);
  border-radius: 0.75rem;
  background: #0b1d30;
  color: #d8e9f7;
  font-size: 1.5rem;
}

.fullscreen-mode .vs {
  display: block;
  grid-row: 2;
  width: 100%;
  height: 100%;
  color: transparent;
  background: #050d18;
}

.fullscreen-mode .black-clock {
  grid-row: 1;
  transform: rotate(180deg);
}

.fullscreen-mode .white-clock {
  grid-row: 3;
}

.fullscreen-mode .clock {
  height: 100%;
  min-height: 0;
  border-radius: 0;
}

.fullscreen-mode .clock strong {
  font-size: clamp(4rem, 14vw, 10rem);
}

.fullscreen-mode .timer-buttons {
  position: absolute;
  top: 50%;
  right: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  margin: 0;
  transform: translateY(-50%);
}
</style>

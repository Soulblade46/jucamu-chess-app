<script setup lang="ts">
import { reactive, watch } from 'vue'

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

const startTimer = () => {
  if (timer.expired) return
  timer.active = !timer.active
  timer.lastTick = performance.now()
  window.clearInterval(timerId)
  if (timer.active) timerId = window.setInterval(tick, 100)
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
  <section class="page page-enter">
    <div class="page-heading">
      <div><span class="eyebrow">PARTITA</span><h2>Timer Scacchi</h2></div>
      <button class="ghost" @click="resetTimer">Reset</button>
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

    <div class="timer-controls panel">
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
      <button class="round-btn" @click="resetTimer">↻</button>
      <button class="play-btn" @click="startTimer">{{ timer.active ? 'Ⅱ' : '▶' }}</button>
      <button class="round-btn" @click="timer.active = false">■</button>
    </div>

    <div class="hint">Premi il grande orologio del giocatore di turno per passare la mossa.</div>
  </section>
</template>

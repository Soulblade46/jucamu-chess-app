<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Match, Mode, Player, Result, Tournament } from '../types'
import TournamentRound from './TournamentRound.vue'
import TournamentSetup from './TournamentSetup.vue'
import TournamentStandings from './TournamentStandings.vue'
import { knockoutPairings } from '../pairings/knockoutPairings'
import { roundRobinPairings } from '../pairings/roundRobinPairings'
import { swissPairings } from '../pairings/swissPairings'

const STORAGE_KEY = 'chessapp.tournaments.v1'
const tournaments = ref<Tournament[]>([])
const currentTournamentId = ref('')
const draftPlayers = ref<Player[]>([])

const tour = reactive({
  name: 'Torneo locale',
  mode: 'swiss' as Mode,
  rounds: 5,
  playerInput: '',
  selectedResult: {} as Record<string, Result>
})

const toast = ref('')
let toastTimer: number | undefined

const showToast = (message: string) => {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 2600)
}

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments.value))

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const tournamentCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('')
  } while (tournaments.value.some(tournament => tournament.id === code))
  return code
}

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    tournaments.value = Array.isArray(saved) ? saved : []
  } catch {
    tournaments.value = []
  }
}

const syncTournaments = () => {
  const selectedId = currentTournamentId.value
  load()
  if (selectedId && tournaments.value.some(t => t.id === selectedId)) currentTournamentId.value = selectedId
}

const addPlayer = () => {
  const name = tour.playerInput.trim()
  if (!name) return
  if (draftPlayers.value.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return showToast('Nome già presente')
  }

  draftPlayers.value.push({
    id: uid(),
    name,
    score: 0,
    buchholz: 0,
    wins: 0,
    draws: 0,
    losses: 0
  })

  tour.playerInput = ''
}

const addCurrentPlayer = () => {
  const tournament = currentTournament.value
  const name = tour.playerInput.trim()
  if (!tournament || tournament.started || !name) return
  if (tournament.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
    return showToast('Nome già presente')
  }

  tournament.players.push({
    id: uid(),
    name,
    score: 0,
    buchholz: 0,
    wins: 0,
    draws: 0,
    losses: 0
  })
  tour.playerInput = ''
  save()
  showToast('Partecipante aggiunto')
}

const removeDraftPlayer = (id: string) => {
  draftPlayers.value = draftPlayers.value.filter(p => p.id !== id)
}

const modeLabel = (m: Mode) => ({
  'round-robin': 'Round-robin',
  swiss: 'Swiss',
  knockout: 'Eliminazione diretta'
}[m])

const currentTournament = computed(() => tournaments.value.find(t => t.id === currentTournamentId.value))
const currentMatches = computed(() => currentTournament.value?.matches.filter(m => m.round === currentTournament.value?.currentRound) ?? [])

const standings = computed(() => {
  const t = currentTournament.value
  if (!t) return []

  const map = new Map(t.players.map(p => [p.id, { ...p, buchholz: 0 }]))

  for (const m of t.matches) {
    if (!m.result || m.bye) continue
    const w = map.get(m.white)
    const b = map.get(m.black)
    if (!w || !b) continue

    if (m.result === 'white') {
      w.score += 1
      w.wins += 1
      b.losses += 1
    } else if (m.result === 'black') {
      b.score += 1
      b.wins += 1
      w.losses += 1
    } else {
      w.score += 0.5
      b.score += 0.5
      w.draws += 1
      b.draws += 1
    }
  }

  for (const m of t.matches) {
    if (!m.result || m.bye) continue
    const w = map.get(m.white)
    const b = map.get(m.black)
    if (w && b) {
      w.buchholz += b.score
      b.buchholz += w.score
    }
  }

  return [...map.values()].sort((a, b) =>
    b.score - a.score || b.buchholz - a.buchholz || b.wins - a.wins || a.name.localeCompare(b.name)
  )
})

const generateRound = (t: Tournament, round: number) => {
  let matches: Match[] = []

  if (t.mode === 'round-robin') matches = roundRobinPairings(t.players, round, uid)
  else if (t.mode === 'swiss') matches = swissPairings(t, round, standings.value, uid)
  else matches = knockoutPairings(t, round, uid)

  t.matches.push(...matches)
  t.currentRound = round

  for (const m of matches) {
    if (m.bye) {
      const p = t.players.find(x => x.id === m.white)
      if (p) p.score += 1
    }
  }
}

const createTournament = () => {
  const t: Tournament = {
    id: tournamentCode(),
    name: tour.name.trim() || 'Torneo',
    mode: tour.mode,
    rounds: tour.mode === 'round-robin' ? Math.max(1, draftPlayers.value.length - 1) : Math.max(1, tour.rounds),
    players: draftPlayers.value.map(p => ({ ...p })),
    matches: [],
    currentRound: 0,
    started: false
  }

  tournaments.value.unshift(t)
  currentTournamentId.value = t.id
  save()
  showToast('Torneo creato')
}

const startTournament = () => {
  const t = currentTournament.value
  if (!t || t.started) return
  if (t.players.length < 2) return showToast('Servono almeno 2 partecipanti')

  if (t.mode === 'round-robin') t.rounds = Math.max(1, t.players.length - 1)
  t.started = true
  generateRound(t, 1)
  save()
  showToast('Torneo avviato')
}

const openTournament = (id: string) => {
  currentTournamentId.value = id
}

const deleteTournament = (id: string) => {
  tournaments.value = tournaments.value.filter(t => t.id !== id)
  if (currentTournamentId.value === id) currentTournamentId.value = ''
  save()
}

const setResult = (match: Match, result: Result) => {
  match.result = result
  save()
}

const allRoundResults = computed(() =>
  currentMatches.value.length > 0 && currentMatches.value.every(m => m.bye || !!m.result)
)

const nextRound = () => {
  const t = currentTournament.value
  if (!t || !allRoundResults.value) return showToast('Inserisci tutti i risultati del turno')
  if (t.mode === 'knockout' && currentMatches.value.length === 1) return showToast('Torneo concluso!')
  if (t.currentRound >= t.rounds) return showToast('Torneo concluso!')

  generateRound(t, t.currentRound + 1)
  save()
  showToast(`Turno ${t.currentRound} generato`)
}

const resetTournament = () => {
  currentTournamentId.value = ''
  draftPlayers.value = []
}

const nameById = (id: string) => currentTournament.value?.players.find(p => p.id === id)?.name || '—'

onMounted(() => {
  load()
  window.addEventListener('storage', syncTournaments)
})
</script>

<template>
  <section class="page page-enter tournament-page">
    <div class="page-heading">
      <div><span class="eyebrow">TORNEI</span><h2>Gestione Tornei</h2></div>
      <button v-if="currentTournamentId" class="ghost" @click="resetTournament">Nuovo</button>
    </div>

    <TournamentSetup
      v-if="!currentTournamentId"
      :name="tour.name"
      :mode="tour.mode"
      :rounds="tour.rounds"
      :player-input="tour.playerInput"
      :draft-players="draftPlayers"
      :tournaments="tournaments"
      :mode-label="modeLabel"
      @update:name="tour.name = $event"
      @update:mode="tour.mode = $event"
      @update:rounds="tour.rounds = $event"
      @update:player-input="tour.playerInput = $event"
      @add-player="addPlayer"
      @remove-player="removeDraftPlayer"
      @create-tournament="createTournament"
      @open-tournament="openTournament"
      @delete-tournament="deleteTournament"
    />

    <div v-else-if="currentTournament" class="tournament-content">
      <div class="tournament-head panel">
        <div><span class="eyebrow">{{ modeLabel(currentTournament.mode) }}</span><h3>{{ currentTournament.name }}</h3><small class="tournament-code">Codice: {{ currentTournament.id }}</small></div>
        <div v-if="currentTournament.started" class="round-badge">Turno <strong>{{ currentTournament.currentRound }}</strong> / {{ currentTournament.rounds }}</div>
        <button v-else class="primary" @click="startTournament">Avvia torneo →</button>
      </div>

      <div v-if="!currentTournament.started" class="panel waiting-panel">
        <span class="eyebrow">IN ATTESA</span>
        <h3>Il torneo non è ancora iniziato</h3>
        <p>{{ currentTournament.players.length }} partecipanti iscritti. Condividi il codice e avvia il primo turno quando sei pronto.</p>
        <div class="add-player manager-add-player">
          <input v-model="tour.playerInput" placeholder="Nome nuovo partecipante" @keyup.enter="addCurrentPlayer" />
          <button class="primary" @click="addCurrentPlayer">+ Aggiungi</button>
        </div>
      </div>

      <TournamentRound v-else
        :matches="currentMatches"
        :name-by-id="nameById"
        :all-results="allRoundResults"
        :is-last-round="currentTournament.currentRound >= currentTournament.rounds"
        @set-result="setResult"
        @next-round="nextRound"
      />

      <TournamentStandings :standings="standings" />
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

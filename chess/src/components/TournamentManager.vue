<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Match, Mode, Player, Result, Tournament } from '../types'

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

const load = () => {
  try {
    tournaments.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    tournaments.value = []
  }
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

const removeDraftPlayer = (id: string) => {
  draftPlayers.value = draftPlayers.value.filter(p => p.id !== id)
}

const modeLabel = (m: Mode) => ({
  'round-robin': 'Round-robin',
  swiss: 'Swiss',
  knockout: 'Eliminazione diretta'
}[m])

function roundRobinPairings(players: Player[], round: number): Match[] {
  const list = players.map(p => p.id)
  if (list.length % 2) list.push('BYE')

  const fixed = list[0]
  const rest = list.slice(1)
  const n = list.length
  const shift = (round - 1) % rest.length
  const rotated = [...rest.slice(shift), ...rest.slice(0, shift)]
  const arr = [fixed, ...rotated]
  const matches: Match[] = []

  for (let i = 0; i < n / 2; i++) {
    let a = arr[i]
    let b = arr[n - 1 - i]

    if (a === 'BYE' || b === 'BYE') {
      const p = a === 'BYE' ? b : a
      matches.push({ id: uid(), round, table: i + 1, white: p, black: 'BYE', bye: true })
      continue
    }

    if ((round + i) % 2) [a, b] = [b, a]
    matches.push({ id: uid(), round, table: i + 1, white: a, black: b })
  }

  return matches
}

function swissPairings(t: Tournament, round: number): Match[] {
  const played = new Set(
    t.matches
      .filter(m => m.result && !m.bye)
      .map(m => [m.white, m.black].sort().join('|'))
  )

  const sorted = standings.value.map(p => p.id)
  const remaining = [...sorted]
  const matches: Match[] = []
  let table = 1

  while (remaining.length > 0) {
    const a = remaining.shift()!
    let idx = remaining.findIndex(b => !played.has([a, b].sort().join('|')))
    if (idx < 0) idx = 0
    const b = remaining.splice(idx, 1)[0]

    if (!b) {
      matches.push({ id: uid(), round, table, white: a, black: 'BYE', bye: true })
      break
    }

    const scoreA = standings.value.find(p => p.id === a)?.score ?? 0
    const scoreB = standings.value.find(p => p.id === b)?.score ?? 0

    matches.push({
      id: uid(),
      round,
      table,
      white: scoreA <= scoreB ? a : b,
      black: scoreA <= scoreB ? b : a
    })

    table++
  }

  return matches
}

function knockoutPairings(t: Tournament, round: number): Match[] {
  const previous = round === 1
    ? t.players.map(p => p.id)
    : t.matches
      .filter(m => m.round === round - 1 && m.result)
      .map(m => (m.result === 'white' ? m.white : m.black))
      .filter(id => id !== 'BYE')

  const list = [...previous]
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, list.length)))

  while (list.length < size) list.push('BYE')

  const matches: Match[] = []
  for (let i = 0; i < list.length; i += 2) {
    const a = list[i]
    const b = list[i + 1]

    if (a === 'BYE' || b === 'BYE') {
      matches.push({ id: uid(), round, table: i / 2 + 1, white: a === 'BYE' ? b : a, black: 'BYE', bye: true })
    } else {
      matches.push({ id: uid(), round, table: i / 2 + 1, white: a, black: b })
    }
  }

  return matches
}

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

  if (t.mode === 'round-robin') matches = roundRobinPairings(t.players, round)
  else if (t.mode === 'swiss') matches = swissPairings(t, round)
  else matches = knockoutPairings(t, round)

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
  if (draftPlayers.value.length < 2) return showToast('Inserisci almeno 2 concorrenti')

  const t: Tournament = {
    id: uid(),
    name: tour.name.trim() || 'Torneo',
    mode: tour.mode,
    rounds: tour.mode === 'round-robin' ? Math.max(1, draftPlayers.value.length - 1) : Math.max(1, tour.rounds),
    players: draftPlayers.value.map(p => ({ ...p })),
    matches: [],
    currentRound: 0,
    started: true
  }

  tournaments.value.unshift(t)
  currentTournamentId.value = t.id
  generateRound(t, 1)
  save()
  showToast('Torneo creato')
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
  if (match.result) return
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

onMounted(load)
</script>

<template>
  <section class="page page-enter tournament-page">
    <div class="page-heading">
      <div><span class="eyebrow">TORNEI</span><h2>Gestione Tornei</h2></div>
      <button v-if="currentTournamentId" class="ghost" @click="resetTournament">Nuovo</button>
    </div>

    <div v-if="!currentTournamentId" class="setup-grid">
      <div class="panel setup-card">
        <span class="step">01</span>
        <h3>Imposta il torneo</h3>
        <label>Nome torneo<input v-model="tour.name" placeholder="Campionato Sociale" /></label>
        <label>Modalità<select v-model="tour.mode"><option value="swiss">Swiss</option><option value="round-robin">Round-robin</option><option value="knockout">Eliminazione diretta</option></select></label>
        <label v-if="tour.mode !== 'round-robin'">Turni<input v-model.number="tour.rounds" type="number" min="1" max="50" /></label>
        <p class="helper">
          {{
            tour.mode === 'swiss'
              ? 'Abbinamenti per punteggio, evitando per quanto possibile le ripetizioni.'
              : tour.mode === 'round-robin'
                ? 'Tutti giocano contro tutti, una volta.'
                : 'Tabellone a eliminazione diretta con bye automatici.'
          }}
        </p>
      </div>

      <div class="panel players-card">
        <span class="step">02</span>
        <h3>Inserisci i giocatori</h3>
        <div class="add-player">
          <input v-model="tour.playerInput" @keyup.enter="addPlayer" placeholder="Nome concorrente" />
          <button class="primary" @click="addPlayer">+ Aggiungi</button>
        </div>

        <div class="players-list">
          <div v-for="(p, i) in draftPlayers" :key="p.id" class="player-row">
            <span>{{ i + 1 }}</span>
            <b>{{ p.name }}</b>
            <button @click="removeDraftPlayer(p.id)">×</button>
          </div>
          <div v-if="!draftPlayers.length" class="empty">Aggiungi almeno due concorrenti.</div>
        </div>

        <button class="primary wide" @click="createTournament">Crea torneo · {{ draftPlayers.length }} giocatori</button>
      </div>

      <div class="panel saved-card" v-if="tournaments.length">
        <span class="step">03</span>
        <h3>Apri un torneo salvato</h3>
        <div v-for="t in tournaments" :key="t.id" class="saved-row">
          <button @click="openTournament(t.id)">
            <b>{{ t.name }}</b>
            <small>{{ modeLabel(t.mode) }} · {{ t.players.length }} giocatori</small>
          </button>
          <button class="delete" @click="deleteTournament(t.id)">×</button>
        </div>
      </div>
    </div>

    <div v-else-if="currentTournament" class="tournament-content">
      <div class="tournament-head panel">
        <div><span class="eyebrow">{{ modeLabel(currentTournament.mode) }}</span><h3>{{ currentTournament.name }}</h3></div>
        <div class="round-badge">Turno <strong>{{ currentTournament.currentRound }}</strong> / {{ currentTournament.rounds }}</div>
      </div>

      <div class="tabs">
        <button class="active">Abbinamenti</button>
        <button>Giocatori · {{ currentTournament.players.length }}</button>
        <button>Classifica</button>
      </div>

      <div class="matches">
        <div v-for="m in currentMatches" :key="m.id" class="match panel" :class="{ bye: m.bye }">
          <div class="table-no">Tavolo {{ m.table }}</div>
          <div class="pair">
            <span>{{ nameById(m.white) }}</span>
            <strong>—</strong>
            <span>{{ m.bye ? 'BYE' : nameById(m.black) }}</span>
          </div>

          <div v-if="m.bye" class="bye-label">Punto automatico</div>
          <div v-else class="result-buttons">
            <button :class="{ chosen: m.result === 'white' }" @click="setResult(m, 'white')">1–0</button>
            <button :class="{ chosen: m.result === 'draw' }" @click="setResult(m, 'draw')">½–½</button>
            <button :class="{ chosen: m.result === 'black' }" @click="setResult(m, 'black')">0–1</button>
          </div>
        </div>
      </div>

      <div class="next-row">
        <span>{{ allRoundResults ? 'Tutti i risultati inseriti.' : 'Inserisci il risultato di ogni partita.' }}</span>
        <button class="primary" :disabled="!allRoundResults" @click="nextRound">
          {{ currentTournament.currentRound >= currentTournament.rounds ? 'Concludi' : 'Genera turno successivo' }} →
        </button>
      </div>

      <div class="panel standings">
        <div class="section-title"><span>CLASSIFICA</span><span>PTS · BHZ</span></div>
        <div v-for="(p, i) in standings" :key="p.id" class="standing-row">
          <span class="rank">{{ i + 1 }}</span>
          <span class="avatar">{{ p.name.slice(0, 1).toUpperCase() }}</span>
          <span class="s-name"><b>{{ p.name }}</b><small>{{ p.wins }}V · {{ p.draws }}P · {{ p.losses }}S</small></span>
          <strong>{{ p.score }}</strong>
          <small>{{ p.buchholz.toFixed(1) }}</small>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

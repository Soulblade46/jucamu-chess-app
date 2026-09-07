<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Player, Tournament } from '../types'
import TournamentStandings from './TournamentStandings.vue'

const STORAGE_KEY = 'chessapp.tournaments.v1'
const tournamentCode = ref('')
const playerName = ref('')
const tournament = ref<Tournament | null>(null)
const joinedName = ref('')
const message = ref('')

const loadTournaments = (): Tournament[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const joinTournament = () => {
  const code = tournamentCode.value.trim()
  const name = playerName.value.trim()
  const tournaments = loadTournaments()
  const found = tournaments.find(item => item.id === code)

  if (!found) {
    message.value = 'Codice torneo non trovato'
    return
  }
  if (found.started) {
    message.value = 'Il torneo è già iniziato'
    return
  }
  if (!name) {
    message.value = 'Inserisci il tuo nome'
    return
  }
  if (found.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
    message.value = 'Questo nome è già nel torneo'
    return
  }

  const player: Player = { id: uid(), name, score: 0, buchholz: 0, wins: 0, draws: 0, losses: 0 }
  found.players.push(player)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments))
  tournament.value = found
  joinedName.value = name
  message.value = ''
}

const currentMatches = computed(() => tournament.value?.matches.filter(match => match.round === tournament.value?.currentRound) ?? [])
const standings = computed(() => {
  const currentTournament = tournament.value
  if (!currentTournament) return []

  const map = new Map(currentTournament.players.map(player => [player.id, { ...player, buchholz: 0 }]))

  for (const match of currentTournament.matches) {
    if (!match.result || match.bye) continue
    const white = map.get(match.white)
    const black = map.get(match.black)
    if (!white || !black) continue

    if (match.result === 'white') {
      white.score += 1
      white.wins += 1
      black.losses += 1
    } else if (match.result === 'black') {
      black.score += 1
      black.wins += 1
      white.losses += 1
    } else {
      white.score += 0.5
      black.score += 0.5
      white.draws += 1
      black.draws += 1
    }
  }

  for (const match of currentTournament.matches) {
    if (!match.result || match.bye) continue
    const white = map.get(match.white)
    const black = map.get(match.black)
    if (white && black) {
      white.buchholz += black.score
      black.buchholz += white.score
    }
  }

  return [...map.values()].sort((a, b) =>
    b.score - a.score || b.buchholz - a.buchholz || b.wins - a.wins || a.name.localeCompare(b.name)
  )
})

const syncTournament = () => {
  if (!tournament.value) return
  const updated = loadTournaments().find(item => item.id === tournament.value?.id)
  if (updated) tournament.value = updated
}

onMounted(() => window.addEventListener('storage', syncTournament))
</script>

<template>
  <section class="page page-enter participant-page">
    <div class="page-heading"><div><span class="eyebrow">PARTECIPANTE</span><h2>Entra nel torneo</h2></div></div>
    <div v-if="!tournament" class="panel participant-form">
      <h3>Inserisci i tuoi dati</h3>
      <label>Codice torneo<input v-model="tournamentCode" maxlength="6" placeholder="Inserisci il codice del torneo" autocomplete="off" /></label>
      <label>Il tuo nome<input v-model="playerName" placeholder="Nome concorrente" autocomplete="name" @keyup.enter="joinTournament" /></label>
      <button class="primary wide" @click="joinTournament">Partecipa</button>
      <p v-if="message" class="form-message">{{ message }}</p>
    </div>
    <div v-else class="participant-content">
      <div class="tournament-head panel"><div><span class="eyebrow">{{ tournament.name }}</span><h3>Ciao, {{ joinedName }}</h3><small class="tournament-code">Codice: {{ tournament.id }}</small></div><div v-if="tournament.started" class="round-badge">Turno <strong>{{ tournament.currentRound }}</strong> / {{ tournament.rounds }}</div><span v-else class="round-badge">In attesa dell'avvio</span></div>
      <div v-if="!tournament.started" class="panel participant-matches waiting-panel"><span class="eyebrow">ISCRIZIONE COMPLETATA</span><h3>Attendiamo l'avvio del torneo</h3><p>Il gestore sta raccogliendo i partecipanti. Gli abbinamenti appariranno qui quando inizierà il primo turno.</p></div>
      <div v-else class="panel participant-matches"><div class="section-title"><span>TURNO CORRENTE</span><span>{{ currentMatches.length }} PARTITE</span></div><div v-for="match in currentMatches" :key="match.id" class="participant-match"><span>{{ tournament.players.find(player => player.id === match.white)?.name || '—' }}</span><b>{{ match.bye ? 'BYE' : 'vs' }}</b><span>{{ match.bye ? '' : tournament.players.find(player => player.id === match.black)?.name || '—' }}</span></div><div v-if="!currentMatches.length" class="empty">Il prossimo turno non è ancora disponibile.</div></div>
      <TournamentStandings :standings="standings" />
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Mode, Player, Tournament } from '../types'

defineProps<{
  name: string
  mode: Mode
  rounds: number
  playerInput: string
  draftPlayers: Player[]
  tournaments: Tournament[]
  modeLabel: (mode: Mode) => string
}>()

defineEmits<{
  'update:name': [value: string]
  'update:mode': [value: Mode]
  'update:rounds': [value: number]
  'update:playerInput': [value: string]
  addPlayer: []
  removePlayer: [id: string]
  createTournament: []
  openTournament: [id: string]
  deleteTournament: [id: string]
}>()
</script>

<template>
  <div class="setup-grid">
    <div class="panel setup-card">
      <span class="step">01</span><h3>Imposta il torneo</h3>
      <label>Nome torneo<input :value="name" placeholder="Campionato Sociale" @input="$emit('update:name', ($event.target as HTMLInputElement).value)" /></label>
      <label>Modalità<select :value="mode" @change="$emit('update:mode', ($event.target as HTMLSelectElement).value as Mode)"><option value="swiss">Swiss</option><option value="round-robin">Round-robin</option><option value="knockout">Eliminazione diretta</option></select></label>
      <label v-if="mode !== 'round-robin'">Turni<input :value="rounds" type="number" min="1" max="50" @input="$emit('update:rounds', Number(($event.target as HTMLInputElement).value))" /></label>
      <p class="helper">{{ mode === 'swiss' ? 'Abbinamenti per punteggio, evitando per quanto possibile le ripetizioni.' : mode === 'round-robin' ? 'Tutti giocano contro tutti, una volta.' : 'Tabellone a eliminazione diretta con bye automatici.' }}</p>
    </div>
    <div class="panel players-card">
      <span class="step">02</span><h3>Inserisci i giocatori</h3>
      <div class="add-player"><input :value="playerInput" placeholder="Nome concorrente" @input="$emit('update:playerInput', ($event.target as HTMLInputElement).value)" @keyup.enter="$emit('addPlayer')" /><button class="primary" @click="$emit('addPlayer')">+ Aggiungi</button></div>
      <div class="players-list"><div v-for="(player, index) in draftPlayers" :key="player.id" class="player-row"><span>{{ index + 1 }}</span><b>{{ player.name }}</b><button @click="$emit('removePlayer', player.id)">×</button></div><div v-if="!draftPlayers.length" class="empty">Puoi aggiungere partecipanti anche dopo la creazione.</div></div>
      <button class="primary wide" @click="$emit('createTournament')">Crea torneo · {{ draftPlayers.length }} giocatori</button>
    </div>
    <div v-if="tournaments.length" class="panel saved-card"><span class="step">03</span><h3>Apri un torneo salvato</h3><div v-for="tournament in tournaments" :key="tournament.id" class="saved-row"><button @click="$emit('openTournament', tournament.id)"><b>{{ tournament.name }}</b><small>{{ modeLabel(tournament.mode) }} · {{ tournament.players.length }} giocatori</small></button><button class="delete" @click="$emit('deleteTournament', tournament.id)">×</button></div></div>
  </div>
</template>

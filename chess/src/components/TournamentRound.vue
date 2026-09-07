<script setup lang="ts">
import type { Match, Result } from '../types'

defineProps<{ matches: Match[]; nameById: (id: string) => string; allResults: boolean; isLastRound: boolean }>()
defineEmits<{ setResult: [match: Match, result: Result]; nextRound: [] }>()
</script>

<template>
  <section class="round-section">
    <div class="section-heading"><div><span class="eyebrow">TURNO IN CORSO</span><h3>Abbinamenti</h3></div><span class="section-count">{{ matches.length }} {{ matches.length === 1 ? 'partita' : 'partite' }}</span></div>
    <div class="matches"><div v-for="match in matches" :key="match.id" class="match panel" :class="{ bye: match.bye }"><div class="table-no">Tavolo {{ match.table }}</div><div class="pair"><span>{{ nameById(match.white) }}</span><strong>—</strong><span>{{ match.bye ? 'BYE' : nameById(match.black) }}</span></div><div v-if="match.bye" class="bye-label">Punto automatico</div><div v-else class="result-buttons"><button :class="{ chosen: match.result === 'white' }" @click="$emit('setResult', match, 'white')">1–0</button><button :class="{ chosen: match.result === 'draw' }" @click="$emit('setResult', match, 'draw')">½–½</button><button :class="{ chosen: match.result === 'black' }" @click="$emit('setResult', match, 'black')">0–1</button></div></div></div>
    <div class="next-row"><span>{{ allResults ? 'Tutti i risultati inseriti.' : 'Inserisci il risultato di ogni partita.' }}</span><button class="primary" :disabled="!allResults" @click="$emit('nextRound')">{{ isLastRound ? 'Concludi' : 'Genera turno successivo' }} →</button></div>
  </section>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin: 0.5rem 0 0.875rem;
}

.section-heading h3 {
  margin: 0.375rem 0 0;
  font-size: 1.375rem;
}

.section-count {
  color: var(--muted);
  font-size: 0.75rem;
}
</style>

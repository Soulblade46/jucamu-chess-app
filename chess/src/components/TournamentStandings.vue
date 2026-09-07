<script setup lang="ts">
import type { Player } from '../types'

defineProps<{ standings: Player[] }>()
</script>

<template>
  <section class="panel standings"><div class="section-title"><span>CLASSIFICA</span><span>PTS · BHZ</span></div><div v-for="(player, index) in standings" :key="player.id" class="standing-row"><span class="rank">{{ index + 1 }}</span><span class="avatar">{{ player.name.slice(0, 1).toUpperCase() }}</span><span class="s-name"><b>{{ player.name }}</b><small>{{ player.wins }}V · {{ player.draws }}P · {{ player.losses }}S</small></span><strong>{{ player.score }}</strong><small>{{ player.buchholz.toFixed(1) }}</small></div><div v-if="!standings.length" class="empty">La classifica apparirà dopo il primo turno.</div></section>
</template>

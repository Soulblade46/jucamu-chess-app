# ChessApp PWA

Webapp moderna in Vue 3 + Vite + TypeScript per timer scacchi e gestione tornei.

## Funzioni

- PWA installabile e offline-first.
- Aggiornamento automatico del Service Worker quando una nuova build è disponibile.
- Timer con preset da 1 a 30 minuti e incremento Fischer.
- Animazione full-screen alla scadenza del tempo.
- Tornei salvati sul dispositivo con localStorage.
- Round-robin con abbinamenti a rotazione.
- Swiss con classifica a punti, Buchholz e prevenzione delle ripetizioni quando possibile.
- Eliminazione diretta con bye automatici.
- Inserimento risultati e generazione del turno successivo.

## Avvio

```bash
npm install
npm run dev
```

## Build PWA

```bash
npm run build
npm run preview
```

> In questa sandbox non è disponibile l'accesso DNS al registry npm, quindi le dipendenze non possono essere scaricate qui. Il progetto è comunque completo e pronto a essere eseguito in un ambiente con accesso a npm.

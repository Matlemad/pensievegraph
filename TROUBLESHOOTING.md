# Troubleshooting

## Warning SES (Secure EcmaScript)

I messaggi come:
```
Removing intrinsics.%MapPrototype%.getOrInsert
Removing intrinsics.%DatePrototype%.toTemporalInstant
```

Sono **warning normali** e non critici. Provengono da librerie che usano SES (Secure EcmaScript) lockdown per sicurezza. Non influenzano il funzionamento dell'applicazione.

**Soluzione**: Nessuna azione richiesta. Questi warning possono essere ignorati.

## Errore CSS `-webkit-text-size-adjust`

L'errore:
```
Error in parsing value for '-webkit-text-size-adjust'. Declaration dropped.
```

È un **warning CSS** comune che proviene da Tailwind CSS o da CSS di sistema. Non è critico e non influisce sul rendering.

**Soluzione**: Nessuna azione richiesta. Questo warning può essere ignorato.

## React DevTools

Il messaggio:
```
Download the React DevTools for a better development experience
```

È solo **informativo** e suggerisce di installare l'estensione React DevTools per il browser.

**Soluzione**: Opzionale. Puoi installare React DevTools se vuoi, ma non è necessario.

## Errore 500 nell'API Route

Se vedi un errore 500 quando carichi il grafo:

1. **Controlla `.env.local`**: Assicurati che `USE_MOCK=true` se vuoi usare i dati mock
2. **Verifica l'URL dell'API**: Se `USE_MOCK=false`, verifica che `PENSIEVE_API_BASE` sia corretto
3. **Controlla i log del server**: L'errore dettagliato viene loggato nella console del server
4. **Fallback automatico**: Se l'API reale fallisce, l'app prova automaticamente a usare i dati mock

**Soluzione rapida**: Imposta `USE_MOCK=true` in `.env.local` per usare i dati mock.

## Come sopprimere i warning in sviluppo

Se vuoi ridurre il rumore nella console durante lo sviluppo, puoi:

1. **Filtrare i warning nella console del browser**: Usa i filtri della console per nascondere messaggi specifici
2. **Usare React Strict Mode solo in produzione**: Modifica `next.config.mjs` se necessario

Questi warning non indicano problemi con il codice e possono essere ignorati in sicurezza.

## Errore "Failed to fetch RSC payload"

Gli errori:
```
Failed to fetch RSC payload for http://localhost:3000/map?...
Falling back to browser navigation.
```

Sono causati da **troppe richieste rapide** quando si cambiano i parametri (slider minCP, focus, ecc.). 

**Soluzione implementata:**
- **Debounce** per il slider minCP (500ms)
- **Debounce** per il focus (300ms)
- **Debounce** per la ricerca (300ms)
- Uso di `router.replace` invece di `router.push` per evitare troppe voci nella history

Questi errori dovrebbero essere significativamente ridotti. Se persistono, possono essere ignorati - l'app funziona comunque correttamente con il fallback a browser navigation.

## Errore WebSocket HMR

L'errore:
```
Firefox can't establish a connection to the server at ws://localhost:3000/_next/webpack-hmr
```

È un **warning normale** del Hot Module Replacement (HMR) di Next.js. Non blocca l'applicazione.

**Possibili cause:**
- Il server è appena partito e HMR non si è ancora connesso
- Firewall o proxy che blocca le connessioni WebSocket
- Estensione del browser che interferisce

**Soluzione**: 
- Ignora questo warning se l'app funziona correttamente
- Se l'app non carica, controlla i log del server per errori reali
- Ricarica la pagina (F5) se necessario

## Warning Ref con dynamic()

Il warning:
```
Warning: Function components cannot be given refs. Attempts to access this ref will fail.
```

È un **warning noto** quando si usa `forwardRef` con `dynamic()` di Next.js. Il wrapper `LoadableComponent` creato da `dynamic()` non passa correttamente i ref.

**Soluzione**: Questo warning può essere ignorato. La funzionalità del ref funziona comunque tramite `useImperativeHandle`. Se il warning è fastidioso, puoi filtrare i warning nella console del browser.

## Errore "Couldn't parse the color string"

Se vedi questo errore:
```
Error: Couldn't parse the color string. Please provide the color as a string in hex, rgb, rgba, hsl or hsla notation.
```

È stato risolto aggiungendo controlli robusti sui colori. Se persiste:

1. **Verifica che tutti i nodi abbiano un `kind` valido** (project, org, person)
2. **Verifica che tutti i link abbiano un `type` valido**
3. **Controlla la console** per vedere quale nodo/link causa il problema

## App che non carica / Rimane in loading

Se l'app rimane nello stato "Caricamento grafo...":

1. **Apri la console del browser** (F12) e controlla gli errori nella tab "Console"
2. **Controlla la tab "Network"** per vedere se la richiesta a `/api/graph` viene completata
3. **Controlla i log del server** nel terminale dove hai avviato `pnpm dev`
4. **Verifica `.env.local`**: Assicurati che `USE_MOCK=true` se vuoi usare i dati mock

**Debug rapido:**
- Apri la console del browser (F12)
- Vai alla tab "Network"
- Ricarica la pagina
- Cerca la richiesta a `/api/graph`
- Clicca su di essa e controlla la risposta


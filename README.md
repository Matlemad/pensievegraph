# Pensieve 3D Map

Visualizzazione 3D interattiva delle relazioni Pensieve utilizzando un grafo force-directed.

## Caratteristiche

- **Vista Affiliations**: Visualizza relazioni `built_on`, `library`, `affiliated`, `contributor`
- **Vista Funding**: Visualizza grant con direzione e importi
- **Filtri**: Tags (lens), Min CP, ricerca
- **Interattività**: Orbit controls, zoom, hover tooltips, click per dettagli
- **URL State**: Deep linking con parametri nella URL
- **Performance**: Ottimizzato per ~400-600 link

## Stack Tecnologico

- **Next.js 14** (App Router, TypeScript)
- **react-force-graph-3d** (Three.js)
- **TailwindCSS** per lo styling
- **pnpm** per la gestione delle dipendenze

## Installazione

```bash
# Installa le dipendenze
pnpm install

# Copia il file .env.example e configura
cp .env.example .env.local

# Avvia il server di sviluppo
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Configurazione

Crea un file `.env.local` con:


- `USE_MOCK=true`: Usa i dati mock da `public/mock.json`. Imposta a `false` per usare l'API reale.
- `PENSIEVE_API_BASE`: URL completo dell'endpoint API Pensieve (`https://pensieve.ecf.network/api/project-relations`)
- `PENSIEVE_API_KEY` o `API_KEY`: Chiave API Pensieve (header `X-API-Key`)
- `CACHE_TTL_SECONDS`: Durata della cache in memoria (default: 300)

### API Pensieve

L'applicazione si integra con l'endpoint `/api/project-relations` di Pensieve:

- **Endpoint**: `GET /api/project-relations`
- **Autenticazione**: Header `X-API-Key: <token>`
- **Rate Limit**: 500 richieste per IP per 60 secondi
- **Query Parameters**:
  - `projectId`: ID progetto specifico (opzionale)
  - `limit`: 1-300, default 20 (per paginazione)
  - `offset`: ≥ 0, default 0 (per paginazione)

L'applicazione recupera automaticamente i progetti con paginazione per costruire il grafo completo.

## Struttura del Progetto

```
pensieve-3d-map/
├── app/
│   ├── api/
│   │   └── graph/
│   │       └── route.ts          # API route per il grafo
│   ├── map/
│   │   └── page.tsx               # Pagina principale
│   ├── layout.tsx
│   ├── page.tsx                   # Redirect a /map
│   └── globals.css
├── components/
│   ├── Graph3D.tsx                # Componente grafo 3D
│   ├── Controls.tsx               # Controlli (mode, filters, search)
│   ├── Sidebar.tsx                # Sidebar con dettagli nodo
│   └── Legend.tsx                 # Legenda
├── lib/
│   ├── api.ts                     # Helper per fetch API
│   ├── normalize.ts               # Normalizzazione Pensieve → Graph3D
│   ├── pensieve.ts                # Fetch dati Pensieve (API o mock)
│   └── types.ts                   # TypeScript types
├── public/
│   └── mock.json                  # Dati mock
└── package.json
```

## API

### GET `/api/graph`

Restituisce il grafo normalizzato in formato `Graph3D`.

**Query Parameters:**
- `mode`: `affiliations` | `funding` (default: `affiliations`)
- `lens`: Tags separati da virgola (es: `public-goods,education`)
- `minCP`: Filtro minimo CP (default: 0)
- `limit`: Limite massimo link (default: 800)

**Esempio:**
```
GET /api/graph?mode=funding&minCP=100&lens=public-goods,education
```

## URL State

La pagina `/map` supporta parametri URL per deep linking:

- `mode`: `affiliations` | `funding`
- `lens`: Tags separati da virgola
- `minCP`: Numero minimo CP
- `limit`: Limite link
- `focus`: ID nodo da focalizzare

**Esempio:**
```
/map?mode=funding&minCP=100&lens=public-goods,education&focus=proj:arweave
```

## Controlli

- **Mode Toggle**: Alterna tra Affiliations e Funding
- **Tags Lens**: Filtra per tags (OR logic, separati da virgola)
- **Min CP Slider**: Filtra nodi per CP minimo (0-5000)
- **Search**: Cerca e focalizza un nodo per nome
- **Reset Camera**: Ripristina la vista del grafo

## Interazioni

- **Hover**: Mostra tooltip con label, kind, tags, CP
- **Click**: Seleziona nodo e mostra dettagli nella sidebar
- **Orbit**: Trascina per ruotare la vista
- **Zoom**: Scroll per zoom in/out

## Sidebar

Quando un nodo è selezionato, la sidebar mostra:

- Informazioni base (nome, tipo, CP, tags, ecosystem)
- Entità correlate (top 10 per peso nel modo corrente)
- Azioni:
  - Focus Node: Focalizza il nodo nella vista
  - Isola Vicinato: Filtra per mostrare solo i vicini
  - Copia Link Condivisione: Copia URL con stato corrente

## Performance

- **Cooldown**: 100 ticks per stabilizzare il grafo
- **Downsampling**: Se i link superano il limite, mantiene i top-K per nodo
- **Cache**: Cache in-memory con TTL configurabile

## Build per Produzione

```bash
pnpm build
pnpm start
```

## Note

- Il grafo usa colori automatici basati su `kind` (project/org/person)
- I link di tipo `grant` hanno frecce direzionali
- La dimensione dei nodi è proporzionale al CP
- Lo spessore dei link è proporzionale al peso

## Licenza

MIT


# Code Optimization Report

Generato: 5 Dicembre 2025

## Riepilogo

- ✅ Codice ben strutturato con utility e hooks separati
- ⚠️ Alcune ottimizzazioni minori necessarie
- ✅ Nessun TODO/FIXME nel codice

## Ottimizzazioni Proposte

### 1. Rimuovere Dipendenze Non Utilizzate

**Dipendenze da rimuovere:**
- `react-force-graph` (1.48.1) - non più usata dopo aver rimosso toggle 2D
- `aframe` (1.7.1) - optional dependency non necessaria
- `aframe-extras` (7.6.0) - optional dependency non necessaria

**Impatto:**
- Riduzione bundle size: ~5-10 MB
- Meno dipendenze = meno vulnerabilità

**Comando:**
```bash
pnpm remove react-force-graph aframe aframe-extras
```

### 2. Rimuovere Componente Non Utilizzato

**File da rimuovere:**
- `components/Legend.tsx` - non importato da nessun componente

**Verifica:** `grep -r "Legend" --include="*.tsx" --include="*.ts" .` mostra solo README

### 3. Ottimizzare Console Logs

**28 console.log** trovati in produzione:
- `lib/pensieve.ts`: 24 logs
- `lib/normalize.ts`: 3 logs
- `app/api/raw-data/route.ts`: 1 log

**Soluzione:** Condizionare con `NODE_ENV`:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...);
}
```

Oppure creare utility logger:
```typescript
const log = process.env.NODE_ENV === 'development' ? console.log : () => {};
```

### 4. Ottimizzare Immagine Logo

**File:** `components/Controls.tsx` linea 153

**Problema:** Usa `<img>` invece di `next/image`

**Soluzione:**
```tsx
import Image from 'next/image';

<Image 
  src="/PensieveGraphLogo.webp" 
  alt="Pensieve Graph" 
  width={32}
  height={32}
  className="h-8 w-auto"
/>
```

**Benefici:**
- Ottimizzazione automatica dell'immagine
- Lazy loading
- Migliore LCP (Largest Contentful Paint)

### 5. Aggiungere Gestione Errori Globale

**Mancante:** Error boundary a livello app

**Soluzione:** Creare `app/error.tsx` per catturare errori globali

### 6. Ottimizzare Build Output

**Bundle size attuale:**
- Totale First Load JS: 87.3 kB ✅ (buono)
- Pagina /map: 8.06 kB ✅ (ottimo)

**Possibili miglioramenti:**
- Tree-shaking più aggressivo (già buono)
- Code splitting per drawer (lazy load)

## Priorità

### Alta Priorità
1. ✅ Rimuovere dipendenze non usate (~5-10 MB risparmiati)
2. ✅ Rimuovere Legend.tsx (pulizia codice)

### Media Priorità
3. ⚠️ Ottimizzare console.logs (performance production)
4. ⚠️ Usare next/Image per logo (SEO/Performance)

### Bassa Priorità
5. 📝 Error boundary globale (migliore UX)
6. 📝 Lazy load drawer (marginal gain)

## Note

- Il codice è già ben ottimizzato grazie a:
  - useMemo/useCallback per prevenire re-render
  - Utility functions separate
  - Hooks custom riutilizzabili
  - TypeScript strict
  
- Performance del grafico 3D è buona per 100-200 nodi


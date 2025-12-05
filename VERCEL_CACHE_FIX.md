# Fix Cache Issues su Vercel

## Problema
Le modifiche funzionano in locale ma non su Vercel a causa della cache.

## Soluzioni Implementate

### 1. Cache Headers nelle API Routes
Aggiunti header espliciti per disabilitare la cache:
- `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`
- `Pragma: no-cache`
- `Expires: 0`

### 2. Force Dynamic Rendering
Tutte le API routes hanno `export const dynamic = 'force-dynamic'` per prevenire il rendering statico.

## Come Forzare il Refresh su Vercel

### Opzione 1: Redeploy Manuale
1. Vai su Vercel Dashboard
2. Seleziona il progetto
3. Clicca su "Redeploy" → "Redeploy with existing Build Cache: No"

### Opzione 2: Clear Cache via API
Chiama l'endpoint per pulire la cache:
```
GET https://pensievegraph.vercel.app/api/clear-cache
```

### Opzione 3: Hard Refresh del Browser
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) o `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### Opzione 4: Verifica il Deploy
Controlla che l'ultimo commit sia deployato:
1. Vai su Vercel Dashboard
2. Controlla i "Deployments"
3. Verifica che l'ultimo commit (a02f933) sia deployato

## Verifica che Funzioni

1. Apri la console del browser (F12)
2. Vai alla tab "Network"
3. Filtra per "graph"
4. Controlla gli header della risposta:
   - `Cache-Control` dovrebbe essere `no-store, no-cache...`
   - `generated_at` dovrebbe essere un timestamp recente

## Se il Problema Persiste

1. **Verifica il Build**: Controlla i log di Vercel per errori durante il build
2. **Clear Vercel Cache**: Vai su Settings → Clear Build Cache
3. **Redeploy**: Fai un nuovo deploy senza cache
4. **Controlla le Variabili d'Ambiente**: Assicurati che siano configurate correttamente


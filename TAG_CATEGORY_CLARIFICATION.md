# Chiarimento: Tag vs Category in Pensieve API

## Problema Identificato

L'app aveva due dropdown separati: **Tag** e **Category**, con valori diversi. Ma l'API Pensieve fornisce solo un campo: `categories` (array).

## Struttura Dati API

```json
{
  "id": 57,
  "name": "ETHna",
  "categories": [
    "Local Communities",
    "Events"
  ]
}
```

**Nota**: L'API fornisce SOLO `categories` (array), non esiste un campo separato per "tag".

## Problema nell'Implementazione Originale

1. **AVAILABLE_TAGS** conteneva 23 valori inventati:
   - `d/acc`, `Ethereum`, `Optimism`, `ZK Rollup`, etc.
   - Questi tag NON esistono nei dati API
   - Risultato: filtrare per questi tag non trovava nessun progetto

2. **AVAILABLE_CATEGORIES** conteneva le 12 categorie reali:
   - `Infrastructure`, `Events`, `Hubs`, etc.
   - Questi valori corrispondono ai dati API
   - Risultato: il filtro category funzionava

## Soluzione Implementata

Entrambi i dropdown (Tag e Category) ora usano le stesse 12 categorie dall'API:

```typescript
export const AVAILABLE_CATEGORIES = [
  'Network States',
  'Zu-Villages',
  'Applications/dApps',
  'Community & Coordination',
  'Developer tools',
  'Hubs',
  'Infrastructure',
  'Security & Privacy',
  'Storage & Data',
  'Events',
  'Local Communities',
  'Other',
] as const;

export const AVAILABLE_TAGS = AVAILABLE_CATEGORIES;
```

## Raccomandazione per il Futuro

Se si desidera una vera distinzione tra "tag" e "category":

1. **Opzione A**: Chiedere al team Pensieve di aggiungere un campo `tags` separato nell'API
2. **Opzione B**: Rimuovere un dropdown dall'UI (mantenere solo "Category") per evitare confusione
3. **Opzione C**: Usare il campo `categories` come tag multipli e permettere filtri su qualsiasi categoria

Al momento entrambi i filtri funzionano, ma filtrano sullo stesso dato.


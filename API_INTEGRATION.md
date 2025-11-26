# Integrazione API Pensieve

Questo documento descrive l'integrazione con l'API reale di Pensieve.

## Endpoint

L'applicazione si integra con l'endpoint `/api/project-relations` di Pensieve.

## Autenticazione

L'API richiede l'header `X-API-Key` con la chiave API fornita.

**Chiave API**: `pk_live_2fd2ed946f85aa50c177cd70b0e79b86`

## Configurazione

Nel file `.env.local`:

```env
USE_MOCK=false
PENSIEVE_API_BASE=https://pensieve.ecf.network/api/project-relations
PENSIEVE_API_KEY=pk_live_2fd2ed946f85aa50c177cd70b0e79b86
# oppure
API_KEY=pk_live_2fd2ed946f85aa50c177cd70b0e79b86
```

## Rate Limits

- **Limite**: 500 richieste per IP per 60 secondi
- **Gestione**: L'applicazione gestisce automaticamente i rate limits:
  - Se riceve un errore 429, attende il tempo specificato nell'header `Retry-After`
  - Aggiunge un piccolo delay tra le richieste per rispettare i limiti

## Paginazione

L'applicazione recupera automaticamente tutti i progetti disponibili usando la paginazione:

- **Limit**: 300 (massimo consentito)
- **Offset**: Incrementato automaticamente
- **Stop condition**: Quando `hasMore` è `false` o raggiunge 1000 progetti (per evitare richieste eccessive)

## Struttura Dati

L'API restituisce progetti con le seguenti sezioni:

1. **affiliation**: Relazioni di affiliazione tra progetti
2. **stack_and_integrations**: Dipendenze e integrazioni (mappate come `built_on` o `library`)
3. **contributing_teams**: Team che contribuiscono (mappati come `contributor`)

## Mappatura Relazioni

- `stack_and_integrations` → `built_on` o `library` (basato su `type`)
- `affiliation` → `affiliated`
- `contributing_teams` → `contributor`

## Note

- I grant non sono disponibili in questo endpoint, quindi la vista "Funding" non funzionerà con l'API reale (usa i dati mock)
- L'applicazione crea link solo tra progetti che esistono nel dataset recuperato
- I progetti vengono filtrati per ID per evitare duplicati


# Analisi Struttura Grants - Pensieve API

## Problema Identificato

Durante l'implementazione, abbiamo riscontrato ambiguità nella struttura del campo `funding_received_grants` dell'API Pensieve.

## Struttura Attuale dei Dati

```json
{
  "funding_received_grants": [
    {
      "_id": "...",
      "date": "2024-03-01T00:00:00.000Z",
      "amount": "1500",
      "organization": ["57"],
      "projectDonator": ["2"],
      "organization_name": ["ETHna"],
      "projectDonator_name": ["SpaghettETH"]
    }
  ]
}
```

## Interpretazione dei Campi

### Campo: `organization`
- **Valore esempio**: `["57"]` (ID di ETHna)
- **Nome campo**: `funding_received_grants` (il progetto corrente ha ricevuto funding)
- **Possibile significato**:
  1. Organizzazione che ha gestito/amministrato il grant
  2. Organizzazione che ha dato il funding (ma questo crea confusione se è lo stesso ID del progetto corrente)
  3. Organizzazione beneficiaria del grant

### Campo: `projectDonator`
- **Valore esempio**: `["2"]` (ID di SpaghettETH)
- **Possibile significato**:
  1. Progetto che ha effettivamente donato il funding (più probabile)
  2. Progetto che ha ricevuto il funding (meno probabile, dato che il campo si chiama "Donator")

## Problema Riscontrato

**Interpretazione iniziale (ERRATA):**
- `organization` = giver (chi dà il funding)
- Progetto corrente = receiver (chi riceve il funding)

**Risultato:** Grants con `organization: ["57"]` venivano interpretati come self-grants (ETHna dà a ETHna), quando in realtà ETHna riceveva da SpaghettETH.

**Interpretazione corretta (IMPLEMENTATA):**
- `projectDonator` = giver (chi dona il funding) - se presente e diverso dal progetto corrente
- `organization` = fallback se `projectDonator` non è disponibile
- Progetto corrente = receiver (chi riceve il funding)

## Domande per il Dev Team Pensieve

1. **Qual è il significato esatto di `organization` in `funding_received_grants`?**
   - È chi ha gestito il grant?
   - È chi ha dato il funding?
   - È qualcos'altro?

2. **Qual è il significato esatto di `projectDonator`?**
   - È sempre chi ha donato il funding?
   - Può essere vuoto/null? In quel caso, chi è il donatore?

3. **Caso self-grant:**
   - Se un progetto dà funding a se stesso, come viene rappresentato?
   - `organization` e `projectDonator` sono entrambi lo stesso ID del progetto?

4. **Documentazione:**
   - Esiste documentazione ufficiale che spiega questi campi?
   - Possiamo avere esempi chiari di diversi scenari (grant esterno, self-grant, grant multi-donatore)?

## Soluzione Implementata (Temporanea)

Abbiamo implementato una logica che:
- Usa `projectDonator` come giver se presente e diverso dal progetto corrente
- Usa `organization` come fallback
- Il progetto corrente è sempre il receiver

Questa logica funziona per i casi testati, ma potrebbe non essere corretta per tutti i casi.

## Raccomandazione

**Chiedere al dev team Pensieve di:**
1. Chiarire la semantica di `organization` e `projectDonator`
2. Fornire esempi di diversi scenari di grant
3. Aggiornare la documentazione API con spiegazioni chiare
4. Considerare di rinominare i campi per maggiore chiarezza (es: `grant_giver`, `grant_receiver`)


# Tech Stack & Development Info

## Linguaggio di Programmazione

**TypeScript** - Linguaggio principale utilizzato per tutto il progetto.

TypeScript è stato scelto per:
- Type safety e prevenzione di errori a compile-time
- Migliore developer experience con autocompletamento
- Compatibilità con l'ecosistema Next.js e React
- Manutenibilità del codice a lungo termine

## Framework & Librerie Principali

- **Next.js 14** (App Router) - Framework React per applicazioni full-stack
- **React 18** - Libreria UI
- **TypeScript 5.4** - Linguaggio di programmazione
- **react-force-graph-3d** - Visualizzazione grafo 3D (basato su Three.js)
- **TailwindCSS** - Framework CSS utility-first

## AI Assistant Utilizzato

Questa applicazione è stata sviluppata con l'assistenza di **Cursor AI** (Auto/Claude Sonnet 4.5).

Cursor è un IDE potenziato dall'AI che integra modelli di linguaggio avanzati per:
- Generazione di codice
- Refactoring assistito
- Debugging intelligente
- Documentazione automatica

## Architettura

- **Frontend**: Next.js App Router con componenti React Server/Client
- **Backend**: Next.js API Routes (Edge-compatible)
- **Visualizzazione**: WebGL tramite Three.js (via react-force-graph-3d)
- **Styling**: TailwindCSS con variabili CSS custom

## Struttura Dati

- **Formato API**: REST/JSON
- **Normalizzazione**: Trasformazione da formato Pensieve a formato Graph3D unificato
- **Caching**: In-memory cache con TTL configurabile

## Note per il Dev Team

Il codice è completamente in TypeScript con tipi strict, seguendo le best practices di Next.js 14 e React 18. L'applicazione è progettata per essere edge-compatible e scalabile.


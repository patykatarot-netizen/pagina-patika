# ADR-0001: Adopt Architecture Decision Records (ADR) Skill

- **Date**: 2026-05-08
- **Status**: accepted
- **Deciders**: anto, gentle-orchestrator

## Context

El flujo de trabajo con agentes AI genera decisiones técnicas constantemente (librerías, patrones, configuraciones) que quedan perdidas en conversaciones. Engram las captura, pero no hay un formato estructurado y visible que cualquier agente (humano o AI) pueda leer al llegar al proyecto. Sin ADRs, cada sesión de agente empieza sin contexto arquitectónico.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Solo Engram (status quo) | Ya existe, no requiere new skill | No es visible en el repo, difícil de descubrir para nuevos agentes |
| ADR en `docs/adr/` | Visible en el repo, legible por humanos y agentes, versionado con git | Requiere crear el skill + disciplina inicial |
| Wiki externa (Notion, etc.) | UI familiar | No está versionada, se desincroniza del código, los agentes no la leen |

## Decision

Adoptamos ADRs estilo MADR (Markdown Any Decision Records) como skill de OpenCode. Cada decisión técnica significativa se captura en `docs/adr/{NNNN}-{slug}.md` con formato: Contexto, Opciones, Decisión, Consecuencias, Y-Statement.

## Consequences

- Las decisiones arquitectónicas son descubribles vía `ls docs/adr/`
- Los agentes futuros pueden leer el "por qué" antes de codear
- Engram sigue siendo el respaldo cross-session, ADRs son el fuente de verdad en el repo
- Requiere disciplina para crear ADRs en lugar de solo charlar la decisión

## Y-Statement

> In the context of **AI-assisted development where technical decisions are made every session**, facing **loss of architectural context across sessions and agents**, we decided for **Architecture Decision Records as an OpenCode skill** to achieve **persistent, discoverable, version-controlled decision history**, accepting **the overhead of writing a 5-minute markdown file per decision**.

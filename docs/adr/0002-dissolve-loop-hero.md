# ADR-0002: Dissolve Transition for Hero Video Loop

- **Date**: 2026-05-08
- **Status**: accepted
- **Deciders**: anto, gentle-ai
- **Example**: ✅ Esta ADR es el ejemplo concreto del skill ADR. Muestra cómo se ve una decisión real bien documentada.

## Context

El Hero de la landing page tiene un video de fondo de ~8s que debe loopear infinitamente. El video raw tiene un hard cut al terminar — el último frame salta al primero sin transición. Se ve mal.

Necesitábamos alguna forma de transicionar suavemente entre el final y el reinicio del video.

## Options Considered

| Opción | Pros | Contras |
|--------|------|---------|
| **Hard cut** | Cero código. El browser loopea naturalmente | Se nota el salto. Se ve tosco. |
| **Crossfade** | Transición muy suave (video A fade out + video B fade in) | Dos elementos `<video>` en DOM. Mayor consumo de memoria. Lógica de timing más compleja. |
| **Dissolve (elegida)** | Un solo `<video>`. Código simple (CSS opacity + evento). 200ms total. | Se ve el gradient background 200ms por loop. El color del gradient importa. |

## Decision

Elegimos **dissolve**: al llegar al final del video (evento `ended` o loop point), fade out a opacity 0 en 100ms, mostramos el gradient background, luego fade in a opacity 1 en 100ms y reiniciamos el video.

Esto da 200ms total de transición. El video visible se reduce de ~8s a ~7.7s pero es imperceptible.

## Consequences

**Positivos:**
- Un solo elemento `<video>` en DOM
- Sin JavaScript libraries — solo CSS transition + evento
- Fácil de ajustar (cambiar duración o easing)

**Tradeoffs aceptados:**
- Durante 200ms se ve el gradient background — si el color no matchea, la transición se nota
- La duración efectiva del video se reduce ligeramente

**Evolución posterior:**
- El gradient se cambió de `#1a1040` (púrpura) a `#1a1410` (marrón cálido) porque frame-by-frame analysis mostró que el video nunca tiene frames azules (R > G > B siempre)
- Se agregaron feather overlays (gradientes) en top/bottom del video para que los bordes se fundan con el gradient, eliminando bordes duros

## Y-Statement

> In the context of a hero background video that needs to loop seamlessly, facing the problem that the raw video has a visible hard cut at the loop point, we decided for a dissolve transition (200ms CSS opacity fade) to achieve a smooth visual loop with minimal code complexity, accepting 200ms of visibility of the background gradient per loop iteration.

## Referencias

- Código: `components/landing/Hero.tsx`
- Video: `public/video/hero-bg.mp4`
- Poster: `public/poster/hero-poster.jpg`
- Feather overlays se documentaron en Engram como `hero-feather-overlays`

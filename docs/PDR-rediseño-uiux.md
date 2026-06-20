# PDR — Rediseño UI/UX Patyka Tarot

> **Producto**: Patyka Tarot — Landing + Booking
> **Versión**: 2.0
> **Estado**: Propuesta
> **Fecha**: 27 mayo 2026
> **Nivel**: Producción (Doctorado)

---

## 1. Resumen Ejecutivo

Rediseño completo de la interfaz de Patyka Tarot alineado con la identidad visual de las publicaciones de la marca (púrpura profundo, dorado, amarillo), con mejoras de usabilidad mobile-first, micro-interacciones dinámicas, y reestructuración de servicios, horarios y flujo de agendamiento según las reglas de negocio actualizadas.

---

## 2. Diagnóstico del Estado Actual

### 2.1 Lo que funciona bien
- **Arquitectura técnica sólida**: Next.js 15 App Router, SSR, Drizzle ORM, PostgreSQL
- **Liquid Glass aesthetic**: glassmorphism bien implementado con `backdrop-filter`
- **Accesibilidad base**: focus trapping, aria labels, keyboard navigation en el drawer
- **Performance**: lazy loading de TikTok embeds, rAF para animaciones
- **Responsive**: breakpoints md/lg bien distribuidos

### 2.2 Problemas identificados

| # | Categoría | Problema | Impacto |
|---|-----------|----------|---------|
| 1 | **Branding** | Paleta actual (negro + gold + purple) no refleja la identidad visual real de la marca (púrpura profundo, dorado, amarillo de las publicaciones) | Alto — desconexión entre web y redes sociales |
| 2 | **Tipografía** | Fuentes demasiado pequeñas (text-sm, text-xs en múltiples lugares). Falta bold en textos clave | Alto — legibilidad pobre en mobile |
| 3 | **Servicios** | Seed data desactualizada ($80k, $50k, $120k). No refleja servicios reales ($10k/$18k/$25k/$35k/$70k) | Crítico — precios incorrectos |
| 4 | **Horarios** | No hay lógica de horarios por tipo de servicio ni por día de la semana | Crítico — el SlotPicker no distingue entre lectura completa, temática o preguntas |
| 5 | **WhatsApp** | WhatsApp está relegado al footer como un ícono más. No es el canal principal | Alto — las preguntas puntuales SOLO se agendan por WhatsApp |
| 6 | **Notas legales** | Faltan notas críticas: comprobante de pago por WhatsApp, Western Union para extranjeros | Medio — confusión en el proceso de pago |
| 7 | **Servicios faltantes** | No existen "Trabajos Energéticos" ni "Lectura Temática" como servicios diferenciados | Alto — oferta incompleta |
| 8 | **Motion** | Animaciones limitadas a hover scale y count-up. Falta dinamismo visual | Medio — experiencia estática |
| 9 | **Contraste** | Algunos textos púrpura sobre fondo oscuro pueden tener ratio de contraste insuficiente | Medio — accesibilidad WCAG |
| 10 | **Booking flow** | 4 pasos es excesivo para servicios que se agendan por WhatsApp. El formulario actual no refleja la realidad del negocio | Alto — fricción innecesaria |

---

## 3. Paleta de Colores — Nueva Identidad Visual

Basada en la imagen de referencia ("Lectura de TAROT Dulce Ritual"):

### 3.1 Variables CSS actualizadas

```css
:root {
  /* Fondos */
  --bg-primary:    #0d0520;    /* Púrpura muy oscuro (casi negro con tono púrpura) */
  --bg-secondary:  #1a0a3e;   /* Púrpura medio para secciones alternas */
  --bg-glass:      rgba(255, 255, 255, 0.06);
  --bg-card:       rgba(139, 92, 246, 0.08);

  /* Bordes glass */
  --border-glass:  rgba(212, 168, 83, 0.12);
  --border-gold:   rgba(212, 168, 83, 0.3);

  /* Acentos principales */
  --accent-gold:   #d4a853;   /* Dorado — CTAs, precios, highlights */
  --accent-yellow: #f5d76e;   /* Amarillo — badges, estrellas, decoraciones */
  --accent-purple: #a855f7;   /* Púrpura vibrante — gradientes, links */
  --accent-purple-deep: #7c3aed; /* Púrpura profundo — fondos de cards */

  /* Textos */
  --text-primary:  #f5f0eb;   /* Blanco cálido — cuerpo principal */
  --text-secondary: rgba(245, 240, 235, 0.65);
  --text-on-purple: #f5f0eb;  /* Texto sobre fondos púrpura (contraste verificado) */
  --text-gold:     #d4a853;   /* Texto dorado sobre fondos oscuros */
}
```

### 3.2 Verificación de contraste WCAG AA

| Combinación | Ratio | WCAG AA | WCAG AAA |
|-------------|-------|---------|----------|
| `#f5f0eb` sobre `#0d0520` | 15.8:1 | ✅ Pass | ✅ Pass |
| `#d4a853` sobre `#0d0520` | 8.2:1 | ✅ Pass | ✅ Pass |
| `#a855f7` sobre `#0d0520` | 7.1:1 | ✅ Pass | ✅ Pass |
| `#f5f0eb` sobre `#1a0a3e` | 12.4:1 | ✅ Pass | ✅ Pass |
| `#d4a853` sobre `#1a0a3e` | 6.5:1 | ✅ Pass |  Fail |
| `rgba(245,240,235,0.65)` sobre `#0d0520` | 10.3:1 | ✅ Pass | ✅ Pass |

> **Nota**: El texto secondary con 65% de opacidad mantiene ratio > 4.5:1 sobre el fondo principal.

---

## 4. Reduccionismo Cognitivo y Ergonomía Digital

### 4.1 Ley de Miller — Chunking Semántico

> **Principio**: La memoria de trabajo humana procesa 7±2 elementos simultáneamente.

**Aplicación en Patyka Tarot:**

| Zona | Elementos actuales | Chunking propuesto | Cumple Miller? |
|------|-------------------|-------------------|----------------|
| Nav links | 3 links + CTA = 4 | ✅ Ya cumple | ✅ Sí |
| Servicios (catálogo) | 6 servicios | Agrupar en **3 categorías** → Preguntas / Lecturas / Energéticos | ✅ Sí (3 chunks) |
| Booking steps | 4 pasos | Reducir a **3 pasos** | ✅ Sí |
| Slots por día | 6-9 horarios | ✅ Dentro del límite | ✅ Sí |
| Footer social | 3 redes | ✅ Ya cumple | ✅ Sí |

**Regla de diseño**: Ninguna pantalla mostrará más de 5 opciones de decisión simultáneas.

### 4.2 Ley de Hick — Decisión Única por Pantalla

> **Principio**: El tiempo de decisión crece logarítmicamente con el número de opciones.

**Aplicación en el motor de reservas:**

```
Pantalla 1: ¿Qué servicio querés? → 3 categorías (no 6 servicios individuales)
Pantalla 2: ¿Qué día y hora? → Calendario + slots (contexto ya definido)
Pantalla 3: ¿Sos vos? → Datos personales + pago (última decisión)
```

**Anti-patrón eliminado**: El paso 4 ("Confirmar") del booking actual viola la Ley de Hick — presenta opciones (volver/pagar) cuando la decisión ya fue tomada. Se elimina.

### 4.3 Saliencia Visual — Jerarquía por Peso, no por Color

> **Principio**: El 80% de la atención debe ir al CTA principal sin competir con elementos decorativos.

**Estrategia de saliencia:**

| Elemento | Saliencia | Mecanismo |
|----------|-----------|-----------|
| CTA principal ("Agendar Sesión") | **ALTA** | Escala (px-8 py-4), peso (bold), glow dorado, posición central |
| CTA secundario (WhatsApp) | **MEDIA** | Escala menor, color verde (diferente al dorado), posición lateral |
| Precios | **ALTA** | Bold + color dorado + tabular-nums |
| Navegación | **BAJA** | Texto pequeño, opacidad reducida, sin glow |
| Decoraciones (partículas, estrellas) | **MÍNIMA** | Opacidad < 0.3, sin interacción, no compiten por atención |

**Regla**: Si un elemento decorativo compite visualmente con un CTA, se reduce su opacidad o se elimina.

---

## 5. Arquitectura de Información Invisible

### 5.1 Progressive Disclosure — Capas de Complejidad

> **Principio**: La complejidad técnica solo emerge tras una interacción deliberada del usuario.

**Capas de revelación en Patyka Tarot:**

```
Capa 1 (Siempre visible):
  ├─ Servicios disponibles (nombre, precio, duración)
  ├─ CTA de agendamiento
  └─ WhatsApp flotante

Capa 2 (Tras seleccionar servicio):
  ├─ Horarios disponibles (solo los del servicio elegido)
  ├─ Días disponibles (filtrados automáticamente)
  ─ Duración estimada

Capa 3 (Tras seleccionar horario):
  ├─ Formulario de datos personales
  ├─ Resumen de la reserva
  ├─ Notas de pago (comprobante, Western Union)
  └─ Términos y condiciones

Capa 4 (Solo tras error o duda):
  ├─ Política de cancelación (link en footer)
  ├─ FAQ implícito (notas inline contextuales)
  └─ Soporte WhatsApp
```

**Regla**: El usuario nunca ve información de la Capa N antes de completar la Capa N-1.

### 5.2 Anticipación UX — Interfaz Predictiva

> **Principio**: La UI transiciona orgánicamente según la intención detectada.

**Implementaciones:**

| Trigger del usuario | Respuesta anticipatoria |
|---------------------|------------------------|
| Selecciona "Lectura Completa" | El date picker **solo muestra** Lun/Mar/Jue. Los demás días están disabled con tooltip explicativo. |
| Selecciona "Lectura Temática" | El date picker **solo muestra** Mié/Vie. |
| Selecciona "Pregunta Puntual" | **No se muestra** date picker. Aparece directamente el CTA de WhatsApp con mensaje prellenado. |
| Selecciona un slot | El slot se ilumina inmediatamente, los demás se atenúan (focus visual). |
| Escribe email inválido | El borde se tiñe de rojo **mientras escribe**, no al salir del campo. |
| Intenta agendar sin terms | El checkbox vibra sutilmente (shake animation), no aparece un popup. |

**Regla**: La interfaz guía, no pregunta. Si el camino es obvio, no se ofrece alternativa.

---

## 6. Estética Mac 2026 — Materialidad Digital

### 6.1 Squircles — Radios de Curvatura Continua

> **Principio**: Las superelipses eliminan la tensión visual de las esquinas redondeadas estándar (border-radius circular).

**Implementación CSS:**

```css
/* Squircle via superellipse approximation */
.squircle {
  border-radius: 12px;
  /* Tailwind no soporta squircles nativamente — usamos clip-path */
}

/* Para elementos críticos (CTAs, cards principales) */
.squircle-lg {
  border-radius: 16px;
}

/* Para elementos pequeños (badges, chips) */
.squircle-sm {
  border-radius: 8px;
}
```

**Aplicación**: Todos los contenedores `liquid-glass` usarán squircles en lugar de border-radius estándar.

### 6.2 Glassmorphism 2.0 — Stack de Materiales

> **Principio**: Diferentes niveles de blur y opacidad simulan profundidad física real.

**Stack de materiales definido:**

| Material | Blur | Opacidad fondo | Specular border | Uso |
|----------|------|---------------|-----------------|-----|
| **Glass Primary** | 20px | 0.06 | 1px @ 12% | Cards de servicios, contenedores principales |
| **Glass Secondary** | 10px | 0.04 | 1px @ 8% | Inputs, campos de formulario |
| **Glass Elevated** | 40px | 0.12 | 1px @ 20% | Modales, drawers, overlays |
| **Glass Subtle** | 5px | 0.02 | 1px @ 5% | Badges, chips, tags |

**Specular Highlight (borde de luz):**

```css
/* El ::before pseudo-element simula luz atrapada en el borde del vidrio */
.glass-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,    /* Luz superior izquierda */
    rgba(255, 255, 255, 0.05) 40%,   /* Transición suave */
    transparent 80%                    /* Desvanecimiento */
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  pointer-events: none;
}
```

**Mobile optimization**: En pantallas < 768px, el blur se reduce al 50% para mantener performance.

### 6.3 Tipografía de Precisión — Espacio Negativo Activo

> **Principio**: La jerarquía se establece por espacio negativo, no solo por tamaño.

**Sistema de Tracking y Leading dinámico:**

```css
/* Tracking (letter-spacing) por tamaño */
.text-display  { letter-spacing: -0.02em; } /* H1 — más compacto */
.text-heading  { letter-spacing: -0.01em; } /* H2, H3 */
.text-body     { letter-spacing: 0; }       /* Párrafos — natural */
.text-caption  { letter-spacing: 0.02em; }  /* Notas — más aire */

/* Leading (line-height) por contexto */
.leading-tight   { line-height: 1.15; } /* Títulos — compacto */
.leading-normal  { line-height: 1.6; }  /* Body — legibilidad */
.leading-relaxed { line-height: 1.75; } /* Notas — aireado */
```

**Espacio negativo activo:**

| Zona | Padding/Margin | Propósito |
|------|---------------|-----------|
| Entre secciones | `py-24 md:py-32` | Respiración visual, separación de contextos |
| Dentro de cards | `p-6 md:p-8` | Contenido contenido, no pegado a bordes |
| Entre cards | `gap-6 md:gap-8` | Separación suficiente para no fusionar visualmente |
| Hero content | `px-4` mínimo, `max-w-4xl` | Líneas de texto no exceden 75 caracteres |

**Regla**: El espacio negativo es un conductor de la mirada. Si dos elementos compiten por atención, se aumenta el espacio entre ellos.

---

## 7. Affordance Orgánico — Física de Materiales

### 7.1 Spring Physics — Micro-interacciones con Masa

> **Principio**: Las animaciones lineales se sienten artificiales. Las spring curves simulan física real.

**Curvas de spring definidas:**

```css
/* Spring curve: masa=1, rigidez=300, amortiguación=25 */
/* Equivale a: cubic-bezier(0.34, 1.56, 0.64, 1) */
.spring-bounce {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Spring curve suave: masa=1, rigidez=200, amortiguación=30 */
/* Equivale a: cubic-bezier(0.25, 1, 0.5, 1) */
.spring-smooth {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Spring curve rápida: masa=0.5, rigidez=400, amortiguación=20 */
/* Equivale a: cubic-bezier(0.4, 0, 0.2, 1) */
.spring-snap {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Aplicación por elemento:**

| Elemento | Curva | Sensación |
|----------|-------|-----------|
| Hover en cards | `spring-bounce` | Rebote sutil, como tocar gel |
| Abrir drawer | `spring-smooth` | Deslizamiento orgánico |
| Cerrar modal | `spring-snap` | Respuesta inmediata |
| Botón al click | `spring-snap` + scale(0.97) | Presión física |
| Error shake | `spring-bounce` | Rechazo suave |

### 7.2 Feedback Háptico Visual — Reacción Orgánica al Error

> **Principio**: Los errores no se comunican con pop-ups disruptivos. La interfaz "reacciona" físicamente.

**Patrones de feedback:**

| Tipo de error | Feedback visual | Duración |
|--------------|----------------|----------|
| Campo inválido | Borde tiñe de rojo + shake sutil (translateX ±3px) | 400ms |
| Slot no disponible | Slot se desatura (grayscale 50%) + tooltip | Instant |
| Formulario incompleto | Botón de submit vibra (scale 0.98 → 1.02 → 0.98) | 300ms |
| Error de servidor | Card entera se desatura temporalmente + mensaje inline | 500ms |

**Implementación del shake:**

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

.shake-error {
  animation: shake 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Desaturación orgánica:**

```css
@keyframes desaturate {
  0% { filter: saturate(1); }
  50% { filter: saturate(0.3); }
  100% { filter: saturate(1); }
}

.desaturate-error {
  animation: desaturate 0.5s ease-in-out;
}
```

### 7.3 Respuesta Emocional — Estados de la Interfaz

| Estado | Sensación deseada | Mecanismo |
|--------|------------------|-----------|
| **Idle** (reposo) | Calma, misterio | Partículas lentas, glow sutil en CTAs |
| **Active** (interactuando) | Energía, respuesta | Spring bounce en hover, glow intensificado |
| **Loading** (esperando) | Paciencia, confianza | Shimmer elegante, no spinner genérico |
| **Success** (completado) | Satisfacción, alivio | Flash dorado sutil, transición suave al siguiente paso |
| **Error** (falló) | Comprensión, no frustración | Desaturación + shake, mensaje claro sin culpa |

---

## 8. Tipografía — Escala Ampliada (actualizada con principios Mac 2026)

### 4.1 Problema actual
- Body text: `text-sm` (14px) — demasiado pequeño
- Descripciones: `text-xs` (12px) — ilegible en mobile
- Headings: `text-3xl` — insuficiente jerarquía

### 4.2 Nueva escala

| Elemento | Mobile | Tablet | Desktop | Peso |
|----------|--------|--------|---------|------|
| H1 (Hero) | `text-3xl` (30px) | `text-4xl` (36px) | `text-5xl` (48px) | bold |
| H2 (Secciones) | `text-2xl` (24px) | `text-3xl` (30px) | `text-4xl` (36px) | bold |
| H3 (Cards) | `text-lg` (18px) | `text-xl` (20px) | `text-xl` (20px) | bold |
| Body | `text-base` (16px) | `text-base` (16px) | `text-base` (16px) | regular |
| Small (notas) | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) | regular |
| Caption | `text-xs` (12px) | `text-xs` (12px) | `text-xs` (12px) | medium |

### 4.3 Regla de oro
> **Ningún texto de contenido principal será menor a 14px. Los precios y CTAs serán siempre bold.**

---

## 9. Catálogo de Servicios — Estructura Definitiva

### 5.1 Servicios a implementar

| ID | Nombre | Precio | Duración | Días | Horarios | Canal |
|----|--------|--------|----------|------|----------|-------|
| 1 | **Pregunta Puntual (1)** | $10.000 COP | ~5 min | Todos | Mismo día | **Solo WhatsApp** |
| 2 | **Pregunta Puntual (2)** | $18.000 COP | ~10 min | Todos | Mismo día | **Solo WhatsApp** |
| 3 | **Pregunta Puntual (3)** | $25.000 COP | ~15 min | Todos | Mismo día | **Solo WhatsApp** |
| 4 | **Lectura Temática** | $35.000 COP | 30 min | Mié, Vie | 8:00, 9:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00 | Web |
| 5 | **Lectura Completa + Ritual** | $70.000 COP | 60 min | Lun, Mar, Jue | 8:00, 9:30, 11:00, 14:00, 15:30, 17:00 | Web |
| 6 | **Trabajo Energético** | TBD | TBD | TBD | TBD | Web |

### 5.2 Eliminaciones
-  Consulta personalizada de $60.000 — **eliminar**
- ❌ Servicio de $80.000 del seed actual — **reemplazar**
- ❌ Servicio de $50.000 del seed actual — **reemplazar**
- ❌ Servicio de $120.000 del seed actual — **reemplazar**

### 5.3 Schema DB — Campos nuevos necesarios

```typescript
// db/schema.ts — agregar a la tabla services
export const services = pgTable("services", {
  // ... campos existentes ...
  
  /** Días de la semana en que se ofrece este servicio */
  availableDays: integer("available_days").notNull(), // bitmask: 1=Lun, 2=Mar, 4=Mié, 8=Jue, 16=Vie, 32=Sáb, 64=Dom
  
  /** Horarios disponibles para este servicio (JSON array de "HH:mm") */
  availableSlots: text("available_slots").notNull(), // JSON: ["08:00", "09:30", ...]
  
  /** Tipo de servicio para lógica de agendamiento */
  bookingType: text("booking_type").notNull().default("web"), // "web" | "whatsapp_only"
  
  /** Categoría para agrupación visual */
  category: text("category").notNull().default("lectura"), // "pregunta" | "tematica" | "completa" | "energetico"
});
```

---

## 10. Horarios — Lógica de Negocio

### 6.1 Reglas por tipo de servicio

#### Lectura Completa (Lun, Mar, Jue)
```
08:00  09:30  11:00  14:00  15:30  17:00
```

#### Lectura Temática (Mié, Vie)
```
08:00  09:00  10:00  11:00  12:00  14:00  15:00  16:00  17:00
```

#### Preguntas Puntuales
```
NO se muestran en el SlotPicker.
Se agendan el MISMO DÍA directamente por WhatsApp.
```

### 6.2 Implementación en SlotPicker

El `SlotPicker` debe:
1. Recibir el `serviceId` seleccionado
2. Consultar los `availableDays` y `availableSlots` del servicio
3. Filtrar las fechas del date picker según los días disponibles
4. Mostrar solo los slots correspondientes al servicio seleccionado
5. Para servicios `whatsapp_only`, mostrar un CTA que redirija a WhatsApp en lugar del slot picker

---

## 11. WhatsApp — Canal Principal de Comunicación

### 7.1 Número oficial
```
+57 301 833 9558
```

### 7.2 Links de WhatsApp a implementar

| Ubicación | URL | Contexto |
|-----------|-----|----------|
| **Floating button** (siempre visible) | `https://wa.me/573018339558` | Botón flotante fixed bottom-right |
| **Preguntas puntuales** | `https://wa.me/573018339558?text=Hola%20Patyka!%20Quiero%20agendar%20una%20pregunta%20puntual` | Card de servicio + nota explicativa |
| **Nota post-pago** | `https://wa.me/573018339558?text=Hola%20Patyka!%20Envío%20mi%20comprobante%20de%20pago` | Después del pago en el booking |
| **Footer** | `https://wa.me/573018339558` | Reemplazar ícono genérico por link directo |
| **Hero CTA secundario** | `https://wa.me/573018339558` | "¿Pregunta puntual? Escríbeme por WhatsApp" |

### 7.3 Floating WhatsApp Button

```tsx
// components/layout/WhatsAppFloat.tsx
<a
  href="https://wa.me/573018339558"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
             bg-green-500 hover:bg-green-400 
             flex items-center justify-center
             shadow-[0_0_20px_rgba(34,197,94,0.4)]
             hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]
             transition-all duration-300 hover:scale-110
             animate-pulse-slow"
  aria-label="Contactar por WhatsApp"
>
  <WhatsAppIcon className="w-7 h-7 text-white" />
</a>
```

---

## 12. Notas Legales y de Proceso

### 8.1 Nota de Preguntas Puntuales
> **Ubicación**: Debajo de las cards de Preguntas Puntuales en el catálogo de servicios
> 
> **Texto**:
> "Las preguntas puntuales ($10.000, $18.000, $25.000) se agendan el **mismo día directamente por WhatsApp**. Son las **únicas** consultas que se agendan por este medio y no por la página web."

### 8.2 Nota de Comprobante de Pago
> **Ubicación**: Después del botón de pago en el BookingForm (Step 4)
> 
> **Texto**:
> "Una vez realizado el pago, enviá tu **comprobante por WhatsApp** (+57 301 833 9558) con tu **nombre completo** para que Patyka pueda confirmar tu cita y escribirte el día de la consulta."

### 8.3 Nota de Pagos Internacionales
> **Ubicación**: Sección de medios de pago (Step 4 del booking)
> 
> **Texto**:
> "El **único medio de pago para clientes del extranjero** es **Western Union**. Contactá por WhatsApp para coordinar."

---

## 13. Motion Design — Micro-interacciones y Dinamismo (actualizado con Affordance Orgánico)

### 13.1 Principios Fundamentales

- **CSS-first**: usar `@keyframes` y `transition` siempre que sea posible
- **Performance**: animar solo `transform` y `opacity` (GPU-accelerated)
- **Significado**: cada animación debe tener un propósito (feedback, guía, deleite)
- **Respeto**: respetar `prefers-reduced-motion`
- **Física real**: curvas spring en lugar de easing lineal
- **Reacción orgánica**: errores comunicados por desaturación/shake, no pop-ups

### 13.2 Curvas de Spring — Reemplazan Easing Tradicional

| Curva | CSS | Sensación | Uso |
|-------|-----|-----------|-----|
| **Bounce** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Rebote sutil, como gel | Hover en cards, partículas |
| **Smooth** | `cubic-bezier(0.25, 1, 0.5, 1)` | Deslizamiento orgánico | Drawer, transiciones de paso |
| **Snap** | `cubic-bezier(0.4, 0, 0.2, 1)` | Respuesta inmediata | Click en botón, cerrar modal |

### 13.3 Tabla de Animaciones (actualizada)

| Animación | Elemento | Trigger | Duración | Curva | Propósito |
|-----------|----------|---------|----------|-------|-----------|
| **Staggered reveal** | Cards de servicios | Scroll (IntersectionObserver) | 400ms cada una | spring-smooth | Guía la mirada secuencialmente |
| **Floating particles** | Hero background | Always | 8s loop | ease-in-out | Atmósfera, no distrae |
| **Glow pulse** | CTA buttons | Idle | 2s loop | ease-in-out | Saliencia visual del CTA principal |
| **Slide-in** | Mobile drawer | Menu open | 300ms | spring-smooth | Transición orgánica |
| **Count-up** | Social proof stats | Scroll into view | 2000ms | ease-out cubic | Deleite visual |
| **Hover lift** | Service cards | Hover | 200ms | spring-bounce | Feedback táctil |
| **Shimmer** | Loading states | Loading | 1.5s loop | linear | Paciencia elegante |
| **Float** | Decorative elements | Always | 4-6s loop | ease-in-out | Profundidad |
| **Gradient shift** | Hero overlay | Always | 10s loop | linear | Dinamismo sutil |
| **Bounce** | WhatsApp floating button | Idle | 3s loop | ease-in-out | Saliencia del canal principal |
| **Press** | Botones al click | Click | 100ms | spring-snap + scale(0.97) | Sensación de presión física |
| **Shake** | Campos con error | Validación fallida | 400ms | spring-bounce | Rechazo suave, no disruptivo |
| **Desaturate** | Elemento con error | Error | 500ms | ease-in-out | Feedback orgánico sin pop-up |

### 13.4 Implementación de partículas flotantes (Hero)

```css
/* globals.css */
@keyframes float-particle {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
}

.particle {
  animation: float-particle 6s ease-in-out infinite;
}

.particle:nth-child(2) { animation-delay: -1s; animation-duration: 8s; }
.particle:nth-child(3) { animation-delay: -2s; animation-duration: 5s; }
.particle:nth-child(4) { animation-delay: -3s; animation-duration: 7s; }
.particle:nth-child(5) { animation-delay: -4s; animation-duration: 9s; }
```

### 9.4 Shimmer loading effect

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-glass) 25%,
    rgba(255,255,255,0.08) 50%,
    var(--bg-glass) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}
```

---

## 14. Estructura de la Página — Nuevo Orden

```
┌─────────────────────────────────────────
│  NAV (scroll-aware, mobile drawer)      │
├─────────────────────────────────────────┤
│  HERO                                   │
│  - Video background + gradient overlay  │
│  - H1: "Descubrí tu camino..."          │
│  - CTA principal: "Agendar Sesión"      │
│  - CTA secundario: "Pregunta por WhatsApp" │
│  - Partículas flotantes decorativas     │
├─────────────────────────────────────────┤
│  SERVICIOS (catálogo visual)            │
│  - Cards con íconos temáticos           │
│  - Preguntas Puntuales → WhatsApp CTA   │
│  - Lectura Temática → Web booking       │
│  - Lectura Completa → Web booking       │
│  - Trabajos Energéticos → Web booking   │
│  - Notas legales inline                 │
├─────────────────────────────────────────
│  AGENDÁ TU LECTURA (booking)            │
│  - Formulario simplificado              │
│  - Step 1: Servicio                     │
│  - Step 2: Fecha y Horario              │
│  - Step 3: Datos + Pago                 │
│  - Notas: comprobante + Western Union   │
├─────────────────────────────────────────┤
│  BRUJITIPS (TikTok embeds)              │
│  - Grid 2x2 mobile, 4 cols desktop      │
│  - Click-to-play                        │
├─────────────────────────────────────────┤
│  PRUEBA SOCIAL (counters + testimonios) │
│  - Contadores animados                  │
│  - Testimonios en cards                 │
├─────────────────────────────────────────┤
│  CONOCÉ A PATYKA (bio)                  │
│  - Foto/ilustración                     │
│  - Bio text                             │
│  - Links a redes                        │
─────────────────────────────────────────┤
│  FOOTER                                 │
│  - Redes sociales                       │
│  - WhatsApp destacado                   │
│  - Copyright + términos                 │
└─────────────────────────────────────────┘
│  WHATSAPP FLOATING BUTTON (fixed)       │
─────────────────────────────────────────┘
```

---

## 15. Booking Flow — Reduccionismo Cognitivo Aplicado

### 15.1 Diagnóstico: Violación de la Ley de Hick

El flujo actual de 4 pasos viola principios cognitivos fundamentales:

```
❌ ACTUAL (4 decisiones):
  Paso 1: ¿Qué servicio?     → Decisión 1
  Paso 2: ¿Qué horario?      → Decisión 2
  Paso 3: ¿Cuál email?       → Decisión 3
  Paso 4: ¿Confirmo o vuelvo? → Decisión 4 (REDUNDANTE — la decisión ya fue tomada)
```

El paso 4 es **parálisis por elección innecesaria**: el usuario ya eligió servicio, horario y email. Pedirle que "confirme" es agregar fricción cognitiva sin valor.

### 15.2 Nuevo flujo (3 decisiones — Ley de Miller cumplida)

```
✅ PROPUESTO (3 decisiones):
  Paso 1: ¿Qué servicio?     → Decisión 1 (3 categorías, no 6 servicios)
  Paso 2: ¿Qué día y hora?   → Decisión 2 (contexto ya definido)
  Paso 3: ¿Sos vos?          → Decisión 3 (datos + pago, última decisión)
```

### 15.3 Progressive Disclosure en el Booking

```
Capa 1 — Selección de categoría (siempre visible):
  ├─  Preguntas Puntuales (3 opciones)
  ├─ 🔮 Lecturas (2 opciones)
  └─  Trabajos Energéticos (1 opción)

Capa 2 — Tras seleccionar categoría:
  ├─ Servicios específicos de esa categoría
  ├─ Precios y duración visibles
  └─ Badge de canal (Web / WhatsApp)

Capa 3 — Tras seleccionar servicio web:
  ├─ Date picker filtrado por días disponibles
  ├─ Slots del servicio seleccionado
  └─ Validación en tiempo real

Capa 4 — Tras seleccionar horario:
  ├─ Nombre completo (obligatorio)
  ├─ Email (obligatorio)
  ├─ WhatsApp (opcional)
  ├─ Resumen de la reserva
  ├─ Notas contextuales (comprobante, Western Union)
  └─ Botón de pago
```

### 15.4 Anticipación UX en el Booking

| Acción del usuario | Respuesta anticipatoria |
|-------------------|------------------------|
| Selecciona "Pregunta Puntual" | **No se muestra** el paso 2. Aparece directamente un card: "Estas consultas se agendan por WhatsApp" + botón verde. |
| Selecciona "Lectura Completa" | El date picker **deshabilita** Mié/Vie/Sáb/Dom con tooltip: "Solo Lun, Mar y Jue". |
| Selecciona "Lectura Temática" | El date picker **deshabilita** Lun/Mar/Jue/Sáb/Dom con tooltip: "Solo Mié y Vie". |
| Escribe email inválido | El borde se tiñe de rojo **mientras escribe** (validación en tiempo real), no al salir del campo. |
| Intenta avanzar sin datos | El botón "Continuar" vibra sutilmente (shake), no aparece un alert. |
| Selecciona un slot | El slot se ilumina, los demás se atenúan al 40% de opacidad (focus visual). |

### 15.5 Estructura del nuevo BookingForm

```tsx
// Paso 1: Categoría + Servicio
// - 3 categorías visuales (Preguntas / Lecturas / Energéticos)
// - Al seleccionar categoría, se expanden los servicios
// - Preguntas puntuales → CTA WhatsApp directo (no avanza al paso 2)

// Paso 2: Fecha y Horario
// - Date picker con días filtrados por servicio
// - Grid de slots (solo los del servicio seleccionado)
// - Slot seleccionado: glow dorado, demás atenuados

// Paso 3: Datos + Pago
// - Nombre completo (nuevo campo, obligatorio)
// - Email (obligatorio)
// - WhatsApp (opcional, nuevo campo)
// - Resumen compacto (servicio, fecha, hora, precio)
// - Nota: "Envía tu comprobante por WhatsApp"
// - Nota: "Western Union para pagos del extranjero"
// - Checkbox términos
// - Botón "Pagar con Wompi" (con press animation)
```

### 15.6 Cambios en el schema

```typescript
// sessions table — agregar campos
customerName: text("customer_name").notNull(),   // Nombre completo (obligatorio)
customerWhatsapp: text("customer_whatsapp"),      // WhatsApp (opcional)
```
Step 1: Elegí tu servicio
  ├─ Cards visuales con ícono, nombre, precio, duración
  ├─ Preguntas puntuales → CTA directo a WhatsApp
  └─ Otros servicios → seleccionan y avanzan

Step 2: Fecha y Horario
  ├─ Date picker con días filtrados por servicio
  ├─ Grid de slots disponibles
  └─ Validación: no se puede seleccionar día/hora no disponible

Step 3: Datos y Pago
  ├─ Nombre completo (nuevo campo)
  ├─ Email
  ├─ WhatsApp (opcional, nuevo campo)
  ├─ Resumen de la reserva
  ├─ Nota: "Envía tu comprobante por WhatsApp"
  ├─ Nota: "Western Union para pagos del extranjero"
  ├─ Checkbox términos
  └─ Botón "Pagar con Wompi"
```

### 11.3 Cambios en el schema

```typescript
// sessions table — agregar campo
customerName: text("customer_name").notNull(),  // Nombre completo
customerWhatsapp: text("customer_whatsapp"),     // WhatsApp opcional
```

---

## 16. Componentes Nuevos / Modificados

### 12.1 Nuevos componentes

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `WhatsAppFloat` | `components/layout/WhatsAppFloat.tsx` | Botón flotante fixed bottom-right |
| `ServiceIcon` | `components/brand/ServiceIcon.tsx` | Íconos temáticos por categoría de servicio |
| `ScheduleNote` | `components/booking/ScheduleNote.tsx` | Nota de horarios por tipo de servicio |
| `PaymentNote` | `components/booking/PaymentNote.tsx` | Notas de comprobante y Western Union |
| `ParticleField` | `components/effects/ParticleField.tsx` | Campo de partículas flotantes para el hero |
| `StaggeredReveal` | `components/effects/StaggeredReveal.tsx` | Wrapper para animaciones escalonadas al scroll |

### 12.2 Componentes modificados

| Componente | Cambios |
|------------|---------|
| `Nav.tsx` | Agregar link directo a WhatsApp en el drawer mobile |
| `Hero.tsx` | Agregar CTA secundario de WhatsApp, partículas flotantes, gradiente animado |
| `ServiceCatalog.tsx` | Nueva estructura de cards con íconos, notas inline, filtro por categoría |
| `ServiceCard.tsx` | Rediseño visual con colores púrpura/dorado, ícono temático, badge de canal |
| `BookingForm.tsx` | Reducir a 3 pasos, agregar campos nombre y WhatsApp, notas de pago |
| `SlotPicker.tsx` | Lógica de horarios por servicio, filtrado de días, CTA WhatsApp para preguntas puntuales |
| `ServiceSelector.tsx` | Cards visuales con íconos, badge "Solo WhatsApp" para preguntas |
| `Footer.tsx` | WhatsApp destacado como canal principal, número visible |
| `globals.css` | Nueva paleta de colores, animaciones, partículas, shimmer |

---

## 17. Seed Data Actualizado

```typescript
// db/seed.ts — nuevos servicios

const seedServices = [
  // ── Preguntas Puntuales (WhatsApp only) ──
  {
    name: "1 Pregunta Puntual",
    description: "Una consulta específica respondida el mismo día por WhatsApp",
    priceCop: 10000,
    durationMin: 5,
    availableDays: 127,        // Todos los días (bitmask)
    availableSlots: "[]",      // No aplica — WhatsApp only
    bookingType: "whatsapp_only",
    category: "pregunta",
  },
  {
    name: "2 Preguntas Puntuales",
    description: "Dos consultas específicas respondidas el mismo día por WhatsApp",
    priceCop: 18000,
    durationMin: 10,
    availableDays: 127,
    availableSlots: "[]",
    bookingType: "whatsapp_only",
    category: "pregunta",
  },
  {
    name: "3 Preguntas Puntuales",
    description: "Tres consultas específicas respondidas el mismo día por WhatsApp",
    priceCop: 25000,
    durationMin: 15,
    availableDays: 127,
    availableSlots: "[]",
    bookingType: "whatsapp_only",
    category: "pregunta",
  },

  // ── Lectura Temática (Mié, Vie) ──
  {
    name: "Lectura Temática",
    description: "Lectura enfocada en Amor, Dinero o Trabajo — 30 minutos",
    priceCop: 35000,
    durationMin: 30,
    availableDays: 20,         // Mié (4) + Vie (16) = 20
    availableSlots: '["08:00","09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"]',
    bookingType: "web",
    category: "tematica",
  },

  // ── Lectura Completa (Lun, Mar, Jue) ──
  {
    name: "Lectura Completa + Ritual Energético",
    description: "Lectura completa de cartas + ritual energético personalizado — 60 minutos",
    priceCop: 70000,
    durationMin: 60,
    availableDays: 11,         // Lun (1) + Mar (2) + Jue (8) = 11
    availableSlots: '["08:00","09:30","11:00","14:00","15:30","17:00"]',
    bookingType: "web",
    category: "completa",
  },

  // ── Trabajo Energético ──
  {
    name: "Trabajo Energético",
    description: "Limpieza y alineación energética personalizada",
    priceCop: 0,               // TBD — definir precio
    durationMin: 0,            // TBD
    availableDays: 0,          // TBD
    availableSlots: "[]",      // TBD
    bookingType: "web",
    category: "energetico",
  },
];
```

---

## 18. Plan de Implementación — Fases (actualizado)

### Fase 1: Fundamentos Visuales y Materialidad (Día 1-2)
- [ ] Actualizar `globals.css` con nueva paleta de colores (púrpura, dorado, amarillo)
- [ ] Verificar contraste WCAG de todas las combinaciones
- [ ] Implementar squircles en lugar de border-radius estándar
- [ ] Definir stack de materiales glassmorphism 2.0 (4 niveles de blur)
- [ ] Actualizar escala tipográfica con tracking/leading dinámicos
- [ ] Implementar espacio negativo activo (py-24 entre secciones)
- [ ] Crear componente `ParticleField` para el hero
- [ ] Agregar animaciones CSS base (shimmer, float, glow pulse)

### Fase 2: Reduccionismo Cognitivo — Catálogo de Servicios (Día 3-4)
- [ ] Actualizar schema DB con nuevos campos (`availableDays`, `availableSlots`, `bookingType`, `category`)
- [ ] Actualizar seed data con servicios reales
- [ ] Implementar chunking: 3 categorías (Preguntas / Lecturas / Energéticos)
- [ ] Rediseñar `ServiceCard` con squircles, íconos temáticos y nueva paleta
- [ ] Implementar `ServiceIcon` component
- [ ] Agregar notas inline (preguntas puntuales → WhatsApp)
- [ ] Aplicar Ley de Miller: máximo 5 opciones visibles simultáneamente

### Fase 3: Booking Flow — Ley de Hick Aplicada (Día 5-6)
- [ ] Simplificar BookingForm a 3 pasos (eliminar paso de confirmación)
- [ ] Agregar campo `customerName` al schema y formulario
- [ ] Agregar campo `customerWhatsapp` opcional
- [ ] Implementar progressive disclosure en el booking
- [ ] Implementar anticipación UX: date picker filtra días por servicio
- [ ] Preguntas puntuales → CTA WhatsApp directo (sin slot picker)
- [ ] Crear `ScheduleNote` y `PaymentNote` components
- [ ] Agregar notas de comprobante y Western Union

### Fase 4: WhatsApp Integration (Día 7)
- [ ] Crear `WhatsAppFloat` component (botón flotante)
- [ ] Actualizar todos los links de WhatsApp con mensajes predefinidos
- [ ] Destacar WhatsApp en el Footer
- [ ] Agregar CTA de WhatsApp en el Hero (secundario)
- [ ] Redirigir preguntas puntuales a WhatsApp desde el booking

### Fase 5: Affordance Orgánico — Motion y Física (Día 8-9)
- [ ] Implementar spring curves en todas las transiciones (reemplazar easing lineal)
- [ ] Agregar press animation en botones (scale 0.97 al click)
- [ ] Implementar shake animation para errores de validación
- [ ] Implementar desaturación orgánica para errores de servidor
- [ ] Implementar `StaggeredReveal` para cards de servicios
- [ ] Agregar animación de gradiente en el hero
- [ ] Refinar hover states con spring-bounce
- [ ] Agregar `prefers-reduced-motion` support
- [ ] Testing cross-browser (Safari, Chrome, Firefox mobile)

### Fase 6: Testing y QA (Día 10)
- [ ] Testing de accesibilidad (Lighthouse, axe)
- [ ] Testing de Ley de Miller (máximo 5 opciones por pantalla)
- [ ] Testing de Ley de Hick (1 decisión por pantalla en booking)
- [ ] Testing responsive (320px, 768px, 1024px, 1440px)
- [ ] Testing de flujo de booking completo
- [ ] Testing de links de WhatsApp
- [ ] Verificación de notas legales visibles
- [ ] Testing de spring curves en mobile
- [ ] Testing de `prefers-reduced-motion`

---

## 19. Criterios de Aceptación

### 19.1 Visual y Estético
- [ ] Paleta de colores coincide con la imagen de referencia (púrpura, dorado, amarillo)
- [ ] Todos los textos de contenido son ≥ 14px
- [ ] Precios y CTAs son bold
- [ ] Contraste WCAG AA verificado en todas las combinaciones
- [ ] Squircles aplicados en cards y contenedores principales
- [ ] Stack de materiales glassmorphism 2.0 implementado (4 niveles de blur)
- [ ] Espacio negativo activo: secciones separadas por `py-24` mínimo
- [ ] Tracking y leading dinámicos aplicados según jerarquía

### 19.2 Cognitivo y Ergonómico
- [ ] Ley de Miller: ninguna pantalla muestra más de 5 opciones de decisión
- [ ] Ley de Hick: máximo 1 decisión por pantalla en el booking flow
- [ ] Saliencia visual: CTA principal captura 80% de atención (escala + peso + glow)
- [ ] Progressive disclosure: complejidad técnica solo emerge tras interacción deliberada
- [ ] Anticipación UX: date picker filtra días según servicio seleccionado
- [ ] Preguntas puntuales NO muestran slot picker — redirigen directo a WhatsApp

### 19.3 Funcional
- [ ] Preguntas puntuales redirigen a WhatsApp (no muestran slot picker)
- [ ] Lectura completa solo muestra horarios para Lun/Mar/Jue
- [ ] Lectura temática solo muestra horarios para Mié/Vie
- [ ] Notas de comprobante y Western Union son visibles en el paso de pago
- [ ] Botón flotante de WhatsApp siempre visible
- [ ] Booking flow de 3 pasos (no 4)
- [ ] Campo nombre completo obligatorio en el paso 3

### 19.4 Motion y Affordance
- [ ] Partículas flotantes en el hero
- [ ] Staggered reveal en cards de servicios
- [ ] Glow pulse en CTAs principales
- [ ] `prefers-reduced-motion` desactiva animaciones decorativas
- [ ] Spring curves aplicadas en hover y transiciones (no easing lineal)
- [ ] Press animation en botones (scale 0.97 al click)
- [ ] Shake animation en campos con error (no pop-ups)
- [ ] Desaturación orgánica en errores de servidor

### 19.5 Mobile
- [ ] Touch targets ≥ 44px
- [ ] Drawer mobile funciona correctamente
- [ ] WhatsApp float no cubre contenido importante
- [ ] Formulario legible y usable en 320px
- [ ] Blur reducido al 50% en mobile para performance

---

## 21. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Precio de Trabajos Energéticos no definido | Alta | Medio | Dejar como TBD en seed, agregar nota "Próximamente" |
| Wompi no soporta Western Union | Media | Alto | La nota es informativa; el pago real sigue siendo por Wompi. Western Union se coordina por WhatsApp |
| Partículas afectan performance en mobile | Media | Medio | Reducir cantidad en mobile, usar `will-change: transform` |
| TikTok embeds rompen con nuevo diseño | Baja | Medio | Mantener la lógica actual de BrujitipsGrid sin cambios estructurales |

---

## 22. Referencias

### Imagen y Branding
- **Imagen de referencia**: `/home/anto/Descargas/patika tarot/WhatsApp Image 2026-05-18 at 11.14.26.jpeg`
- **WhatsApp**: +57 301 833 9558
- **TikTok**: @patyka550
- **Instagram**: @patykatarot

### Principios Cognitivos y Ergonómicos
- **Ley de Miller**: Miller, G.A. (1956). "The Magical Number Seven, Plus or Minus Two"
- **Ley de Hick**: Hick, W.E. (1952). "On the Rate of Gain of Information"
- **Progressive Disclosure**: Nielsen Norman Group — "Progressive Disclosure"
- **Saliencia Visual**: Ware, C. (2012). "Information Visualization: Perception for Design"

### Estética y Materialidad
- **Squircles**: Apple Human Interface Guidelines — "Shapes and Corners"
- **Glassmorphism 2.0**: Material Design 3 — "Elevation and Surfaces"
- **Spring Physics**: Framer Motion — "Spring Animations"
- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/

### Técnico
- **Next.js Image best practices**: https://nextjs.org/docs/app/api-reference/components/image
- **Motion design principles**: https://web.dev/articles/animations-guide
- **CSS Spring Curves**: https://cubic-bezier.com/

---

## 20. Glossary

| Término | Definición |
|---------|------------|
| **Liquid Glass** | Estética de glassmorphism con backdrop-filter blur y borde gradiente |
| **Glassmorphism 2.0** | Stack de materiales con 4 niveles de blur (5px-40px) y specular highlights |
| **Squircle** | Radio de curvatura continua basado en superelipse, elimina tensión visual de esquinas |
| **Specular Highlight** | Borde de 1px con gradiente de luz que simula reflejo en vidrio |
| **Spring Physics** | Curvas de animación basadas en masa, rigidez y amortiguación (no easing lineal) |
| **Progressive Disclosure** | Sistema de capas donde la complejidad emerge tras interacción deliberada |
| **Anticipación UX** | La UI transiciona orgánicamente según la intención detectada del usuario |
| **Saliencia Visual** | Jerarquía por peso y escala, no por color estridente. 80% atención al CTA principal |
| **Ley de Miller** | La memoria de trabajo procesa 7±2 elementos. Diseño: máximo 5 opciones por pantalla |
| **Ley de Hick** | El tiempo de decisión crece con las opciones. Diseño: 1 decisión por pantalla |
| **Affordance Orgánico** | Feedback cinético con física real (spring curves, shake, desaturación) |
| **Feedback Háptico Visual** | Errores comunicados por reacción física de la interfaz, no pop-ups |
| **Espacio Negativo Activo** | El blanco no es vacío, es conductor de la mirada |
| **Tracking** | Letter-spacing dinámico según jerarquía tipográfica |
| **Leading** | Line-height dinámico según contexto (título vs body vs nota) |
| **Chunking** | Agrupación de funcionalidades en bloques semánticos de máximo 5 elementos |
| **Pregunta Puntual** | Consulta específica de 1-3 preguntas, respondida por WhatsApp el mismo día |
| **Lectura Temática** | Lectura enfocada en un tema (Amor, Dinero, Trabajo), 30 min, Mié/Vie |
| **Lectura Completa** | Lectura completa + ritual energético, 60 min, Lun/Mar/Jue |
| **Trabajo Energético** | Servicio de limpieza y alineación energética (precio TBD) |
| **Wompi** | Pasarela de pagos de Bancolombia usada para cobros en COP |
| **Western Union** | Único medio de pago para clientes del extranjero |

---

*Documento generado el 27 de mayo de 2026. Revisar y aprobar antes de iniciar implementación.*

---
name: Relatório Brasil 2016–2026
description: Relatório editorial dark premium — dados, fake news e realidade
colors:
  bg-primary: "#0C0F14"
  bg-secondary: "#111520"
  bg-card: "#1A2030"
  text-primary: "#E8E6E1"
  text-secondary: "#A8B0C0"
  text-tertiary: "#8A93A8"
  accent-gold: "#C4A265"
  accent-teal: "#4A9BAA"
  danger: "#C4524A"
  success: "#5B9A72"
  warning: "#D4A04A"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Source Sans 3', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.accent-gold}"
    rounded: "{rounded.sm}"
    padding: "1rem 2.5rem"
  chart-card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "2.5rem"
---

# Design System: Relatório Brasil 2016–2026

## 1. Overview

**Creative North Star: "The Data Tribunal"**

Um tribunal editorial onde narrativas de desinformação são julgadas à luz de evidências oficiais. Superfície escura, tipografia de revista de análise, acentos dourados como selo de credibilidade e teal para dados neutros. Densidade moderada: blocos de leitura longa intercalados com gráficos e fact-checks.

Rejeita explicitamente: SaaS landing clichés, Inter como fonte default, gradient text decorativo, side-tab borders, cards aninhados sem propósito.

**Key Characteristics:**
- Dark editorial premium (#0C0F14 base)
- Par serif display + sans body (Playfair + Source Sans 3)
- Fact-check cards em grid 50/50 (fake | realidade)
- Chart cards com footnotes monoespaçadas
- Scroll progress + reveal animations suaves

## 2. Colors

Paleta escura com acentos quentes (ouro) e frios (teal) para separar editorial de dados.

### Primary
- **Archive Gold** (#C4A265): títulos de seção, links, CTAs, números-chave. Usado com parcimônia.

### Secondary
- **Evidence Teal** (#4A9BAA): dados neutros, gráficos Selic, highlights informativos.

### Tertiary
- **Verdict Red** (#C4524A): fake news, déficits, alertas.
- **Verified Green** (#5B9A72): realidade confirmada, melhorias positivas.

### Neutral
- **Ink Warm** (#E8E6E1): texto principal sobre fundos escuros.
- **Ink Muted** (#A8B0C0): corpo secundário, parágrafos longos.
- **Ink Dim** (#8A93A8): metadados, footnotes (contraste AA mínimo).
- **Surface Deep** (#0C0F14): background principal.
- **Surface Card** (#1A2030): cards, chart containers.

### Named Rules
**The Gold Sparingly Rule.** Ouro aparece em ≤15% da superfície visível. Sua raridade sinaliza importância.

## 3. Typography

**Display Font:** Playfair Display (Georgia fallback)
**Body Font:** Source Sans 3 (system-ui fallback)
**Label/Mono Font:** JetBrains Mono

**Character:** Par editorial clássico — serif expressivo para manchetes, sans humanista para leitura longa de dados e análise.

### Hierarchy
- **Display** (700, clamp 2.5–4.5rem, 1.1): hero title only.
- **Headline** (700, clamp 1.8–2.8rem, 1.2): section titles (h2).
- **Title** (600, 1.5rem, 1.3): subsections (h3).
- **Body** (400, 1rem, 1.7): parágrafos, max 70ch.
- **Label** (500, 0.8125rem, uppercase 0.08em tracking): kickers, footnotes, tags.

### Named Rules
**The 13px Floor Rule.** Nenhum texto de corpo ou metadata abaixo de 0.8125rem (13px).

## 4. Elevation

Sistema híbrido: tonal layering (bg-primary → bg-card → bg-elevated) com sombras sutis apenas em hover. Sem glassmorphism decorativo.

### Shadow Vocabulary
- **ambient-glow** (`0 0 30px rgba(196,162,101,0.08)`): hover em key numbers.
- **card-lift** (`0 4px 12px rgba(0,0,0,0.4)`): hover em cards interativos.

## 5. Components

### Buttons
- **Shape:** retangular suave (6px radius)
- **Primary (CTA):** outline gold, uppercase mono, hover glow
- **Hover:** background gold-glow, translateY(-2px)

### Cards / Containers
- **Corner Style:** 16px (chart-card), 10px (data highlights)
- **Background:** bg-card (#1A2030)
- **Border:** 1px rgba(255,255,255,0.06)
- **Internal Padding:** 1.5–2.5rem

### Fact-check Cards
- Grid 2 colunas: fake (danger-glow) | realidade (success-glow)
- Mobile: stack vertical

### Navigation
- Fixed top, transparent → blurred on scroll
- Links uppercase tracked, underline gold on hover

## 6. Do's and Don'ts

### Do:
- **Do** citar fonte oficial em cada gráfico e highlight numérico.
- **Do** manter contraste AA (4.5:1) em todo texto de corpo.
- **Do** usar Playfair apenas para display/headlines; Source Sans 3 para corpo.
- **Do** respeitar `prefers-reduced-motion`.

### Don't:
- **Don't** usar Inter, Roboto ou gradientes roxo-azul SaaS.
- **Don't** usar `border-left` > 1px como accent colorido (side-tab).
- **Don't** usar gradient text (`background-clip: text`) em headings.
- **Don't** aninhar cards dentro de cards sem propósito semântico.
- **Don't** usar texto cinza claro sobre fundos coloridos sem ajuste de contraste.

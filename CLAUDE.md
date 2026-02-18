# CLAUDE.md — Estado del Proyecto

## Última actualización
2026-02-17

## Stack (adaptado a Next.js)
- **Framework**: Next.js 16 App Router (no Vite/React Router como el prompt original)
- **Lenguaje**: TypeScript (el proyecto ya lo tenía configurado)
- **Estilos**: Tailwind CSS v4 (config via `@theme` en CSS, sin tailwind.config.js)
- **DB / Auth**: Supabase (ya conectado via MCP, schema aplicado)
- **Estado**: Zustand
- **Animaciones**: Framer Motion
- **Gráficas**: Recharts
- **Íconos**: Lucide React
- **Toasts**: React Hot Toast

## Fases completadas
- [x] Fase 1: Scaffold + dependencias (Next.js 16 ya existía)
- [x] Fase 2: Schema SQL + Supabase client + .env.local + design system CSS
- [x] Fase 3: Auth (authStore, Login page, AuthGuard)
- [x] Fase 4: Design system (GlassCard, MetricWidget, AnimatedNumber, CurrencyInput, ProductSearch, BottomSheet, FAB, StatusBadge, ConfirmDialog, EmptyState, Header, MobileNav)
- [x] Fase 5: Layout + navegación mobile (App Router route group `(app)/`)
- [x] Fase 6: Dashboard (métricas, sparkline 7 días, alertas stock bajo)
- [x] Fase 7: Inventario (CRUD completo, ajuste de stock, búsqueda)
- [x] Fase 8: Ventas (Flujo A: venta rápida + Flujo B: cierre del día)
- [x] Fase 9: Caja (movimientos, balance, filtros por periodo)
- [x] Fase 10: Reportes (métricas, bar chart, exportar CSV)
- [ ] Fase 11: PWA completa (iconos PNG pendientes)
- [ ] Fase 12: Seed data UI prompt + README deploy
- [x] Fase 13: Workspaces + RBAC (roles admin/manager/cashier/viewer, gestión de usuarios, Settings page, edge function manage-user, Realtime kick)

## Archivos creados
```
CLAUDE.md                         ← este archivo
.env.local                        ← credenciales Supabase (no commitear)
.env.example                      ← template
supabase/schema.sql               ← DDL de referencia (ya aplicado via MCP)
public/manifest.webmanifest       ← PWA manifest
public/icons/                     ← PENDIENTE: agregar icon-192.png y icon-512.png
lib/supabase.ts                   ← cliente Supabase + types
stores/authStore.ts               ← Zustand: sesión de usuario
stores/inventoryStore.ts          ← Zustand: CRUD productos
stores/salesStore.ts              ← Zustand: ventas
stores/cashStore.ts               ← Zustand: movimientos de caja
utils/formatters.ts               ← formatCurrency, formatDate, today(), daysAgo()
utils/calculations.ts             ← margin(), profit(), stockStatus()
utils/seed.ts                     ← datos de ejemplo (llamar manualmente)
app/globals.css                   ← design system, @theme Tailwind v4
app/layout.tsx                    ← root layout (HTML, metadata, PWA meta)
app/page.tsx                      ← redirect → /dashboard
app/login/page.tsx                ← login / registro glassmorphism
app/(app)/layout.tsx              ← AuthGuard + Header + MobileNav
app/(app)/dashboard/page.tsx      ← métricas, gráfica, alertas
app/(app)/inventory/page.tsx      ← CRUD inventario, grid 2 cols
app/(app)/sales/page.tsx          ← venta rápida + cierre del día
app/(app)/cash/page.tsx           ← movimientos de caja
app/(app)/reports/page.tsx        ← reportes con bar chart + CSV export
components/layout/AuthGuard.tsx   ← protección de rutas cliente
components/layout/Header.tsx      ← header sticky con botón signOut
components/layout/MobileNav.tsx   ← bottom tab bar, 5 tabs
components/ui/GlassCard.tsx       ← contenedor base glassmorphism
components/ui/MetricWidget.tsx    ← widget de métrica con número animado
components/ui/AnimatedNumber.tsx  ← número con animación spring (RAF)
components/ui/CurrencyInput.tsx   ← input numérico con prefijo $
components/ui/ProductSearch.tsx   ← autocomplete de productos
components/ui/BottomSheet.tsx     ← sheet draggable (Framer Motion)
components/ui/FAB.tsx             ← floating action button verde
components/ui/StatusBadge.tsx     ← badge OK/Bajo/Agotado
components/ui/ConfirmDialog.tsx   ← diálogo de confirmación animado
components/ui/EmptyState.tsx      ← estado vacío con ícono
```

## Decisiones técnicas
- **Next.js App Router** en lugar de React Router (el proyecto ya usaba Next.js)
- **Route group `(app)/`** para aplicar AuthGuard + layout autenticado sin afectar la URL
- **Tailwind v4** usa `@theme {}` en CSS para definir tokens — no existe tailwind.config.js
- **Auth cliente**: `@supabase/supabase-js` puro (sin SSR) — válido para PWA mobile
- **Zustand** stores con directiva `'use client'` — todos los stores son client-only
- **TypeScript** mantenido (proyecto ya lo tenía); el prompt original pedía JS puro
- **`(app)/layout.tsx`** importa AuthGuard como server component wrapper, pero AuthGuard usa `'use client'`

## Variables de entorno
- NEXT_PUBLIC_SUPABASE_URL: ✅ configurada (.env.local)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ configurada (.env.local)

## Pendientes
- [ ] Crear iconos PNG para PWA (icon-192.png, icon-512.png en /public/icons/)
- [ ] Agregar seed data prompt en Login (BottomSheet "¿Cargar datos de ejemplo?")
- [ ] README.md con instrucciones de deploy a Vercel
- [ ] Verificar que .env.local está en .gitignore
- [ ] Considerar `next-pwa` si se quiere service worker automático

## Para continuar en nueva sesión
1. Leer este CLAUDE.md
2. Las fases 11 y 12 están pendientes
3. Ejecutar `npm run dev` para verificar el estado actual

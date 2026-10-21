# CRM completo sobre el panel /admin (2026-10-21)

El panel ya tenía: inbox de chats del bot, estado, notas, tarjeta IA, clics a WhatsApp.
Lo que lo convierte en CRM:

- [x] Migración aditiva en Neon: `source`, `email`, `zona`, `project`, `amount`,
      `follow_up_on`, `follow_up_note`, `lost_reason`, `status_changed_at` + tabla `activities`
      + estado nuevo `visita` (medición)
- [x] Alta manual de contactos (WhatsApp directo, Instagram, teléfono, local, referido)
- [x] Datos editables del contacto + monto + motivo de pérdida + eliminar
- [x] Próximo seguimiento con fecha (atajos mañana / 3 días / 1 semana)
- [x] Historial de actividad (llamada, WhatsApp, visita, presupuesto, nota; cambios de estado automáticos)
- [x] Inicio: agenda (vencidos / hoy / próximos), sin contactar, métricas del período, embudo y origen
- [x] Embudo kanban con arrastrar y soltar y suma de montos por columna
- [x] Exportar a CSV
- [x] Build de producción, preview con Playwright, deploy a prod

## Revisión

- Migración aplicada en Neon (aditiva, sin tocar datos) antes del deploy.
- Probado con Playwright contra preview + base real: alta manual, llamada que avanza el
  estado, seguimiento "Hoy", edición de datos, select de estado, filtro de seguimiento,
  Inicio, arrastre en el embudo (desktop), CSV y borrado. El contacto de prueba se borró.
- Arreglado de paso: Tailwind no escaneaba `lib/`, así que los colores de estado
  (puntos azul/violeta/verde) nunca se habían generado.
- Deploy a prod 2026-10-21 desde el working tree. **Sin commitear.**
- Pendiente: avisos de lead nuevo (Telegram/webhook sin configurar), favicon.ico 404 en todo el sitio.

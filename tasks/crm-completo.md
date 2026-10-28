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

# Acceso con cuentas individuales (2026-10-21)

Reemplaza a la contraseña única compartida (`ADMIN_PASSWORD`, ya no la lee el código).

- [x] Tablas `admin_users`, `admin_sessions`, `admin_invites`, `admin_login_failures` + `activities.user_id`
- [x] Contraseñas con scrypt (`lib/password.ts`), mínimo 10 caracteres y sin obvias
- [x] Sesiones en la base, revocables; la cookie firmada solo hace de primer filtro (`lib/session.ts`)
- [x] Alta por link de invitación de un solo uso, 48 h, token en el `#` (no queda en logs)
- [x] 2 pasos TOTP opcional por usuario, secreto cifrado con AES-GCM (`lib/totp.ts`)
- [x] Bloqueo: 5 fallos por email / 20 por IP en 15 min
- [x] Origin propio exigido en los POST; X-Frame-Options DENY, no-referrer, no-store
- [x] `/admin/usuarios` (dueño): invitar, link de restablecer, baja, cerrar sesiones, resetear 2 pasos, rol
- [x] `/admin/cuenta`: cambiar contraseña, activar 2 pasos, cerrar otras sesiones
- [x] El historial muestra quién registró cada cosa; el WhatsApp sale firmado con el nombre de quien escribe

Verificado: 21 chequeos con Playwright contra preview + base real (invitación, link reusado,
contraseña obvia, 2 pasos, baja que corta la sesión, bloqueo, Origin ajeno, permisos de rol).
TOTP contra los vectores del RFC 6238. Datos de prueba borrados.

# Login que "no anda" + empleados con sus contactos (2026-10-22)

Diagnóstico: el login no estaba roto ni duplicado. En `admin_users` había **una sola cuenta**
(Matías, sin contraseña: nunca usó su invitación) y Marcelo no tenía ninguna. Él probaba
`mcpmuebles@gmail.com` (5 intentos fallidos en la base) con la contraseña vieja compartida, que
ya no existe. Y sin ningún dueño con contraseña, nadie podía invitar a nadie desde el panel.

- [x] `npm run admin:invite -- <email> "<Nombre>" [owner|user]` (`db/invite.mjs`): crea la cuenta
      si falta y da un link de alta/restablecer sin entrar al panel. Limpia los intentos fallidos.
- [x] `conversations.assigned_to` (responsable) + actividad `asignacion` en el historial
- [x] Usuario común: ve solo sus contactos y los sin asignar; puede tomar uno sin asignar o soltar
      uno suyo. No borra contactos ni descarga el CSV.
- [x] Dueño: ve todo, asigna desde la ficha, panel "Equipo" en Inicio (abiertos, seguimientos
      para hoy, ventas y facturado por persona), columna Responsable en el CSV
- [x] Contacto cargado a mano queda a cargo de quien lo cargó; los chats de la web entran sin asignar
- [x] Filtros "Míos" y "Sin asignar"; los filtros pasan a una fila deslizable en el celular
- [x] Migración aplicada en Neon (aditiva) antes de cualquier deploy

Verificado: 29 chequeos con Playwright contra preview + base real (dueño + 2 empleados: quién ve
qué, tomar/soltar, reasignar, 404 al tocar lo ajeno, 403 al borrar/exportar, filtro Míos, panel
Equipo, CSV, sin desborde en 390 px). Contactos y usuarios de prueba borrados.
Deploy a prod 2026-10-22 desde el working tree. **Sin commitear.** Falta que Matías corra
`admin:invite` para Marcelo y para él.

# Asistente / Chatbot de MCP

Un asistente de chat integrado en la web que **engancha la conversación**,
responde **solo con la información de la página** y deriva al cliente a
**WhatsApp** con Marcelo.

## Cómo funciona

- Aparece un botón flotante **"Consultanos"** abajo a la derecha.
- Al abrirlo, saluda y muestra **preguntas frecuentes** (precios, materiales,
  tiempos, formas de pago, presupuesto). Cada una responde al instante con datos
  reales.
- El cliente también puede **escribir libremente**. Con IA activada, el
  asistente conversa de forma natural — pero **nunca inventa**: solo usa la
  información cargada en la base de conocimiento.
- Siempre tiene un botón **"Seguir por WhatsApp"** que abre el chat con Marcelo
  (con seguimiento de conversión de Google Ads, igual que el resto de la web).

## Lo único que edita Marcelo

Todo el contenido —precios, materiales, tiempos, forma de atender, preguntas
frecuentes— está en **un solo archivo**:

```
lib/asistente/knowledge-base.ts
```

Se cambia solo el texto entre comillas, se guarda y se vuelve a publicar la web.
No hace falta tocar nada más ni saber programar.

## Dos modos (funciona con o sin IA)

1. **Modo guiado (por defecto, sin costo).** Si no se configura ninguna clave,
   el asistente responde con las preguntas frecuentes de la base de
   conocimiento. Funciona 100% en la página, sin servidores ni costos.

2. **Modo IA (conversación natural).** Si se configura una clave de Anthropic
   (Claude), el asistente conversa de forma natural, siempre limitado a la
   información de la página. Se activa con estas variables (ver `.env.example`):

   ```
   ANTHROPIC_API_KEY=...        # clave de https://console.anthropic.com
   ANTHROPIC_MODEL=claude-opus-4-8   # opcional; para bajar costos: claude-haiku-4-5
   ```

   La clave se guarda **solo en el servidor** (nunca llega al navegador del
   cliente). Si el modo IA falla o no está configurado, el asistente pasa
   automáticamente al modo guiado.

## Archivos del feature

| Archivo | Qué es |
|---|---|
| `lib/asistente/knowledge-base.ts` | **El contenido editable** (lo que edita Marcelo). |
| `components/Asistente.tsx` | El widget del chat (botón + panel). |
| `app/api/chat/route.ts` | El endpoint con IA, limitado a la base de conocimiento. |

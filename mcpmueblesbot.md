# MCP Muebles Bot

Documento de contexto del piloto de bot para MCP Muebles Santa Fe.

## Objetivo

Crear un bot conversacional para MCP Muebles que primero se pueda probar por Telegram y luego se pueda llevar a WhatsApp Business dentro de Zapia/Atenbot.

El bot tiene dos partes separadas:

1. Atencion al cliente: responder consultas, escuchar al cliente, ordenar la informacion y avanzar la venta.
2. Herramienta interna para Marcelo: generar una propuesta visual tipo render 3D a partir de la conversacion, sin enviarla automaticamente al cliente.

## Proyecto donde se implemento

La implementacion tecnica se hizo en el repo de Zapia/Atenbot:

`/Users/matiasquenardelle/GitHub/zapia`

Este archivo esta en el repo de MCP Muebles para dejar documentado el contexto comercial y operativo del piloto.

## Cliente creado en Zapia

Cliente: MCP Muebles Santa Fe

Email de acceso:

`mcp.muebles@zapia.local`

La cuenta fue marcada como piloto manual:

- `subscriptionStatus`: `active`
- `planName`: `pro`
- `paymentProvider`: `manual`
- `onboardingCompleted`: `true`

Nota: no guardar passwords ni tokens en este archivo. Las credenciales sensibles quedan fuera del repo.

## Bot de Telegram

Bot de prueba:

`@Mcpmueblesbot`

El webhook de Telegram apunta a:

`https://atenbot.com/api/webhooks/telegram`

El bot esta asociado al cliente MCP Muebles mediante la variable:

`TELEGRAM_PILOT_CLIENT_ID`

Actualmente el bot se usa para validar comportamiento conversacional antes de pasarlo a WhatsApp.

## Variables configuradas

En Vercel/Zapia se configuraron variables para:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_PILOT_CLIENT_ID`
- `FURNITURE_ANALYSIS_MODEL`
- `OPENAI_IMAGE_MODEL`
- `FURNITURE_IMAGE_GENERATION_ENABLED`

Estado importante:

`FURNITURE_IMAGE_GENERATION_ENABLED=false`

Eso significa que el bot de Telegram no genera ni manda renders automaticamente al cliente.

## Comportamiento esperado del bot

El bot no debe funcionar como formulario rigido. Debe escuchar al cliente, mantener el hilo de la conversacion y avanzar con naturalidad.

Reglas principales:

- No repetir preguntas que ya fueron respondidas.
- Hacer como maximo una pregunta importante por mensaje.
- Si el cliente pide precio, no volver a pedir todo desde cero.
- Si falta informacion, explicar que para un numero real se necesita avanzar con el proceso de proyecto.
- No prometer precio final automaticamente.
- No negociar precios finales.
- Orientar hacia el proceso de diseno + presupuesto.

## Flujo comercial de MCP Muebles

La idea comercial definida para Marcelo:

1. El cliente consulta por cocina, mesada, placard u otro mueble a medida.
2. El bot ayuda a ordenar la consulta y detectar intencion real.
3. Cuando ya hay una idea suficientemente clara, se ofrece avanzar con el proyecto.
4. El proceso de proyecto incluye diseno/render + presupuesto completo.
5. Ese proceso tiene un valor inicial de referencia de `$200.000`.
6. Luego Marcelo revisa, ajusta y cierra la venta.

Guion base para avanzar:

> Perfecto, con lo que vimos ya podemos avanzar bien. El siguiente paso es trabajar el proyecto: hacemos el diseno en 3D y el presupuesto completo para que tengas todo claro antes de decidir. Ese proceso tiene un valor de $200.000. Si te parece bien, lo iniciamos y empezamos a armar tu cocina.

## Roles operativos

Marcelo:

- Medicion en obra.
- Definicion tecnica inicial.
- Supervision de diseno.
- Cierre de ventas.
- Estrategia general.

Disenadora freelance:

- Diseno en SketchUp.
- Generacion de renders.
- Presupuesto tecnico sin margen.
- Coordinacion post-venta de materiales y logistica.

Produccion:

- Corte.
- Armado.
- Preparacion de pedidos.

Instalacion:

- Colocacion en obra.
- Resolucion en campo.

Marketing:

- Generacion de consultas por Google Ads.

## Generacion de imagen / propuesta 3D

La generacion de imagen se implemento como herramienta interna, no como parte automatica de atencion al cliente.

Tecnologia actual:

- OpenAI Images API.
- Modelo configurable por `OPENAI_IMAGE_MODEL`.
- Valor usado: `gpt-image-1.5`.

Importante:

Esto no es SketchUp ni CAD real. Es una referencia visual generada con IA para ayudar a Marcelo a mostrar una idea o validar estilo/distribucion. Para planos tecnicos finales haria falta otra capa, por ejemplo SketchUp, Blender o un configurador parametrico.

## Como genera Marcelo una propuesta 3D

1. Entrar a `https://atenbot.com`.
2. Loguearse con la cuenta de MCP Muebles.
3. Ir a Inbox.
4. Abrir la conversacion del cliente de Telegram.
5. Abrir el panel de IA.
6. Click en `Generar propuesta 3D`.
7. Atenbot lee la conversacion, arma el prompt tecnico y genera la imagen.
8. La imagen queda visible internamente para Marcelo.

La imagen no se envia sola al cliente.

## Archivos principales agregados o modificados en Zapia

Telegram:

- `src/lib/telegram.ts`
- `src/app/api/webhooks/telegram/route.ts`

Analisis de muebles:

- `src/lib/furniture/project-analysis.ts`
- `src/lib/furniture/render-prompt.ts`
- `src/lib/furniture/image-generation.ts`

Render interno:

- `src/app/api/furniture/render/route.ts`

Skill de muebles:

- `src/lib/skills/definitions/custom-furniture-design.ts`
- `src/lib/skills/registry.ts`
- `src/lib/skills/__tests__/definitions.test.ts`

Inbox / panel interno:

- `src/app/api/inbox/conversations/route.ts`
- `src/app/api/inbox/messages/route.ts`
- `src/components/inbox/ai-panel.tsx`

## Estado actual

Hecho:

- Usuario y cliente MCP creados en Zapia.
- Bot de Telegram conectado.
- Webhook de Telegram desplegado en produccion.
- Bot responde usando contexto de MCP Muebles.
- Se corrigio el problema inicial de fallo por JSON invalido.
- Se corrigio el problema de perdida de hilo usando historial reciente.
- Se ajusto el prompt para que el bot pregunte menos y escuche mas.
- Generacion automatica de imagenes desde Telegram desactivada.
- Generacion interna de propuesta 3D agregada al panel de IA.
- Cuenta MCP marcada como piloto manual/pro para evitar pantalla de precios.
- Deploy productivo hecho en `https://atenbot.com`.

## Proximos pasos recomendados

1. Probar conversaciones reales por Telegram con casos de cocina, mesada y placard.
2. Ver si el bot avanza bien hacia el proceso de `$200.000` sin parecer insistente.
3. Probar el boton interno de `Generar propuesta 3D` desde el inbox.
4. Ajustar el prompt con ejemplos reales de Marcelo.
5. Definir si el render IA alcanza para venta inicial o si hace falta integracion con SketchUp/Blender.
6. Cuando el flujo este validado, conectar el mismo comportamiento al canal WhatsApp dentro de Zapia/Kapso.

## Nota de seguridad

No incluir en este archivo:

- Token del bot de Telegram.
- Password del usuario MCP.
- Secret del webhook.
- API keys de OpenAI.
- Variables de base de datos.

Esos datos deben quedar en `.env`, Vercel Environment Variables o gestor de secretos.

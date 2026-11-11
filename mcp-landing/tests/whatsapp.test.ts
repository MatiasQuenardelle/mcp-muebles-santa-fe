// Lectura de webhooks, teléfonos y modos del bot. Corre con `npm test`.

import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  BUCLE_UMBRAL,
  hayBucle,
  modoEfectivo,
  ventanaAbierta,
} from '../lib/whatsapp/modo.ts'
import { mismoTelefono, telefonoCanonico } from '../lib/whatsapp/telefono.ts'
import {
  contenidoVisible,
  firmaValida,
  leerEstado,
  leerMensajeRecibido,
  separarEventos,
} from '../lib/whatsapp/webhook.ts'

const firmar = (body: string, secreto: string) =>
  createHmac('sha256', secreto).update(body).digest('hex')

test('la firma se valida contra los bytes crudos', () => {
  const body = '{"a":1}'
  assert.equal(firmaValida(body, 's3', firmar(body, 's3')), true)
  assert.equal(firmaValida('{"a": 1}', 's3', firmar(body, 's3')), false)
  assert.equal(firmaValida(body, 'otro', firmar(body, 's3')), false)
  assert.equal(firmaValida(body, 's3', null), false)
  assert.equal(firmaValida(body, undefined, firmar(body, 's3')), false)
  assert.equal(firmaValida(body, 's3', 'corta'), false)
})

test('separa un evento suelto y un lote', () => {
  const suelto = separarEventos({ message: { id: 'a' } }, 'whatsapp.message.received')
  assert.equal(suelto.length, 1)
  assert.equal(suelto[0].event, 'whatsapp.message.received')

  const lote = separarEventos(
    { type: 'whatsapp.message.read', batch: true, data: [{ message: { id: 'a' } }, { message: { id: 'b' } }, 'x'] },
    null
  )
  assert.equal(lote.length, 2)
  assert.equal(lote[1].event, 'whatsapp.message.read')

  assert.equal(separarEventos('nada', null).length, 0)
})

test('sin encabezado, deduce el evento de la dirección del mensaje', () => {
  const [evento] = separarEventos({ message: { kapso: { direction: 'outbound', status: 'read' } } }, null)
  assert.equal(evento.event, 'whatsapp.message.read')
})

const recibido = (message: Record<string, unknown>) => ({
  phone_number_id: '111',
  conversation: { phone_number: '+54 9 342 569-6876', contact_name: 'Ana' },
  message: { id: 'wamid.1', timestamp: '1762700000', ...message },
})

test('lee un mensaje de texto recibido', () => {
  const dato = leerMensajeRecibido(recibido({ type: 'text', text: { body: 'hola' } }))
  assert.equal(dato?.phone, '5493425696876')
  assert.equal(dato?.content, 'hola')
  assert.equal(dato?.contactName, 'Ana')
  assert.equal(dato?.sentAt?.getTime(), 1762700000000)
})

test('un audio se guarda con su transcripción y una foto con su leyenda', () => {
  const audio = leerMensajeRecibido(recibido({ type: 'audio', kapso: { transcript: { text: 'quiero una cocina' } } }))
  assert.equal(audio?.content, 'quiero una cocina')

  const foto = leerMensajeRecibido(recibido({ type: 'image', image: { caption: 'así está hoy' } }))
  assert.equal(foto?.content, '📷 Foto: así está hoy')
})

test('una foto sin texto se muestra; una reacción se descarta', () => {
  assert.equal(contenidoVisible('[image]', 'image'), '📷 Foto')
  assert.equal(contenidoVisible('[reaction]', 'reaction'), null)
  assert.equal(contenidoVisible('[Mensaje borrado]', undefined), null)
  assert.equal(contenidoVisible('hola [che]', 'text'), 'hola [che]')
})

test('falta un dato obligatorio: no se inventa el mensaje', () => {
  assert.equal(leerMensajeRecibido({ message: { id: 'x', text: { body: 'hola' } } }), null)
})

test('el eco de la app se distingue del envío por API', () => {
  const eco = leerEstado({
    phone_number_id: '111',
    message: { id: 'w', to: '5493425696876', text: { body: 'te llamo' }, kapso: { origin: 'business_app' } },
  })
  assert.equal(eco?.origin, 'business_app')
  assert.equal(eco?.phone, '5493425696876')
  assert.equal(eco?.content, 'te llamo')
})

test('los formatos de un mismo celular coinciden', () => {
  const variantes = [
    '5493425696876',
    '543425696876',
    '+54 9 342 569-6876',
    '342 569-6876',
    '0342 569 6876',
    '0342 15 569-6876',
    '342155696876',
  ]
  for (const variante of variantes) {
    assert.equal(telefonoCanonico(variante), '3425696876', variante)
  }
  assert.equal(mismoTelefono('5493425196295', '3425696876'), false)
  assert.equal(mismoTelefono(null, null), false)
  assert.equal(telefonoCanonico('sin número'), null)
})

test('el modo del contacto manda sobre el general', () => {
  assert.equal(modoEfectivo('AUTO', null), 'AUTO')
  assert.equal(modoEfectivo('AUTO', 'SUGGEST'), 'SUGGEST')
  assert.equal(modoEfectivo('OFF', 'AUTO'), 'AUTO')
})

test('la ventana de 24 h se corta justo al cumplirse', () => {
  const ahora = Date.parse('2026-11-09T12:00:00Z')
  assert.equal(ventanaAbierta('2026-11-08T12:00:01Z', ahora), true)
  assert.equal(ventanaAbierta('2026-11-08T12:00:00Z', ahora), false)
  assert.equal(ventanaAbierta(null, ahora), false)
})

test('varios mensajes seguidos de un cliente no son un bucle', () => {
  assert.equal(hayBucle(4), false)
  assert.equal(hayBucle(BUCLE_UMBRAL - 1), false)
  assert.equal(hayBucle(BUCLE_UMBRAL), true)
})

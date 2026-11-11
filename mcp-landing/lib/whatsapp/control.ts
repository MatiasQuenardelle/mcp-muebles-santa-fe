// Server-only: cambios de modo del bot. La base es la verdad; Kapso se sincroniza
// como mejor se pueda, porque el workflow igual consulta el modo en cada charla nueva.

import { addActivity } from '@/lib/db'
import {
  contactosConCharlaReciente,
  guardarModoGeneral,
  guardarOverride,
  leerConfig,
  type ConfigWhatsapp,
  type ContactoWhatsapp,
} from './db'
import { activarWorkflow, pasarAHumano, terminarConversacion } from './kapso'
import { modoEfectivo, type ModoBot } from './modo'

async function sincronizarCharla(
  config: ConfigWhatsapp,
  phone: string,
  antes: ModoBot,
  despues: ModoBot
): Promise<void> {
  if (!config.phone_number_id || (antes === 'AUTO') === (despues === 'AUTO')) {
    return
  }
  try {
    if (despues === 'AUTO') {
      await terminarConversacion(config.phone_number_id, phone)
    } else {
      await pasarAHumano(config.phone_number_id, phone)
    }
  } catch (error) {
    console.error('[whatsapp] No se pudo sincronizar la charla en Kapso', error)
  }
}

export async function cambiarModoDeContacto(
  contacto: ContactoWhatsapp,
  override: ModoBot | null
): Promise<void> {
  const config = await leerConfig()
  await guardarOverride(contacto.id, override)
  await sincronizarCharla(
    config,
    contacto.wa_phone,
    modoEfectivo(config.mode, contacto.ai_mode_override),
    modoEfectivo(config.mode, override)
  )
}

export async function cambiarModoGeneral(mode: ModoBot): Promise<void> {
  const config = await leerConfig()
  if (config.mode === mode) {
    return
  }
  await guardarModoGeneral(mode)

  if (config.workflow_id) {
    try {
      await activarWorkflow(config.workflow_id, mode !== 'OFF')
    } catch (error) {
      // Apagar siempre se respeta: el workflow consulta el modo y no va a contestar.
      if (mode !== 'OFF') {
        await guardarModoGeneral(config.mode)
        throw error
      }
      console.error('[whatsapp] No se pudo desactivar el workflow en Kapso', error)
    }
  }

  const contactos = await contactosConCharlaReciente()
  await Promise.all(
    contactos
      .filter((contacto) => contacto.ai_mode_override === null)
      .map((contacto) => sincronizarCharla(config, contacto.wa_phone, config.mode, mode))
  )
}

/**
 * Contestó una persona: el bot se calla con este cliente hasta que alguien lo
 * reactive desde el panel, para que nunca se pise con Marcelo.
 */
export async function pausarPorIntervencionHumana(contacto: ContactoWhatsapp): Promise<void> {
  const config = await leerConfig()
  if (modoEfectivo(config.mode, contacto.ai_mode_override) !== 'AUTO') {
    return
  }
  await guardarOverride(contacto.id, 'SUGGEST')
  await addActivity(contacto.id, 'nota', 'El bot se pausó porque contestó una persona.', null)
  await sincronizarCharla(config, contacto.wa_phone, 'AUTO', 'SUGGEST')
}

import { PLACARES } from '@/lib/precios.mjs'

export type SeleccionPlacard = {
  ancho: number
  puertas: 'batientes' | 'corredizas'
  espejos: number
}

export const SELECCION_INICIAL: SeleccionPlacard = {
  ancho: PLACARES.anchoInicial,
  puertas: 'batientes',
  espejos: 0,
}

export const metros = (cm: number) => (cm / 100).toFixed(2).replace('.', ',')

export function cotizarPlacard(s: SeleccionPlacard) {
  const renglones = [
    {
      nombre: 'Placard a medida',
      medida: `${metros(s.ancho)} m`,
      precio: Math.round((PLACARES.precioMetro * s.ancho) / 100),
    },
  ]
  if (s.puertas === 'corredizas') {
    renglones.push({ nombre: 'Puertas corredizas', medida: '', precio: PLACARES.corredizas })
  }
  if (s.espejos > 0) {
    renglones.push({
      nombre: s.espejos === 1 ? 'Puerta con espejo' : 'Puertas con espejo',
      medida: `× ${s.espejos}`,
      precio: PLACARES.espejo * s.espejos,
    })
  }
  return { renglones, total: renglones.reduce((t, r) => t + r.precio, 0) }
}

export const INCLUYE = [
  'Melamina Egger de 18 mm en el color que elijas',
  'Bauleras arriba para lo que usás poco',
  'Cajonera con correderas Grupo Euro',
  'Pantalonero y barral para colgar',
  'Diseño a medida antes de fabricar',
  'Medición, fabricación y colocación propias',
]

export const PROCESO = [
  {
    titulo: 'Nos escribís',
    texto:
      'Un WhatsApp con una foto de la pared o el hueco y las medidas aproximadas. No hace falta que sean exactas.',
  },
  {
    titulo: 'Diseño y presupuesto',
    texto:
      'Te proponemos cómo repartir el interior (cajones, estantes, barral) y te pasamos el precio por escrito.',
  },
  {
    titulo: 'Fabricación y colocación',
    texto:
      'Lo fabricamos en nuestro taller de Santa Fe y lo colocamos nosotros. Vos no armás nada.',
  },
]

export const PREGUNTAS = [
  {
    q: '¿El precio de la calculadora es el final?',
    a: 'Es orientativo. El precio exacto sale de medir el espacio y definir el interior con vos, pero te deja saber en qué rango estás.',
  },
  {
    q: '¿Qué incluye el placard?',
    a: 'Va de piso a techo, con bauleras arriba, cajonera, pantalonero y barral. Las puertas batientes vienen incluidas; las corredizas y las de espejo se suman aparte.',
  },
  {
    q: '¿Hacen vestidores?',
    a: 'Sí, también fabricamos vestidores abiertos y con puertas. Escribinos con las medidas del ambiente y te pasamos el precio.',
  },
  {
    q: '¿Puedo elegir la distribución de adentro?',
    a: 'Sí. Cada placard se diseña para lo que vas a guardar: más cajones, más espacio para colgar o estantes para zapatos.',
  },
  {
    q: '¿En qué zonas trabajan?',
    a: 'Santa Fe Capital, Santo Tomé, Recreo, Rincón y alrededores. Si estás más lejos, consultanos.',
  },
]

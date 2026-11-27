import { PLACARES } from '@/lib/precios.mjs'

export type Medida = 'ancho' | 'alto' | 'profundidad'

export type SeleccionPlacard = Record<Medida, number> & {
  puertas: 'batientes' | 'corredizas'
}

export const SELECCION_INICIAL: SeleccionPlacard = {
  ancho: PLACARES.ancho.inicial,
  alto: PLACARES.alto.inicial,
  profundidad: PLACARES.profundidad.inicial,
  puertas: 'corredizas',
}

export const MEDIDAS: { id: Medida; nombre: string; ayuda: string }[] = [
  { id: 'ancho', nombre: 'Ancho', ayuda: 'De pared a pared, o lo que querés que ocupe.' },
  { id: 'alto', nombre: 'Alto', ayuda: 'Del piso al techo. Lo más común es 2,40 m.' },
  { id: 'profundidad', nombre: 'Profundidad', ayuda: 'Para colgar ropa se usa 60 cm.' },
]

export const metros = (cm: number) => (cm / 100).toFixed(2).replace('.', ',')

export const TRABAJOS = [
  {
    src: '/placares/g-corredizas-madera.jpg',
    titulo: 'Corredizas símil madera',
    texto: 'Tres hojas de piso a techo con perfil de aluminio.',
  },
  {
    src: '/placares/g-espejo.jpg',
    titulo: 'Con espejo y cajonera',
    texto: 'Corredizas blancas, una hoja espejada y cajones a la vista.',
  },
  {
    src: '/placares/g-negro-abierto.jpg',
    titulo: 'Negro, interior blanco',
    texto: 'Doble barral para colgar y zapatero abajo.',
  },
  {
    src: '/placares/g-interior.jpg',
    titulo: 'Interior a medida',
    texto: 'Estantes, barrales y cajones repartidos según lo que se guarda.',
  },
  {
    src: '/placares/g-listones.jpg',
    titulo: 'Puerta de listones',
    texto: 'Frente corredizo de varillas que divide y esconde.',
  },
  {
    src: '/placares/g-taller.jpg',
    titulo: 'En el taller',
    texto: 'Marcelo con un vestidor antes de salir a colocación.',
  },
]

export const INCLUYE = [
  'Melamina Egger de 18 mm en el color que elijas',
  'Herrajes y correderas Grupo Euro',
  'Interior a medida: estantes, barrales, cajones',
  'Puertas batientes o corredizas',
  'Diseño antes de fabricar',
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
    q: '¿Cómo se calcula el precio?',
    a: 'Por metro cúbico: multiplicás ancho × alto × profundidad, en metros. Un placard de 2 m de ancho, 2,40 m de alto y 60 cm de profundidad son 2,88 m³. La calculadora hace la cuenta sola.',
  },
  {
    q: '¿El precio de la calculadora es el final?',
    a: 'Es de referencia. El precio exacto depende de las medidas tomadas en obra, el tipo de puerta, la distribución interior y las terminaciones que elijas. Lo terminamos de afinar al cotizar formalmente.',
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

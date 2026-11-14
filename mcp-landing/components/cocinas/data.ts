// Todos los datos de la página /cocinas viven acá, para que Marcelo pueda
// actualizar precios y textos sin tocar markup.
//
// Los precios viven en lib/precios.mjs, la lista única que también usan los bots.
import { PROVEEDORES } from '@/lib/constants'
import {
  LARGOS_LISTA,
  PRECIO_ML_BAJO_MESADA,
  precioModulo,
  type LineaId,
  type ModuloId,
} from '@/lib/precios.mjs'

export { PRECIOS_ACTUALIZADOS, PRECIO_ML_BAJO_MESADA, precioModulo } from '@/lib/precios.mjs'
export type { LineaId, ModuloId } from '@/lib/precios.mjs'

// La calculadora cotiza cada 10 cm entre LARGO_MIN y LARGO_MAX.
export const LARGO_MIN = 60
export const LARGO_MAX = 400
export const LARGO_PASO = 10

export const NOTA_COLOCACION: Record<LineaId, string> = {
  economica: 'Sin colocación · entrega a domicilio',
  estandar: 'Colocación a convenir, se cotiza aparte',
  premium: 'Colocación profesional incluida',
}

const DIFERENCIA_ECONOMICA_ML = PRECIO_ML_BAJO_MESADA.estandar - PRECIO_ML_BAJO_MESADA.economica

export const MODULOS: {
  id: ModuloId
  nombre: string
  detalle: string
}[] = [
  {
    id: 'bajoMesada',
    nombre: 'Bajo mesada',
    detalle: 'Módulos con cajones y puertas, hueco para cocina y bacha.',
  },
  {
    id: 'alacena',
    nombre: 'Alacena',
    detalle: 'Muebles altos con estantes regulables y puertas.',
  },
  {
    id: 'mesada',
    nombre: 'Mesada',
    detalle: 'Superficie de trabajo con corte para bacha y anafe.',
  },
]

export const LINEAS: {
  id: LineaId
  nombre: string
  claim: string
  descripcion: string
  material: string
  colocacion: string
  incluye: string[]
  destacada?: boolean
}[] = [
  {
    id: 'economica',
    nombre: 'Económica',
    claim: 'La más accesible',
    descripcion:
      'Para renovar la cocina sin estirar el presupuesto. Los mismos módulos, la misma prolijidad, sin el servicio de colocación.',
    material: 'Aglomerado, 1 cajón incluido',
    colocacion: 'Entrega a domicilio, sin colocación',
    incluye: [
      'Aglomerado con 1 cajón incluido',
      'Fabricación a medida de tu espacio',
      'Entrega a domicilio en Santa Fe',
      `$${DIFERENCIA_ECONOMICA_ML.toLocaleString('es-AR')} menos por metro de bajo mesada`,
    ],
  },
  {
    id: 'estandar',
    nombre: 'Estándar',
    claim: 'La más pedida',
    descripcion:
      'Los mismos módulos que la Económica, con la opción de sumar colocación profesional y el asesoramiento de diseño incluido.',
    material: 'Aglomerado, 1 cajón incluido',
    colocacion: 'Colocación a convenir',
    incluye: [
      'Aglomerado con 1 cajón incluido',
      'Colocación profesional a convenir',
      'Asesoramiento de diseño incluido',
      'Ajuste final en obra',
    ],
    destacada: true,
  },
  {
    id: 'premium',
    nombre: 'Premium',
    claim: 'Todo incluido',
    descripcion:
      'MDF Egger, herrajes de extracción total y colocación incluida en el precio. Para quien quiere que la cocina dure décadas y no volver a pensar en el tema.',
    material: 'MDF Egger importado',
    colocacion: 'Colocación profesional incluida',
    incluye: [
      'MDF Egger importado',
      'Toma de medidas en tu casa',
      'Correderas de extracción total',
      'Manijas de aluminio negro anodizado',
      'Cambio de color a elección',
      'Colocación profesional incluida',
    ],
  },
]

export function precioDesde(linea: LineaId) {
  return precioModulo(linea, 'bajoMesada', LARGOS_LISTA[0])
}

export const PROCESO = [
  {
    titulo: 'Nos escribís',
    texto:
      'Un WhatsApp con una foto de tu cocina y las medidas que tengas a mano. Con eso ya podemos empezar a hablar de números.',
  },
  {
    titulo: 'Relevamiento',
    texto:
      'Coordinamos la visita o trabajamos con tus medidas. Columnas, techos inclinados y rincones irregulares se resuelven acá.',
  },
  {
    titulo: 'Diseño y presupuesto',
    texto:
      'Te mostramos cómo queda y te pasamos el presupuesto itemizado por escrito. Sin letra chica ni extras que aparecen después.',
  },
  {
    titulo: 'Fabricación',
    texto:
      'Entre 15 y 20 días hábiles en nuestro taller de Santa Fe. Te avisamos en cada etapa, no tenés que estar preguntando.',
  },
  {
    titulo: 'Colocación',
    texto:
      'Un solo día. Nuestro equipo instala, nivela y deja todo funcionando. Vos no movés un mueble.',
  },
  {
    titulo: 'Ajuste y limpieza',
    texto:
      'Ajuste final de puertas y cajones en obra, y nos llevamos la basura. La cocina queda lista para usar.',
  },
]

export const DIFERENCIALES: { titulo: string; texto: string; link?: { url: string; cta: string } }[] = [
  {
    titulo: 'Medida exacta',
    texto:
      'Cada módulo se fabrica con las medidas de tu pared. Sin rellenos, sin ese hueco de tres centímetros al costado de la heladera.',
  },
  {
    titulo: 'MDF y melamina Egger',
    texto:
      'Tablero importado, el mismo que usan las cocinas de alta gama. Cantos termofusionados que no se despegan con el vapor.',
    link: PROVEEDORES.egger,
  },
  {
    titulo: 'Herrajes Grupo Euro',
    texto:
      'Correderas telescópicas de extracción total. Abren entero, cierran suave y aguantan el uso diario de una familia.',
    link: PROVEEDORES.grupoEuro,
  },
  {
    titulo: 'Manijas de aluminio',
    texto:
      'Perfil negro anodizado, no plástico pintado. Se siente en la mano y no se descascara a los dos años.',
  },
  {
    titulo: 'Colocación propia',
    texto:
      'No subcontratamos. El mismo taller que fabricó tu cocina la instala, la nivela y se hace cargo si algo no cierra bien.',
  },
  {
    titulo: 'Garantía por escrito',
    texto:
      '12 meses sobre herrajes y estructura, en papel. Si algo falla, lo resolvemos nosotros sin costo.',
  },
]

export const INCLUYE = [
  'Fabricación a medida completa',
  'Melamina o MDF Egger con cantos termofusionados',
  'Correderas telescópicas Grupo Euro',
  'Manijas de aluminio negro anodizado',
  'Colocación profesional (línea Premium)',
  'Ajuste final de puertas y cajones en obra',
  'Limpieza final del espacio',
]

export const NO_INCLUYE = [
  'Bacha, grifería y electrodomésticos',
  'Electricidad y plomería',
  'Pintura o revestimientos de pared',
  'Retiro de los muebles viejos',
]

export const TRABAJOS: { src: string; titulo: string; texto: string; destacado?: boolean }[] = [
  {
    src: '/cocinas/g-oscura.jpg',
    destacado: true,
    titulo: 'Grafito y madera clara',
    texto: 'Bajo mesada en grafito mate con alacenas en símil madera, columna de horno y microondas empotrados y luz bajo alacena.',
  },
  {
    src: '/cocinas/g-moderna.jpg',
    titulo: 'En L con columna de horno',
    texto: 'Aprovechamiento total del rincón, torre de horno y microondas a la izquierda y mesada de granito en toda la vuelta.',
  },
  {
    src: '/cocinas/g-barra.jpg',
    titulo: 'Con barra y pasaplatos',
    texto: 'Mesada de granito negro que sigue hasta la barra desayunadora, integrando cocina y comedor sin obra.',
  },
  {
    src: '/cocinas/g-lineal.jpg',
    titulo: 'Lineal sobre una pared',
    texto: 'Alacenas en símil madera, bajo mesada blanco y campana empotrada. La solución cuando hay una sola pared disponible.',
  },
  {
    src: '/cocinas/g-vanitory.jpg',
    titulo: 'Vanitory de baño',
    texto: 'La misma fábrica hace muebles de baño, placards y vestidores. Mesada sintética con bacha bajo mesada.',
  },
]

export const OPINIONES = [
  {
    texto:
      'Me quedé sorprendida. Me pidieron la foto, me mandaron el diseño en 3D y en dos semanas tenía la cocina puesta. La bacha ya está conectada y todo queda perfecto. Más fácil imposible.',
    nombre: 'María A.',
    lugar: 'Santa Fe · Barrio Sur',
  },
  {
    texto:
      'Yo no tenía idea de medidas ni de nada. Me dijeron que mandara una foto y ellos se encargaban. En el día me contestaron con precio y todo. Quedó re linda y no pagué ningún extra.',
    nombre: 'Roberto G.',
    lugar: 'Santo Tomé',
  },
  {
    texto:
      'Pedí presupuesto en tres carpinterías. MCP fue el único que me contestó el mismo día y el que más claro me explicó todo. Encima la calidad es otra cosa. No me arrepiento para nada.',
    nombre: 'Laura P.',
    lugar: 'Santa Fe Capital',
  },
]

export const PREGUNTAS = [
  {
    q: '¿Qué diferencia hay entre la línea Económica y la Estándar?',
    a: 'Son los mismos módulos y el mismo material. La diferencia está en el servicio: en la Económica te entregamos los muebles en tu casa y los colocás vos, y por eso el bajo mesada sale $50.000 menos por metro lineal. En la Estándar sumás colocación profesional a convenir y el asesoramiento de diseño.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre 15 y 20 días hábiles desde que confirmás el presupuesto. Te avisamos en cada etapa. La colocación se hace en un solo día, sin que tengas que hacer nada.',
  },
  {
    q: '¿Los materiales son buenos de verdad?',
    a: 'En la línea Premium usamos MDF Egger importado, el mismo tablero que las cocinas de alta gama, con correderas Grupo Euro de extracción total. No mezclamos buen tablero con herrajes baratos: si algo tiene que durar, tiene que durar todo.',
  },
  {
    q: '¿Y si mi espacio tiene formas raras?',
    a: 'Justamente para eso somos a medida. Techos inclinados, columnas, rincones irregulares y paredes que no están a escuadra: todo tiene solución. Antes de fabricar hacemos el relevamiento detallado del espacio.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'Por etapas y con trato directo: se abonan los materiales para arrancar y el resto en cuotas acordadas con Marcelo. Sin financiación bancaria de por medio.',
  },
  {
    q: '¿Cómo sé que van a cumplir?',
    a: 'Damos garantía escrita de 12 meses sobre herrajes y estructura. Si algo falla, lo resolvemos nosotros sin costo extra. Llevamos más de 20 años fabricando en Santa Fe y más de 480 cocinas entregadas.',
  },
  {
    q: '¿La mesada está incluida?',
    a: 'La mesada es un módulo aparte que sumás en la calculadora si la necesitás, porque no todos la cambian. Se cotiza por metro lineal igual que el resto y va con colocación y sellado profesional. El material (granito natural o sintético premium) lo definimos juntos.',
  },
  {
    q: '¿Trabajan fuera de Santa Fe Capital?',
    a: 'Trabajamos en Santa Fe Capital y alrededores, incluyendo Santo Tomé, Recreo y Rincón. Si estás un poco más lejos, escribinos y lo vemos: depende del tamaño del proyecto.',
  },
]

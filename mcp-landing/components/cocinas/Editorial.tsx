import Reveal from './Reveal'
import { Titulo } from './ui'

export default function Editorial() {
  return (
    <section className="bg-brand-cream px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[760px]">
        <Reveal>
          <Titulo
            className="text-[1.8rem] md:text-[2.3rem]"
            recta="Cocinas a medida en Santa Fe,"
            italica="hechas como se hacían antes."
          />

          <div className="mt-8 space-y-5 text-[15px] leading-[1.75] text-brand-dark/75">
            <p>
              Buscar una cocina a medida en Santa Fe termina casi siempre igual: tres
              presupuestos que no se pueden comparar entre sí, uno que no contesta más y otro
              que aparece con un extra cuando ya está la mitad puesta. MCP existe desde hace
              más de veinte años justamente porque eso nos parece evitable.
            </p>

            <h3 className="pt-4 font-display text-[21px] font-semibold text-brand-dark">
              Por qué la medida exacta cambia todo
            </h3>
            <p>
              Un mueble de línea se fabrica para una pared que no existe. Cuando lo traés a tu
              casa te sobran tres centímetros al lado de la heladera, el cajón pega contra el
              marco de la puerta y la columna de la instalación de gas te obliga a dejar un
              hueco muerto. Fabricar a medida no es un lujo: es la diferencia entre una cocina
              donde entra todo y una cocina donde siempre falta lugar. Techos inclinados,
              rincones que no están a escuadra, paredes de casa vieja santafesina: todo eso se
              resuelve en el relevamiento, antes de cortar el primer tablero.
            </p>

            <h3 className="pt-4 font-display text-[21px] font-semibold text-brand-dark">
              Qué hacemos además de cocinas
            </h3>
            <p>
              La misma fábrica hace placards y vestidores, muebles de baño y vanitorys,
              mesadas de granito natural y de sintético premium, y muebles de living o
              escritorios a medida. Trabajamos en Santa Fe Capital y alrededores —Santo Tomé,
              Recreo, Rincón—, con taller propio y equipo de colocación propio. No
              subcontratamos la instalación, que es donde se arruinan los buenos muebles.
            </p>

            <h3 className="pt-4 font-display text-[21px] font-semibold text-brand-dark">
              Por qué los precios están publicados
            </h3>
            <p>
              Porque preguntar el precio no debería ser una negociación. La lista de esta
              página es la misma que usamos por WhatsApp, y la calculadora hace la cuenta que
              haríamos nosotros. Lo que sí cambia es el número final, que sale del
              relevamiento: medidas reales, terminaciones elegidas y si hay algún trabajo en L
              o alguna medida especial. Si querés ese número con firma, el estudio previo
              cuesta $40.000 y se te descuenta del total si avanzás.
            </p>

            <p className="border-l-2 border-brand-gold pl-5 text-brand-dark/85">
              Más de 480 cocinas entregadas, garantía escrita de 12 meses y un solo
              responsable del principio al final. Escribinos con una foto de tu cocina y en el
              día tenés una respuesta con precio.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

"use client";

import { useMemo, useState } from "react";
import { useWhatsAppCTA } from "@/lib/useWhatsAppCTA";
import {
  ADICIONALES,
  EXTRAS,
  MESADAS,
  PILETAS,
  TOPE_DE_GAMA,
  pesos,
} from "@/lib/precios.mjs";
import {
  LARGO_MAX,
  LARGO_MIN,
  LARGO_PASO,
  LINEAS,
  MODULOS,
  NOTA_COLOCACION,
  PRECIOS_ACTUALIZADOS,
  type LineaId,
  type ModuloId,
} from "./data";
import {
  MAX_LADOS,
  SELECCION_INICIAL,
  ajustarAMesada,
  cotizar,
  medidasMesada,
  metros,
  type Seleccion,
} from "./cotizar";
import DescargaPdf from "./DescargaPdf";
import { Eyebrow, IconoWhatsApp, Titulo, formatearPesos } from "./ui";

function Paso({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </p>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-w-0 rounded-md border px-3 py-2.5 text-left text-[13px] transition-all ${
        activo
          ? "border-brand-gold bg-brand-gold/10 font-semibold text-brand-dark ring-1 ring-brand-gold"
          : "border-brand-border text-brand-dark/80 hover:border-brand-gold/50"
      }`}
    >
      {children}
    </button>
  );
}

/** −/+ y barra para el largo de un lado. `medidas`: solo esas (mesada de medida fija). */
function Lado({
  nombre,
  largo,
  incluido,
  medidas,
  onChange,
  onQuitar,
}: {
  nombre: string;
  largo: number;
  incluido: boolean;
  medidas: number[] | null;
  onChange: (largo: number) => void;
  onQuitar?: () => void;
}) {
  const min = medidas ? medidas[0] : LARGO_MIN;
  const max = medidas ? medidas[medidas.length - 1] : LARGO_MAX;
  const paso = medidas ? medidas[1] - medidas[0] : LARGO_PASO;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        {nombre ? (
          <span className="w-14 text-[12px] font-medium text-brand-muted">
            {nombre}
          </span>
        ) : null}
        <div
          className={`flex items-center rounded border transition-all ${
            incluido ? "border-brand-dark" : "border-brand-border opacity-50"
          }`}
        >
          <button
            type="button"
            onClick={() => onChange(largo - paso)}
            disabled={incluido && largo <= min}
            aria-label={`Restar ${paso} cm`}
            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
          >
            −
          </button>
          <output
            aria-live="polite"
            className="min-w-[4.5rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark"
          >
            {metros(largo)} m
          </output>
          <button
            type="button"
            onClick={() => onChange(largo + paso)}
            disabled={incluido && largo >= max}
            aria-label={`Sumar ${paso} cm`}
            className="h-10 w-10 text-[18px] text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-30"
          >
            +
          </button>
        </div>
        {onQuitar ? (
          <button
            type="button"
            onClick={onQuitar}
            className="text-[12.5px] text-brand-muted underline underline-offset-4 hover:text-brand-dark"
          >
            Quitar lado
          </button>
        ) : null}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={largo}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Largo en centímetros${nombre ? `, ${nombre}` : ""}`}
        className={`mt-3 w-full accent-brand-dark ${incluido ? "" : "opacity-40"}`}
      />
      <div className="flex justify-between text-[11px] tabular-nums text-brand-muted">
        <span>{metros(min)} m</span>
        <span>{metros(max)} m</span>
      </div>
    </div>
  );
}

export default function Calculadora() {
  const [s, setS] = useState<Seleccion>(SELECCION_INICIAL);
  const tope = s.linea === "topeDeGama";
  const medidasFijas = medidasMesada(s.mesada.material);

  const setLinea = (linea: LineaId) => setS((p) => ({ ...p, linea }));

  const ajustar = (id: ModuloId, i: number, largo: number) =>
    setS((p) => {
      const fijas = id === "mesada" ? medidasMesada(p.mesada.material) : null;
      const [min, max] = fijas
        ? [fijas[0], fijas[fijas.length - 1]]
        : [LARGO_MIN, LARGO_MAX];
      const nuevo = Math.min(Math.max(largo, min), max);
      const lados = p[id].lados.map((l, j) => (j === i ? nuevo : l));
      return { ...p, [id]: { ...p[id], lados, incluido: true } };
    });

  const sumarLado = (id: ModuloId) =>
    setS((p) => {
      const fijas = id === "mesada" ? medidasMesada(p.mesada.material) : null;
      const nuevo = fijas ? fijas[0] : 150;
      return {
        ...p,
        [id]: { ...p[id], lados: [...p[id].lados, nuevo], incluido: true },
      };
    });

  const quitarLado = (id: ModuloId, i: number) =>
    setS((p) => ({
      ...p,
      [id]: { ...p[id], lados: p[id].lados.filter((_, j) => j !== i) },
    }));

  const alternarModulo = (id: ModuloId) =>
    setS((p) => ({ ...p, [id]: { ...p[id], incluido: !p[id].incluido } }));

  const elegirMaterial = (material: Seleccion["mesada"]["material"]) =>
    setS((p) => ({
      ...p,
      mesada: {
        ...p.mesada,
        material,
        incluido: true,
        lados: p.mesada.lados.map((l) => ajustarAMesada(material, l)),
      },
    }));

  const alternarAdicional = (id: Seleccion["adicionales"][number]) =>
    setS((p) => ({
      ...p,
      adicionales: p.adicionales.includes(id)
        ? p.adicionales.filter((a) => a !== id)
        : [...p.adicionales, id],
    }));

  const { renglones, total, aConsultar } = useMemo(() => cotizar(s), [s]);
  const hayModulos =
    s.bajoMesada.incluido || s.alacena.incluido || s.mesada.incluido;
  const nombreLinea = LINEAS.find((l) => l.id === s.linea)?.nombre ?? "";

  const mensaje = useMemo(() => {
    if (!hayModulos) {
      return "Hola Marcelo, quiero armar el presupuesto de mi cocina a medida.";
    }
    const detalle = renglones
      .map(
        (r) =>
          `· ${r.nombre} ${r.medida} — ${r.nota ?? formatearPesos(r.precio)}`,
      )
      .join("\n");
    return [
      `Hola Marcelo, armé este presupuesto en la calculadora de la web (línea ${nombreLinea}):`,
      detalle,
      `Total orientativo: ${formatearPesos(total)}${aConsultar ? " + mesada a consultar" : ""}`,
      "¿Me confirmás el precio exacto para mis medidas?",
    ].join("\n\n");
  }, [renglones, nombreLinea, total, aConsultar, hayModulos]);

  const { href, handleClick } = useWhatsAppCTA({
    baseMessage: mensaje,
    ctaLabel: "Enviar presupuesto por WhatsApp",
    placement: "cocinas_calculadora",
  });

  return (
    <section
      id="calculadora"
      className="relative bg-brand-ink px-5 py-20 md:py-28"
    >
      <div className="cc-trama absolute inset-0" />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="max-w-2xl">
          <Eyebrow tono="oscuro">Calculadora de precios</Eyebrow>
          <Titulo
            tono="oscuro"
            className="mt-4 text-[2rem] md:text-[2.6rem]"
            recta="Armá tu cocina y mirá"
            italica="cuánto sale, ahora."
          />
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            Elegí la línea, poné los metros lineales de cada módulo (de a 10 cm)
            y la calculadora te da el número con la lista de precios de MCP. Si
            tu cocina es en L, sumá otro lado. Es orientativo: el precio final
            sale del relevamiento de tu espacio, pero te deja saber en qué rango
            estás parado.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-lg border border-white/10 bg-white lg:grid lg:grid-cols-[1fr_400px]">
          {/* ── Controles ─────────────────────────────────────────── */}
          <div className="min-w-0 p-6 sm:p-9">
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                1 · Elegí la línea
              </legend>
              <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                {LINEAS.map((l) => {
                  const activa = l.id === s.linea;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLinea(l.id)}
                      aria-pressed={activa}
                      className={`min-w-0 rounded-md border px-4 py-3 text-left transition-all ${
                        activa
                          ? "border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold"
                          : "border-brand-border hover:border-brand-gold/50"
                      }`}
                    >
                      <span className="block font-display text-[17px] font-semibold text-brand-dark">
                        {l.nombre}
                      </span>
                      <span className="mt-0.5 block text-[11px] uppercase tracking-[0.1em] text-brand-muted">
                        {l.claim}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12.5px] text-brand-muted">
                {NOTA_COLOCACION[s.linea]}
              </p>

              {tope ? (
                <div className="mt-6 space-y-6 rounded-md border border-brand-gold/40 bg-brand-gold/[0.06] p-4 sm:p-5">
                  <div>
                    <p className="text-[12.5px] font-semibold text-brand-dark">
                      Color
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {TOPE_DE_GAMA.colores.map((c) => (
                        <Chip
                          key={c}
                          activo={s.color === c}
                          onClick={() => setS((p) => ({ ...p, color: c }))}
                        >
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-brand-dark">
                      Cajones con cierre suave{" "}
                      <span className="font-normal text-brand-muted">
                        · {pesos(TOPE_DE_GAMA.precioCajon)} c/u
                      </span>
                    </p>
                    <div className="mt-2.5 flex w-fit items-center rounded border border-brand-dark">
                      <button
                        type="button"
                        onClick={() =>
                          setS((p) => ({
                            ...p,
                            cajones: Math.max(0, p.cajones - 1),
                          }))
                        }
                        disabled={s.cajones <= 0}
                        aria-label="Un cajón menos"
                        className="h-10 w-10 text-[18px] text-brand-dark hover:bg-brand-dark/5 disabled:opacity-30"
                      >
                        −
                      </button>
                      <output className="min-w-[3.5rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark">
                        {s.cajones}
                      </output>
                      <button
                        type="button"
                        onClick={() =>
                          setS((p) => ({
                            ...p,
                            cajones: Math.min(
                              TOPE_DE_GAMA.cajonesMax,
                              p.cajones + 1,
                            ),
                          }))
                        }
                        disabled={s.cajones >= TOPE_DE_GAMA.cajonesMax}
                        aria-label="Un cajón más"
                        className="h-10 w-10 text-[18px] text-brand-dark hover:bg-brand-dark/5 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    El perfil Gola y las luces LED se calculan solos con los
                    metros de bajo mesada y alacena. La puerta vidriada, el
                    cubertero y el porta residuos ya vienen incluidos.
                  </p>
                </div>
              ) : null}
            </fieldset>

            <div className="mt-10">
              <Paso>2 · Poné los metros lineales</Paso>

              <div className="mt-5 space-y-9">
                {MODULOS.map((m) => {
                  const { lados, incluido } = s[m.id];
                  const esMesada = m.id === "mesada";
                  const subtotal = renglones.find((r) =>
                    esMesada
                      ? r.nombre.startsWith("Mesada")
                      : r.nombre === m.nombre,
                  );
                  return (
                    <div key={m.id} className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-display text-[19px] font-semibold text-brand-dark">
                          {m.nombre}
                        </h3>
                        <span className="font-display text-[17px] text-brand-gold">
                          {!incluido || !subtotal
                            ? "—"
                            : (subtotal.nota ??
                              formatearPesos(subtotal.precio))}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
                        {m.detalle}
                      </p>

                      {esMesada ? (
                        <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {MESADAS.map((mat) => (
                            <Chip
                              key={mat.id}
                              activo={incluido && s.mesada.material === mat.id}
                              onClick={() => elegirMaterial(mat.id)}
                            >
                              <span className="block">{mat.nombre}</span>
                              <span className="mt-0.5 block text-[11.5px] font-normal text-brand-muted">
                                {mat.porMetro
                                  ? `${pesos(mat.porMetro)} el metro · `
                                  : ""}
                                {mat.detalle}
                              </span>
                            </Chip>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-4">
                        {lados.map((largo, i) => (
                          <Lado
                            key={i}
                            nombre={lados.length > 1 ? `Lado ${i + 1}` : ""}
                            largo={largo}
                            incluido={incluido}
                            medidas={esMesada ? medidasFijas : null}
                            onChange={(l) => ajustar(m.id, i, l)}
                            onQuitar={
                              i > 0 ? () => quitarLado(m.id, i) : undefined
                            }
                          />
                        ))}
                      </div>

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {lados.length < MAX_LADOS ? (
                          <button
                            type="button"
                            onClick={() => sumarLado(m.id)}
                            className="rounded border border-brand-border px-3 py-2 text-[13px] font-medium text-brand-dark transition-all hover:border-brand-dark/40"
                          >
                            + Sumar otro lado{" "}
                            {lados.length === 1 ? "(en L)" : "(en U)"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => alternarModulo(m.id)}
                          aria-pressed={!incluido}
                          className={`rounded border px-3 py-2 text-[13px] font-medium transition-all ${
                            !incluido
                              ? "border-brand-dark bg-brand-dark text-white"
                              : "border-brand-border text-brand-muted hover:border-brand-dark/40 hover:text-brand-dark"
                          }`}
                        >
                          No lo llevo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10">
              <Paso>3 · Pileta de acero (se suma aparte)</Paso>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Chip
                  activo={s.pileta === null}
                  onClick={() => setS((p) => ({ ...p, pileta: null }))}
                >
                  Sin pileta
                </Chip>
                {PILETAS.map((p) => (
                  <Chip
                    key={p.id}
                    activo={s.pileta === p.id}
                    onClick={() => setS((prev) => ({ ...prev, pileta: p.id }))}
                  >
                    <span className="block">
                      {p.nombre.replace("Pileta ", "")}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] font-normal text-brand-muted">
                      {pesos(p.precio)}
                    </span>
                  </Chip>
                ))}
              </div>
              {s.mesada.incluido &&
              s.mesada.material === "sinteticoEstandar" ? (
                <p className="mt-2.5 text-[12px] text-brand-muted">
                  La mesada sintética estándar ya trae una bacha simple. Elegí
                  una pileta solo si querés otra.
                </p>
              ) : null}
            </div>

            <div className="mt-10">
              <Paso>4 · Adicionales</Paso>
              {tope ? (
                <p className="mt-3 text-[13px] text-brand-muted">
                  En Tope de Gama el cubertero y el porta residuos ya vienen
                  incluidos.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ADICIONALES.map((a) => (
                    <Chip
                      key={a.id}
                      activo={s.adicionales.includes(a.id)}
                      onClick={() => alternarAdicional(a.id)}
                    >
                      <span className="block">{a.nombre}</span>
                      <span className="mt-0.5 block text-[11.5px] font-normal text-brand-muted">
                        + {pesos(a.precio)}
                      </span>
                    </Chip>
                  ))}
                  <Chip
                    activo={s.led && s.alacena.incluido}
                    onClick={() =>
                      setS((p) =>
                        p.alacena.incluido
                          ? { ...p, led: !p.led }
                          : {
                              ...p,
                              led: true,
                              alacena: { ...p.alacena, incluido: true },
                            },
                      )
                    }
                  >
                    <span className="block">{EXTRAS.led.nombre}</span>
                    <span className="mt-0.5 block text-[11.5px] font-normal text-brand-muted">
                      + {pesos(EXTRAS.led.precioTira)} cada{" "}
                      {EXTRAS.led.metrosTira} m de alacena
                    </span>
                  </Chip>
                  <div className="flex flex-col">
                    <Chip
                      activo={s.puertasVidrio > 0}
                      onClick={() =>
                        setS((p) => ({
                          ...p,
                          puertasVidrio: p.puertasVidrio > 0 ? 0 : 1,
                        }))
                      }
                    >
                      <span className="block">
                        {EXTRAS.puertaVidrio.nombre}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] font-normal text-brand-muted">
                        + {pesos(EXTRAS.puertaVidrio.precio)} por puerta
                      </span>
                    </Chip>
                    {s.puertasVidrio > 0 ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex w-fit items-center rounded border border-brand-dark">
                          <button
                            type="button"
                            onClick={() =>
                              setS((p) => ({
                                ...p,
                                puertasVidrio: Math.max(0, p.puertasVidrio - 1),
                              }))
                            }
                            aria-label="Una puerta menos"
                            className="h-9 w-9 text-[18px] text-brand-dark hover:bg-brand-dark/5"
                          >
                            −
                          </button>
                          <output className="min-w-[3rem] text-center text-[14px] font-semibold tabular-nums text-brand-dark">
                            {s.puertasVidrio}
                          </output>
                          <button
                            type="button"
                            onClick={() =>
                              setS((p) => ({
                                ...p,
                                puertasVidrio: Math.min(
                                  EXTRAS.puertaVidrio.max,
                                  p.puertasVidrio + 1,
                                ),
                              }))
                            }
                            disabled={
                              s.puertasVidrio >= EXTRAS.puertaVidrio.max
                            }
                            aria-label="Una puerta más"
                            className="h-9 w-9 text-[18px] text-brand-dark hover:bg-brand-dark/5 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[12px] text-brand-muted">
                          {s.puertasVidrio === 1 ? "puerta" : "puertas"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Resumen ───────────────────────────────────────────── */}
          <div className="min-w-0 bg-brand-dark p-6 text-white sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Tu presupuesto
            </p>

            <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
              {!hayModulos ? (
                <p className="text-[13.5px] leading-relaxed text-brand-muted-dark">
                  Elegí al menos un módulo y su medida para ver el total.
                </p>
              ) : (
                renglones.map((r) => (
                  <div
                    key={r.nombre}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="min-w-0 text-[13.5px] text-brand-muted-dark">
                      {r.nombre}{" "}
                      <span className="tabular-nums text-white/50">
                        {r.medida}
                      </span>
                    </span>
                    <span className="flex-shrink-0 text-[13.5px] tabular-nums">
                      {r.nota ?? formatearPesos(r.precio)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6">
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted-dark">
                Total orientativo · línea {nombreLinea}
              </span>
              <p className="mt-2 font-display text-[2.5rem] leading-none tabular-nums text-brand-gold">
                {formatearPesos(total)}
              </p>
              {aConsultar ? (
                <p className="mt-2 text-[12.5px] text-white/70">
                  + mesada a consultar
                </p>
              ) : null}
              <p className="mt-3 text-[12px] leading-relaxed text-brand-muted-dark">
                {NOTA_COLOCACION[s.linea]}. Precios de lista actualizados a{" "}
                {PRECIOS_ACTUALIZADOS}, en pesos.
              </p>
            </div>

            <a
              href={href}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-md bg-brand-gold px-5 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-brand-dark transition-all hover:bg-brand-gold-light"
            >
              <IconoWhatsApp />
              Enviar este presupuesto
            </a>
            <p className="mt-3 text-center text-[11.5px] text-brand-muted-dark">
              Te llega a Marcelo con el detalle ya escrito.
            </p>

            <DescargaPdf seleccion={s} disabled={!hayModulos} />
          </div>
        </div>
      </div>
    </section>
  );
}

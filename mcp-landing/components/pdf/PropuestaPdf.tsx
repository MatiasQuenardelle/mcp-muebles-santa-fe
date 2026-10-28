// PDF del presupuesto para el cliente. Server-only: se renderiza con
// @react-pdf/renderer en las rutas /api/admin/presupuestos/[id]/pdf (formal) y
// /api/presupuesto/[id]/pdf (preliminar de la calculadora).
//
// El diseño es el de la hoja "Propuesta Cliente" de la planilla de Marcelo.
// Fuente Helvetica integrada: cubre tildes, ñ y ², pero no "✓", por eso las
// viñetas son "•".

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import {
  ALCANCE,
  CALIDAD,
  CARACTERISTICAS,
  ETAPAS,
  PASOS,
  WHATSAPP_VISIBLE,
  calcular,
  cantidadTexto,
  formatearFecha,
  pesos,
  venceEl,
  type PreliminarData,
  type PresupuestoData,
} from '@/lib/presupuesto'
import { LOGO_MCP } from './logo'

const C = {
  blue: '#1D4ED8',
  dark: '#0F172A',
  gray: '#475569',
  muted: '#64748B',
  light: '#EEF3FF',
  head: '#F1F5F9',
  line: '#E2E8F0',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 46,
    paddingHorizontal: 38,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: C.dark,
    lineHeight: 1.35,
  },
  bold: { fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 54, height: 56 },
  brand: { marginLeft: 10, flexGrow: 1 },
  brandName: { fontWeight: 'bold', fontSize: 19, color: C.blue, lineHeight: 1.15, marginBottom: 2 },
  brandSub: { fontWeight: 'bold', fontSize: 7.5, color: C.gray, letterSpacing: 0.4 },
  brandContact: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  badge: {
    backgroundColor: C.light,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  badgeTitle: { fontWeight: 'bold', fontSize: 11, color: C.blue },
  badgeSub: { fontSize: 8, color: C.gray, marginTop: 2 },
  box: { backgroundColor: C.light, padding: 10, marginTop: 14, flexDirection: 'row', flexWrap: 'wrap' },
  boxCell: { marginBottom: 6 },
  boxLabel: { fontWeight: 'bold', fontSize: 6.5, color: C.muted, letterSpacing: 0.5 },
  boxValue: { fontWeight: 'bold', fontSize: 10.5, marginTop: 1 },
  title: { fontWeight: 'bold', fontSize: 14, marginTop: 16 },
  subtitle: { fontStyle: 'italic', fontSize: 9, color: C.gray, marginTop: 4 },
  section: {
    fontWeight: 'bold',
    fontSize: 10.5,
    color: C.blue,
    borderBottomWidth: 1.5,
    borderBottomColor: C.blue,
    paddingBottom: 3,
    marginTop: 16,
    marginBottom: 6,
  },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { width: 12, color: C.blue, fontWeight: 'bold' },
  bulletText: { flex: 1 },
  thead: { flexDirection: 'row', backgroundColor: C.head, paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontWeight: 'bold', fontSize: 6.5, color: C.gray, letterSpacing: 0.4 },
  tr: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  cDesc: { flex: 1, paddingRight: 6 },
  cNum: { width: 42, textAlign: 'right' },
  cMoney: { width: 72, textAlign: 'right' },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 0.8,
    borderTopColor: C.dark,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  subtotalLabel: { fontWeight: 'bold', fontSize: 7.5, color: C.gray, marginRight: 12 },
  subtotalValue: { fontWeight: 'bold', fontSize: 10.5, color: C.blue, width: 90, textAlign: 'right' },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.blue,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  totalLabel: { fontWeight: 'bold', fontSize: 11.5, color: '#FFFFFF' },
  totalValue: { fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' },
  note: { fontStyle: 'italic', fontSize: 8.5, color: C.gray, marginBottom: 6 },
  etapa: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  etapaNum: { width: 52, fontWeight: 'bold', color: C.blue, fontSize: 9 },
  etapaTitulo: { fontWeight: 'bold' },
  etapaTexto: { color: C.gray },
  paso: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  pasoNum: { width: 22, fontWeight: 'bold', fontSize: 13, color: C.blue, textAlign: 'center' },
  pasoText: { flex: 1, marginLeft: 8 },
  cond: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  condLabel: { width: 190, fontWeight: 'bold', color: C.gray },
  parrafo: { marginBottom: 6 },
  gracias: { fontWeight: 'bold', color: C.blue, textAlign: 'center', marginTop: 14 },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 38,
    right: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: C.muted,
  },
})

function Encabezado({ etiqueta, numero }: { etiqueta: string; numero: string }) {
  return (
    <View style={s.header}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, no de HTML */}
      <Image src={LOGO_MCP} style={s.logo} />
      <View style={s.brand}>
        <Text style={s.brandName}>MCP MUEBLES</Text>
        <Text style={s.brandSub}>DISEÑO & FABRICACIÓN DE AMOBLAMIENTOS</Text>
        <Text style={s.brandContact}>Santa Fe · WhatsApp {WHATSAPP_VISIBLE} · mcpmuebles.com</Text>
      </View>
      <View style={s.badge}>
        <Text style={s.badgeTitle}>{etiqueta}</Text>
        <Text style={s.badgeSub}>N° {numero}</Text>
      </View>
    </View>
  )
}

function DatoCaja({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <View style={[s.boxCell, { width }]}>
      <Text style={s.boxLabel}>{label}</Text>
      <Text style={s.boxValue}>{value}</Text>
    </View>
  )
}

function Seccion({ children }: { children: ReactNode }) {
  return <Text style={s.section}>{children}</Text>
}

function Viñetas({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function Pie({ numero }: { numero: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>MCP Muebles · Presupuesto N° {numero}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )
}

function Pasos({ pasos }: { pasos: string[] }) {
  return (
    <View>
      {pasos.map((paso, i) => (
        <View key={paso} style={s.paso}>
          <Text style={s.pasoNum}>{i + 1}</Text>
          <Text style={s.pasoText}>{paso}</Text>
        </View>
      ))}
    </View>
  )
}

function Condiciones({ filas }: { filas: [string, string][] }) {
  return (
    <View style={{ marginTop: 6 }}>
      {filas.map(([label, value]) => (
        <View key={label} style={s.cond}>
          <Text style={s.condLabel}>{label}</Text>
          <Text>{value}</Text>
        </View>
      ))}
    </View>
  )
}

function Parrafos({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((p) => (
        <Text key={p} style={s.parrafo}>
          {p}
        </Text>
      ))}
    </View>
  )
}

export function PropuestaFormalPdf({ numero, data }: { numero: string; data: PresupuestoData }) {
  const calc = calcular(data)
  const cliente = data.localidad ? `${data.cliente} (${data.localidad})` : data.cliente

  return (
    <Document title={`Presupuesto MCP Muebles - ${data.cliente}`} author="MCP Muebles">
      <Page size="A4" style={s.page}>
        <Encabezado etiqueta="PRESUPUESTO" numero={numero} />

        <View style={s.box}>
          <DatoCaja label="CLIENTE" value={cliente} width="50%" />
          <DatoCaja label="FECHA" value={formatearFecha(data.fecha)} width="25%" />
          <DatoCaja label="VÁLIDO HASTA" value={venceEl(data.fecha, data.validezDias)} width="25%" />
          {data.proyecto ? <DatoCaja label="PROYECTO" value={data.proyecto} width="100%" /> : null}
        </View>

        <Text style={s.title}>Propuesta de Proyecto de Cocina a Medida | Línea Premium</Text>
        <Text style={s.subtitle}>Diseño, fabricación e instalación de mobiliario de cocina</Text>

        <Seccion>CARACTERÍSTICAS Y MATERIALES INCLUIDOS</Seccion>
        <Viñetas items={CARACTERISTICAS} />

        {calc.secciones.map((seccion, i) => (
          <View key={seccion.id} wrap={false}>
            <Seccion>
              {i + 1}. {seccion.titulo.toUpperCase()}
            </Seccion>
            <View style={s.thead}>
              <Text style={[s.th, s.cDesc]}>DESCRIPCIÓN</Text>
              <Text style={[s.th, s.cNum]}>CANT.</Text>
              <Text style={[s.th, s.cMoney]}>PRECIO UNIT.</Text>
              <Text style={[s.th, s.cMoney]}>SUBTOTAL</Text>
            </View>
            {seccion.items.map((item, j) => (
              <View key={j} style={s.tr}>
                <Text style={s.cDesc}>{item.concepto}</Text>
                <Text style={s.cNum}>{cantidadTexto(item.cantidad)}</Text>
                <Text style={s.cMoney}>{pesos(item.precio)}</Text>
                <Text style={[s.cMoney, s.bold]}>{pesos(item.cantidad * item.precio)}</Text>
              </View>
            ))}
            <View style={s.subtotalRow}>
              <Text style={s.subtotalLabel}>SUBTOTAL {seccion.titulo.toUpperCase()}</Text>
              <Text style={s.subtotalValue}>{pesos(seccion.subtotal)}</Text>
            </View>
          </View>
        ))}

        <View wrap={false}>
          <Seccion>RESUMEN DE LA INVERSIÓN</Seccion>
          {calc.secciones.map((seccion) => (
            <View key={seccion.id} style={s.resumenRow}>
              <Text>{seccion.titulo}</Text>
              <Text>{pesos(seccion.subtotal)}</Text>
            </View>
          ))}
          <View style={s.totalBar}>
            <Text style={s.totalLabel}>PRECIO FINAL DEL PROYECTO</Text>
            <Text style={s.totalValue}>{pesos(calc.total)}</Text>
          </View>
        </View>

        <View wrap={false}>
          <Seccion>FORMA DE PAGO: TU COCINA AVANZA POR ETAPAS</Seccion>
          <Text style={s.note}>
            No necesitás abonar todo junto: pagás a medida que el proyecto avanza, y en cada etapa
            sabés exactamente en qué se invierte tu dinero.
          </Text>
          {calc.etapas.map((etapa, i) => (
            <View key={etapa.titulo} style={s.etapa}>
              <Text style={s.etapaNum}>ETAPA {i + 1}</Text>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.etapaTitulo}>{etapa.titulo}</Text>
                <Text style={s.etapaTexto}>{etapa.explicacion}</Text>
              </View>
              <Text style={[s.cNum, { color: C.gray }]}>{Math.round(etapa.pct * 100)} %</Text>
              <Text style={[s.cMoney, s.bold, { width: 84 }]}>{pesos(etapa.monto)}</Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Seccion>¿CÓMO SEGUIMOS?</Seccion>
          <Pasos pasos={PASOS} />
          <Condiciones
            filas={[
              ['Término de entrega', data.entrega],
              ['Garantía de la casa en los herrajes', data.garantia],
              ['Validez del presupuesto', `Hasta el ${venceEl(data.fecha, data.validezDias)}`],
            ]}
          />
        </View>

        <View wrap={false}>
          <Seccion>CALIDAD Y EXPERIENCIA MCP MUEBLES</Seccion>
          <Parrafos items={CALIDAD} />
        </View>
        <View wrap={false}>
          <Seccion>ALCANCE DE LA PROPUESTA</Seccion>
          <Parrafos items={ALCANCE} />
        </View>

        <Text style={s.gracias}>
          Gracias por confiar en MCP Muebles. Diseñamos espacios pensados para tu vida.
        </Text>
        <Pie numero={numero} />
      </Page>
    </Document>
  )
}

const ALCANCE_PRELIMINAR = [
  'Este es un presupuesto orientativo, armado con la lista de precios de MCP y las medidas que cargaste en la calculadora de la web.',
  'El precio final se confirma después de relevar tu espacio y definir el diseño. Los trabajos en L se cotizan aparte. No incluye pileta, grifería, electrodomésticos ni instalaciones de agua, gas o electricidad.',
]

const PASOS_PRELIMINAR = [
  `Escribinos por WhatsApp al ${WHATSAPP_VISIBLE} con este presupuesto y, si podés, una foto de tu cocina.`,
  'Coordinamos la medición de tu espacio y ajustamos el diseño a tus necesidades.',
  'Te enviamos el presupuesto final con el detalle completo y la forma de pago por etapas.',
]

export function PropuestaPreliminarPdf({ numero, data }: { numero: string; data: PreliminarData }) {
  return (
    <Document title={`Presupuesto preliminar MCP Muebles - ${data.cliente}`} author="MCP Muebles">
      <Page size="A4" style={s.page}>
        <Encabezado etiqueta="PRESUPUESTO PRELIMINAR" numero={numero} />

        <View style={s.box}>
          <DatoCaja label="CLIENTE" value={data.cliente} width="50%" />
          <DatoCaja label="FECHA" value={formatearFecha(data.fecha)} width="25%" />
          <DatoCaja label="VÁLIDO HASTA" value={venceEl(data.fecha, data.validezDias)} width="25%" />
          <DatoCaja label="PROYECTO" value={`Cocina a medida · línea ${data.linea}`} width="100%" />
        </View>

        <Text style={s.title}>Tu cocina a medida, línea {data.linea}</Text>
        <Text style={s.subtitle}>Presupuesto orientativo según la calculadora de mcpmuebles.com</Text>

        <Seccion>QUÉ INCLUYE LA LÍNEA {data.linea.toUpperCase()}</Seccion>
        <Viñetas items={data.incluye} />

        <View wrap={false}>
          <Seccion>DETALLE DE TU COCINA</Seccion>
          <View style={s.thead}>
            <Text style={[s.th, s.cDesc]}>MÓDULO</Text>
            <Text style={[s.th, s.cMoney]}>MEDIDA</Text>
            <Text style={[s.th, s.cMoney]}>PRECIO</Text>
          </View>
          {data.modulos.map((modulo) => (
            <View key={modulo.nombre} style={s.tr}>
              <Text style={s.cDesc}>{modulo.nombre}</Text>
              <Text style={s.cMoney}>{modulo.medida} m</Text>
              <Text style={[s.cMoney, s.bold]}>{pesos(modulo.precio)}</Text>
            </View>
          ))}
          <View style={s.totalBar}>
            <Text style={s.totalLabel}>TOTAL ORIENTATIVO</Text>
            <Text style={s.totalValue}>{pesos(data.total)}</Text>
          </View>
          <Text style={[s.note, { marginTop: 6 }]}>
            {data.notaColocacion}. Precios de lista actualizados a {data.preciosActualizados}, en pesos.
          </Text>
        </View>

        <View wrap={false}>
          <Seccion>FORMA DE PAGO: TU COCINA AVANZA POR ETAPAS</Seccion>
          <Text style={s.note}>
            No necesitás abonar todo junto: pagás a medida que el proyecto avanza. Los montos de cada
            etapa se detallan en el presupuesto final.
          </Text>
          {ETAPAS.map((etapa, i) => (
            <View key={etapa.titulo} style={s.etapa}>
              <Text style={s.etapaNum}>ETAPA {i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.etapaTitulo}>{etapa.titulo}</Text>
                <Text style={s.etapaTexto}>
                  {i === 2 && !data.conColocacion
                    ? 'Mano de obra especializada MCP: armado de los módulos y entrega en tu domicilio.'
                    : etapa.explicacion}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Seccion>¿CÓMO SEGUIMOS?</Seccion>
          <Pasos pasos={PASOS_PRELIMINAR} />
        </View>

        <View wrap={false}>
          <Seccion>CALIDAD Y EXPERIENCIA MCP MUEBLES</Seccion>
          <Parrafos items={CALIDAD} />
        </View>
        <View wrap={false}>
          <Seccion>IMPORTANTE</Seccion>
          <Parrafos items={ALCANCE_PRELIMINAR} />
        </View>

        <Text style={s.gracias}>
          Gracias por confiar en MCP Muebles. Diseñamos espacios pensados para tu vida.
        </Text>
        <Pie numero={numero} />
      </Page>
    </Document>
  )
}

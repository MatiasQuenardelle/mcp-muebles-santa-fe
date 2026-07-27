import { ImageResponse } from 'next/og'

export const alt = 'MCP - Cocinas a Medida en Santa Fe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#141210',
          color: '#ffffff',
          padding: '80px',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            letterSpacing: 10,
            color: '#c8a35a',
            textTransform: 'uppercase',
          }}
        >
          MCP · Muebles a Medida
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>
            Cocinas a medida en Santa Fe
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: '#c8a35a', marginTop: 28 }}>
            Instaladas y funcionando · Desde $660.000
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#b8b2a8' }}>
          20 años de experiencia · Presupuesto gratis por WhatsApp
        </div>
      </div>
    ),
    size
  )
}

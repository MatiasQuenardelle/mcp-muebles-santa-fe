import { ImageResponse } from 'next/og'

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageContentType = 'image/png'

interface OgImageOptions {
  heading: string
  highlight: string
  footer: string
}

export function renderOgImage({ heading, highlight, footer }: OgImageOptions) {
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
            {heading}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: '#c8a35a', marginTop: 28 }}>
            {highlight}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#b8b2a8' }}>{footer}</div>
      </div>
    ),
    ogImageSize
  )
}

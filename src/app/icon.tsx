import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: '#0F0F14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* calendar top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: 'linear-gradient(90deg, #10b981, #8b5cf6)',
            borderRadius: '7px 7px 0 0',
            display: 'flex',
          }}
        />
        {/* "30" */}
        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            fontWeight: 900,
            color: '#F0EDF8',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          30
        </div>
      </div>
    ),
    { ...size },
  )
}

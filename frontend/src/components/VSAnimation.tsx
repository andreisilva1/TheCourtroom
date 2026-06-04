interface Props {
  size?: 'sm' | 'lg'
}

export default function VSAnimation({ size = 'lg' }: Props) {
  const dim = size === 'lg' ? 160 : 96
  const fontSize = size === 'lg' ? '3rem' : '1.75rem'

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: dim, height: dim }}
    >
      {/* Outer dashed ring */}
      <div
        className="absolute inset-0 rounded-full spin-slow"
        style={{ border: '2px dashed rgba(232,0,26,0.30)' }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full spin-slow-rev"
        style={{
          inset: '18%',
          border: '1px solid rgba(232,0,26,0.15)',
        }}
      />
      {/* VS text */}
      <span
        className="relative z-10 font-black select-none vs-scale"
        style={{
          fontSize,
          color: '#E8001A',
          letterSpacing: '-0.04em',
        }}
      >
        VS
      </span>
    </div>
  )
}

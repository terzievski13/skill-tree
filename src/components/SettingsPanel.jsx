import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { themes, THEME_CYCLE, THEME_LABELS } from '../utils/themes'
import { FONTS, FONT_KEYS } from '../utils/fonts'

const EDGE_STYLES = [
  { key: 'smoothstep', label: 'Smooth' },
  { key: 'step', label: 'Stepped' },
  { key: 'straight', label: 'Straight' },
]

const DOT_DENSITIES = [
  { key: 'small', label: 'S' },
  { key: 'medium', label: 'M' },
  { key: 'large', label: 'L' },
]

export default function SettingsPanel({ onClose, triggerRef }) {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const font = useStore((s) => s.font)
  const setFont = useStore((s) => s.setFont)
  const dotDensity = useStore((s) => s.dotDensity)
  const setDotDensity = useStore((s) => s.setDotDensity)
  const autoExpand = useStore((s) => s.autoExpand)
  const setAutoExpand = useStore((s) => s.setAutoExpand)
  const edgeStyle = useStore((s) => s.edgeStyle)
  const setEdgeStyle = useStore((s) => s.setEdgeStyle)
  const t = themes[theme] || themes.light

  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (triggerRef?.current && triggerRef.current.contains(e.target)) return
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, triggerRef])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 44,
        right: 0,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.dropdownShadow,
        width: 240,
        zIndex: 600,
        overflow: 'hidden',
      }}
    >
      {/* Theme section */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}` }}>
        <p style={sectionLabel(t)}>Theme</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          {THEME_CYCLE.map((key) => {
            const isActive = theme === key
            const th = themes[key]
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: `1px solid ${isActive ? t.primary : 'transparent'}`,
                  background: isActive ? t.primaryLight : 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.hoverBg }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: th.canvasBg,
                  border: `1px solid ${th.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: th.primary }} />
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? t.primaryText : t.textPrimary,
                  flex: 1,
                }}>
                  {THEME_LABELS[key]}
                </span>
                {isActive && <span style={{ fontSize: 11, color: t.primary }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Font section */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}` }}>
        <p style={sectionLabel(t)}>Font</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          {FONT_KEYS.map((key) => {
            const f = FONTS[key]
            const isActive = font === key
            return (
              <button
                key={key}
                onClick={() => setFont(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: `1px solid ${isActive ? t.primary : 'transparent'}`,
                  background: isActive ? t.primaryLight : 'none',
                  cursor: 'pointer',
                  fontFamily: f.family,
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? t.primaryText : t.textPrimary,
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.hoverBg }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <span style={{ flex: 1 }}>{f.label}</span>
                {isActive && <span style={{ fontSize: 11, color: t.primary, fontFamily: 'inherit' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Canvas section */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}` }}>
        <p style={sectionLabel(t)}>Canvas</p>

        <div style={{ marginTop: 10 }}>
          <p style={rowLabel(t)}>Edge style</p>
          <div style={segmentedRow}>
            {EDGE_STYLES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setEdgeStyle(key)}
                style={segmentBtn(t, edgeStyle === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <p style={rowLabel(t)}>Dot density</p>
          <div style={segmentedRow}>
            {DOT_DENSITIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDotDensity(key)}
                style={segmentBtn(t, dotDensity === key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Behavior section */}
      <div style={{ padding: '12px 14px' }}>
        <p style={sectionLabel(t)}>Behavior</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textPrimary }}>Auto-expand details</span>
          <button
            onClick={() => setAutoExpand(!autoExpand)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              border: 'none',
              background: autoExpand ? t.primary : t.border,
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#FFFFFF',
              position: 'absolute',
              top: 3,
              left: autoExpand ? 19 : 3,
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function sectionLabel(t) {
  return {
    margin: 0,
    fontSize: 10,
    fontWeight: 600,
    color: t.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }
}

function rowLabel(t) {
  return {
    margin: '0 0 6px',
    fontSize: 12,
    color: t.textSecondary,
  }
}

const segmentedRow = {
  display: 'flex',
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid transparent',
  gap: 0,
}

function segmentBtn(t, active) {
  return {
    flex: 1,
    padding: '5px 0',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    background: active ? t.primary : t.surface,
    color: active ? '#FFFFFF' : t.textSecondary,
    fontWeight: active ? 500 : 400,
    marginRight: 4,
  }
}

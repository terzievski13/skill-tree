import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import StatusBadge from './StatusBadge'
import { STATUS_CYCLE, generateId } from '../utils/defaults'
import { themes } from '../utils/themes'

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
}

export default function DetailPanel() {
  const detailNodeId = useStore((s) => s.detailNodeId)
  const setDetailNode = useStore((s) => s.setDetailNode)
  const updateData = useStore((s) => s.updateNodeData)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  // Subscribe directly to the specific node's data so the panel re-renders on changes
  const node = useStore((s) => {
    if (!s.detailNodeId) return null
    return (s.treeData[s.activeTreeId]?.nodes || []).find((n) => n.id === s.detailNodeId) || null
  })
  const data = node?.data

  const [addingLink, setAddingLink] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    setAddingLink(false)
    setLinkTitle('')
    setLinkUrl('')
  }, [detailNodeId])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setDetailNode(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setDetailNode])

  if (!node) return null

  const update = (patch) => updateData(detailNodeId, patch)

  const saveLink = () => {
    const title = linkTitle.trim() || linkUrl.trim()
    const url = linkUrl.trim()
    if (!url) return
    update({ links: [...(data.links || []), { id: generateId('link'), title, url }] })
    setLinkTitle('')
    setLinkUrl('')
    setAddingLink(false)
  }

  const deleteLink = (linkId) => {
    update({ links: (data.links || []).filter((l) => l.id !== linkId) })
  }

  const inputStyle = {
    width: '100%',
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    color: t.textPrimary,
    background: t.inputBg,
  }

  const textareaStyle = {
    width: '100%',
    resize: 'vertical',
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 14,
    color: t.textPrimary,
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: 1.5,
    background: t.inputBg,
  }

  return (
    <>
      <div
        onClick={() => setDetailNode(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 400 }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: window.innerWidth < 640 ? 0 : 56,
          right: 0,
          bottom: 0,
          width: window.innerWidth < 640 ? '100%' : 380,
          background: t.surface,
          borderLeft: `1px solid ${t.border}`,
          boxShadow: t.panelShadow,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.18s ease-out',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(40px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input
              value={data.label}
              onChange={(e) => update({ label: e.target.value })}
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: 600,
                color: t.textPrimary,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                lineHeight: '1.3',
              }}
            />
            <button
              onClick={() => setDetailNode(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: t.textSecondary, padding: '4px 8px',
                lineHeight: 1, flexShrink: 0, minWidth: 36, minHeight: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Status toggle */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {STATUS_CYCLE.map((s) => (
              <button
                key={s}
                onClick={() => update({ status: s })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${data.status === s ? t.primary : t.border}`,
                  background: data.status === s ? t.primaryLight : t.surface,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: data.status === s ? t.primaryText : t.textSecondary,
                  fontFamily: 'inherit',
                }}
              >
                <StatusBadge status={s} size={8} />
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <Section label="Notes" t={t}>
            <textarea
              value={data.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Add notes..."
              rows={5}
              style={textareaStyle}
            />
          </Section>

          <Section label="Links" t={t}>
            {(data.links || []).map((link) => (
              <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, fontSize: 14, color: t.primary, textDecoration: 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  title={link.url}
                >
                  {link.title || link.url}
                </a>
                <button
                  onClick={() => deleteLink(link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: t.textSecondary, fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0,
                  }}
                  title="Remove link"
                >
                  ✕
                </button>
              </div>
            ))}

            {addingLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                <input
                  placeholder="Title (optional)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="URL"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveLink() }}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveLink} style={primaryBtn(t)}>Save</button>
                  <button onClick={() => setAddingLink(false)} style={secondaryBtn(t)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingLink(true)}
                style={{
                  background: 'none',
                  border: `1px dashed ${t.border}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                  color: t.textSecondary,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                  marginTop: 4,
                }}
              >
                + Add Link
              </button>
            )}
          </Section>

          <Section label="Resources" t={t}>
            <textarea
              value={data.resources}
              onChange={(e) => update({ resources: e.target.value })}
              placeholder="Books, videos, files..."
              rows={4}
              style={textareaStyle}
            />
          </Section>
        </div>
      </div>
    </>
  )
}

function Section({ label, t, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: t.sectionLabel,
        textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
      }}>
        {label}
      </p>
      {children}
    </div>
  )
}

const primaryBtn = (t) => ({
  padding: '6px 14px', borderRadius: 6, border: 'none',
  background: t.primary, color: '#FFFFFF', cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
})

const secondaryBtn = (t) => ({
  padding: '6px 14px', borderRadius: 6, border: `1px solid ${t.border}`,
  background: t.surface, color: t.textSecondary, cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
})

import { useEffect, useState } from 'react'
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
  const deleteNode = useStore((s) => s.deleteNode)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const node = useStore((s) => {
    if (!s.detailNodeId) return null
    return (s.treeData[s.activeTreeId]?.nodes || []).find((n) => n.id === s.detailNodeId) || null
  })
  const data = node?.data

  const [addingLink, setAddingLink] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setAddingLink(false)
    setLinkTitle('')
    setLinkUrl('')
    setConfirmDelete(false)
  }, [detailNodeId])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setDetailNode(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setDetailNode])

  if (!node) return null

  const isMobile = window.innerWidth < 640
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
    borderRadius: 7,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    color: t.textPrimary,
    background: t.inputBg,
    transition: 'border-color 0.15s ease',
  }

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    lineHeight: 1.6,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDetailNode(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 400 }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: isMobile ? 0 : 56,
          right: 0,
          bottom: 0,
          width: isMobile ? '100%' : 360,
          background: t.surface,
          borderLeft: `1px solid ${t.border}`,
          boxShadow: t.panelShadow,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.18s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(24px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <input
              value={data.label}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="Node title"
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '-0.01em',
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
                fontSize: 18, color: t.textTertiary, padding: '4px 6px',
                lineHeight: 1, flexShrink: 0, borderRadius: 6,
                transition: 'color 0.12s ease, background 0.12s ease',
                minWidth: 32, minHeight: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.textPrimary
                e.currentTarget.style.background = t.hoverBg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = t.textTertiary
                e.currentTarget.style.background = 'none'
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 5 }}>
            {STATUS_CYCLE.map((s) => {
              const active = data.status === s
              return (
                <button
                  key={s}
                  onClick={() => update({ status: s })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${active ? t.primary : t.border}`,
                    background: active ? t.primaryLight : 'transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? t.primaryText : t.textSecondary,
                    fontFamily: 'inherit',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <StatusBadge status={s} size={7} />
                  {STATUS_LABELS[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

          <Section label="Notes" t={t}>
            <textarea
              value={data.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Add notes…"
              rows={5}
              style={textareaStyle}
            />
          </Section>

          <Section label="Links" t={t}>
            {(data.links || []).map((link) => (
              <div key={link.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 6, padding: '6px 8px',
                background: t.inputBg, borderRadius: 7,
                border: `1px solid ${t.border}`,
              }}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, fontSize: 13, color: t.primary,
                    textDecoration: 'none', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  title={link.url}
                >
                  {link.title || link.url}
                </a>
                <button
                  onClick={() => deleteLink(link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: t.textTertiary, fontSize: 14, padding: '2px 4px',
                    lineHeight: 1, flexShrink: 0, borderRadius: 4,
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = t.textTertiary)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}

            {addingLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <input
                  placeholder="Title (optional)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveLink() }}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveLink} style={filledBtn(t)}>Save</button>
                  <button onClick={() => setAddingLink(false)} style={outlineBtn(t)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingLink(true)}
                style={{
                  background: 'none',
                  border: `1px dashed ${t.border}`,
                  borderRadius: 7,
                  padding: '7px 12px',
                  fontSize: 13,
                  color: t.textSecondary,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                  marginTop: 2,
                  transition: 'border-color 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.primary
                  e.currentTarget.style.color = t.primaryText
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.border
                  e.currentTarget.style.color = t.textSecondary
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
              placeholder="Books, videos, files…"
              rows={4}
              style={textareaStyle}
            />
          </Section>

          {/* Delete */}
          <div style={{ marginTop: 4, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 7,
                border: `1px solid rgba(239,68,68,0.3)`,
                background: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
                e.currentTarget.style.borderColor = '#EF4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
              }}
            >
              Delete Node
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, background: t.modalOverlay,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: 14, padding: '24px 28px',
              width: 320, boxShadow: t.modalShadow, border: `1px solid ${t.border}`,
            }}
          >
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 15, color: t.textPrimary }}>
              Delete node?
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}>
              "{data.label}" and all its connections will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={outlineBtn(t)}>Cancel</button>
              <button
                onClick={() => { deleteNode(detailNodeId); setConfirmDelete(false) }}
                style={{
                  padding: '7px 16px', borderRadius: 7, border: 'none',
                  background: '#EF4444', color: '#FFFFFF', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, t, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 10, fontWeight: 600, color: t.sectionLabel,
        textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px',
      }}>
        {label}
      </p>
      {children}
    </div>
  )
}

const filledBtn = (t) => ({
  padding: '6px 14px', borderRadius: 7, border: 'none',
  background: t.primary, color: '#FFFFFF', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
})

const outlineBtn = (t) => ({
  padding: '6px 14px', borderRadius: 7, border: `1px solid ${t.border}`,
  background: 'transparent', color: t.textSecondary, cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
})

import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { themes } from '../utils/themes'

export default function TreeSelector({ onClose }) {
  const trees = useStore((s) => s.trees)
  const activeTreeId = useStore((s) => s.activeTreeId)
  const switchTree = useStore((s) => s.switchTree)
  const createTree = useStore((s) => s.createTree)
  const renameTree = useStore((s) => s.renameTree)
  const deleteTree = useStore((s) => s.deleteTree)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const ref = useRef(null)
  const newInputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    if (creatingNew && newInputRef.current) newInputRef.current.focus()
  }, [creatingNew])

  const submitCreate = () => {
    const name = newName.trim() || 'New Tree'
    createTree(name)
    setNewName('')
    setCreatingNew(false)
    onClose()
  }

  const submitRename = (id) => {
    const name = renameDraft.trim()
    if (name) renameTree(id, name)
    setRenamingId(null)
  }

  const inputStyle = {
    flex: 1, border: `1px solid ${t.primary}`, borderRadius: 4,
    padding: '2px 6px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: t.inputBg, color: t.textPrimary,
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 44, right: 0,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.dropdownShadow,
        minWidth: 240, zIndex: 600, overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 12px 6px', borderBottom: `1px solid ${t.border}` }}>
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 600, color: t.sectionLabel,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Trees
        </p>
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {trees.map((tree) => {
          const isActive = tree.id === activeTreeId
          return (
            <div
              key={tree.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '8px 12px',
                background: isActive ? t.primaryLight : 'transparent',
                cursor: 'pointer', gap: 8,
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.hoverBg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? t.primaryLight : 'transparent' }}
            >
              {renamingId === tree.id ? (
                <input
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => submitRename(tree.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(tree.id)
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={inputStyle}
                />
              ) : (
                <span
                  onClick={() => { switchTree(tree.id); onClose() }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setRenamingId(tree.id)
                    setRenameDraft(tree.name)
                  }}
                  style={{
                    flex: 1, fontSize: 14,
                    color: isActive ? t.primaryText : t.textPrimary,
                    fontWeight: isActive ? 500 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {tree.name}
                </span>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(tree.id) }}
                title="Delete tree"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: t.border, fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = t.border)}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: `1px solid ${t.border}` }}>
        {creatingNew ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              ref={newInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreate()
                if (e.key === 'Escape') setCreatingNew(false)
              }}
              placeholder="Tree name..."
              style={{
                flex: 1, border: `1px solid ${t.border}`, borderRadius: 6,
                padding: '6px 8px', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', background: t.inputBg, color: t.textPrimary,
              }}
            />
            <button
              onClick={submitCreate}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: t.primary, color: '#FFFFFF', cursor: 'pointer',
                fontSize: 13, fontFamily: 'inherit',
              }}
            >
              Create
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingNew(true)}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: 6,
              border: `1px solid ${t.border}`, background: t.surface,
              cursor: 'pointer', fontSize: 13, color: t.textSecondary,
              fontFamily: 'inherit', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = t.surface)}
          >
            + New Tree
          </button>
        )}
      </div>

      {confirmDeleteId && (
        <DeleteTreeModal
          name={trees.find((tr) => tr.id === confirmDeleteId)?.name}
          t={t}
          onConfirm={() => { deleteTree(confirmDeleteId); setConfirmDeleteId(null) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}

function DeleteTreeModal({ name, t, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: t.modalOverlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface, borderRadius: 12, padding: '24px 28px',
          width: 320, boxShadow: t.modalShadow, border: `1px solid ${t.border}`,
        }}
      >
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 16, color: t.textPrimary }}>
          Delete tree?
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: t.textSecondary }}>
          "{name}" and all its nodes will be permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${t.border}`,
              background: t.surface, cursor: 'pointer', fontSize: 14,
              color: t.textPrimary, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: '#EF4444', color: '#FFFFFF', cursor: 'pointer',
              fontSize: 14, fontFamily: 'inherit',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

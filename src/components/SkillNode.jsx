import { useState, useRef, useEffect, useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import StatusBadge from './StatusBadge'
import useStore from '../store/useStore'
import { themes } from '../utils/themes'

export default function SkillNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const [contextMenu, setContextMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef(null)

  const cycleStatus = useStore((s) => s.cycleNodeStatus)
  const updateData = useStore((s) => s.updateNodeData)
  const deleteNode = useStore((s) => s.deleteNode)
  const duplicateNode = useStore((s) => s.duplicateNode)
  const setDetailNode = useStore((s) => s.setDetailNode)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  useEffect(() => {
    setDraft(data.label)
  }, [data.label])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commitEdit = useCallback(() => {
    setEditing(false)
    const trimmed = draft.trim() || 'New Node'
    updateData(id, { label: trimmed })
    setDraft(trimmed)
  }, [draft, id, updateData])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setDraft(data.label)
      setEditing(false)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const isDone = data.status === 'done'

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        style={{
          background: isDone ? t.nodeBgDone : t.nodeBg,
          border: `${selected ? '2px' : '1px'} solid ${selected ? t.primary : t.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          minWidth: 150,
          maxWidth: 280,
          boxShadow: t.shadow,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'default',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <StatusBadge
          status={data.status}
          size={10}
          onClick={(e) => {
            e?.stopPropagation()
            cycleStatus(id)
          }}
        />

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'inherit',
              background: 'transparent',
              minWidth: 0,
              color: t.textPrimary,
            }}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
            style={{
              flex: 1,
              fontSize: 14,
              color: t.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '1.4',
            }}
          >
            {data.label}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setDetailNode(id)
          }}
          title="Open details"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            color: t.textSecondary,
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ⋮
        </button>

        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#94A3B8', width: 8, height: 8 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#94A3B8', width: 8, height: 8 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{ background: '#94A3B8', width: 8, height: 8 }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{ background: '#94A3B8', width: 8, height: 8 }}
        />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          t={t}
          onClose={() => setContextMenu(null)}
          onDelete={() => { setContextMenu(null); setConfirmDelete(true) }}
          onDuplicate={() => { setContextMenu(null); duplicateNode(id) }}
          onCycleStatus={() => { setContextMenu(null); cycleStatus(id) }}
        />
      )}

      {confirmDelete && (
        <DeleteConfirmModal
          label={data.label}
          t={t}
          onConfirm={() => { setConfirmDelete(false); deleteNode(id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}

function ContextMenu({ x, y, t, onClose, onDelete, onDuplicate, onCycleStatus }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items = [
    { label: 'Cycle Status', action: onCycleStatus },
    { label: 'Duplicate Node', action: onDuplicate },
    { label: 'Delete Node', action: onDelete, danger: true },
  ]

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y, left: x,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        boxShadow: t.dropdownShadow,
        zIndex: 9999,
        minWidth: 160,
        overflow: 'hidden',
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: item.danger ? '#EF4444' : t.textPrimary,
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function DeleteConfirmModal({ label, t, onConfirm, onCancel }) {
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
          Delete node?
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: t.textSecondary }}>
          "{label}" and all its connections will be removed.
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

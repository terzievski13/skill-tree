import { useState, useRef, useEffect, useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import StatusBadge from './StatusBadge'
import useStore from '../store/useStore'
import { themes } from '../utils/themes'

export default function SkillNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef(null)
  const longPressTimer = useRef(null)

  const cycleStatus = useStore((s) => s.cycleNodeStatus)
  const updateData = useStore((s) => s.updateNodeData)
  const setDetailNode = useStore((s) => s.setDetailNode)
  const setContextMenuNode = useStore((s) => s.setContextMenuNode)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  useEffect(() => { setDraft(data.label) }, [data.label])

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
    if (e.key === 'Escape') { setDraft(data.label); setEditing(false) }
  }

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    const x = touch.clientX
    const y = touch.clientY
    longPressTimer.current = setTimeout(() => {
      setContextMenuNode({ id, x, y })
    }, 500)
  }, [id, setContextMenuNode])

  const handleTouchEnd = useCallback(() => { clearTimeout(longPressTimer.current) }, [])
  const handleTouchMove = useCallback(() => { clearTimeout(longPressTimer.current) }, [])

  const isDone = data.status === 'done'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{
        background: isDone ? t.nodeBgDone : t.nodeBg,
        border: `${selected ? '2px' : '1px'} solid ${selected ? t.primary : t.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 150,
        maxWidth: 280,
        boxShadow: hovered && !selected ? t.shadowHover : t.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'default',
        userSelect: 'none',
        position: 'relative',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <StatusBadge
        status={data.status}
        size={10}
        onClick={(e) => { e?.stopPropagation(); cycleStatus(id) }}
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
            flex: 1, border: 'none', outline: 'none',
            fontSize: 14, fontFamily: 'inherit',
            background: 'transparent', minWidth: 0, color: t.textPrimary,
          }}
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          style={{
            flex: 1, fontSize: 14, color: t.textPrimary,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', lineHeight: '1.4',
          }}
        >
          {data.label}
        </span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); setDetailNode(id) }}
        title="Open details"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 2px', color: t.textSecondary,
          fontSize: 16, lineHeight: 1, flexShrink: 0,
        }}
      >
        ⋮
      </button>

      <Handle type="target" position={Position.Top} style={{ background: '#94A3B8', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#94A3B8', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#94A3B8', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#94A3B8', width: 8, height: 8 }} />
    </div>
  )
}

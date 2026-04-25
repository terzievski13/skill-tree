import { useState } from 'react'
import useStore from '../store/useStore'
import TreeSelector from './TreeSelector'
import { themes, THEME_CYCLE, THEME_LABELS } from '../utils/themes'

export default function Toolbar({ onAddNode }) {
  const getActiveTree = useStore((s) => s.getActiveTree)
  const renameTree = useStore((s) => s.renameTree)
  const cycleTheme = useStore((s) => s.cycleTheme)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const activeTree = getActiveTree()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [showSelector, setShowSelector] = useState(false)

  const commitRename = () => {
    const name = nameDraft.trim()
    if (name && activeTree) renameTree(activeTree.id, name)
    setEditingName(false)
  }

  const nextTheme = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]

  return (
    <div
      style={{
        height: 56,
        background: t.toolbarBg,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        position: 'relative',
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      {editingName ? (
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditingName(false)
          }}
          autoFocus
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: t.textPrimary,
            border: 'none',
            borderBottom: `2px solid ${t.primary}`,
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            minWidth: 120,
          }}
        />
      ) : (
        <span
          onClick={() => {
            setNameDraft(activeTree?.name || '')
            setEditingName(true)
          }}
          title="Click to rename"
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: t.textPrimary,
            cursor: 'text',
            userSelect: 'none',
          }}
        >
          {activeTree?.name || 'Loading...'}
        </span>
      )}

      <button
        onClick={onAddNode}
        title="Add node"
        style={btnStyle(t)}
        onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = t.surface)}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        Add Node
      </button>

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        title={`Switch to ${THEME_LABELS[nextTheme]} theme`}
        style={{ ...btnStyle(t), gap: 4 }}
        onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = t.surface)}
      >
        {theme === 'light' ? '◑' : theme === 'dark' ? '◐' : '◉'} {THEME_LABELS[theme]}
      </button>

      {/* Tree selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSelector((v) => !v)}
          title="Switch tree"
          style={{
            ...btnStyle(t),
            background: showSelector ? t.primaryLight : t.surface,
            color: showSelector ? t.primaryText : t.textPrimary,
            borderColor: showSelector ? t.primary : t.border,
          }}
          onMouseEnter={(e) => !showSelector && (e.currentTarget.style.background = t.hoverBg)}
          onMouseLeave={(e) => !showSelector && (e.currentTarget.style.background = t.surface)}
        >
          Trees ▾
        </button>

        {showSelector && <TreeSelector onClose={() => setShowSelector(false)} />}
      </div>
    </div>
  )
}

function btnStyle(t) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.surface,
    cursor: 'pointer',
    fontSize: 13,
    color: t.textPrimary,
    fontFamily: 'inherit',
  }
}

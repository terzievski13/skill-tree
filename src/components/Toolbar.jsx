import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import TreeSelector from './TreeSelector'
import SettingsPanel from './SettingsPanel'
import { themes } from '../utils/themes'

export default function Toolbar({ onAddNode }) {
  const getActiveTree = useStore((s) => s.getActiveTree)
  const renameTree = useStore((s) => s.renameTree)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const activeTree = getActiveTree()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [showSelector, setShowSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const settingsBtnRef = useRef(null)
  const selectorBtnRef = useRef(null)

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const isMobile = windowWidth < 640

  const commitRename = () => {
    const name = nameDraft.trim()
    if (name && activeTree) renameTree(activeTree.id, name)
    setEditingName(false)
  }

  return (
    <div
      style={{
        height: 56,
        background: t.toolbarBg,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 10px' : '0 16px',
        gap: isMobile ? 8 : 12,
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
            fontSize: isMobile ? 15 : 18,
            fontWeight: 600,
            color: t.textPrimary,
            border: 'none',
            borderBottom: `2px solid ${t.primary}`,
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            minWidth: 80,
            maxWidth: isMobile ? 130 : 'none',
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
            fontSize: isMobile ? 15 : 18,
            fontWeight: 600,
            color: t.textPrimary,
            cursor: 'text',
            userSelect: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: isMobile ? 130 : 'none',
            flexShrink: isMobile ? 1 : 0,
          }}
        >
          {activeTree?.name || 'Loading...'}
        </span>
      )}

      <button
        onClick={onAddNode}
        title="Add node"
        style={isMobile ? compactBtnStyle(t) : btnStyle(t)}
        onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = t.surface)}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        {!isMobile && 'Add Node'}
      </button>

      <div style={{ flex: 1 }} />

      {/* Tree selector */}
      <div style={{ position: 'relative' }}>
        <button
          ref={selectorBtnRef}
          onClick={() => { setShowSelector((v) => !v); setShowSettings(false) }}
          title="Switch tree"
          style={{
            ...(isMobile ? compactBtnStyle(t) : btnStyle(t)),
            background: showSelector ? t.hoverBg : t.surface,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = showSelector ? t.hoverBg : t.surface)}
        >
          {isMobile ? '≡' : 'Trees ▾'}
        </button>
        {showSelector && <TreeSelector onClose={() => setShowSelector(false)} triggerRef={selectorBtnRef} />}
      </div>

      {/* Settings */}
      <div style={{ position: 'relative' }}>
        <button
          ref={settingsBtnRef}
          onClick={() => { setShowSettings((v) => !v); setShowSelector(false) }}
          title="Settings"
          style={{
            ...(isMobile ? compactBtnStyle(t) : btnStyle(t)),
            background: showSettings ? t.hoverBg : t.surface,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = showSettings ? t.hoverBg : t.surface)}
        >
          {isMobile ? '⚙' : 'Settings'}
        </button>
        {showSettings && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, top: 56, zIndex: 590 }}
              onClick={() => setShowSettings(false)}
            />
            <SettingsPanel onClose={() => setShowSettings(false)} triggerRef={settingsBtnRef} />
          </>
        )}
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

function compactBtnStyle(t) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.surface,
    cursor: 'pointer',
    fontSize: 16,
    color: t.textPrimary,
    fontFamily: 'inherit',
    minWidth: 36,
  }
}

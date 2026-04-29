import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  PanOnScrollMode,
  SelectionMode,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import useStore from '../store/useStore'
import SkillNode from './SkillNode'
import OffsetEdge from './OffsetEdge'
import { themes } from '../utils/themes'

const nodeTypes = { skillNode: SkillNode }
const edgeTypes = { offset: OffsetEdge }


function CanvasInner() {
  const nodes = useStore((s) => s.getNodes())
  const edges = useStore((s) => s.getEdges())
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const addNode = useStore((s) => s.addNode)
  const deleteNode = useStore((s) => s.deleteNode)
  const deleteNodes = useStore((s) => s.deleteNodes)
  const duplicateNode = useStore((s) => s.duplicateNode)
  const cycleStatus = useStore((s) => s.cycleNodeStatus)
  const saveSnapshot = useStore((s) => s.saveSnapshot)
  const setDetailNode = useStore((s) => s.setDetailNode)
  const detailNodeId = useStore((s) => s.detailNodeId)
  const contextMenuNode = useStore((s) => s.contextMenuNode)
  const setContextMenuNode = useStore((s) => s.setContextMenuNode)
  const theme = useStore((s) => s.theme)
  const dotDensity = useStore((s) => s.dotDensity)
  const autoExpand = useStore((s) => s.autoExpand)
  const activeTreeId = useStore((s) => s.activeTreeId)
  const t = themes[theme] || themes.light

  const { screenToFlowPosition, fitView } = useReactFlow()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const [confirmDeleteNodes, setConfirmDeleteNodes] = useState(null) // null | Node[]
  const [mobileEdgeTap, setMobileEdgeTap] = useState(null)
  const selectedNodeIdRef = useRef(null)
  const selectedEdgeIdRef = useRef(null)
  // Mobile double-tap tracking
  const lastPaneTapRef = useRef({ time: 0, x: 0, y: 0 })
  const touchStartRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(
      () => fitView({ padding: 0.3, ...(isMobile ? {} : { maxZoom: 0.8 }) }),
      50
    )
    return () => clearTimeout(t)
  }, [activeTreeId, fitView, isMobile])

  const DOT_DENSITY_MAP = { small: { gap: 14, size: 1.0 }, medium: { gap: 22, size: 1.5 }, large: { gap: 35, size: 2.0 } }
  const { gap: dotGap, size: dotSize } = DOT_DENSITY_MAP[dotDensity] || DOT_DENSITY_MAP.medium

  const defaultEdgeOptions = {
    type: 'offset',
    style: { stroke: '#94A3B8', strokeWidth: 2 },
  }

  // Force all edges through the custom edge type for selection highlighting
  const augmentedEdges = useMemo(
    () => edges.map((e) => ({ ...e, type: 'offset' })),
    [edges]
  )

  // Desktop double-click on canvas pane to add a node.
  // onPaneDoubleClick is not a real ReactFlow 11 prop, so we handle it on the wrapper div.
  const handleContainerDblClick = useCallback(
    (e) => {
      if (
        e.target.closest('.react-flow__node') ||
        e.target.closest('.react-flow__edge-interaction') ||
        e.target.closest('.react-flow__edge-path') ||
        e.target.closest('.react-flow__controls') ||
        e.target.closest('.react-flow__panel')
      ) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(position)
    },
    [screenToFlowPosition, addNode]
  )

  const handleNodeClick = useCallback(
    (_e, node) => {
      selectedNodeIdRef.current = node.id
      selectedEdgeIdRef.current = null
      setSelectedNode(node.id)
      if (autoExpand) setDetailNode(node.id)
    },
    [setSelectedNode, setDetailNode, autoExpand]
  )

  const handleEdgeClick = useCallback((e, edge) => {
    selectedEdgeIdRef.current = edge.id
    selectedNodeIdRef.current = null
    if (window.innerWidth < 640) {
      setMobileEdgeTap({ id: edge.id, x: e.clientX, y: e.clientY })
    }
  }, [])

  const handlePaneClick = useCallback(() => {
    selectedNodeIdRef.current = null
    selectedEdgeIdRef.current = null
    setSelectedNode(null)
    setContextMenuNode(null)
    setMobileEdgeTap(null)
  }, [setSelectedNode, setContextMenuNode])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        if (detailNodeId) setDetailNode(null)
        if (contextMenuNode) setContextMenuNode(null)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
        if (selectedEdgeIdRef.current) {
          saveSnapshot()
          onEdgesChange([{ type: 'remove', id: selectedEdgeIdRef.current }])
          selectedEdgeIdRef.current = null
          return
        }
        const selected = nodes.filter((n) => n.selected)
        if (selected.length > 0) {
          setConfirmDeleteNodes(selected)
          return
        }
      }
    },
    [detailNodeId, setDetailNode, contextMenuNode, setContextMenuNode, nodes, onEdgesChange, saveSnapshot]
  )

  const onNodeContextMenu = useCallback(
    (e, node) => {
      e.preventDefault()
      setContextMenuNode({ id: node.id, x: e.clientX, y: e.clientY })
    },
    [setContextMenuNode]
  )

  const handleContextMenuDelete = useCallback(() => {
    if (!contextMenuNode) return
    const node = nodes.find((n) => n.id === contextMenuNode.id)
    setContextMenuNode(null)
    if (node) setConfirmDeleteNodes([node])
  }, [contextMenuNode, nodes, setContextMenuNode])

  // Mobile double-tap to add node
  const handleContainerTouchStart = useCallback((e) => {
    // Ignore touches on nodes or edges
    if (e.target.closest('.react-flow__node') || e.target.closest('.react-flow__edge-interaction') || e.target.closest('.react-flow__edge-path')) {
      touchStartRef.current = null
      return
    }
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleContainerTouchEnd = useCallback((e) => {
    const start = touchStartRef.current
    if (!start) return

    const touch = e.changedTouches[0]
    const dx = Math.abs(touch.clientX - start.x)
    const dy = Math.abs(touch.clientY - start.y)
    touchStartRef.current = null

    // Skip if the finger moved (it was a drag/pan, not a tap)
    if (dx > 10 || dy > 10) return
    // Skip if touch ended on a node, edge, or any UI panel (controls, toolbar, etc.)
    if (
      e.target.closest('.react-flow__node') ||
      e.target.closest('.react-flow__edge-interaction') ||
      e.target.closest('.react-flow__edge-path') ||
      e.target.closest('.react-flow__controls') ||
      e.target.closest('.react-flow__panel')
    ) return

    const now = Date.now()
    const last = lastPaneTapRef.current
    const tapDx = Math.abs(touch.clientX - last.x)
    const tapDy = Math.abs(touch.clientY - last.y)

    if (now - last.time < 350 && tapDx < 40 && tapDy < 40) {
      const pos = screenToFlowPosition({ x: touch.clientX, y: touch.clientY })
      addNode(pos)
      lastPaneTapRef.current = { time: 0, x: 0, y: 0 }
    } else {
      lastPaneTapRef.current = { time: now, x: touch.clientX, y: touch.clientY }
    }
  }, [screenToFlowPosition, addNode])

  return (
    <div
      style={{ flex: 1, position: 'relative', touchAction: 'manipulation' }}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleContainerDblClick}
      onTouchStart={handleContainerTouchStart}
      onTouchEnd={handleContainerTouchEnd}
      tabIndex={-1}
    >
      <ReactFlow
        nodes={nodes}
        edges={augmentedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={onNodeContextMenu}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Free}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        fitView
        fitViewOptions={{ padding: 0.3, ...(isMobile ? {} : { maxZoom: 0.8 }) }}
        minZoom={0.1}
        maxZoom={3}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={dotGap}
          size={dotSize}
          color={t.dotColor}
          style={{ background: t.canvasBg }}
        />
        <Controls
          showInteractive={false}
          style={isMobile ? { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)', left: 21} : undefined}
        />
      </ReactFlow>

      {contextMenuNode && (
        <NodeContextMenu
          x={contextMenuNode.x}
          y={contextMenuNode.y}
          t={t}
          onClose={() => setContextMenuNode(null)}
          onCycleStatus={() => { cycleStatus(contextMenuNode.id); setContextMenuNode(null) }}
          onDuplicate={() => { duplicateNode(contextMenuNode.id); setContextMenuNode(null) }}
          onDelete={handleContextMenuDelete}
        />
      )}

      {confirmDeleteNodes && (
        <DeleteConfirmModal
          nodes={confirmDeleteNodes}
          t={t}
          onConfirm={() => {
            if (confirmDeleteNodes.length === 1) {
              deleteNode(confirmDeleteNodes[0].id)
            } else {
              deleteNodes(confirmDeleteNodes.map((n) => n.id))
            }
            selectedNodeIdRef.current = null
            setConfirmDeleteNodes(null)
          }}
          onCancel={() => setConfirmDeleteNodes(null)}
        />
      )}

      {mobileEdgeTap && (
        <MobileEdgeDeletePopup
          x={mobileEdgeTap.x}
          y={mobileEdgeTap.y}
          t={t}
          onDelete={() => {
            saveSnapshot()
            onEdgesChange([{ type: 'remove', id: mobileEdgeTap.id }])
            selectedEdgeIdRef.current = null
            setMobileEdgeTap(null)
          }}
          onCancel={() => setMobileEdgeTap(null)}
        />
      )}
    </div>
  )
}

function NodeContextMenu({ x, y, t, onClose, onDelete, onDuplicate, onCycleStatus }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 175)
  const adjustedY = Math.min(y, window.innerHeight - 130)

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
        top: adjustedY, left: adjustedX,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        boxShadow: t.dropdownShadow,
        zIndex: 9999,
        minWidth: 165,
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
            padding: '10px 14px',
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

function DeleteConfirmModal({ nodes, t, onConfirm, onCancel }) {
  const isSingle = nodes.length === 1
  const label = isSingle ? nodes[0].data.label : null
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onConfirm() }
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onConfirm, onCancel])

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
          {isSingle ? 'Delete node?' : `Delete ${nodes.length} nodes?`}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: t.textSecondary }}>
          {isSingle
            ? `"${label}" and all its connections will be removed.`
            : `${nodes.length} nodes and all their connections will be removed.`}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={secondaryBtn(t)}>Cancel</button>
          <button onClick={onConfirm} style={dangerBtn}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function MobileEdgeDeletePopup({ x, y, t, onDelete, onCancel }) {
  const adjustedX = Math.min(Math.max(x - 60, 8), window.innerWidth - 136)
  const adjustedY = Math.min(Math.max(y - 52, 8), window.innerHeight - 100)

  return (
    <div
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.dropdownShadow,
        zIndex: 9999,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onDelete}
        style={{
          padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, color: '#EF4444', fontFamily: 'inherit',
          borderRight: `1px solid ${t.border}`,
        }}
      >
        Delete Edge
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '10px 12px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, color: t.textSecondary, fontFamily: 'inherit',
        }}
      >
        Cancel
      </button>
    </div>
  )
}

const secondaryBtn = (t) => ({
  padding: '8px 16px', borderRadius: 6, border: `1px solid ${t.border}`,
  background: t.surface, cursor: 'pointer', fontSize: 14, color: t.textPrimary, fontFamily: 'inherit',
})

const dangerBtn = {
  padding: '8px 16px', borderRadius: 6, border: 'none',
  background: '#EF4444', color: '#FFFFFF', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
}

export default function Canvas() {
  return <CanvasInner />
}

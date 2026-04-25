import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import useStore from '../store/useStore'
import SkillNode from './SkillNode'
import { themes } from '../utils/themes'

const nodeTypes = { skillNode: SkillNode }

function CanvasInner() {
  const nodes = useStore((s) => s.getNodes())
  const edges = useStore((s) => s.getEdges())
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const addNode = useStore((s) => s.addNode)
  const deleteNode = useStore((s) => s.deleteNode)
  const saveSnapshot = useStore((s) => s.saveSnapshot)
  const setDetailNode = useStore((s) => s.setDetailNode)
  const detailNodeId = useStore((s) => s.detailNodeId)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const { screenToFlowPosition } = useReactFlow()
  const [confirmDeleteNode, setConfirmDeleteNode] = useState(null)
  const selectedNodeIdRef = useRef(null)
  const selectedEdgeIdRef = useRef(null)

  const defaultEdgeOptions = {
    type: 'smoothstep',
    style: { stroke: '#94A3B8', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#94A3B8', width: 12, height: 12 },
  }

  const handlePaneDoubleClick = useCallback(
    (e) => {
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
    },
    [setSelectedNode]
  )

  const handleEdgeClick = useCallback((_e, edge) => {
    selectedEdgeIdRef.current = edge.id
    selectedNodeIdRef.current = null
  }, [])

  const handlePaneClick = useCallback(() => {
    selectedNodeIdRef.current = null
    selectedEdgeIdRef.current = null
    setSelectedNode(null)
  }, [setSelectedNode])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        if (detailNodeId) setDetailNode(null)
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
        if (selectedNodeIdRef.current) {
          const node = nodes.find((n) => n.id === selectedNodeIdRef.current)
          if (node) setConfirmDeleteNode(node)
          return
        }
      }
    },
    [detailNodeId, setDetailNode, nodes, onEdgesChange, saveSnapshot]
  )

  return (
    <div style={{ flex: 1, position: 'relative' }} onKeyDown={handleKeyDown} tabIndex={-1}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onPaneDoubleClick={handlePaneDoubleClick}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.5}
          color={t.dotColor}
          style={{ background: t.canvasBg }}
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const colors = { not_started: '#9CA3AF', in_progress: '#F59E0B', done: '#10B981' }
            return colors[node.data?.status] || '#9CA3AF'
          }}
          style={{ background: t.miniMapBg, border: `1px solid ${t.border}` }}
        />
      </ReactFlow>

      {confirmDeleteNode && (
        <DeleteConfirmModal
          label={confirmDeleteNode.data.label}
          t={t}
          onConfirm={() => {
            deleteNode(confirmDeleteNode.id)
            selectedNodeIdRef.current = null
            setConfirmDeleteNode(null)
          }}
          onCancel={() => setConfirmDeleteNode(null)}
        />
      )}
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
          <button onClick={onCancel} style={secondaryBtn(t)}>Cancel</button>
          <button onClick={onConfirm} style={dangerBtn}>Delete</button>
        </div>
      </div>
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

import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'
import { loadData, saveData } from '../utils/storage'
import { makeDefaultTree, makeDefaultNode, generateId, STATUS_CYCLE } from '../utils/defaults'
import { THEME_CYCLE } from '../utils/themes'

const HISTORY_LIMIT = 50

let saveTimer = null
function debouncedSave(state) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveData({
      trees: state.trees,
      treeData: state.treeData,
      activeTreeId: state.activeTreeId,
      theme: state.theme,
      font: state.font,
      dotDensity: state.dotDensity,
      autoExpand: state.autoExpand,
      edgeStyle: state.edgeStyle,
    })
  }, 500)
}

function cloneTreeState(treeData, treeId) {
  const current = treeData[treeId] || { nodes: [], edges: [] }
  return JSON.parse(JSON.stringify(current))
}

function buildInitialState() {
  const saved = loadData()
  if (saved && saved.trees?.length > 0) {
    return {
      trees: saved.trees,
      treeData: saved.treeData || {},
      activeTreeId: saved.activeTreeId || saved.trees[0].id,
      theme: saved.theme || 'navy',
      font: saved.font || 'inter',
      dotDensity: saved.dotDensity || 'medium',
      autoExpand: saved.autoExpand ?? false,
      edgeStyle: saved.edgeStyle || 'smoothstep',
    }
  }
  const { tree, nodes, edges } = makeDefaultTree('My First Tree')
  return {
    trees: [tree],
    treeData: { [tree.id]: { nodes, edges } },
    activeTreeId: tree.id,
    theme: 'navy',
    font: 'inter',
    dotDensity: 'medium',
    autoExpand: false,
    edgeStyle: 'smoothstep',
  }
}

const initial = buildInitialState()

const useStore = create((set, get) => ({
  trees: initial.trees,
  treeData: initial.treeData,
  activeTreeId: initial.activeTreeId,
  theme: initial.theme,
  font: initial.font,
  dotDensity: initial.dotDensity,
  autoExpand: initial.autoExpand,
  edgeStyle: initial.edgeStyle,

  selectedNodeId: null,
  detailNodeId: null,
  contextMenuNode: null, // { id, x, y } | null

  // undo/redo: { [treeId]: { past: [...snapshots], future: [...snapshots] } }
  history: {},

  // --- Derived helpers ---
  getActiveTree() {
    return get().trees.find((t) => t.id === get().activeTreeId) || null
  },
  getNodes() {
    return get().treeData[get().activeTreeId]?.nodes || []
  },
  getEdges() {
    return get().treeData[get().activeTreeId]?.edges || []
  },

  // --- Theme ---
  setTheme(theme) {
    set((state) => {
      const next = { ...state, theme }
      debouncedSave(next)
      return next
    })
  },
  cycleTheme() {
    const current = get().theme
    const idx = THEME_CYCLE.indexOf(current)
    get().setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  },

  setFont(font) {
    set((state) => {
      const next = { ...state, font }
      debouncedSave(next)
      return next
    })
  },

  setDotDensity(dotDensity) {
    set((state) => {
      const next = { ...state, dotDensity }
      debouncedSave(next)
      return next
    })
  },

  setAutoExpand(autoExpand) {
    set((state) => {
      const next = { ...state, autoExpand }
      debouncedSave(next)
      return next
    })
  },

  setEdgeStyle(edgeStyle) {
    set((state) => {
      const newTreeData = {}
      for (const [id, data] of Object.entries(state.treeData)) {
        newTreeData[id] = {
          ...data,
          edges: data.edges.map((e) => ({ ...e, type: edgeStyle })),
        }
      }
      const next = { ...state, edgeStyle, treeData: newTreeData }
      debouncedSave(next)
      return next
    })
  },

  // --- History ---
  saveSnapshot() {
    const { activeTreeId, treeData, history } = get()
    const snapshot = cloneTreeState(treeData, activeTreeId)
    const treeHistory = history[activeTreeId] || { past: [], future: [] }
    set({
      history: {
        ...history,
        [activeTreeId]: {
          past: [...treeHistory.past.slice(-(HISTORY_LIMIT - 1)), snapshot],
          future: [],
        },
      },
    })
  },

  undo() {
    const { activeTreeId, treeData, history } = get()
    const treeHistory = history[activeTreeId] || { past: [], future: [] }
    if (treeHistory.past.length === 0) return
    const prev = treeHistory.past[treeHistory.past.length - 1]
    const current = cloneTreeState(treeData, activeTreeId)
    const next = {
      ...get(),
      treeData: { ...treeData, [activeTreeId]: prev },
      history: {
        ...history,
        [activeTreeId]: {
          past: treeHistory.past.slice(0, -1),
          future: [current, ...treeHistory.future.slice(0, HISTORY_LIMIT - 1)],
        },
      },
    }
    set(next)
    debouncedSave(next)
  },

  redo() {
    const { activeTreeId, treeData, history } = get()
    const treeHistory = history[activeTreeId] || { past: [], future: [] }
    if (treeHistory.future.length === 0) return
    const next_state = treeHistory.future[0]
    const current = cloneTreeState(treeData, activeTreeId)
    const next = {
      ...get(),
      treeData: { ...treeData, [activeTreeId]: next_state },
      history: {
        ...history,
        [activeTreeId]: {
          past: [...treeHistory.past.slice(-(HISTORY_LIMIT - 1)), current],
          future: treeHistory.future.slice(1),
        },
      },
    }
    set(next)
    debouncedSave(next)
  },

  // --- React Flow event handlers ---
  onNodesChange(changes) {
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        treeData: {
          ...state.treeData,
          [id]: { ...current, nodes: applyNodeChanges(changes, current.nodes) },
        },
      }
      debouncedSave(next)
      return next
    })
  },
  onEdgesChange(changes) {
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        treeData: {
          ...state.treeData,
          [id]: { ...current, edges: applyEdgeChanges(changes, current.edges) },
        },
      }
      debouncedSave(next)
      return next
    })
  },
  onConnect(connection) {
    get().saveSnapshot()
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const newEdge = { ...connection, type: state.edgeStyle, id: generateId('edge') }
      const next = {
        ...state,
        treeData: {
          ...state.treeData,
          [id]: { ...current, edges: addEdge(newEdge, current.edges) },
        },
      }
      debouncedSave(next)
      return next
    })
  },

  // --- Node actions ---
  addNode(position) {
    get().saveSnapshot()
    const node = makeDefaultNode(position)
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        treeData: {
          ...state.treeData,
          [id]: { ...current, nodes: [...current.nodes, node] },
        },
      }
      debouncedSave(next)
      return next
    })
    return node.id
  },

  deleteNode(nodeId) {
    get().saveSnapshot()
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        detailNodeId: state.detailNodeId === nodeId ? null : state.detailNodeId,
        treeData: {
          ...state.treeData,
          [id]: {
            nodes: current.nodes.filter((n) => n.id !== nodeId),
            edges: current.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          },
        },
      }
      debouncedSave(next)
      return next
    })
  },

  deleteNodes(nodeIds) {
    get().saveSnapshot()
    const idSet = new Set(nodeIds)
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        selectedNodeId: idSet.has(state.selectedNodeId) ? null : state.selectedNodeId,
        detailNodeId: idSet.has(state.detailNodeId) ? null : state.detailNodeId,
        treeData: {
          ...state.treeData,
          [id]: {
            nodes: current.nodes.filter((n) => !idSet.has(n.id)),
            edges: current.edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
          },
        },
      }
      debouncedSave(next)
      return next
    })
  },

  duplicateNode(nodeId) {
    get().saveSnapshot()
    const state = get()
    const id = state.activeTreeId
    const current = state.treeData[id] || { nodes: [], edges: [] }
    const original = current.nodes.find((n) => n.id === nodeId)
    if (!original) return
    const clone = {
      ...original,
      id: generateId('node'),
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      data: { ...original.data, links: [...(original.data.links || [])] },
    }
    set((s) => {
      const next = {
        ...s,
        treeData: {
          ...s.treeData,
          [id]: { ...current, nodes: [...current.nodes, clone] },
        },
      }
      debouncedSave(next)
      return next
    })
  },

  updateNodeData(nodeId, patch) {
    get().saveSnapshot()
    set((state) => {
      const id = state.activeTreeId
      const current = state.treeData[id] || { nodes: [], edges: [] }
      const next = {
        ...state,
        treeData: {
          ...state.treeData,
          [id]: {
            ...current,
            nodes: current.nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
            ),
          },
        },
      }
      debouncedSave(next)
      return next
    })
  },

  cycleNodeStatus(nodeId) {
    const state = get()
    const id = state.activeTreeId
    const node = (state.treeData[id]?.nodes || []).find((n) => n.id === nodeId)
    if (!node) return
    const idx = STATUS_CYCLE.indexOf(node.data.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    get().updateNodeData(nodeId, { status: next })
  },

  setSelectedNode(nodeId) {
    set({ selectedNodeId: nodeId })
  },
  setDetailNode(nodeId) {
    set({ detailNodeId: nodeId })
  },
  setContextMenuNode(data) {
    set({ contextMenuNode: data })
  },

  // --- Tree actions ---
  createTree(name) {
    const { tree, nodes, edges } = makeDefaultTree(name)
    set((state) => {
      const next = {
        ...state,
        trees: [...state.trees, tree],
        treeData: { ...state.treeData, [tree.id]: { nodes, edges } },
        activeTreeId: tree.id,
        selectedNodeId: null,
        detailNodeId: null,
      }
      debouncedSave(next)
      return next
    })
  },

  switchTree(treeId) {
    set((state) => {
      const next = { ...state, activeTreeId: treeId, selectedNodeId: null, detailNodeId: null }
      debouncedSave(next)
      return next
    })
  },

  renameTree(treeId, name) {
    set((state) => {
      const next = {
        ...state,
        trees: state.trees.map((t) =>
          t.id === treeId ? { ...t, name, updatedAt: new Date().toISOString() } : t
        ),
      }
      debouncedSave(next)
      return next
    })
  },

  deleteTree(treeId) {
    set((state) => {
      const remaining = state.trees.filter((t) => t.id !== treeId)
      if (remaining.length === 0) {
        const { tree, nodes, edges } = makeDefaultTree('My First Tree')
        remaining.push(tree)
        const newData = { [tree.id]: { nodes, edges } }
        const next = {
          ...state,
          trees: remaining,
          treeData: newData,
          activeTreeId: tree.id,
          selectedNodeId: null,
          detailNodeId: null,
        }
        debouncedSave(next)
        return next
      }
      const { [treeId]: _removed, ...restData } = state.treeData
      const newActiveId = state.activeTreeId === treeId ? remaining[0].id : state.activeTreeId
      const next = {
        ...state,
        trees: remaining,
        treeData: restData,
        activeTreeId: newActiveId,
        selectedNodeId: null,
        detailNodeId: null,
      }
      debouncedSave(next)
      return next
    })
  },
}))

export default useStore

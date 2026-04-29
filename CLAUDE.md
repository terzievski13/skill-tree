# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # localhost:5173
npm run build    # verify zero errors before shipping
npm run lint
```

No test suite. Validate with `npm run build` + manual browser check.

## Stack

React 19 + ReactFlow 11 + Zustand 5 + Vite. No TypeScript. Styling is 100% inline JS style objects — no Tailwind classes at runtime despite it being installed.

## State

All state in `src/store/useStore.js`. Components subscribe directly via `useStore((s) => s.x)` — no prop-drilling.

```js
{
  trees: Tree[],                          // metadata only
  treeData: { [treeId]: { nodes, edges } },
  activeTreeId,
  theme, font, dotDensity, autoExpand, edgeStyle,  // persisted
  selectedNodeId, detailNodeId, contextMenuNode,   // transient UI
  history: { [treeId]: { past, future } },         // not persisted
}
```

Use `getNodes()` / `getEdges()` store helpers — never read `treeData` directly in components. All mutating actions call `debouncedSave(500ms)` to `localStorage` key `skilltree_data`. Undo/redo stacks reset on page load.

## Canvas (`Canvas.jsx`)

- **`onPaneDoubleClick` is not a real ReactFlow 11 prop.** Double-click-to-add-node is on the wrapper `<div>` via `onDoubleClick` with `e.target.closest()` guards for nodes, edges, controls, panels.
- **Mobile double-tap** detected manually via touch events on the same div (350ms / 40px threshold). `touch-action: manipulation` prevents browser native double-tap zoom.
- **`augmentedEdges`** (`useMemo`) forces all stored edges to `type: 'offset'`. The stored `edgeStyle` only controls path shape inside `OffsetEdge`.
- **Box selection:** `selectionOnDrag + SelectionMode.Partial + panOnDrag={[1,2]}`. Trackpad pan via `panOnScroll + PanOnScrollMode.Free`.
- **Multi-select delete:** checks `nodes.filter(n => n.selected)`, not just the clicked-node ref.
- **Auto-fit on tree switch:** `useEffect` on `activeTreeId` → `fitView()` after 50ms.
- `deleteKeyCode={null}` and `zoomOnDoubleClick={false}` must stay set.
- Mobile controls: `{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)', left: 21 }`.

## OffsetEdge (`OffsetEdge.jsx`)

Custom edge used for all edges. Use `style={{ stroke, strokeWidth }}` as **inline styles**, not SVG presentation attributes — ReactFlow's CSS `.react-flow__edge.selected .react-flow__edge-path { stroke: #555 }` overrides presentation attributes and dims selected edges. Inline styles win. Selected state renders a wider primary-colour path behind the normal edge as a halo/outline.

## SkillNode (`SkillNode.jsx`)

Uses ReactFlow's `selected` prop for border highlight, not `store.selectedNodeId`. The store's `selectedNodeId` is set only on explicit single-click — box-select does not update it.

## Themes (`utils/themes.js`)

Five themes: `light`, `dark`, `navy`, `orange`, `midnight`. Each has a `primary` colour used for all selection highlights. Components import `themes[theme]` directly.

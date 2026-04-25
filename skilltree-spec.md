# SkillTree — Product Specification v1

## Overview

SkillTree is a personal learning and research organizer built around interactive tree graphs on an infinite canvas. Users create nodes representing goals, concepts, or tasks, connect them in parent-child relationships, and break down complex topics into smaller actionable pieces. Each node carries a status and an expandable detail panel for notes, links, and resources.

The app runs as a web application, deployed to Vercel for access from any device. Data is stored in the browser's localStorage for v1, with database migration planned for a later version.

---

## Target User

Single user (the builder). No auth, no multi-user features in v1. The app is a personal tool.

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Framework | React (with JSX) | UI component library |
| Canvas | React Flow | Node-based graph UI — handles zoom, pan, drag, edges |
| State Management | Zustand | Centralized app state (nodes, edges, trees, UI state) |
| Build Tool | Vite | Dev server, bundling, hot reload |
| Styling | Tailwind CSS | Utility-first CSS framework for rapid styling |
| Persistence | localStorage | Save/load tree data between sessions (v1) |
| Deployment | Vercel | Free hosting with a real URL |

---

## Project Structure

```
skilltree/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx              — React Flow canvas wrapper with dot grid background
│   │   ├── SkillNode.jsx           — Custom node component (label, status dot, expand button)
│   │   ├── DetailPanel.jsx         — Slide-out panel for notes, links, resources
│   │   ├── Toolbar.jsx             — Top bar (tree selector, add node button, tree title)
│   │   ├── TreeSelector.jsx        — Sidebar or dropdown to switch between trees
│   │   └── StatusBadge.jsx         — Small colored dot/circle indicating node status
│   ├── store/
│   │   └── useStore.js             — Zustand store (all state + actions)
│   ├── utils/
│   │   ├── storage.js              — localStorage read/write helpers
│   │   └── defaults.js             — Default node data, ID generators
│   ├── App.jsx                     — Root component, layout shell
│   ├── main.jsx                    — Entry point (ReactDOM.render)
│   └── index.css                   — Tailwind imports + global styles
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Data Model

### Tree

```json
{
  "id": "tree_1",
  "name": "Learn Machine Learning",
  "createdAt": "2026-04-25T10:00:00Z",
  "updatedAt": "2026-04-25T12:30:00Z"
}
```

### Node

Each node on the canvas. Stored as a React Flow node with custom data.

```json
{
  "id": "node_1",
  "type": "skillNode",
  "position": { "x": 250, "y": 100 },
  "data": {
    "label": "Learn Python Basics",
    "status": "in_progress",
    "notes": "Focus on data structures first",
    "links": [
      { "title": "Python Docs", "url": "https://docs.python.org" }
    ],
    "resources": "Book: Automate the Boring Stuff"
  }
}
```

### Edge

Connection between two nodes (parent → child).

```json
{
  "id": "edge_1-2",
  "source": "node_1",
  "target": "node_2",
  "type": "smoothstep"
}
```

### Status Values

| Status | Color | Dot Color Code |
|--------|-------|----------------|
| `not_started` | Gray | `#9CA3AF` |
| `in_progress` | Amber/Yellow | `#F59E0B` |
| `done` | Green | `#10B981` |

### Full localStorage Schema

All data lives under one key: `skilltree_data`

```json
{
  "trees": [
    {
      "id": "tree_1",
      "name": "Learn ML",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "treeData": {
    "tree_1": {
      "nodes": [ /* React Flow node objects */ ],
      "edges": [ /* React Flow edge objects */ ]
    }
  },
  "activeTreeId": "tree_1"
}
```

---

## Screens & Components

### 1. Main Canvas (primary screen)

The full-screen workspace. This is what the user sees 99% of the time.

**Layout:**
- **Top bar (Toolbar):** fixed at top. Contains:
  - Left: tree name (editable — click to rename)
  - Center or left: "Add Node" button (+ icon)
  - Right: tree selector dropdown or button to open sidebar
- **Canvas area:** fills remaining space. React Flow canvas with:
  - Dot grid background pattern (light gray dots on white/near-white background)
  - Zoom via scroll wheel or pinch
  - Pan via click-and-drag on empty space
  - Nodes rendered as custom `SkillNode` components
  - Edges rendered as smooth curved lines between nodes

**Interactions on canvas:**
- **Double-click on empty space** → creates a new node at that position
- **Click a node** → selects it (subtle highlight border)
- **Double-click a node's label** → enters edit mode (inline text input)
- **Click the status dot on a node** → cycles: not_started → in_progress → done
- **Click the expand icon on a node** → opens the DetailPanel
- **Drag a node** → repositions it on the canvas
- **Drag from a node's handle (small circle on edge of node)** → creates a new edge to another node
- **Click an edge** → selects it; press Delete/Backspace to remove
- **Right-click a node** → context menu: Delete Node, Duplicate Node, Change Status

### 2. SkillNode (custom node component)

A rounded rectangle card on the canvas. Compact but readable.

```
┌──────────────────────────────┐
│  ● Label Text Here        ⋮  │
└──────────────────────────────┘
```

- **Left:** colored status dot (●)
- **Center:** node label text (single line, truncated if long)
- **Right:** expand/menu icon (⋮ or ▶) — opens DetailPanel
- **Border:** subtle, slightly thicker when selected
- **Background:** white or very light gray
- **Connection handles:** small circles at top and bottom (or all four sides) — visible on hover, used to drag edges

**Visual states:**
- Default: light border, white background
- Selected: slightly thicker/colored border
- Done: the status dot is green, optionally the node gets a subtle green-tinted background

### 3. DetailPanel (slide-out side panel)

Opens from the right side of the screen when a node's expand icon is clicked. Overlays the canvas (does not push it). Has a close button (X) in the top-right.

**Contents:**
- **Node title** (editable, larger text at top)
- **Status selector** (three-option toggle or dropdown: Not Started / In Progress / Done)
- **Notes section** (multi-line textarea, plain text for v1, markdown rendering could come later)
- **Links section:**
  - List of saved links, each showing title + URL
  - "Add Link" button → two inputs appear: title + URL
  - Click a link → opens in new tab
  - Delete icon on each link
- **Resources section** (free-form textarea for book names, file references, any text)

**Behavior:**
- Panel width: ~350-400px
- Opens with a subtle slide-in animation
- Clicking outside the panel or pressing Escape closes it
- All changes auto-save (no manual save button)

### 4. TreeSelector

Accessed from the Toolbar. Can be either:
- **Option A:** a dropdown menu listing all trees
- **Option B:** a left sidebar that slides in

**Contents:**
- List of tree names with last-updated date
- "New Tree" button at the top or bottom
- Click a tree → switches to that tree's canvas
- Right-click or swipe on a tree → Delete Tree (with confirmation dialog)
- Rename inline by double-clicking

**Recommendation:** start with a simple dropdown for v1. Sidebar can come later.

---

## User Flows

### Flow 1: First Launch
1. App loads. No data exists in localStorage.
2. A default tree is created: name = "My First Tree", with one starter node in the center labeled "Start Here".
3. User sees the canvas with the single node and the dot grid.

### Flow 2: Adding Nodes and Building a Tree
1. User double-clicks on empty canvas space.
2. A new node appears at that position with placeholder label "New Node" in edit mode.
3. User types a label and presses Enter or clicks away to confirm.
4. User hovers over the node — connection handles appear.
5. User drags from a handle on node A to node B → an edge is created.
6. Repeat to build the tree structure.

### Flow 3: Updating Node Status
1. User clicks the colored dot on a node.
2. Status cycles: not_started (gray) → in_progress (yellow) → done (green).
3. Change auto-saves immediately.

### Flow 4: Adding Details to a Node
1. User clicks the expand icon (⋮) on a node.
2. DetailPanel slides in from the right.
3. User adds notes in the textarea.
4. User clicks "Add Link", types "React Flow Docs" + "https://reactflow.dev", clicks Save.
5. User closes the panel — all data persisted.

### Flow 5: Creating a New Tree
1. User opens TreeSelector from toolbar.
2. Clicks "New Tree".
3. Prompt or inline input for tree name.
4. New empty canvas loads with one default node.

### Flow 6: Switching Between Trees
1. User opens TreeSelector.
2. Clicks a different tree name.
3. Current tree state auto-saves, selected tree loads onto the canvas.

---

## Visual Design Guidelines

### Canvas
- Background: white or very light gray (`#FAFAFA`)
- Dot grid: small dots, color `#E5E7EB`, spacing ~20-25px apart
- Fits the full viewport below the toolbar

### Nodes
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Border radius: `8px`
- Font: system font stack (Inter or -apple-system)
- Font size: 14px for label
- Padding: 12px 16px
- Min width: 150px, max width: 280px
- Shadow: subtle (`0 1px 3px rgba(0,0,0,0.1)`)
- Selected state: border color changes to `#3B82F6` (blue)

### Edges
- Type: `smoothstep` (curved right angles — looks clean and readable)
- Color: `#94A3B8` (slate gray)
- Stroke width: 2px
- Animated: no (keep it clean)
- Arrow: small arrowhead at target end

### DetailPanel
- Background: `#FFFFFF`
- Width: 380px
- Right-aligned, full height
- Subtle left border or shadow to separate from canvas
- Close button in top-right corner

### Toolbar
- Height: 56px
- Background: `#FFFFFF`
- Bottom border: `1px solid #E5E7EB`
- Tree name: 18px, semi-bold
- Buttons: minimal, icon-based with tooltips

### Color Palette
- Primary: `#3B82F6` (blue — selections, primary buttons)
- Background: `#FAFAFA`
- Surface: `#FFFFFF`
- Border: `#E5E7EB`
- Text primary: `#1F2937`
- Text secondary: `#6B7280`
- Status green: `#10B981`
- Status amber: `#F59E0B`
- Status gray: `#9CA3AF`

---

## Auto-Save Behavior

- Every state change (node move, label edit, status change, detail update, edge creation/deletion) triggers a debounced save to localStorage.
- Debounce delay: 500ms (waits 500ms after the last change before writing — prevents hammering storage during rapid edits like dragging).
- On app load: read from localStorage and hydrate (fill) the Zustand store.
- If localStorage is empty: initialize with default data (see Flow 1).

---

## Keyboard Shortcuts (v1)

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected node or edge (with confirmation for nodes) |
| `Escape` | Close DetailPanel / deselect |
| `Ctrl/Cmd + Z` | Undo (if implemented — optional for v1) |
| `Ctrl/Cmd + Shift + Z` | Redo (if implemented — optional for v1) |

---

## What Is NOT in v1 (Deferred Features)

These are explicitly out of scope for the first version. They will be built in later iterations:

1. **Cross-tree node sharing** — a node appearing in multiple trees
2. **Skills/knowledge graph** — connecting trees into broader concept clusters (business, marketing, videography, etc.)
3. **Folder/list view** — collapsible list alternative to the flowchart view
4. **Search** — finding nodes across trees
5. **Tags/categories** — labeling nodes with topics
6. **Database backend** — replacing localStorage with a real database for cross-device sync
7. **PWA (Progressive Web App)** — installable on phone home screen
8. **Undo/Redo** — full history stack
9. **Export/Import** — saving trees as JSON files
10. **Dark mode**
11. **Collaborative features** — sharing trees with others
12. **AI integration** — suggesting subtasks or learning paths

---

## Deployment Plan

1. **Development:** run locally with `npm run dev` (Vite dev server on `localhost:5173`)
2. **Deploy:** push to GitHub, connect repo to Vercel, deploy with one click
3. **Result:** app lives at `skilltree.vercel.app` (or custom subdomain), accessible from any device
4. **Updates:** every push to main branch auto-deploys

---

## Instructions for Claude Code

When building this project, follow this order:

### Phase 1: Project Setup
1. Initialize project with `npm create vite@latest skilltree -- --template react`
2. Install dependencies: `npm install reactflow zustand`
3. Install Tailwind CSS and configure it
4. Verify the dev server runs with `npm run dev`

### Phase 2: Core Canvas
1. Set up the React Flow canvas in `Canvas.jsx` with dot grid background
2. Create the custom `SkillNode` component with label, status dot, and expand button
3. Implement node creation on double-click
4. Implement inline label editing on double-click of label
5. Implement edge creation by dragging between node handles
6. Implement node deletion (Delete key + confirmation)

### Phase 3: State Management
1. Create the Zustand store with all state shape and actions
2. Wire React Flow events (onNodesChange, onEdgesChange, onConnect) to the store
3. Implement localStorage persistence with debounced save
4. Implement load-on-startup hydration

### Phase 4: Detail Panel
1. Build the DetailPanel slide-out component
2. Wire it to the selected node's data
3. Implement notes textarea
4. Implement links list with add/delete
5. Implement resources textarea
6. Auto-save all changes to store

### Phase 5: Multi-Tree Support
1. Build TreeSelector dropdown in Toolbar
2. Implement tree creation, switching, renaming, deletion
3. Ensure tree state saves and loads correctly when switching

### Phase 6: Polish
1. Style everything according to the Visual Design Guidelines
2. Add keyboard shortcuts
3. Test edge cases (empty trees, very long labels, many nodes)
4. Deploy to Vercel

---

## Glossary

| Term | Meaning |
|------|---------|
| **Node** | A single item on the canvas — a box representing a goal, concept, or task |
| **Edge** | A line connecting two nodes, showing a parent-child relationship |
| **Canvas** | The zoomable, pannable workspace where nodes live |
| **Handle** | The small circle on a node's edge used to drag and create connections |
| **Store** | The centralized data layer (Zustand) that holds all app state |
| **Hydrate** | Loading saved data from storage into the app's memory on startup |
| **Debounce** | Waiting a short time after the last change before executing an action (like saving) |
| **Viewport** | The visible area of the canvas at any given zoom/pan position |
| **PWA** | Progressive Web App — a web app that can be installed on a device like a native app |
| **localStorage** | A browser API that stores key-value data persistently on the user's device |


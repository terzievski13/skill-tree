export const STATUS_CYCLE = ['not_started', 'in_progress', 'done']

export const STATUS_COLORS = {
  not_started: '#9CA3AF',
  in_progress: '#F59E0B',
  done: '#10B981',
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function makeDefaultNode(position = { x: 300, y: 200 }, label = 'New Node') {
  return {
    id: generateId('node'),
    type: 'skillNode',
    position,
    data: {
      label,
      status: 'not_started',
      notes: '',
      links: [],
      resources: '',
    },
  }
}

export function makeDefaultTree(name = 'My First Tree') {
  const id = generateId('tree')
  const now = new Date().toISOString()
  return {
    tree: { id, name, createdAt: now, updatedAt: now },
    nodes: [makeDefaultNode({ x: 300, y: 200 }, 'Start Here')],
    edges: [],
  }
}

import { useCallback, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import DetailPanel from './components/DetailPanel'
import useStore from './store/useStore'
import { themes } from './utils/themes'

function AppInner() {
  const addNode = useStore((s) => s.addNode)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const theme = useStore((s) => s.theme)
  const t = themes[theme] || themes.light

  const handleAddNodeAtCenter = useCallback(() => {
    addNode({ x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 })
  }, [addNode])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // don't intercept when typing in an input or textarea
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [undo, redo])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: t.canvasBg,
      }}
    >
      <Toolbar onAddNode={handleAddNodeAtCenter} />
      <Canvas />
      <DetailPanel />
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}

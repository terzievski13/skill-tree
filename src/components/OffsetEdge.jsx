import { getBezierPath, getSmoothStepPath } from 'reactflow'
import useStore from '../store/useStore'
import { themes } from '../utils/themes'

export default function OffsetEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style = {},
}) {
  const theme = useStore((s) => s.theme)
  const edgeStyle = useStore((s) => s.edgeStyle)
  const t = themes[theme] || themes.light

  let edgePath
  if (edgeStyle === 'smoothstep') {
    ;[edgePath] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 8,
    })
  } else if (edgeStyle === 'step') {
    ;[edgePath] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 0,
    })
  } else if (edgeStyle === 'straight') {
    edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`
  } else {
    ;[edgePath] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
    })
  }

  const baseColor = style.stroke || '#94A3B8'
  const baseWidth = style.strokeWidth || 2
  const markerId = `ce-arrow-${id}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          {/* Arrow fill matches the main edge color, not the outline */}
          <polygon points="0 0, 10 4, 0 8" fill={baseColor} />
        </marker>
      </defs>
      {/* Wide transparent hit area */}
      <path
        d={edgePath}
        style={{ stroke: 'transparent', strokeWidth: 16 }}
        fill="none"
        className="react-flow__edge-interaction"
      />
      {/* Primary-color outline rendered behind the main path when selected */}
      {selected && (
        <path
          d={edgePath}
          style={{ stroke: t.primary, strokeWidth: baseWidth + 1 }}
          fill="none"
        />
      )}
      {/* Main visible edge — inline style overrides ReactFlow's .selected CSS rule */}
      <path
        id={id}
        d={edgePath}
        style={{ stroke: baseColor, strokeWidth: baseWidth }}
        fill="none"
        markerEnd={`url(#${markerId})`}
        className="react-flow__edge-path"
      />
    </>
  )
}

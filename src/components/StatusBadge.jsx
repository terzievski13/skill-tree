import { STATUS_COLORS } from '../utils/defaults'

export default function StatusBadge({ status, onClick, size = 10 }) {
  return (
    <button
      onClick={onClick}
      title={status?.replace('_', ' ')}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.not_started,
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        padding: 0,
      }}
    />
  )
}

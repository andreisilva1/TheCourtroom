import type { ActivityItem } from '../types'

function ResultPill({ result }: { result: string }) {
  if (result.toUpperCase().includes('WINS') || result.toUpperCase().includes('WIN')) {
    return (
      <span className="inline-block font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        {result}
      </span>
    )
  }
  if (result.toUpperCase().includes('DRAW')) {
    return (
      <span className="inline-block font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
        {result}
      </span>
    )
  }
  return (
    <span className="inline-block font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-muted">
      {result}
    </span>
  )
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-surface rounded-lg border border-border hover:shadow-card transition-all cursor-pointer px-4 py-3"
        >
          <div className="text-xs font-bold text-ink truncate">
            {item.persona_a} <span className="text-muted font-normal">vs</span> {item.persona_b}
          </div>
          <div className="font-mono text-[10px] text-muted mt-0.5 truncate italic">
            "{item.topic}"
          </div>
          <div className="flex items-center justify-between mt-2">
            <ResultPill result={item.result} />
            <span className="font-mono text-[9px] text-muted">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

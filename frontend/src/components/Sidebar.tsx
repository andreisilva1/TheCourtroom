import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',         label: 'Home',               exact: true },
  { to: '/confront', label: 'Start Confrontation' },
  { to: '/personas', label: 'Personas'            },
]

export default function Sidebar() {
  return (
    <aside className="w-48 flex-shrink-0 flex flex-col h-screen border-r border-[#EBEBEB] bg-white">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#EBEBEB]">
        <div className="font-black text-sm tracking-widest text-[#111111]">
          ARGUMENTAI
        </div>
        <div className="font-mono text-xs text-[#888888] mt-0.5">
          debate arena
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-px">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `block px-3 py-2 text-sm transition-all duration-150 border-l-2 ${
                isActive
                  ? 'text-[#111111] font-semibold border-[#E8001A]'
                  : 'text-[#888888] hover:text-[#111111] border-transparent'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#EBEBEB]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-mono text-xs text-[#888888]">online</span>
        </div>
      </div>
    </aside>
  )
}

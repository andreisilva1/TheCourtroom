import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import StartConfrontationPage from './pages/StartConfrontationPage'
import DebateArenaPage from './pages/DebateArenaPage'
import PersonasPage from './pages/PersonasPage'

function Root() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F7] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'confront', element: <StartConfrontationPage /> },
      { path: 'arena', element: <DebateArenaPage /> },
      { path: 'personas', element: <PersonasPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

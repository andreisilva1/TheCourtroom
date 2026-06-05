import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AceAttorneyArena from './pages/AceAttorneyArena'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/ace-attorney/:persona_id', element: <AceAttorneyArena /> },
])

export default function App() {
  return <RouterProvider router={router} />
}

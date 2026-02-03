import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Inbox from './pages/Inbox'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="inbox/:sessionId" element={<Inbox />} />
        <Route path="admin" element={<Admin />} />
        {/* Redirect old setup route to admin */}
        <Route path="setup" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

export default App

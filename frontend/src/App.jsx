import { Routes, Route } from 'react-router-dom'
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
      </Route>
    </Routes>
  )
}

export default App

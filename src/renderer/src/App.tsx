import { HashRouter, Routes, Route } from 'react-router-dom'
import Main from '@/pages/Main'
import Layout from '@/components/layout/Layout'

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

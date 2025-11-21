import { HashRouter, Routes, Route } from 'react-router-dom'
import Main from '@/pages/Main'
import Setting from '@/pages/Setting'
import Upload from '@/pages/Upload'
import Layout from '@/components/layout/Layout'

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path="setting" element={<Setting />} />
          <Route path="upload/:folderName" element={<Upload />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

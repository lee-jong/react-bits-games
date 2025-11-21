import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Main from '@/pages/Main'
import ImageMain from '@/pages/imageGame/List'
import ImageSetting from '@/pages/imageGame/Setting'
import ImageUpload from '@/pages/imageGame/Upload'

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          {/* Image Routes */}
          <Route path="image-game" element={<ImageMain />} />
          <Route path="image-game/setting" element={<ImageSetting />} />
          <Route path="image-game/upload/:folderName" element={<ImageUpload />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

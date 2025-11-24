import React, { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Main from '@/pages/Main'
import ImageList from '@/pages/imageGame/List'
import ImageGame from '@/pages/imageGame/Game'
import ImageAdmin from '@/pages/imageGame/Admin'
import ImageSetting from '@/pages/imageGame/Setting'
import ImageUpload from '@/pages/imageGame/Upload'
import QuizList from '@/pages/quizGame/List'
import QuizSetting from '@/pages/quizGame/Setting'
import QuizRegister from '@/pages/quizGame/Register'

// Component to handle route changes and create admin window
const RouteHandler: React.FC = () => {
  const location = useLocation()
  const prevPathnameRef = useRef<string>('')

  useEffect(() => {
    // Skip initial render if pathname hasn't changed
    if (prevPathnameRef.current === location.pathname) {
      return
    }

    const prevPathname = prevPathnameRef.current
    const currentPathname = location.pathname

    // Update ref before processing
    prevPathnameRef.current = currentPathname

    // Check if route is Game page (HashRouter uses pathname without #)
    const gameRouteMatch = currentPathname.match(/image-game\/game\/(.+)/)
    const wasGameRoute = prevPathname && prevPathname.match(/image-game\/game\/(.+)/)

    if (gameRouteMatch) {
      // Entering Game page - only create if we weren't already on Game page
      if (!wasGameRoute) {
        const folderName = gameRouteMatch[1]
        // Create admin window immediately when route changes
        window.api.createAdminWindow(folderName).catch((error) => {
          console.error('Error creating admin window:', error)
        })
      }
    } else if (wasGameRoute) {
      // Leaving Game page - only close if we were on Game page before
      window.api.closeAdminWindow().catch(() => {
        // Ignore errors if window doesn't exist
      })
    }
  }, [location.pathname])

  return null
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <RouteHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path="image-game/list" element={<ImageList />} />
          <Route path="image-game/game/:folderName" element={<ImageGame />} />
          <Route path="image-game/admin" element={<ImageAdmin />} />
          <Route path="image-game/setting" element={<ImageSetting />} />
          <Route path="image-game/upload/:folderName" element={<ImageUpload />} />
          <Route path="quiz-game/list" element={<QuizList />} />
          <Route path="quiz-game/setting" element={<QuizSetting />} />
          <Route path="quiz-game/register/:folderName" element={<QuizRegister />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

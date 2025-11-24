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
import QuizGame from '@/pages/quizGame/Game'
import QuizAdmin from '@/pages/quizGame/Admin'
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
    const imageGameRouteMatch = currentPathname.match(/image-game\/game\/(.+)/)
    const quizGameRouteMatch = currentPathname.match(/quiz-game\/game\/(.+)/)
    const wasImageGameRoute = prevPathname && prevPathname.match(/image-game\/game\/(.+)/)
    const wasQuizGameRoute = prevPathname && prevPathname.match(/quiz-game\/game\/(.+)/)

    if (imageGameRouteMatch) {
      // Entering Image Game page
      if (!wasImageGameRoute && !wasQuizGameRoute) {
        const folderName = imageGameRouteMatch[1]
        window.api.createAdminWindow(folderName, 'image').catch((error) => {
          console.error('Error creating admin window:', error)
        })
      }
    } else if (quizGameRouteMatch) {
      // Entering Quiz Game page
      if (!wasQuizGameRoute && !wasImageGameRoute) {
        const folderName = quizGameRouteMatch[1]
        window.api.createAdminWindow(folderName, 'quiz').catch((error) => {
          console.error('Error creating admin window:', error)
        })
      }
    } else if (wasImageGameRoute || wasQuizGameRoute) {
      // Leaving Game page - close admin window
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
          <Route path="quiz-game/game/:folderName" element={<QuizGame />} />
          <Route path="quiz-game/admin" element={<QuizAdmin />} />
          <Route path="quiz-game/setting" element={<QuizSetting />} />
          <Route path="quiz-game/register/:folderName" element={<QuizRegister />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

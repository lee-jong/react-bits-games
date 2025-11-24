import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

interface QuizItem {
  id: string
  index: number
  quiz: string
  answer: string
}

const Admin: React.FC = () => {
  const [searchParams] = useSearchParams()
  const folderName = searchParams.get('folder') || ''
  const [currentQuiz, setCurrentQuiz] = useState<QuizItem | null>(null)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalQuizzes, setTotalQuizzes] = useState(0)

  const loadQuizzes = useCallback(async (): Promise<void> => {
    if (!folderName) return

    try {
      const { quizzes } = await window.api.getQuizFile(folderName)
      setTotalQuizzes(quizzes?.length || 0)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    }
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadQuizzes()
    }
  }, [folderName, loadQuizzes])

  useEffect(() => {
    // Listen for quiz changes from Game page
    const removeListener = window.api.onGameQuizChanged((quiz: QuizItem) => {
      setCurrentQuiz(quiz)
      // Use the index from the game (which reflects the shuffled order)
      setCurrentIndex(quiz.index)
    })

    return () => {
      removeListener()
    }
  }, [])

  const handleStartGame = (): void => {
    if (folderName && !isGameStarted) {
      window.api.gameStart(folderName)
      setIsGameStarted(true)
      setCurrentIndex(0)
    }
  }

  const handleNextQuiz = (): void => {
    if (isGameStarted) {
      window.api.gameNextImage()
    }
  }

  const handleEndGame = (): void => {
    if (isGameStarted) {
      window.api.gameEnd()
      setIsGameStarted(false)
      setCurrentIndex(0)
      setCurrentQuiz(null)
    }
  }

  const isAllQuizzesShown = isGameStarted && totalQuizzes > 0 && currentIndex >= totalQuizzes - 1

  return (
    <div className="w-full h-full bg-gray-900 text-white p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">게임 관리</h1>
      <p className="text-gray-400 mb-6">폴더: {folderName}</p>

      {!isGameStarted ? (
        <>
          <div className="flex-1 flex items-center justify-center mb-6">
            <p className="text-gray-400 text-lg">준비중입니다.</p>
          </div>
          <button
            onClick={handleStartGame}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            게임 시작
          </button>
        </>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">현재 퀴즈</h2>
            {currentQuiz ? (
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-gray-400 text-xs mb-1">퀴즈</p>
                  <p className="text-white text-sm break-all">Q. {currentQuiz.quiz}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">정답</p>
                  <p className="text-white text-sm break-all">A. {currentQuiz.answer}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">퀴즈 정보 없음</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">
              진행도: {currentIndex + 1} / {totalQuizzes}
            </p>
          </div>

          {isAllQuizzesShown ? (
            <button
              onClick={handleEndGame}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium mb-4"
            >
              끝내기
            </button>
          ) : (
            <button
              onClick={handleNextQuiz}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mb-4"
            >
              다음 퀴즈
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default Admin

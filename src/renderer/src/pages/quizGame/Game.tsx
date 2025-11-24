import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

interface QuizItem {
  id: string
  index: number
  quiz: string
  answer: string
}

interface QuizWithImage extends QuizItem {
  base64?: string
  hasImage: boolean
}

const Game: React.FC = () => {
  const navigate = useNavigate()
  const { folderName } = useParams<{ folderName: string }>()
  const [currentQuiz, setCurrentQuiz] = useState<QuizWithImage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const quizzesRef = useRef<QuizWithImage[]>([])

  // Fisher-Yates shuffle algorithm for randomizing quizzes
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const loadAllQuizzes = useCallback(async (): Promise<void> => {
    if (!folderName) return

    try {
      setIsLoading(true)
      const { quizzes } = await window.api.getQuizFile(folderName)

      if (!quizzes || quizzes.length === 0) {
        quizzesRef.current = []
        setCurrentQuiz(null)
        return
      }

      // Load images for each quiz and check if image exists
      const quizzesWithImages = await Promise.all(
        quizzes.map(async (quiz) => {
          try {
            const { base64, exists } = await window.api.getQuizImageBase64(folderName, quiz.id)
            return {
              ...quiz,
              base64: exists ? base64 : undefined,
              hasImage: exists
            }
          } catch (error) {
            console.error(`Error loading image for quiz ${quiz.id}:`, error)
            return {
              ...quiz,
              base64: undefined,
              hasImage: false
            }
          }
        })
      )

      // Shuffle quizzes randomly without duplicates
      const shuffledQuizzes = shuffleArray(quizzesWithImages)
      quizzesRef.current = shuffledQuizzes

      // Don't set quiz until game starts
      setCurrentQuiz(null)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Error loading quizzes:', error)
      quizzesRef.current = []
      setCurrentQuiz(null)
    } finally {
      setIsLoading(false)
    }
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadAllQuizzes()
    }
  }, [folderName, loadAllQuizzes])

  useEffect(() => {
    // Notify admin window about quiz change (only when game is started)
    if (currentQuiz && isGameStarted) {
      window.api.gameQuizChanged({
        id: currentQuiz.id,
        index: currentIndex, // Use currentIndex instead of quiz.index for actual position
        quiz: currentQuiz.quiz,
        answer: currentQuiz.answer
      })
    }
  }, [currentQuiz, isGameStarted, currentIndex])

  useEffect(() => {
    // Listen for game control events from admin window
    const removeGameStart = window.api.onGameStart((receivedFolderName: string) => {
      if (receivedFolderName === folderName) {
        setIsGameStarted(true)
        if (quizzesRef.current.length > 0) {
          setCurrentIndex(0)
          setCurrentQuiz(quizzesRef.current[0])
        }
      }
    })

    const removeGameNextImage = window.api.onGameNextImage(() => {
      if (isGameStarted && quizzesRef.current.length > 0) {
        if (currentIndex < quizzesRef.current.length - 1) {
          const nextIndex = currentIndex + 1
          setCurrentIndex(nextIndex)
          setCurrentQuiz(quizzesRef.current[nextIndex])
        }
      }
    })

    const removeGameEnd = window.api.onGameEnd(() => {
      setIsGameStarted(false)
      navigate('/quiz-game/list')
    })

    return () => {
      removeGameStart()
      removeGameNextImage()
      removeGameEnd()
    }
  }, [folderName, isGameStarted, currentIndex, navigate])

  const handleBack = (): void => {
    navigate('/quiz-game/list')
  }

  return (
    <div className="relative w-full h-full">
      <ScrollArea className="w-full h-full">
        <div className="p-20">
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="text-white hover:text-gray-300 transition-colors mb-4"
            >
              ← 뒤로가기
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">퀴즈 게임</h1>
            {folderName && <p className="text-gray-400">카테고리: {folderName}</p>}
          </div>

          <div
            className="flex flex-col items-center justify-center w-full px-4"
            style={{
              height: 'calc(100vh - 12rem - 60px)',
              paddingTop: '30px',
              paddingBottom: '30px'
            }}
          >
            {isLoading ? (
              <div className="text-white text-center py-20">로딩 중...</div>
            ) : quizzesRef.current.length === 0 ? (
              <div className="text-gray-400 text-center py-20">
                퀴즈가 없습니다. 설정에서 퀴즈를 추가해주세요.
              </div>
            ) : !isGameStarted ? (
              <div className="text-gray-400 text-center py-20">준비중입니다.</div>
            ) : !currentQuiz ? (
              <div className="text-gray-400 text-center py-20">퀴즈를 불러오는 중...</div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                {/* Quiz text with Q. prefix */}
                <div className="w-full text-center mb-4">
                  <h2 className="text-white text-3xl font-bold">Q. {currentQuiz.quiz}</h2>
                </div>

                {/* Image display */}
                {currentQuiz.hasImage && currentQuiz.base64 ? (
                  <div className="w-full flex-1 flex items-center justify-center">
                    <img
                      src={currentQuiz.base64}
                      alt={`퀴즈 ${currentQuiz.index + 1}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-full flex-1 flex items-center justify-center text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default Game

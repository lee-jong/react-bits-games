import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import { v4 as uuidv4 } from 'uuid'

interface QuizItem {
  id: string
  index: number
  quiz: string
  answer: string
}

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { folderName } = useParams<{ folderName: string }>()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [category, setCategory] = useState<string>('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<QuizItem>({
    id: '',
    index: 0,
    quiz: '',
    answer: ''
  })
  const [newQuiz, setNewQuiz] = useState<QuizItem>({ id: '', index: 0, quiz: '', answer: '' })
  const [quizImages, setQuizImages] = useState<Record<string, string>>({}) // id -> base64
  const [quizImageFileNames, setQuizImageFileNames] = useState<Record<string, string>>({}) // id -> fileName
  const [pendingImage, setPendingImage] = useState<{
    base64: string
    fileName: string
    tempId: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false) // Used for internal state management during saves

  const loadQuizzes = useCallback(async (): Promise<void> => {
    if (!folderName) return

    try {
      setIsLoading(true)
      const { category: loadedCategory, quizzes: loadedQuizzes } =
        await window.api.getQuizFile(folderName)
      setCategory(loadedCategory || folderName)
      setQuizzes(loadedQuizzes || [])

      // Load images for each quiz
      const imagesMap: Record<string, string> = {}
      const fileNamesMap: Record<string, string> = {}
      for (const quiz of loadedQuizzes || []) {
        try {
          const { base64, exists, fileName } = await window.api.getQuizImageBase64(
            folderName,
            quiz.id
          )
          if (exists && base64) {
            imagesMap[quiz.id] = base64
            if (fileName) {
              fileNamesMap[quiz.id] = fileName
            }
          }
        } catch (error) {
          console.error(`Error loading image for quiz ${quiz.id}:`, error)
        }
      }
      setQuizImages(imagesMap)
      setQuizImageFileNames(fileNamesMap)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadQuizzes()
    }
  }, [folderName, loadQuizzes])

  const handleBack = (): void => {
    navigate('/quiz-game/setting')
  }

  const saveQuizzes = async (quizzesToSave: QuizItem[]): Promise<void> => {
    if (!folderName) return

    // Validate all quizzes
    for (const quiz of quizzesToSave) {
      if (!quiz.id || !quiz.quiz.trim() || !quiz.answer.trim()) {
        alert('모든 필드는 필수입니다. 빈 필드가 있는지 확인해주세요.')
        return
      }
    }

    try {
      setIsSaving(true)
      await window.api.saveQuizFile(folderName, category || folderName, quizzesToSave)
    } catch (error) {
      console.error('Error saving quizzes:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuiz = async (): Promise<void> => {
    if (!newQuiz.quiz.trim() || !newQuiz.answer.trim()) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    // Get the last quiz's index or start from 0
    const lastIndex = quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.index)) : -1
    const newIndex = lastIndex + 1

    // Generate UUID for new quiz (use pending image's tempId if exists)
    const newId = pendingImage?.tempId || uuidv4()

    // If there's a pending image, save it first
    if (pendingImage && folderName) {
      try {
        await window.api.saveQuizImage(
          folderName,
          newId,
          pendingImage.base64,
          pendingImage.fileName
        )
      } catch (error) {
        console.error('Error saving image:', error)
        alert('이미지 저장에 실패했습니다.')
        return
      }
    }

    // Add quiz to list
    const quizToAdd: QuizItem = {
      id: newId,
      index: newIndex,
      quiz: newQuiz.quiz,
      answer: newQuiz.answer
    }
    const updatedQuizzes = [...quizzes, quizToAdd]
    setQuizzes(updatedQuizzes)

    // Update state with the saved image if exists
    if (pendingImage) {
      setQuizImages((prev) => ({ ...prev, [newId]: pendingImage.base64 }))
      setQuizImageFileNames((prev) => ({ ...prev, [newId]: pendingImage.fileName }))
    }

    // Clear new quiz input and pending image
    setNewQuiz({ id: '', index: 0, quiz: '', answer: '' })
    setPendingImage(null)

    // Auto-save after adding
    await saveQuizzes(updatedQuizzes)
  }

  const handleDeleteQuiz = async (index: number): Promise<void> => {
    if (!folderName) return

    const quiz = quizzes[index]
    if (!confirm(`"${index + 1}"번 퀴즈를 삭제하시겠습니까?`)) {
      return
    }

    // Delete image if exists
    if (quizImages[quiz.id]) {
      try {
        await window.api.deleteQuizImage(folderName, quiz.id)
      } catch (error) {
        console.error('Error deleting quiz image:', error)
      }
    }

    // Remove from state
    const updatedQuizzes = quizzes.filter((_, i) => i !== index)
    setQuizzes(updatedQuizzes)
    const updatedImages = { ...quizImages }
    delete updatedImages[quiz.id]
    setQuizImages(updatedImages)
    const updatedFileNames = { ...quizImageFileNames }
    delete updatedFileNames[quiz.id]
    setQuizImageFileNames(updatedFileNames)

    // Auto-save after deleting
    await saveQuizzes(updatedQuizzes)
  }

  const startEdit = (index: number): void => {
    setEditingIndex(index)
    setEditingQuiz({ ...quizzes[index] })
  }

  const cancelEdit = (): void => {
    setEditingIndex(null)
    setEditingQuiz({ id: '', index: 0, quiz: '', answer: '' })
  }

  const saveEdit = async (index: number): Promise<void> => {
    if (!folderName || !editingQuiz.id || !editingQuiz.quiz.trim() || !editingQuiz.answer.trim()) {
      alert('모든 필드는 필수입니다.')
      return
    }

    const updatedQuizzes = [...quizzes]
    updatedQuizzes[index] = { ...editingQuiz }
    setQuizzes(updatedQuizzes)

    cancelEdit()

    // Auto-save after editing
    await saveQuizzes(updatedQuizzes)
  }

  const handleImageUpload = async (
    quizId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!folderName || !event.target.files || event.target.files.length === 0 || !quizId) return

    const file = event.target.files[0]
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result as string
        try {
          await window.api.saveQuizImage(folderName, quizId, base64Data, file.name)
          setQuizImages((prev) => ({ ...prev, [quizId]: base64Data }))
          setQuizImageFileNames((prev) => ({ ...prev, [quizId]: file.name }))
        } catch (error) {
          console.error('Error uploading image:', error)
          alert('이미지 업로드에 실패했습니다.')
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('파일을 읽는 중 오류가 발생했습니다.')
    }

    // Reset input
    event.target.value = ''
  }

  const handleImageDelete = async (quizId: string, index: number): Promise<void> => {
    if (!folderName) return

    if (!confirm(`"${index + 1}"번 퀴즈의 이미지를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await window.api.deleteQuizImage(folderName, quizId)
      const updatedImages = { ...quizImages }
      delete updatedImages[quizId]
      setQuizImages(updatedImages)
      const updatedFileNames = { ...quizImageFileNames }
      delete updatedFileNames[quizId]
      setQuizImageFileNames(updatedFileNames)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('이미지 삭제에 실패했습니다.')
    }
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
            <h1 className="text-4xl font-bold text-white mb-2">퀴즈 등록</h1>
            <p className="text-gray-400">퀴즈를 추가하고 관리하세요</p>
          </div>

          {isLoading ? (
            <div className="text-white text-center py-20">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600">
                      번호
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600">
                      퀴즈 *
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600">
                      정답 *
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600">
                      이미지
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border-b border-gray-600 w-40">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Add new quiz row */}
                  <tr className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-white">{quizzes.length + 1}</td>
                    <td className="px-4 py-3">
                      <textarea
                        value={newQuiz.quiz}
                        onChange={(e) => setNewQuiz({ ...newQuiz, quiz: e.target.value })}
                        placeholder="퀴즈를 입력하세요"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                        rows={2}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={newQuiz.answer}
                        onChange={(e) => setNewQuiz({ ...newQuiz, answer: e.target.value })}
                        placeholder="정답을 입력하세요"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-2">
                        {pendingImage ? (
                          <div className="flex flex-col gap-2">
                            <div className="relative">
                              <img
                                src={pendingImage.base64}
                                alt="미리보기"
                                className="w-16 h-16 object-cover rounded"
                              />
                              <button
                                onClick={() => setPendingImage(null)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                            <span className="text-gray-400 text-xs truncate max-w-[150px]">
                              {pendingImage.fileName}
                            </span>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (!e.target.files || e.target.files.length === 0) return

                                const file = e.target.files[0]
                                if (!file.type.startsWith('image/')) {
                                  alert('이미지 파일만 업로드할 수 있습니다.')
                                  return
                                }

                                // Generate temporary UUID for pending image
                                const tempId = uuidv4()

                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  const base64Data = reader.result as string
                                  setPendingImage({
                                    base64: base64Data,
                                    fileName: file.name,
                                    tempId: tempId
                                  })
                                }
                                reader.readAsDataURL(file)

                                // Reset input
                                e.target.value = ''
                              }}
                              className="hidden"
                              id="new-quiz-image"
                            />
                            <label
                              htmlFor="new-quiz-image"
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded cursor-pointer"
                            >
                              업로드
                            </label>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={handleAddQuiz}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                      >
                        추가
                      </button>
                    </td>
                  </tr>

                  {/* Existing quizzes */}
                  {quizzes.map((quiz, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                      {editingIndex === index ? (
                        <>
                          <td className="px-4 py-3 text-white">{index + 1}</td>
                          <td className="px-4 py-3">
                            <textarea
                              value={editingQuiz.quiz}
                              onChange={(e) =>
                                setEditingQuiz({ ...editingQuiz, quiz: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-purple-500 focus:outline-none resize-none"
                              rows={2}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingQuiz.answer}
                              onChange={(e) =>
                                setEditingQuiz({ ...editingQuiz, answer: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-2">
                              {quizImages[editingQuiz.id] ? (
                                <div className="flex flex-col gap-2">
                                  <div className="relative">
                                    <img
                                      src={quizImages[editingQuiz.id]}
                                      alt={`퀴즈 ${index + 1}`}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                    <button
                                      onClick={() => handleImageDelete(editingQuiz.id, index)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {quizImageFileNames[editingQuiz.id] && (
                                    <span className="text-gray-400 text-xs truncate max-w-[150px]">
                                      {quizImageFileNames[editingQuiz.id]}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(editingQuiz.id, e)}
                                    className="hidden"
                                    id={`edit-image-${index}`}
                                  />
                                  <label
                                    htmlFor={`edit-image-${index}`}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded cursor-pointer"
                                  >
                                    업로드
                                  </label>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => saveEdit(index)}
                                className="w-16 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded whitespace-nowrap"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="w-16 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded whitespace-nowrap"
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-white">{index + 1}</td>
                          <td className="px-4 py-3 text-white whitespace-pre-wrap">{quiz.quiz}</td>
                          <td className="px-4 py-3 text-white">{quiz.answer}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-2">
                              {quizImages[quiz.id] ? (
                                <div className="flex flex-col gap-2">
                                  <img
                                    src={quizImages[quiz.id]}
                                    alt={`퀴즈 ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  {quizImageFileNames[quiz.id] && (
                                    <span className="text-gray-400 text-xs truncate max-w-[150px]">
                                      {quizImageFileNames[quiz.id]}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">이미지 없음</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => startEdit(index)}
                                className="w-16 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded whitespace-nowrap"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteQuiz(index)}
                                className="w-16 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded whitespace-nowrap"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Register

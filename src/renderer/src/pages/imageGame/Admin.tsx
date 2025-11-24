import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const Admin: React.FC = () => {
  const [searchParams] = useSearchParams()
  const folderName = searchParams.get('folder') || ''
  const [currentImageName, setCurrentImageName] = useState<string>('')
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalImages, setTotalImages] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])

  const loadImages = useCallback(async (): Promise<void> => {
    if (!folderName) return

    try {
      const imageList = await window.api.getFolderImages(folderName)
      const imageNames = imageList.map((img) => img.name)
      setAllImages(imageNames)
      setTotalImages(imageNames.length)
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadImages()
    }
  }, [folderName, loadImages])

  useEffect(() => {
    // Listen for image changes from Game page
    const removeListener = window.api.onGameImageChanged((imageName: string) => {
      setCurrentImageName(imageName)
      setCurrentIndex((prevIndex) => {
        const index = allImages.findIndex((img) => img === imageName)
        return index !== -1 ? index : prevIndex
      })
    })

    return () => {
      removeListener()
    }
  }, [allImages])

  const handleStartGame = (): void => {
    if (folderName && !isGameStarted) {
      window.api.gameStart(folderName)
      setIsGameStarted(true)
      setCurrentIndex(0)
    }
  }

  const handleNextImage = (): void => {
    if (isGameStarted) {
      window.api.gameNextImage()
    }
  }

  const handleEndGame = (): void => {
    if (isGameStarted) {
      window.api.gameEnd()
      setIsGameStarted(false)
      setCurrentIndex(0)
      setCurrentImageName('')
    }
  }

  const isAllImagesShown = isGameStarted && totalImages > 0 && currentIndex >= totalImages - 1

  // Remove file extension from image name
  const getImageNameWithoutExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.')
    return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName
  }

  return (
    <div className="w-full h-full bg-gray-900 text-white p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">게임 관리</h1>
      <p className="text-gray-400 mb-6">폴더: {folderName}</p>

      {!isGameStarted ? (
        <button
          onClick={handleStartGame}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium mb-4"
        >
          게임 시작
        </button>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">정답</h2>
            {currentImageName ? (
              <p className="text-white text-sm bg-gray-800 p-3 rounded-lg break-all">
                {getImageNameWithoutExtension(currentImageName)}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">이미지 정보 없음</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">
              진행도: {currentIndex + 1} / {totalImages}
            </p>
          </div>

          {isAllImagesShown ? (
            <button
              onClick={handleEndGame}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium mb-4"
            >
              끝내기
            </button>
          ) : (
            <button
              onClick={handleNextImage}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mb-4"
            >
              다음 이미지
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default Admin

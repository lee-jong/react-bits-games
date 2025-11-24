import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImageFile {
  name: string
  path: string
  size: number
  modifiedAt: number
  base64?: string
}

const Game: React.FC = () => {
  const navigate = useNavigate()
  const { folderName } = useParams<{ folderName: string }>()
  const [currentImage, setCurrentImage] = useState<ImageFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const imagesRef = useRef<ImageFile[]>([])

  const loadImageByIndex = useCallback(
    async (index: number): Promise<void> => {
      if (!folderName || imagesRef.current.length === 0) return

      const image = imagesRef.current[index]
      if (!image) return

      try {
        setIsLoading(true)
        const { base64 } = await window.api.getImageBase64(folderName, image.name)
        setCurrentImage({ ...image, base64 })
        // Notify admin window about image change
        window.api.gameImageChanged(image.name)
      } catch (error) {
        console.error(`Error loading image ${image.name}:`, error)
        setCurrentImage(image)
      } finally {
        setIsLoading(false)
      }
    },
    [folderName]
  )

  const loadAllImages = useCallback(async (): Promise<void> => {
    if (!folderName) return

    try {
      const imageList = await window.api.getFolderImages(folderName)
      imagesRef.current = imageList
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadAllImages()
    }
  }, [folderName, loadAllImages])

  useEffect(() => {
    // Listen for game control events from admin window
    const removeGameStart = window.api.onGameStart((receivedFolderName: string) => {
      if (receivedFolderName === folderName) {
        setIsGameStarted(true)
        setCurrentImageIndex(0)
        loadImageByIndex(0)
      }
    })

    const removeGameNextImage = window.api.onGameNextImage(() => {
      if (isGameStarted && imagesRef.current.length > 0) {
        if (currentImageIndex < imagesRef.current.length - 1) {
          const nextIndex = currentImageIndex + 1
          setCurrentImageIndex(nextIndex)
          loadImageByIndex(nextIndex)
        }
      }
    })

    const removeGameEnd = window.api.onGameEnd(() => {
      setIsGameStarted(false)
      navigate('/image-game/list')
    })

    return () => {
      removeGameStart()
      removeGameNextImage()
      removeGameEnd()
    }
  }, [folderName, isGameStarted, currentImageIndex, loadImageByIndex, navigate])

  const handleBack = (): void => {
    navigate('/image-game/list')
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
            <h1 className="text-4xl font-bold text-white mb-2">이미지 게임</h1>
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
            ) : !currentImage ? (
              <div className="text-gray-400 text-center py-20">
                이미지가 없습니다. 설정에서 이미지를 추가해주세요.
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {currentImage.base64 ? (
                  <img
                    src={currentImage.base64}
                    alt={currentImage.name}
                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                    이미지 로딩 중...
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

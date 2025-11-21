import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Folder from '@/components/bits/Folder'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FolderImage {
  name: string
  path: string
  size: number
  modifiedAt: number
  base64?: string
}

interface FolderData {
  id: string
  title: string
}

const Setting: React.FC = () => {
  const navigate = useNavigate()
  const [folders, setFolders] = useState<FolderData[]>([])
  const [folderImages, setFolderImages] = useState<Record<string, FolderImage[]>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const folderList = await window.api.getFolders()
      setFolders(folderList)

      // Load images for each folder
      const imagesMap: Record<string, FolderImage[]> = {}
      for (const folder of folderList) {
        try {
          const imageList = await window.api.getFolderImages(folder.id)
          // Get base64 for latest 2 images only (for performance)
          const imagesWithBase64 = await Promise.all(
            imageList.slice(0, 2).map(async (image) => {
              try {
                const { base64 } = await window.api.getImageBase64(folder.id, image.name)
                return { ...image, base64 }
              } catch (error) {
                console.error(`Error loading image ${image.name}:`, error)
                return image
              }
            })
          )
          imagesMap[folder.id] = imagesWithBase64
        } catch (error) {
          console.error(`Error loading images for folder ${folder.id}:`, error)
          imagesMap[folder.id] = []
        }
      }
      setFolderImages(imagesMap)
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = (): void => {
    navigate('/')
  }

  const handleAddFolder = async (): Promise<void> => {
    const trimmedName = newFolderName.trim()
    if (!trimmedName) {
      alert('폴더명을 입력해주세요.')
      return
    }

    // Validate folder name before sending
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(trimmedName)) {
      alert('폴더명에 사용할 수 없는 문자가 포함되어 있습니다: < > : " / \\ | ? *')
      return
    }

    try {
      const result = await window.api.createFolder(trimmedName)
      if (result?.success) {
        setNewFolderName('')
        setShowAddModal(false)
        await loadFolders()
      }
    } catch (error: unknown) {
      console.error('Error creating folder:', error)
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

      if (errorMessage.includes('already exists')) {
        alert('같은 이름의 폴더가 이미 존재합니다.')
      } else {
        alert(`폴더 생성에 실패했습니다: ${errorMessage}`)
      }
    }
  }

  const handleDeleteFolder = async (folderId: string): Promise<void> => {
    if (!confirm(`"${folderId}" 폴더를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await window.api.deleteFolder(folderId)
      await loadFolders()
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('폴더 삭제에 실패했습니다.')
    }
  }

  const getLatestImages = (folderId: string): FolderImage[] => {
    const images = folderImages[folderId] || []
    // Images are already sorted by modifiedAt (newest first) from API
    // and limited to 2 images
    return images
  }

  const renderFolderItems = (folderId: string): React.ReactNode[] => {
    const latestImages = getLatestImages(folderId)
    const items: React.ReactNode[] = []

    // Add upload button first - navigate to upload page on click
    items.push(
      <div
        key="upload-button"
        onClick={() => navigate(`/upload/${folderId}`)}
        className="w-full h-full rounded-lg flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer border-2 border-dashed border-gray-400"
      >
        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-gray-600 text-sm font-medium">업로드</span>
        </div>
      </div>
    )

    // Add latest images based on count
    // 이미지 2개 이상: 업로드 + 최신 2개
    // 이미지 1개: 업로드 + 이미지 1개
    // 이미지 0개: 업로드만
    if (latestImages.length >= 2) {
      // 최신 2개만 표시
      latestImages.slice(0, 2).forEach((image) => {
        items.push(
          <div
            key={image.name}
            className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
          >
            {image.base64 ? (
              <img src={image.base64} alt={image.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                로딩 중...
              </div>
            )}
          </div>
        )
      })
    } else if (latestImages.length === 1) {
      // 이미지 1개 표시
      items.push(
        <div
          key={latestImages[0].name}
          className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
        >
          {latestImages[0].base64 ? (
            <img
              src={latestImages[0].base64}
              alt={latestImages[0].name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              로딩 중...
            </div>
          )}
        </div>
      )
    }
    // 이미지 0개일 경우 업로드 버튼만 반환 (아무것도 추가하지 않음)
    return items
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
            <h1 className="text-4xl font-bold text-white mb-2">게임 설정</h1>
            <p className="text-gray-400">파일을 업로드하여 게임을 설정하세요</p>
          </div>

          <div className="mb-20">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              + 폴더 추가
            </button>
          </div>

          {isLoading ? (
            <div className="text-white text-center py-20">로딩 중...</div>
          ) : folders.length === 0 ? (
            <div className="text-gray-400 text-center py-20">
              폴더가 없습니다. 폴더를 추가해주세요.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-x-8 gap-y-12">
              {/* Folder Cards */}
              {folders.map((data) => (
                <div key={data.id} className="flex flex-col items-center gap-8 relative group">
                  <Folder
                    items={renderFolderItems(data.id)}
                    color="#5227FF"
                    size={1.5}
                    className="flex-shrink-0"
                    maxCount={renderFolderItems(data.id).length}
                  />
                  <div className="relative w-full flex items-center justify-center px-14">
                    <h2 className="text-white text-xl font-semibold text-center truncate w-full">
                      {data.title}
                    </h2>
                    <button
                      onClick={() => handleDeleteFolder(data.id)}
                      className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded flex-shrink-0"
                      title="폴더 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Folder Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
                <h2 className="text-white text-xl font-bold mb-4">새 폴더 추가</h2>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFolder()
                    } else if (e.key === 'Escape') {
                      setShowAddModal(false)
                      setNewFolderName('')
                    }
                  }}
                  placeholder="폴더명을 입력하세요"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 mb-4"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewFolderName('')
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddFolder}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Setting

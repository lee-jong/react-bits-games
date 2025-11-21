import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import AddFolderModal from '@/components/setting/AddFolderModal'
import FolderCard from '@/components/setting/FolderCard'
import UploadButton from '@/components/setting/UploadButton'

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
              {folders.map((data) => {
                const latestImages = getLatestImages(data.id)
                return (
                  <FolderCard
                    key={data.id}
                    folderId={data.id}
                    folderTitle={data.title}
                    images={latestImages}
                    uploadButton={
                      <UploadButton
                        key="upload-button"
                        onClick={() => navigate(`/upload/${data.id}`)}
                      />
                    }
                    onDelete={handleDeleteFolder}
                  />
                )
              })}
            </div>
          )}

          {/* Add Folder Modal */}
          <AddFolderModal
            isOpen={showAddModal}
            folderName={newFolderName}
            onFolderNameChange={setNewFolderName}
            onAdd={handleAddFolder}
            onCancel={() => {
              setShowAddModal(false)
              setNewFolderName('')
            }}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

export default Setting

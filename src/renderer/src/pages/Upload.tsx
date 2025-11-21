import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImageFile {
  name: string
  path: string
  size: number
  modifiedAt: number
  base64?: string
}

interface UploadingImage {
  id: string
  file: File
  preview: string
  name: string
}

const Upload: React.FC = () => {
  const navigate = useNavigate()
  const { folderName } = useParams<{ folderName: string }>()
  const [images, setImages] = useState<ImageFile[]>([])
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([])
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (folderName) {
      loadImages()
    }
  }, [folderName])

  const loadImages = async (): Promise<void> => {
    if (!folderName) return

    try {
      setIsLoading(true)
      const imageList = await window.api.getFolderImages(folderName)

      // Load base64 for each image
      const imagesWithBase64 = await Promise.all(
        imageList.map(async (image) => {
          try {
            const { base64 } = await window.api.getImageBase64(folderName, image.name)
            return { ...image, base64 }
          } catch (error) {
            console.error(`Error loading image ${image.name}:`, error)
            return image
          }
        })
      )

      setImages(imagesWithBase64)
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = (): void => {
    navigate('/setting')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newUploadingImages: UploadingImage[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const uploadImage: UploadingImage = {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview: reader.result as string,
            name: file.name
          }
          newUploadingImages.push(uploadImage)
          setUploadingImages((prev) => [...prev, uploadImage])
        }
        reader.readAsDataURL(file)
      }
    })

    // Reset input
    event.target.value = ''
  }

  const handleUpload = async (): Promise<void> => {
    if (!folderName || uploadingImages.length === 0) return

    try {
      for (const uploadImage of uploadingImages) {
        const base64Data = uploadImage.preview
        await window.api.saveImage(folderName, uploadImage.name, base64Data)
      }

      // Clear uploading images
      setUploadingImages([])
      // Reload images
      await loadImages()
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('이미지 업로드에 실패했습니다.')
    }
  }

  const handleDelete = async (fileName: string): Promise<void> => {
    if (!folderName) return

    if (!confirm(`"${fileName}" 이미지를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await window.api.deleteImage(folderName, fileName)
      await loadImages()
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('이미지 삭제에 실패했습니다.')
    }
  }

  const startRename = (fileName: string): void => {
    setEditingName(fileName)
    setNewName(fileName)
  }

  const cancelRename = (): void => {
    setEditingName(null)
    setNewName('')
  }

  const handleRename = async (oldFileName: string): Promise<void> => {
    if (!folderName || !newName.trim()) return

    if (newName.trim() === oldFileName) {
      cancelRename()
      return
    }

    try {
      await window.api.renameImage(folderName, oldFileName, newName.trim())
      cancelRename()
      await loadImages()
    } catch (error) {
      console.error('Error renaming image:', error)
      alert('이미지명 변경에 실패했습니다.')
    }
  }

  const removeUploadingImage = (id: string): void => {
    setUploadingImages((prev) => prev.filter((img) => img.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
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
            <h1 className="text-4xl font-bold text-white mb-2">이미지 업로드</h1>
            <p className="text-gray-400">폴더: {folderName}</p>
          </div>

          {/* Upload Section */}
          <div className="mb-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h2 className="text-white text-xl font-semibold mb-4">새 이미지 추가</h2>
            <div className="flex gap-4 items-center">
              <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer font-medium">
                파일 선택 (멀티 선택 가능)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {uploadingImages.length > 0 && (
                <>
                  <span className="text-gray-400">선택된 파일: {uploadingImages.length}개</span>
                  <button
                    onClick={handleUpload}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    업로드
                  </button>
                </>
              )}
            </div>

            {/* Uploading Images Preview */}
            {uploadingImages.length > 0 && (
              <div className="mt-6 grid grid-cols-5 gap-4">
                {uploadingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-white text-sm truncate">{img.name}</p>
                      <button
                        onClick={() => removeUploadingImage(img.id)}
                        className="text-red-400 hover:text-red-300 text-xs mt-1"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing Images Section */}
          <div>
            <h2 className="text-white text-xl font-semibold mb-4">
              기존 이미지 ({images.length}개)
            </h2>
            {isLoading ? (
              <div className="text-white text-center py-20">로딩 중...</div>
            ) : images.length === 0 ? (
              <div className="text-gray-400 text-center py-20">이미지가 없습니다.</div>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {images.map((image) => (
                  <div key={image.name} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                      {image.base64 ? (
                        <img
                          src={image.base64}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          로딩 중...
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      {editingName === image.name ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRename(image.name)
                              } else if (e.key === 'Escape') {
                                cancelRename()
                              }
                            }}
                            className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(image.name)}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            확인
                          </button>
                          <button
                            onClick={cancelRename}
                            className="text-gray-400 hover:text-gray-300 text-xs"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-white text-sm truncate" title={image.name}>
                            {image.name}
                          </p>
                          <p className="text-gray-400 text-xs">{formatFileSize(image.size)}</p>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => startRename(image.name)}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              이름 변경
                            </button>
                            <button
                              onClick={() => handleDelete(image.name)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default Upload

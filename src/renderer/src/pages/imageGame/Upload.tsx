import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import UploadHeader from '@/components/upload/UploadHeader'
import UploadSection from '@/components/upload/UploadSection'
import ImageItem from '@/components/upload/ImageItem'

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

  const loadImages = useCallback(async (): Promise<void> => {
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
  }, [folderName])

  useEffect(() => {
    if (folderName) {
      loadImages()
    }
  }, [folderName, loadImages])

  const handleBack = (): void => {
    navigate('/image-game/setting')
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
          <UploadHeader folderName={folderName} onBack={handleBack} />

          <UploadSection
            uploadingImages={uploadingImages}
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            onRemoveUploadingImage={removeUploadingImage}
          />

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
                  <ImageItem
                    key={image.name}
                    image={image}
                    editingName={editingName}
                    newName={newName}
                    onStartRename={startRename}
                    onRename={handleRename}
                    onCancelRename={cancelRename}
                    onNewNameChange={setNewName}
                    onDelete={handleDelete}
                    formatFileSize={formatFileSize}
                  />
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

import React from 'react'
import ImageRenameInput from './ImageRenameInput'

interface ImageFile {
  name: string
  size: number
  base64?: string
}

interface ImageItemProps {
  image: ImageFile
  editingName: string | null
  newName: string
  onStartRename: (fileName: string) => void
  onRename: (oldFileName: string) => void
  onCancelRename: () => void
  onNewNameChange: (name: string) => void
  onDelete: (fileName: string) => void
  formatFileSize: (bytes: number) => string
}

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  editingName,
  newName,
  onStartRename,
  onRename,
  onCancelRename,
  onNewNameChange,
  onDelete,
  formatFileSize
}) => {
  const isEditing = editingName === image.name

  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
        {image.base64 ? (
          <img src={image.base64} alt={image.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            로딩 중...
          </div>
        )}
      </div>
      <div className="mt-2">
        {isEditing ? (
          <ImageRenameInput
            value={newName}
            onChange={onNewNameChange}
            onConfirm={() => onRename(image.name)}
            onCancel={onCancelRename}
          />
        ) : (
          <>
            <p className="text-white text-sm truncate" title={image.name}>
              {image.name}
            </p>
            <p className="text-gray-400 text-xs">{formatFileSize(image.size)}</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => onStartRename(image.name)}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                이름 변경
              </button>
              <button
                onClick={() => onDelete(image.name)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageItem

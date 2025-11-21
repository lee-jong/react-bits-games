import React from 'react'

interface UploadingImageItemProps {
  id: string
  name: string
  preview: string
  onRemove: (id: string) => void
}

const UploadingImageItem: React.FC<UploadingImageItemProps> = ({ id, name, preview, onRemove }) => {
  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
        <img src={preview} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="mt-2">
        <p className="text-white text-sm truncate">{name}</p>
        <button
          onClick={() => onRemove(id)}
          className="text-red-400 hover:text-red-300 text-xs mt-1"
        >
          제거
        </button>
      </div>
    </div>
  )
}

export default UploadingImageItem

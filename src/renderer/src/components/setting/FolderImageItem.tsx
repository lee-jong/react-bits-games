import React from 'react'

interface FolderImageItemProps {
  name: string
  base64?: string
}

const FolderImageItem: React.FC<FolderImageItemProps> = ({ name, base64 }) => {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
      {base64 ? (
        <img src={base64} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          로딩 중...
        </div>
      )}
    </div>
  )
}

export default FolderImageItem

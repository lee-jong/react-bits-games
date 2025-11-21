import React from 'react'
import Folder from '@/components/bits/Folder'
import FolderImageItem from './FolderImageItem'

interface FolderImage {
  name: string
  base64?: string
}

interface FolderCardProps {
  folderId: string
  folderTitle: string
  images: FolderImage[]
  uploadButton: React.ReactNode
  onDelete: (folderId: string) => void
}

const FolderCard: React.FC<FolderCardProps> = ({
  folderId,
  folderTitle,
  images,
  uploadButton,
  onDelete
}) => {
  const renderFolderItems = (): React.ReactNode[] => {
    const items: React.ReactNode[] = [uploadButton]

    // Add latest images based on count
    if (images.length >= 2) {
      images.slice(0, 2).forEach((image) => {
        items.push(<FolderImageItem key={image.name} name={image.name} base64={image.base64} />)
      })
    } else if (images.length === 1) {
      items.push(
        <FolderImageItem key={images[0].name} name={images[0].name} base64={images[0].base64} />
      )
    }

    return items
  }

  return (
    <div className="flex flex-col items-center gap-8 relative group">
      <Folder
        items={renderFolderItems()}
        color="#5227FF"
        size={1.5}
        className="flex-shrink-0"
        maxCount={renderFolderItems().length}
      />
      <div className="relative w-full flex items-center justify-center px-14">
        <h2 className="text-white text-xl font-semibold text-center truncate w-full">
          {folderTitle}
        </h2>
        <button
          onClick={() => onDelete(folderId)}
          className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded flex-shrink-0"
          title="폴더 삭제"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default FolderCard

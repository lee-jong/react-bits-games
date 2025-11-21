import React from 'react'
import UploadingImageItem from './UploadingImageItem'

interface UploadingImage {
  id: string
  name: string
  preview: string
}

interface UploadSectionProps {
  uploadingImages: UploadingImage[]
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  onRemoveUploadingImage: (id: string) => void
}

const UploadSection: React.FC<UploadSectionProps> = ({
  uploadingImages,
  onFileSelect,
  onUpload,
  onRemoveUploadingImage
}) => {
  return (
    <div className="mb-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6">
      <h2 className="text-white text-xl font-semibold mb-4">새 이미지 추가</h2>
      <div className="flex gap-4 items-center">
        <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer font-medium">
          파일 선택 (멀티 선택 가능)
          <input type="file" accept="image/*" multiple onChange={onFileSelect} className="hidden" />
        </label>
        {uploadingImages.length > 0 && (
          <>
            <span className="text-gray-400">선택된 파일: {uploadingImages.length}개</span>
            <button
              onClick={onUpload}
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
            <UploadingImageItem
              key={img.id}
              id={img.id}
              name={img.name}
              preview={img.preview}
              onRemove={onRemoveUploadingImage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UploadSection

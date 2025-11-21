import React from 'react'

interface UploadHeaderProps {
  folderName?: string
  onBack: () => void
}

const UploadHeader: React.FC<UploadHeaderProps> = ({ folderName, onBack }) => {
  return (
    <div className="mb-8">
      <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors mb-4">
        ← 뒤로가기
      </button>
      <h1 className="text-4xl font-bold text-white mb-2">이미지 업로드</h1>
      {folderName && <p className="text-gray-400">폴더: {folderName}</p>}
    </div>
  )
}

export default UploadHeader

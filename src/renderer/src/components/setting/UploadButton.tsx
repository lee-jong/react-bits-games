import React from 'react'

interface UploadButtonProps {
  onClick: () => void
  text?: string
}

const UploadButton: React.FC<UploadButtonProps> = ({ onClick, text = '업로드' }) => {
  return (
    <div
      onClick={onClick}
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
        <span className="text-gray-600 text-sm font-medium">{text}</span>
      </div>
    </div>
  )
}

export default UploadButton

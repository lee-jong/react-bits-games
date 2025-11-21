import React from 'react'

interface ImageRenameInputProps {
  value: string
  onChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

const ImageRenameInput: React.FC<ImageRenameInputProps> = ({
  value,
  onChange,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onConfirm()
          } else if (e.key === 'Escape') {
            onCancel()
          }
        }}
        className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-purple-500"
        autoFocus
      />
      <button onClick={onConfirm} className="text-green-400 hover:text-green-300 text-xs">
        확인
      </button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-300 text-xs">
        취소
      </button>
    </div>
  )
}

export default ImageRenameInput

import React from 'react'

interface AddFolderModalProps {
  isOpen: boolean
  folderName: string
  onFolderNameChange: (name: string) => void
  onAdd: () => void
  onCancel: () => void
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({
  isOpen,
  folderName,
  onFolderNameChange,
  onAdd,
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
        <h2 className="text-white text-xl font-bold mb-4">새 폴더 추가</h2>
        <input
          type="text"
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          placeholder="폴더명을 입력하세요"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 mb-4"
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddFolderModal

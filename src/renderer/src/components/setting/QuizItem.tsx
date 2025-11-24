import React from 'react'

interface QuizItemProps {
  index: number
}

const QuizItem: React.FC<QuizItemProps> = ({ index }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border-2 border-purple-500/50 p-4">
      <span className="text-white text-sm font-medium truncate text-center w-full">
        {index + 1}
      </span>
    </div>
  )
}

export default QuizItem

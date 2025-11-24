import React from 'react'

interface QuizItemProps {
  title: string
}

const QuizItem: React.FC<QuizItemProps> = ({ title }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border-2 border-purple-500/50 p-4">
      <span className="text-white text-sm font-medium truncate text-center w-full">{title}</span>
    </div>
  )
}

export default QuizItem

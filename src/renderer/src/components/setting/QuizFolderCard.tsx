import React from 'react'
import Folder from '@/components/bits/Folder'
import QuizItem from './QuizItem'

interface QuizItemData {
  title: string
  quiz: string
  answer: string
}

interface QuizFolderCardProps {
  folderId: string
  folderTitle: string
  quizzes: QuizItemData[]
  registerButton: React.ReactNode
  onDelete: (folderId: string) => void
}

const QuizFolderCard: React.FC<QuizFolderCardProps> = ({
  folderId,
  folderTitle,
  quizzes,
  registerButton,
  onDelete
}) => {
  const renderFolderItems = (): React.ReactNode[] => {
    const items: React.ReactNode[] = [registerButton]

    // Add latest quizzes based on count (similar to images)
    if (quizzes.length >= 2) {
      quizzes.slice(0, 2).forEach((quiz, index) => {
        items.push(<QuizItem key={`quiz-${index}`} title={quiz.title} />)
      })
    } else if (quizzes.length === 1) {
      items.push(<QuizItem key="quiz-0" title={quizzes[0].title} />)
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

export default QuizFolderCard

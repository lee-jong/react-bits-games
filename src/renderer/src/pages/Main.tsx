import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SpotlightCard from '@/components/bits/SpotlightCard'
import ShinyText from '@/components/bits/ShinyText'
import StarBorder from '@/components/bits/StarBorder'
import { ScrollArea } from '@/components/ui/scroll-area'

// Game categories
const GAME_CATEGORIES = [
  { name: '이미지 게임', path: '/image-game/list' },
  { name: '퀴즈 게임', path: '/quiz-game/list' }
] as const

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState({})

  const handleMouseEnter = (id): void => {
    setIsHovered((prev) => ({ ...prev, [id]: true }))
  }

  const handleMouseLeave = (id): void => {
    setIsHovered((prev) => ({ ...prev, [id]: false }))
  }

  return (
    <div className="relative w-full h-full">
      <ScrollArea className="w-full h-full">
        <div className="grid grid-cols-2 gap-4 p-20">
          {GAME_CATEGORIES.map((category) => (
            <StarBorder className="pa-0 ma-0" speed={'6s'} key={category.name}>
              <div
                onMouseEnter={() => handleMouseEnter(category.name)}
                onMouseLeave={() => handleMouseLeave(category.name)}
                onClick={() => navigate(category.path)}
                className="cursor-pointer"
              >
                <SpotlightCard
                  className="custom-spotlight-card"
                  spotlightColor="rgba(255, 255, 255, 0.25)"
                >
                  <ShinyText
                    className={`text-[24px] ${isHovered[category.name] && 'text-white'}`}
                    text={category.name}
                    speed={2}
                    disabled={isHovered[category.name]}
                  />
                </SpotlightCard>
              </div>
            </StarBorder>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Home

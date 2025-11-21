import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SpotlightCard from '@/components/bits/SpotlightCard'
import ShinyText from '@/components/bits/ShinyText'
import StarBorder from '@/components/bits/StarBorder'
import { ScrollArea } from '@/components/ui/scroll-area'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const menus = [{ id: '1', title: '이미지 게임', route: '/image-game' }]
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
        <div className=" p-20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">게임</h1>
            <p className="text-gray-400">다양한 게임을 진행해보세요!</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {menus.length === 0 ? (
              <div className="col-span-2 text-gray-400 text-center py-20">메뉴가 없습니다.</div>
            ) : (
              menus.map((data) => (
                <StarBorder className="pa-0 ma-0" speed={'6s'} key={data.id}>
                  <div
                    onMouseEnter={() => handleMouseEnter(data.id)}
                    onMouseLeave={() => handleMouseLeave(data.id)}
                    onClick={() => navigate('image-game')}
                  >
                    <SpotlightCard
                      className="custom-spotlight-card"
                      spotlightColor="rgba(255, 255, 255, 0.25)"
                    >
                      <ShinyText
                        className={`text-[24px] ${isHovered[data.id] && 'text-white'}`}
                        text={data.title}
                        speed={2}
                        disabled={isHovered[data.id]}
                      />
                    </SpotlightCard>
                  </div>
                </StarBorder>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default Home

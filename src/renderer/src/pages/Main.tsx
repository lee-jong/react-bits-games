import React, { useState } from 'react'
import SpotlightCard from '@/components/bits/SpotlightCard'
import ShinyText from '@/components/bits/ShinyText'
import StarBorder from '@/components/bits/StarBorder'
import { ScrollArea } from '@/components/ui/scroll-area'

const Home: React.FC = () => {
  const [isHovered, setIsHovered] = useState({})

  const exampleData = [
    { id: '1', title: '역사' },
    { id: '2', title: '경제' },
    { id: '3', title: '영어' },
    { id: '4', title: '인물' },
    { id: '5', title: '캐릭터' }
  ]

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
          {/* Image Quiz Card */}
          {exampleData.map((data) => (
            <StarBorder className="pa-0 ma-0" speed={'6s'} key={data.id}>
              <div
                onMouseEnter={() => handleMouseEnter(data.id)}
                onMouseLeave={() => handleMouseLeave(data.id)}
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
          ))}
          {/* Game Setting Button */}
          <div className="absolute bottom-4 right-4">
            <StarBorder className="pa-0 ma-0" speed={'6s'}>
              <div
                onMouseEnter={() => handleMouseEnter('setting')}
                onMouseLeave={() => handleMouseLeave('setting')}
              >
                <SpotlightCard
                  className="custom-spotlight-card w-[120px] h-[60px] p-1 flex justify-center items-center"
                  spotlightColor="rgba(255, 255, 255, 0.25)"
                >
                  <ShinyText
                    className={`text-[20px] ${isHovered['setting'] && 'text-white'}`}
                    text={'SETTING'}
                    speed={2}
                    disabled={isHovered['setting']}
                  />
                </SpotlightCard>
              </div>
            </StarBorder>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default Home

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SpotlightCard from '@/components/bits/SpotlightCard'
import ShinyText from '@/components/bits/ShinyText'
import StarBorder from '@/components/bits/StarBorder'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FolderData {
  id: string
  title: string
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState({})
  const [folders, setFolders] = useState<FolderData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const folderList = await window.api.getFolders()
      setFolders(folderList)
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          {isLoading ? (
            <div className="col-span-2 text-white text-center py-20">로딩 중...</div>
          ) : folders.length === 0 ? (
            <div className="col-span-2 text-gray-400 text-center py-20">
              폴더가 없습니다. 설정에서 폴더를 추가해주세요.
            </div>
          ) : (
            folders.map((data) => (
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
            ))
          )}
          {/* Game Setting Button */}
          <div className="absolute bottom-4 right-4">
            <StarBorder className="pa-0 ma-0" speed={'6s'}>
              <div
                onMouseEnter={() => handleMouseEnter('setting')}
                onMouseLeave={() => handleMouseLeave('setting')}
                onClick={() => navigate('/setting')}
                className="cursor-pointer"
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

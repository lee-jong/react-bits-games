import { Outlet } from 'react-router-dom'
import DotGrid from '@/components/bits/DotGrid'
import SplashCursor from '../bits/SplashCursor'

const Layout = () => {
  return (
    <div className="w-full h-full relative">
      <DotGrid
        className="p-0"
        dotSize={5}
        gap={15}
        baseColor="rgb(39,30,55)"
        activeColor="#5227FF"
        proximity={120}
        shockRadius={250}
        shockStrength={1}
        resistance={750}
        returnDuration={1.5}
      />
      <div className="absolute top-0 left-0 w-full h-full">
        <Outlet />
      </div>
      <SplashCursor />
    </div>
  )
}

export default Layout

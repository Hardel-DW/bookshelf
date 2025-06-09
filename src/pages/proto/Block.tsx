import { useState, useEffect } from 'react'
import bookshelfTexture from '../../assets/bookshelf.png'
import oakPlanksTexture from '../../assets/oak_planks.png'

interface BlockProps {
  x?: number
  y?: number
  z?: number
}

function Block({ x = 0, y = 0, z = 0 }: BlockProps) {
  const [animY, setAnimY] = useState(-200) // Commence en haut du ciel
  
  useEffect(() => {
    // Petite delay puis animation vers la position finale
    const timer = setTimeout(() => {
      setAnimY(-y * 32)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [y])

  // Animation différente selon si c'est au sol ou en hauteur
  const transition = y > 0 
    ? 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1)'
    : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'

  const style = {
    transform: `translate3d(${x * 32}px, ${animY}px, ${z * 32}px)`,
    transition
  }

  return (
    <div 
      className="absolute w-8 h-8 transform-gpu transform-3d transition-all duration-300" 
      style={{ ...style}}
    >
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10 pixelated" 
          style={{ 
            backgroundImage: `url(${bookshelfTexture})`,
            transform: 'rotateY(0deg) translateZ(15px)'
          }} 
        />
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10 pixelated" 
          style={{ 
            backgroundImage: `url(${bookshelfTexture})`,
            transform: 'rotateY(90deg) translateZ(15px)'
          }} 
        />
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10 pixelated" 
          style={{ 
            backgroundImage: `url(${bookshelfTexture})`,
            transform: 'rotateY(180deg) translateZ(15px)'
          }} 
        />
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10 pixelated" 
          style={{ 
            backgroundImage: `url(${bookshelfTexture})`,
            transform: 'rotateY(-90deg) translateZ(15px)'
          }} 
        />
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10" 
          style={{ 
            backgroundImage: `url(${oakPlanksTexture})`,
            transform: 'rotateX(90deg) translateZ(15px)'
          }} 
        />
        <div 
          className="absolute w-8 h-8 bg-cover bg-no-repeat border border-white/10 pixelated" 
          style={{ 
            backgroundImage: `url(${oakPlanksTexture})`,
            transform: 'rotateX(-90deg) translateZ(15px)'
          }} 
        />
    </div>
  )
}

export default Block 
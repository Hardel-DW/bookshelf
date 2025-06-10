import bookshelfTexture from '../../assets/bookshelf.png'
import oakPlanksTexture from '../../assets/oak_planks.png'
import enchantingTableTopTexture from '../../assets/enchanting_table_top.png'
import enchantingTableSideTexture from '../../assets/enchanting_table_side.png'
import enchantingTableBottomTexture from '../../assets/enchanting_table_bottom.png'
import type { BlockType } from './AppInCss'

const BLOCK_CONFIG = {
  default: { top: oakPlanksTexture, bottom: oakPlanksTexture, sides: bookshelfTexture },
  enchanting_table: { top: enchantingTableTopTexture, bottom: enchantingTableBottomTexture, sides: enchantingTableSideTexture } 
}

function Block({ x = 0, y = 0, z = 0, type = 'default' }: BlockType) {
  const config = BLOCK_CONFIG[type as keyof typeof BLOCK_CONFIG] || BLOCK_CONFIG.default
  const textures = config

  const faces = [
    { rot: 'rotateY(0deg)', tex: textures.sides, transform: `rotateY(0deg) translateZ(16px)` },
    { rot: 'rotateY(90deg)', tex: textures.sides, transform: `rotateY(90deg) translateZ(16px)` },
    { rot: 'rotateY(180deg)', tex: textures.sides, transform: `rotateY(180deg) translateZ(16px)` },
    { rot: 'rotateY(-90deg)', tex: textures.sides, transform: `rotateY(-90deg) translateZ(16px)` },
    { rot: 'rotateX(90deg)', tex: textures.top, transform: `rotateX(90deg) translateZ(${type === 'enchanting_table' ? 8 : 16}px)` },
    { rot: 'rotateX(-90deg)', tex: textures.bottom, transform: `rotateX(-90deg) translateZ(16px)` }
  ]

  return (
    <div 
      className={`block ${y > 0 ? 'block-air' : 'block-ground'}`} 
      style={{ '--x': `${x * 32}px`, '--y': `${-y * 32}px`, '--z': `${z * 32}px` } as React.CSSProperties}
    >
      {faces.map((face, i) => (
        <div 
          key={i}
          className="block-face pixelated" 
          style={{ 
            backgroundImage: `url(${face.tex})`,
            transform: face.transform,
            height: "32px"
          }} 
        />
      ))}
    </div>
  )
}

export default Block 
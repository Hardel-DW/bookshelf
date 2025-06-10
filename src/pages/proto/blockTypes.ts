import bookshelfTexture from '../../assets/bookshelf.png'
import oakPlanksTexture from '../../assets/oak_planks.png'
import enchantingTableTopTexture from '../../assets/enchanting_table_top.png'
import enchantingTableSideTexture from '../../assets/enchanting_table_side.png'
import enchantingTableBottomTexture from '../../assets/enchanting_table_bottom.png'

export interface BlockType {
    height: number // 1.0 = full block, 0.75 = 3/4 height, etc.
    textures: {
        top: string
        bottom: string
        sides: string
    }
}

export const BLOCK_TYPES: Record<string, BlockType> = {
    default: {
        height: 1.0,
        textures: {
            top: oakPlanksTexture,
            bottom: oakPlanksTexture,
            sides: bookshelfTexture
        }
    },
    enchanting_table: {
        height: 0.75,
        textures: {
            top: enchantingTableTopTexture,
            bottom: enchantingTableBottomTexture,
            sides: enchantingTableSideTexture
        }
    }
}

// Helper to create geometry for any height
export function createBlockGeometry(size: number, height: number) {
    const s = size
    const h = s * height
    
    return [
        -s, -s,  s,   s, -s,  s,   s,  h,  s,  -s,  h,  s, // Front
        -s, -s, -s,  -s,  h, -s,   s,  h, -s,   s, -s, -s, // Back
        -s,  h, -s,  -s,  h,  s,   s,  h,  s,   s,  h, -s, // Top
        -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s, // Bottom
         s, -s, -s,   s,  h, -s,   s,  h,  s,   s, -s,  s, // Right
        -s, -s, -s,  -s, -s,  s,  -s,  h,  s,  -s,  h, -s // Left
    ]
}

// Helper to create texture coordinates for any height
export function createBlockTexCoords(height: number) {
    return [
        0, 0,  1, 0,  1, height,  0, height, // Front
        0, 0,  1, 0,  1, height,  0, height, // Back
        0, 0,  1, 0,  1, 1,  0, 1,           // Top
        0, 0,  1, 0,  1, 1,  0, 1,           // Bottom
        1, 0,  1, height,  0, height,  0, 0, // Right
        0, height,  0, 0,  1, 0,  1, height  // Left
    ]
} 
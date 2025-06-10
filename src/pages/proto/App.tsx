import { useState, useRef, useCallback } from 'react'
import { useIsoRenderer } from './useIsoRenderer'
import './App.css'

interface Block { x: number; y: number; z: number }
interface AnimatedBlock extends Block { targetY: number }

const allPositions: Block[] = [
    { x: 2, z: 0, y: 0 }, { x: 1, z: 0, y: 0 }, { x: 0, z: 1, y: 0 }, { x: 0, z: 2, y: 0 }, { x: 4, z: 2, y: 0 }, { x: 0, z: 3, y: 0 },
    { x: 4, z: 1, y: 0 }, { x: 3, z: 0, y: 0 }, { x: 4, z: 3, y: 0 }, { x: 0, z: 0, y: 0 }, { x: 4, z: 0, y: 0 }, { x: 2, z: 0, y: 1 },
    { x: 1, z: 0, y: 1 }, { x: 3, z: 0, y: 1 },
];

function App() {
    const [blockCount, setBlockCount] = useState(1)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [blocks, setBlocks] = useState<Block[]>([])
    const animatedBlocksRef = useRef<AnimatedBlock[]>([])

    const animate = useCallback(() => {
        const newBlocks = animatedBlocksRef.current
            .map(b => Math.abs(b.targetY - b.y) < 0.1 ? b : { ...b, y: b.y + (b.targetY - b.y) * 0.1 })
            .filter(b => b.y > -25)
        
        if (newBlocks.some((b, i) => b.y !== animatedBlocksRef.current[i]?.y)) {
            animatedBlocksRef.current = newBlocks
            setBlocks(newBlocks)
            requestAnimationFrame(animate)
        }
    }, [])

    const updateBlocks = (count: number) => {
        setBlockCount(count)
        const targets = allPositions.slice(0, count), current = animatedBlocksRef.current
        const kept = current.filter(c => targets.some(t => t.x === c.x && t.z === c.z && t.y === c.targetY))
        const newBlocks = targets.filter(t => !kept.some(k => k.x === t.x && k.z === t.z && k.targetY === t.y)).map(t => ({ ...t, y: 20, targetY: t.y }))
        const toRemove = current.filter(c => !targets.some(t => t.x === c.x && t.z === c.z && t.y === c.targetY)).map(c => ({ ...c, targetY: 5 }))
        animatedBlocksRef.current = [...kept, ...newBlocks, ...toRemove]
        requestAnimationFrame(animate)
    }
    
    useIsoRenderer(canvasRef, blocks)

    return (
        <div className="app">
            <div className="controls">
                <label htmlFor="blockCount">Blocs: {blockCount}</label>
                <input id="blockCount" type="range" min="1" max={allPositions.length} value={blockCount} onChange={(e) => updateBlocks(+(e.target.value))} />
            </div>
            <div className="scene-container">
                <canvas ref={canvasRef} width="800" height="600" />
            </div>
        </div>
    )
}

export default App

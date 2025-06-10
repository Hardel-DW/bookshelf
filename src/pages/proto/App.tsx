import { useState, useRef, useEffect } from 'react'
import { useIsoRenderer } from './useIsoRenderer'
import './App.css'

interface Block { x: number; y: number; z: number; type?: string }

const allPositions: Block[] = [
    { x: 2, z: 0, y: 0 }, { x: 1, z: 0, y: 0 }, { x: 0, z: 1, y: 0 }, { x: 0, z: 2, y: 0 }, { x: 4, z: 2, y: 0 }, { x: 0, z: 3, y: 0 },
    { x: 4, z: 1, y: 0 }, { x: 3, z: 0, y: 0 }, { x: 4, z: 3, y: 0 }, { x: 0, z: 0, y: 0 }, { x: 4, z: 0, y: 0 }, { x: 2, z: 0, y: 1 },
    { x: 1, z: 0, y: 1 }, { x: 3, z: 0, y: 1 },
];

const enchantingTable: Block = { x: 2, z: 2, y: 0, type: 'enchanting_table' };

function App() {
    const [blockCount, setBlockCount] = useState(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const blocks = [enchantingTable, ...allPositions.slice(0, blockCount)]
    useIsoRenderer(canvasRef, blocks)
    useEffect(() => setBlockCount(1), [])

    return (
        <div className="app">
            <div className="controls">
                <label htmlFor="blockCount">Blocs: {blockCount}</label>
                <input 
                    id="blockCount" 
                    type="range" 
                    min="1" 
                    max={allPositions.length} 
                    value={blockCount} 
                    onChange={(e) => setBlockCount(+(e.target.value))} 
                />
            </div>
            <div className="scene-container">
                <canvas ref={canvasRef} width="800" height="600" />
            </div>
        </div>
    )
}

export default App

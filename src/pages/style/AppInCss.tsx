import { useState } from 'react'
import Block from './Block'
import './Block.css';

export interface BlockType { x: number; y: number; z: number; type?: string }

export default function App() {
    const [blockCount, setBlockCount] = useState(0)
    
    const enchantingTable: BlockType = { x: 2, z: 2, y: 0, type: 'enchanting_table' }
    const positions: BlockType[] = [
        ...Array.from({length: 3}, (_, i) => ({ x: i + 1, z: 0, y: 0 })),
        ...Array.from({length: 3}, (_, i) => ({ x: 0, z: i + 1, y: 0 })),
        ...Array.from({length: 3}, (_, i) => ({ x: 4, z: i + 1, y: 0 })),
        ...Array.from({length: 3}, (_, i) => ({ x: i + 1, z: 0, y: 1 })),
        ...Array.from({length: 2}, (_, i) => ({ x: 4, z: i + 1, y: 1 })),
        ...Array.from({length: 1}, (_, i) => ({ x: 0, z: i + 1, y: 1 })),
    ].filter((pos, i, arr) => arr.findIndex(p => p.x === pos.x && p.z === pos.z && p.y === pos.y) === i)

    const allBlocks = blockCount === 0 ? [enchantingTable] : [enchantingTable, ...positions.slice(0, blockCount)]

    return (
        <div className="app">
            <div className="controls">
                <label htmlFor="blockCount">Blocs: {blockCount}</label>
                <input id="blockCount" type="range" min="0" max="15" value={blockCount} onChange={(e) => setBlockCount(+(e.target.value))} />
            </div>
            <div className="scene">
                {allBlocks.map((pos, index) => (
                    <Block key={index} x={pos.x} y={pos.y} z={pos.z} type={pos.type} />
                ))}
            </div>
        </div>
    )
}
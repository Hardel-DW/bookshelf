import { useState } from 'react'
import Block from './Block'
import './App.css'

function App() {
    const [blockCount, setBlockCount] = useState(1)
    
    const positions = [
        { x: 2, z: 0, y: 0 }, // 8
        { x: 1, z: 0, y: 0 }, // 6
        { x: 0, z: 1, y: 0 }, // 2
        { x: 0, z: 2, y: 0 }, // 3
        { x: 4, z: 2, y: 0 }, // 10
        { x: 0, z: 3, y: 0 }, // 4
        { x: 4, z: 1, y: 0 }, // 11
        { x: 3, z: 0, y: 0 }, // 9
        { x: 4, z: 3, y: 0 }, // 7
        { x: 0, z: 0, y: 0 }, // 1
        { x: 4, z: 0, y: 0 }, // 12
        { x: 2, z: 0, y: 1 }, // 14 (étage 2, case 2)
        { x: 1, z: 0, y: 1 }, // 13 (étage 2, case 1)
        { x: 3, z: 0, y: 1 }, // 15 (étage 2, case 3)
    ]

    const blocks = positions.slice(0, blockCount).map((pos, index) => (
        <Block key={index} x={pos.x} y={pos.y} z={pos.z} />
    ))

    return (
        <div className="app">
            <div className="controls">
                <label htmlFor="blockCount">Blocs: {blockCount}</label>
                <input
                    id="blockCount"
                    type="range"
                    min="1"
                    max="15"
                    value={blockCount}
                    onChange={(e) => setBlockCount(parseInt(e.target.value))}
                />
            </div>
            <div className="scene scale-150">
                {blocks}
            </div>
        </div>
    )
}

export default App

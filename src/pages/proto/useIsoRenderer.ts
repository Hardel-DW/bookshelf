import { useRef } from 'react'
import { m4 } from '../../util/matrix'
import { BLOCK_TYPES, createBlockGeometry, createBlockTexCoords } from './blockTypes'

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uScale;
    varying highp vec2 vTextureCoord;
    
    void main(void) {
        vec4 scaledPosition = vec4(aVertexPosition.xyz * uScale, aVertexPosition.w);
        gl_Position = uProjectionMatrix * uModelViewMatrix * scaledPosition;
        vTextureCoord = aTextureCoord;
    }
`

const fsSource = `
    precision mediump float;
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    
    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`

interface Block { x: number, y: number, z: number, type?: string }

interface AnimatedBlock {
    x: number
    y: number 
    z: number
    type?: string
    scale: number
    targetScale: number
    startTime: number
}

function getBlockKey(block: Block): string {
    return `${block.x},${block.y},${block.z},${block.type || 'default'}`
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

export function useIsoRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>, blocks: Block[]) {
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<any>(null)
    const buffersRef = useRef<any>(null)
    const texturesRef = useRef<any>(null)
    const animatedBlocksRef = useRef<Map<string, AnimatedBlock>>(new Map())
    const animationRef = useRef<number>(0)

    if (!canvasRef.current) return

    if (!glRef.current) {
        const gl = canvasRef.current.getContext('webgl', { antialias: false })!
        const pixelRatio = window.devicePixelRatio || 1
        const canvas = canvasRef.current
        canvas.width = canvas.clientWidth * pixelRatio
        canvas.height = canvas.clientHeight * pixelRatio
        
        // Shaders
        const vs = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vs, vsSource)
        gl.compileShader(vs)
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fs, fsSource)
        gl.compileShader(fs)
        
        const program = gl.createProgram()!
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)

        const s = 16
        const indices = [
             0,  1,  2,   0,  2,  3,  // front
             4,  5,  6,   4,  6,  7,  // back
             8,  9, 10,   8, 10, 11,  // top
            12, 13, 14,  12, 14, 15,  // bottom
            16, 17, 18,  16, 18, 19,  // right
            20, 21, 22,  20, 22, 23   // left
        ]

        // Create buffers for each block type
        const buffers: any = {}
        const textures: any = {}
        
        Object.entries(BLOCK_TYPES).forEach(([typeName, blockType]) => {
            const positions = createBlockGeometry(s, blockType.height)
            const texCoords = createBlockTexCoords(blockType.height)
            
            // Position buffer
            const posBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
            
            // Texture coordinate buffer
            const texBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
            
            buffers[typeName] = { pos: posBuffer, tex: texBuffer }
            
            // Load textures
            const loadTex = (url: string) => {
                const t = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, t)
                
                const img = new Image()
                img.onload = () => {
                    gl.bindTexture(gl.TEXTURE_2D, t)
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
                }
                img.src = url
                return t
            }
            
            textures[typeName] = {
                top: loadTex(blockType.textures.top),
                bottom: loadTex(blockType.textures.bottom),
                sides: loadTex(blockType.textures.sides)
            }
        })

        // Index buffer (shared)
        const idxBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

        glRef.current = gl
        programRef.current = {
            program,
            vPos: gl.getAttribLocation(program, 'aVertexPosition'),
            vTex: gl.getAttribLocation(program, 'aTextureCoord'),
            uProj: gl.getUniformLocation(program, 'uProjectionMatrix'),
            uMV: gl.getUniformLocation(program, 'uModelViewMatrix'),
            uSamp: gl.getUniformLocation(program, 'uSampler'),
            uScale: gl.getUniformLocation(program, 'uScale')
        }
        buffersRef.current = { ...buffers, idx: idxBuffer }
        texturesRef.current = textures
    }

    // Update animated blocks based on target blocks
    const currentTime = performance.now()
    const currentBlocks = animatedBlocksRef.current
    const targetBlockKeys = new Set(blocks.map(getBlockKey))
    
    // Add new blocks that need to appear
    blocks.forEach(block => {
        const key = getBlockKey(block)
        if (!currentBlocks.has(key)) {
            currentBlocks.set(key, {
                ...block,
                scale: 0,
                targetScale: 1,
                startTime: currentTime
            })
        } else {
            // Update target scale for existing blocks
            const animated = currentBlocks.get(key)!
            if (animated.targetScale !== 1) {
                animated.targetScale = 1
                animated.startTime = currentTime
            }
        }
    })
    
    // Mark blocks for removal that are no longer in target
    currentBlocks.forEach((animated, key) => {
        if (!targetBlockKeys.has(key) && animated.targetScale > 0) {
            animated.targetScale = 0
            animated.startTime = currentTime
        }
    })

    const render = () => {
        const gl = glRef.current!
        const prog = programRef.current!
        const buf = buffersRef.current!
        const tex = texturesRef.current!
        
        const now = performance.now()
        const animationDuration = 300 // ms
        let needsUpdate = false
        
        // Update animations
        currentBlocks.forEach((animated, key) => {
            const elapsed = now - animated.startTime
            const progress = Math.min(elapsed / animationDuration, 1)
            const easedProgress = easeOutCubic(progress)
            
            const newScale = animated.scale + (animated.targetScale - animated.scale) * easedProgress
            
            if (Math.abs(newScale - animated.scale) > 0.001) {
                animated.scale = newScale
                needsUpdate = true
            }
            
            // Remove blocks that finished disappearing
            if (animated.targetScale === 0 && animated.scale < 0.01) {
                currentBlocks.delete(key)
                needsUpdate = true
            }
        })
        
        // Setup rendering
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Projection matrix
        const proj = m4.create()
        m4.perspective(proj, Math.PI/4, gl.canvas.width / gl.canvas.height, 0.1, 2000)
        
        // View matrix (camera)
        const view = m4.create()
        m4.translate(view, view, [-15, 65, -300])
        m4.rotateX(view, view, Math.PI/4)
        m4.rotateY(view, view, -Math.PI/4)

        // Setup shader program
        gl.useProgram(prog.program)
        gl.uniformMatrix4fv(prog.uProj, false, proj)
        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1i(prog.uSamp, 0)

        // Face indices
        const FACES = {
            front: 0, back: 12, top: 24, bottom: 36, right: 48, left: 60
        }

        // Helper functions
        const setupGeometry = (posBuffer: WebGLBuffer, texBuffer: WebGLBuffer) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
            gl.vertexAttribPointer(prog.vPos, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(prog.vPos)
            
            gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
            gl.vertexAttribPointer(prog.vTex, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(prog.vTex)
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx)
        }

        const drawFaces = (texture: WebGLTexture, faceIndices: number[]) => {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            faceIndices.forEach(i => gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i))
        }

        // Render animated blocks
        currentBlocks.forEach(animated => {
            if (animated.scale < 0.01) return
            
            const mv = m4.create()
            m4.multiply(mv, view, mv)
            m4.translate(mv, mv, [animated.x*32, animated.y*32, animated.z*32])
            gl.uniformMatrix4fv(prog.uMV, false, mv)
            
            const blockType = animated.type || 'default'
            const blockBuf = buf[blockType]
            const blockTex = tex[blockType]
            
            gl.uniform1f(prog.uScale, animated.scale)
            
            setupGeometry(blockBuf.pos, blockBuf.tex)
            drawFaces(blockTex.top, [FACES.top])
            drawFaces(blockTex.bottom, [FACES.bottom])
            drawFaces(blockTex.sides, [FACES.front, FACES.back, FACES.right, FACES.left])
        })
        
        // Continue animation if needed
        if (needsUpdate) {
            animationRef.current = requestAnimationFrame(render)
        }
    }

    // Cancel previous animation
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
    }
    
    // Start new animation
    animationRef.current = requestAnimationFrame(render)
} 
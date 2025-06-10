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

export function useIsoRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>, blocks: Block[]) {
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<any>(null)
    const buffersRef = useRef<any>(null)
    const texturesRef = useRef<any>(null)
    const animStatesRef = useRef<Map<string, { scale: number, target: number, time: number }>>(new Map())
    const animFrameRef = useRef<number>(0)

    if (!canvasRef.current) return

    // Init WebGL once
    if (!glRef.current) {
        const gl = canvasRef.current.getContext('webgl', { antialias: false })!
        const pixelRatio = window.devicePixelRatio || 1
        const canvas = canvasRef.current
        canvas.width = canvas.clientWidth * pixelRatio
        canvas.height = canvas.clientHeight * pixelRatio
        
        // Compile shaders
        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type)!
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            return shader
        }
        
        const program = gl.createProgram()!
        gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource))
        gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource))
        gl.linkProgram(program)

        // Create geometry buffers
        const indices = [0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]
        const buffers = Object.fromEntries(
            Object.entries(BLOCK_TYPES).map(([type, blockType]) => {
                const positions = createBlockGeometry(16, blockType.height)
                const texCoords = createBlockTexCoords(blockType.height)
                
                const posBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
                
                const texBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
                
                return [type, { pos: posBuffer, tex: texBuffer }]
            })
        )

        const idxBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

        // Load textures
        const loadTexture = (url: string) => {
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            
            const img = new Image()
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            }
            img.src = url
            return texture
        }

        const textures = Object.fromEntries(
            Object.entries(BLOCK_TYPES).map(([type, blockType]) => [
                type, 
                {
                    top: loadTexture(blockType.textures.top),
                    bottom: loadTexture(blockType.textures.bottom),
                    sides: loadTexture(blockType.textures.sides)
                }
            ])
        )

        glRef.current = gl
        programRef.current = {
            program,
            attrs: {
                pos: gl.getAttribLocation(program, 'aVertexPosition'),
                tex: gl.getAttribLocation(program, 'aTextureCoord')
            },
            uniforms: {
                proj: gl.getUniformLocation(program, 'uProjectionMatrix'),
                mv: gl.getUniformLocation(program, 'uModelViewMatrix'),
                sampler: gl.getUniformLocation(program, 'uSampler'),
                scale: gl.getUniformLocation(program, 'uScale')
            }
        }
        buffersRef.current = { ...buffers, idx: idxBuffer }
        texturesRef.current = textures
    }

    const render = () => {
        const gl = glRef.current!
        const prog = programRef.current!
        const buf = buffersRef.current!
        const tex = texturesRef.current!
        const states = animStatesRef.current
        
        const now = performance.now()
        let needsUpdate = false

        // Render blocks with animation
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        const proj = m4.create()
        m4.perspective(proj, Math.PI/4, gl.canvas.width / gl.canvas.height, 0.1, 2000)
        
        const view = m4.create()
        m4.translate(view, view, [-15, 65, -300])
        m4.rotateX(view, view, Math.PI/4)
        m4.rotateY(view, view, -Math.PI/4)

        gl.useProgram(prog.program)
        gl.uniformMatrix4fv(prog.uniforms.proj, false, proj)
        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1i(prog.uniforms.sampler, 0)

        for (const [key, state] of states) {
            const elapsed = now - state.time
            const progress = Math.min(elapsed / 200, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            
            const newScale = state.scale + (state.target - state.scale) * eased
            if (Math.abs(newScale - state.scale) > 0.001) {
                state.scale = newScale
                needsUpdate = true
            }
            
            if (state.target === 0 && state.scale < 0.01) {
                states.delete(key)
                continue
            }
            
            if (state.scale < 0.01) continue
            
            const [x, y, z, type] = key.split(',')
            const blockType = type === 'undefined' ? 'default' : type
            const blockBuf = buf[blockType]
            const blockTex = tex[blockType]
            
            const mv = m4.create()
            m4.multiply(mv, view, mv)
            m4.translate(mv, mv, [+x * 32, +y * 32, +z * 32])
            
            gl.uniformMatrix4fv(prog.uniforms.mv, false, mv)
            gl.uniform1f(prog.uniforms.scale, state.scale)
            
            // Setup geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, blockBuf.pos)
            gl.vertexAttribPointer(prog.attrs.pos, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(prog.attrs.pos)
            
            gl.bindBuffer(gl.ARRAY_BUFFER, blockBuf.tex)
            gl.vertexAttribPointer(prog.attrs.tex, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(prog.attrs.tex)
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx)
            
            // Draw faces
            const drawFace = (texture: WebGLTexture, offset: number) => {
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, offset)
            }
            
            drawFace(blockTex.top, 24)
            drawFace(blockTex.bottom, 36)
            drawFace(blockTex.sides, 0)   // front
            drawFace(blockTex.sides, 12)  // back
            drawFace(blockTex.sides, 48)  // right
            drawFace(blockTex.sides, 60)  // left
        }
        
        if (needsUpdate) {
            animFrameRef.current = requestAnimationFrame(render)
        }
    }

    // Update animation states
    const now = performance.now()
    const states = animStatesRef.current
    const blockKeys = blocks.map(b => `${b.x},${b.y},${b.z},${b.type || 'default'}`)
    
    // Add new blocks
    blocks.forEach(block => {
        const key = `${block.x},${block.y},${block.z},${block.type || 'default'}`
        if (!states.has(key)) {
            states.set(key, { scale: 0, target: 1, time: now })
        } else {
            states.get(key)!.target = 1
        }
    })
    
    // Remove old blocks
    for (const [key, state] of states) {
        if (!blockKeys.includes(key) && state.target > 0) {
            state.target = 0
            state.time = now
        }
    }

    // Cancel previous animation and start new one
    if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
    }
    animFrameRef.current = requestAnimationFrame(render)
} 
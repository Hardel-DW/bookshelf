import { useRef } from 'react'
import bookshelfTexture from '../../assets/bookshelf.png'
import oakPlanksTexture from '../../assets/oak_planks.png'
import { m4 } from '../../util/matrix'

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`

const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    
    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`

interface Block { x: number, y: number, z: number }

export function useIsoRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>, blocks: Block[]) {
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<any>(null)
    const buffersRef = useRef<any>(null)
    const texturesRef = useRef<any>(null)

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

        // Cube geometry
        const s = 16
        const positions = [
            -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s, // Front face
            -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s, // Back face
            -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s, // Top face
            -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s, // Bottom face
             s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s, // Right face
            -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s // Left face
        ]
        
        const texCoords = [
            // Front, Back, Top, Bottom faces
            0, 0,  1, 0,  1, 1,  0, 1,
            0, 0,  1, 0,  1, 1,  0, 1,
            0, 0,  1, 0,  1, 1,  0, 1,
            0, 0,  1, 0,  1, 1,  0, 1,
            // Right, Left faces
            1, 0,  1, 1,  0, 1,  0, 0,
            0, 1,  0, 0,  1, 0,  1, 1
        ]
        
        const indices = [
             0,  1,  2,   0,  2,  3,  // front
             4,  5,  6,   4,  6,  7,  // back
             8,  9, 10,   8, 10, 11,  // top
            12, 13, 14,  12, 14, 15,  // bottom
            16, 17, 18,  16, 18, 19,  // right
            20, 21, 22,  20, 22, 23   // left
        ]

        // Buffers
        const posBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
        
        const texBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
        
        const idxBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

        // Texture loader
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

        glRef.current = gl
        programRef.current = {
            program,
            vPos: gl.getAttribLocation(program, 'aVertexPosition'),
            vTex: gl.getAttribLocation(program, 'aTextureCoord'),
            uProj: gl.getUniformLocation(program, 'uProjectionMatrix'),
            uMV: gl.getUniformLocation(program, 'uModelViewMatrix'),
            uSamp: gl.getUniformLocation(program, 'uSampler')
        }
        buffersRef.current = { pos: posBuffer, tex: texBuffer, idx: idxBuffer }
        texturesRef.current = {
            bookshelf: loadTex(bookshelfTexture),
            oak: loadTex(oakPlanksTexture)
        }
    }

    const gl = glRef.current!
    const prog = programRef.current!
    const buf = buffersRef.current!
    const tex = texturesRef.current!
    
    // Setup rendering
    gl.clearColor(0.1, 0.1, 0.15, 1)
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
    
    // Setup vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.pos)
    gl.vertexAttribPointer(prog.vPos, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(prog.vPos)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.tex)
    gl.vertexAttribPointer(prog.vTex, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(prog.vTex)
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx)
    gl.activeTexture(gl.TEXTURE0)
    gl.uniform1i(prog.uSamp, 0)

    // Render blocks
    blocks.forEach(b => {
        const mv = m4.create()
        m4.multiply(mv, view, mv)
        m4.translate(mv, mv, [b.x*32, b.y*32, b.z*32])
        gl.uniformMatrix4fv(prog.uMV, false, mv)
        
        // Render bookshelf faces (front, back, top, bottom)
        gl.bindTexture(gl.TEXTURE_2D, tex.bookshelf)
        const bookshelfFaces = [0, 12, 48, 60]
        bookshelfFaces.forEach(i => {
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i)
        })
        
        // Render oak faces (right, left)
        gl.bindTexture(gl.TEXTURE_2D, tex.oak)
        const oakFaces = [24, 36]
        oakFaces.forEach(i => {
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i)
        })
    })
} 
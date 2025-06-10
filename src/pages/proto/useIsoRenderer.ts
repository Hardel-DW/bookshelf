import { useRef } from 'react'
import bookshelfTexture from '../../assets/bookshelf.png'
import oakPlanksTexture from '../../assets/oak_planks.png'

const m4 = {
    create: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    perspective: (out: Float32Array, fov: number, aspect: number, near: number, far: number) => { const f = 1 / Math.tan(fov * 0.5), nf = 1 / (near - far); out.set([f/aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]) },
    translate: (out: Float32Array, a: Float32Array, v: number[]) => { if (out !== a) out.set(a); out[12] = a[0] * v[0] + a[4] * v[1] + a[8] * v[2] + a[12]; out[13] = a[1] * v[0] + a[5] * v[1] + a[9] * v[2] + a[13]; out[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14]; out[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15] },
    rotateX: (out: Float32Array, a: Float32Array, rad: number) => { const s = Math.sin(rad), c = Math.cos(rad), a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]; if (a !== out) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3]; out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15] }; out[4] = a10 * c + a20 * s; out[5] = a11 * c + a21 * s; out[6] = a12 * c + a22 * s; out[7] = a13 * c + a23 * s; out[8] = a20 * c - a10 * s; out[9] = a21 * c - a11 * s; out[10] = a22 * c - a12 * s; out[11] = a23 * c - a13 * s },
    rotateY: (out: Float32Array, a: Float32Array, rad: number) => { const s = Math.sin(rad), c = Math.cos(rad), a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]; if (a !== out) { out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7]; out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15] }; out[0] = a00 * c - a20 * s; out[1] = a01 * c - a21 * s; out[2] = a02 * c - a22 * s; out[3] = a03 * c - a23 * s; out[8] = a00 * s + a20 * c; out[9] = a01 * s + a21 * c; out[10] = a02 * s + a22 * c; out[11] = a03 * s + a23 * c },
    multiply: (out: Float32Array, a: Float32Array, b: Float32Array) => { const a00=a[0], a01=a[1], a02=a[2], a03=a[3], a10=a[4], a11=a[5], a12=a[6], a13=a[7], a20=a[8], a21=a[9], a22=a[10], a23=a[11], a30=a[12], a31=a[13], a32=a[14], a33=a[15], b00=b[0], b01=b[1], b02=b[2], b03=b[3], b10=b[4], b11=b[5], b12=b[6], b13=b[7], b20=b[8], b21=b[9], b22=b[10], b23=b[11], b30=b[12], b31=b[13], b32=b[14], b33=b[15]; out[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30; out[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31; out[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32; out[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33; out[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30; out[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31; out[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32; out[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33; out[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30; out[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31; out[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32; out[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33; out[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30; out[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31; out[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32; out[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33 }
}

const vsSource = `attribute vec4 aVertexPosition; attribute vec2 aTextureCoord; uniform mat4 uModelViewMatrix; uniform mat4 uProjectionMatrix; varying highp vec2 vTextureCoord; void main(void) { gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition; vTextureCoord = aTextureCoord; }`
const fsSource = `varying highp vec2 vTextureCoord; uniform sampler2D uSampler; void main(void) { gl_FragColor = texture2D(uSampler, vTextureCoord); }`

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
        
        const vs = gl.createShader(gl.VERTEX_SHADER)!; gl.shaderSource(vs, vsSource); gl.compileShader(vs)
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!; gl.shaderSource(fs, fsSource); gl.compileShader(fs)
        const program = gl.createProgram()!; gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)

        const s = 16, positions = [-s,-s,s, s,-s,s, s,s,s, -s,s,s, -s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s, -s,s,-s, -s,s,s, s,s,s, s,s,-s, -s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s, s,-s,-s, s,s,-s, s,s,s, s,-s,s, -s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s]
        const texCoords = [0,0,1,0,1,1,0,1, 0,0,1,0,1,1,0,1, 0,0,1,0,1,1,0,1, 0,0,1,0,1,1,0,1, 1,0,1,1,0,1,0,0, 0,1,0,0,1,0,1,1]
        const indices = [0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11, 12,13,14,12,14,15, 16,17,18,16,18,19, 20,21,22,20,22,23]

        const posBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
        const texBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
        const idxBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

        const loadTex = (url: string) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); const img = new Image(); img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }; img.src = url; return t }

        glRef.current = gl
        programRef.current = { program, vPos: gl.getAttribLocation(program, 'aVertexPosition'), vTex: gl.getAttribLocation(program, 'aTextureCoord'), uProj: gl.getUniformLocation(program, 'uProjectionMatrix'), uMV: gl.getUniformLocation(program, 'uModelViewMatrix'), uSamp: gl.getUniformLocation(program, 'uSampler') }
        buffersRef.current = { pos: posBuffer, tex: texBuffer, idx: idxBuffer }
        texturesRef.current = { bookshelf: loadTex(bookshelfTexture), oak: loadTex(oakPlanksTexture) }
    }

    const gl = glRef.current!, prog = programRef.current!, buf = buffersRef.current!, tex = texturesRef.current!
    gl.clearColor(0.1, 0.1, 0.15, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    const proj = m4.create(); m4.perspective(proj, Math.PI/4, gl.canvas.width / gl.canvas.height, 0.1, 2000)
    const view = m4.create(); m4.translate(view, view, [-15, 65, -300]); m4.rotateX(view, view, Math.PI/4); m4.rotateY(view, view, -Math.PI/4)

    gl.useProgram(prog.program); gl.uniformMatrix4fv(prog.uProj, false, proj)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.pos); gl.vertexAttribPointer(prog.vPos, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(prog.vPos)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.tex); gl.vertexAttribPointer(prog.vTex, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(prog.vTex)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx); gl.activeTexture(gl.TEXTURE0); gl.uniform1i(prog.uSamp, 0)

    blocks.forEach(b => {
        const mv = m4.create(); m4.multiply(mv, view, mv); m4.translate(mv, mv, [b.x*32, b.y*32, b.z*32]); gl.uniformMatrix4fv(prog.uMV, false, mv)
        gl.bindTexture(gl.TEXTURE_2D, tex.bookshelf); [0,12,48,60].forEach(i => gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i))
        gl.bindTexture(gl.TEXTURE_2D, tex.oak); [24,36].forEach(i => gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i))
    })
} 
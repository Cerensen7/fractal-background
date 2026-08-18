const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL tarayıcınız tarafından desteklenmiyor.');
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / min(resolution.y, resolution.x);

        float t = time * 0.15;

        vec2 c = vec2(sin(t * 0.8) * 0.4 - 0.1, cos(t * 0.5) * 0.4 + 0.2);

        vec2 z = uv * 2.2;

        float iter = 0.0;
        const float max_iter = 60.0;

        for(float i = 0.0; i < 60.0; i++) {
            if(dot(z, z) > 4.0) break;
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            iter++;
        }

        if (iter == max_iter) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            float smooth_iter = iter - log2(log2(dot(z,z))) + 4.0;
            float f = smooth_iter / max_iter;

            vec3 color = hsl2rgb(vec3(0.6 + f * 0.2 + t * 0.1, 0.7, 0.5));

            color *= smoothstep(0.0, 1.0, f * 2.5);

            gl_FragColor = vec4(color * 0.6, 1.0);
        }
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionLocation = gl.getUniformLocation(program, "resolution");
const timeLocation = gl.getUniformLocation(program, "time");

let startTime = Date.now();

function render() {
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    const currentTime = (Date.now() - startTime) * 0.001;
    gl.uniform1f(timeLocation, currentTime);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

render();

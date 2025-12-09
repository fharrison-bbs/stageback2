
// Common Vertex Shader
const vertShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Cosmic Portal Shader (replaces Synapse)
// A swirling, glowing portal with energy beams
const portalFragShader = `
precision mediump float;
varying vec2 vTexCoord;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uIntensity; // controlled by particle count slider
uniform float uSpeed; // controlled by connection distance slider
uniform float uZoom; // controlled by mouse influence slider

// Simplex noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st = st * 2.0 - 1.0;
    st.x *= uResolution.x / uResolution.y;
    
    // Zoom and rotation
    float zoom = 1.0 + uZoom;
    st /= zoom;
    
    float ang = atan(st.y, st.x);
    float len = length(st);
    
    // Portal swirl
    float time = uTime * (uSpeed + 0.5) * 0.5;
    
    // Spiral noise
    float n1 = snoise(vec2(len * 5.0 - time * 2.0, ang * 2.0));
    float n2 = snoise(vec2(len * 10.0 + time, ang * 4.0 + time));
    
    // Glow core
    float core = 0.15 / (len + 0.1 * n1);
    
    // Energy beams
    float beams = smoothstep(0.5, 0.8, snoise(vec2(ang * 8.0 + time, len * 2.0)));
    
    // Color mixing
    vec3 c1 = vec3(0.1, 0.0, 0.4); // Deep purple
    vec3 c2 = vec3(1.0, 0.8, 0.2); // Gold
    vec3 c3 = vec3(0.0, 0.5, 1.0); // Cyan
    
    vec3 color = mix(c1, c3, len + n1 * 0.2);
    color += c2 * core * (uIntensity * 2.0);
    color += c3 * beams * 0.5;
    
    // Mouse interaction - adds local disturbance
    vec2 mouse = uMouse / uResolution * 2.0 - 1.0;
    mouse.x *= uResolution.x / uResolution.y;
    mouse.y *= -1.0;
    
    float dMouse = distance(st, mouse);
    if(dMouse < 0.5) {
        color += c2 * (0.5 - dMouse) * 2.0;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

// Realistic Water Shader
const waterFragShader = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uSpeed;
uniform float uBlue;
uniform float uComplexity;

// Tiled noise
vec2 hash( vec2 p ) {
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y)*K1 );
	vec2 a = p - i + (i.x+i.y)*K2;
	vec2 o = step(a.yx,a.xy);    
	vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

	vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

	return dot( n, vec3(70.0) );
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= uResolution.x / uResolution.y;
    
    float time = uTime * uSpeed * 0.5;
    
    vec2 uv_water = p * (uComplexity + 2.0);
    
    // Create water-like caustic patterns using domain warping
    vec2 q = vec2(0.);
    q.x = noise(uv_water + 0.0 * time);
    q.y = noise(uv_water + vec2(1.0));
    
    vec2 r = vec2(0.);
    r.x = noise(uv_water + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
    r.y = noise(uv_water + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);
    
    float f = noise(uv_water + r);
    
    // Deep blue water palette
    vec3 c1 = vec3(0.0, 0.3, 0.7) * uBlue; // Deep Blue
    vec3 c2 = vec3(0.0, 0.8, 1.0) * uBlue; // Light Blue
    vec3 c3 = vec3(1.0, 1.0, 1.0); // White highlights
    
    vec3 color = mix(c1, c2, f);
    color = mix(color, c3, smoothstep(0.8, 1.0, f));
    
    // Mouse ripples (simplified)
    vec2 mouse = uMouse / uResolution;
    mouse.y = 1.0 - mouse.y; // Invert Y just in case of coordinate mismatch
    float d = distance(uv, mouse);
    
    // Add ripple effect
    float ripple = sin(d * 50.0 - uTime * 10.0) * exp(-d * 5.0);
    color += vec3(ripple) * 0.2;
    
    // Specular highlights
    float spec = pow(max(0.0, dot(vec3(f, f, 1.0), vec3(0.0, 0.0, 1.0))), 10.0);
    color += spec * 0.5;

    gl_FragColor = vec4(color, 1.0);
}
`;

// Tunnel (Geometric Portal) Shader
const tunnelFragShader = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uLightIntensity;
uniform float uDepth;

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    
    // Polar coordinates
    float a = atan(p.y, p.x);
    float r = length(p);
    
    // Tunnel mapping
    vec2 uv = vec2(1.0 / r + uTime * uSpeed * 0.2, a / 3.14159);
    
    // Grid/Architecture pattern
    float grid = sin(uv.x * 20.0 * uDepth) * sin(uv.y * 10.0);
    float w = fwidth(grid);
    grid = smoothstep(-w, w, grid);
    
    // Color
    vec3 col = vec3(0.0);
    
    // Base tunnel color
    vec3 c1 = vec3(0.1, 0.0, 0.3); // Purple
    vec3 c2 = vec3(0.0, 0.8, 1.0); // Cyan
    
    float pulse = sin(uTime + 10.0 / r) * 0.5 + 0.5;
    col = mix(c1, c2, grid * pulse);
    
    // Depth fog
    col *= r * 1.5;
    
    // Intensity control
    col *= uLightIntensity * 2.0;
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// --- P5 Sketches ---

// Synapse (Cosmic Portal) Sketch
const synapseSketch = (p) => {
    let sh;

    p.setup = () => {
        let container = document.getElementById('synapse-demo');
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('synapse-demo');
        sh = p.createShader(vertShader, portalFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        // Controls mapping
        // Previous controls: Particle Count -> Intensity
        // Connection Distance -> Speed
        // Mouse Influence -> Zoom

        // Safety check for elements
        let intensity = 1.0;
        let speed = 1.0;
        let zoom = 0.5;

        let slider1 = document.getElementById('particle-slider');
        if (slider1) intensity = p.map(slider1.value, 50, 300, 0.5, 2.0);

        let slider2 = document.getElementById('distance-slider');
        if (slider2) speed = p.map(slider2.value, 50, 120, 0.1, 2.0);

        let slider3 = document.getElementById('mouse-slider');
        if (slider3) zoom = p.map(slider3.value, 0, 200, 0.0, 1.0);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.mouseY]);

        sh.setUniform('uIntensity', intensity);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uZoom', zoom);

        p.rect(0, 0, p.width, p.height);
    };

    p.windowResized = () => {
        let container = document.getElementById('synapse-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

// Fluids (Realistic Water) Sketch
const fluidsSketch = (p) => {
    let sh;

    p.setup = () => {
        let container = document.getElementById('fluids-demo');
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('fluids-demo');
        sh = p.createShader(vertShader, waterFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        // Wrapper mapping
        let speed = 1.0;
        let blue = 1.0;
        let complexity = 1.0;

        let slider1 = document.getElementById('flow-slider');
        if (slider1) speed = p.map(slider1.value, 1, 10, 0.2, 3.0);

        let slider2 = document.getElementById('viscosity-slider'); // Mapped to complexity
        if (slider2) complexity = p.map(slider2.value, 10, 100, 1.0, 5.0);

        let slider3 = document.getElementById('color-slider'); // Mapped to Blue intensity
        if (slider3) blue = p.map(slider3.value, 0, 100, 0.5, 1.5);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.mouseY]);

        sh.setUniform('uSpeed', speed);
        sh.setUniform('uComplexity', complexity);
        sh.setUniform('uBlue', blue);

        p.rect(0, 0, p.width, p.height);
    };

    p.windowResized = () => {
        let container = document.getElementById('fluids-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

// Tunnel (Geometric Portal) Sketch
const tunnelSketch = (p) => {
    let sh;

    p.setup = () => {
        let container = document.getElementById('tunnel-demo');
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('tunnel-demo');
        sh = p.createShader(vertShader, tunnelFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        let speed = 1.0;
        let intensity = 1.0;
        let depth = 1.0;

        let slider1 = document.getElementById('speed-slider');
        if (slider1) speed = p.map(slider1.value, 1, 10, 0.5, 3.0);

        let slider2 = document.getElementById('intensity-slider');
        if (slider2) intensity = p.map(slider2.value, 0, 100, 0.1, 1.5);

        let slider3 = document.getElementById('depth-slider');
        if (slider3) depth = p.map(slider3.value, 1, 10, 0.5, 2.0);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uLightIntensity', intensity);
        sh.setUniform('uDepth', depth);

        p.rect(0, 0, p.width, p.height);
    };

    p.windowResized = () => {
        let container = document.getElementById('tunnel-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

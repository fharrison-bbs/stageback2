
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

// Digital Synapse Fragment Shader (Neural Network / Energy)
// Uses a voronoi-like or distance field approach + noise
const synapseFragShader = `
precision mediump float;
varying vec2 vTexCoord;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uParticles;
uniform float uConnectionDist;

// Simplex noise function
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
    st.x *= uResolution.x / uResolution.y;
    
    vec3 color = vec3(0.0);
    
    // Neural web effect using noise and distance fields
    vec2 grid = st * 5.0;
    vec2 i_st = floor(grid);
    vec2 f_st = fract(grid);
    
    float m_dist = 1.0;  // minimum distance
    
    // Iterate through neighbors to find closest points (cells)
    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x),float(y));
            vec2 point = vec2(0.0);
            
            // Animate points
            point = 0.5 + 0.5*sin(uTime * 0.5 + 6.2831*point);
            
            // Randomize per cell
            vec2 rand = vec2(snoise(i_st + neighbor + vec2(uTime*0.1)), snoise(i_st + neighbor + vec2(uTime*0.1 + 100.0)));
            point = 0.5 + 0.3 * rand;

            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            m_dist = min(m_dist, dist);
        }
    }
    
    // Draw edges/connections ('synapses')
    float edge = 1.0 - smoothstep(0.05, 0.06 + (uConnectionDist * 0.001), m_dist);
    // Glow
    float glow = 1.0 / (m_dist * 5.0);
    
    vec3 neuronColor = vec3(0.2, 0.5, 1.0); // Blueish
    if (uMouse.x > 0.0) {
       float dMouse = distance(st, uMouse/uResolution * vec2(uResolution.x/uResolution.y, 1.0));
       if (dMouse < 0.3) {
           neuronColor += vec3(1.0, 0.8, 0.0) * (1.0 - dMouse/0.3); // Gold glow near mouse
       }
    }
    
    color += glow * neuronColor;
    
    // Add pulsing impulses
    float pulse = sin(uTime * 3.0 - m_dist * 10.0) * 0.5 + 0.5;
    color += vec3(pulse) * 0.2 * vec3(0.5, 0.8, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

// Cymatic Fluids Fragment Shader
// Domain Warping based
const fluidsFragShader = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uFlowSpeed;
uniform float uViscosity;
uniform float uColorIntensity;

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

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
        v += a * snoise(st);
        st = rot * st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    float time = uTime * (uFlowSpeed * 0.1);
    
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);

    float f = fbm(st+r);

    // Color mixing
    vec3 color = mix(vec3(0.101961,0.619608,0.666667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));

    color = mix(color,
                vec3(0,0,0.164706),
                clamp(length(q),0.0,1.0));

    color = mix(color,
                vec3(0.666667,1,1),
                clamp(length(r.x),0.0,1.0));
                
    // Mouse interaction - adds a swirl of bright color
    if (uMouse.x > 0.0) {
        float d = distance(st, uMouse/uResolution * vec2(uResolution.x/uResolution.y, 1.0));
        color += vec3(1.0, 0.5, 0.0) * smoothstep(0.2, 0.0, d) * 0.5;
    }

    // Viscosity affects contrast/smoothness
    float contrast = uViscosity / 50.0;
    color = pow(color, vec3(contrast));
    
    // Intensity
    color *= (uColorIntensity / 50.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

// Architecture of Sound (Tunnel) Fragment Shader
// Raymarching
const tunnelFragShader = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uLightIntensity;
uniform float uDepth;

// ... (Raymarching logic to be added)
// Simplex noise for texture
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
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    
    // Tunnel projection
    float r = length(p);
    float a = atan(p.y, p.x);
    
    // Animate tunnel
    float movement = uTime * uSpeed * 0.5;
    
    // Map to UV coordinates for texture
    vec2 uv = vec2(1.0/r + movement, a/3.14159);
    
    // Generate texture pattern
    float f = snoise(uv * vec2(10.0, 20.0) * (uDepth/5.0));
    
    // Color
    vec3 col = vec3(0.0);
    
    // Grid lines
    float grid = step(0.9, fract(uv.x * 5.0)) + step(0.9, fract(uv.y * 10.0));
    
    // Mix colors based on pattern
    vec3 baseColor = vec3(0.1, 0.0, 0.3); // Deep purple
    vec3 lightColor = vec3(0.0, 0.5, 1.0); // Cyan/Blue
    
    col = mix(baseColor, lightColor, f + grid * 0.5);
    
    // Depth darkening
    col *= r * 2.0; 
    
    // Intensity
    col *= (uLightIntensity / 50.0);

    gl_FragColor = vec4(col, 1.0);
}
`;


// --- P5 Sketches ---

// Synapse Sketch
const synapseSketch = (p) => {
    let sh;

    p.setup = () => {
        let canvas = p.createCanvas(800, 384, p.WEBGL);
        sh = p.createShader(vertShader, synapseFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        // Get control values
        let particleCount = parseFloat(document.getElementById('particle-slider').value);
        let connectionDist = parseFloat(document.getElementById('distance-slider').value);
        let mouseInfluence = parseFloat(document.getElementById('mouse-influence').value);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.mouseY]); // Mouse Y is inverted in WebGL shader usually? No, depends on coordinate system. FragCoord is bottom-left. p5 mouse is top-left.
        // Actually for p5 WebGL, we might need to adjust mouse coords or use just relative.
        // Let's pass raw mouse and handle in shader or assume p5 mapping.
        // Actually p5 WebGL 0,0 is center. This is specific to geometry.
        // But for a loose full-screen quad shader, we pass raw mouse.
        // Correction: gl_FragCoord is (0,0) at bottom-left. p.mouseX is (0,0) at top-left.
        sh.setUniform('uMouse', [p.mouseX, p.height - p.mouseY]);

        sh.setUniform('uParticles', particleCount);
        sh.setUniform('uConnectionDist', connectionDist);

        p.rect(0, 0, p.width, p.height); // Draw a quad to fill screen
    };

    p.windowResized = () => {
        // handle resize if needed, though containers are fixed size usually
        // p.resizeCanvas(width, height);
    };
};

// Fluids Sketch
const fluidsSketch = (p) => {
    let sh;

    p.setup = () => {
        let canvas = p.createCanvas(800, 384, p.WEBGL);
        sh = p.createShader(vertShader, fluidsFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        let flowSpeed = parseFloat(document.getElementById('flow-slider').value);
        let viscosity = parseFloat(document.getElementById('viscosity-slider').value);
        let colorIntensity = parseFloat(document.getElementById('color-slider').value);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.height - p.mouseY]);
        sh.setUniform('uFlowSpeed', flowSpeed);
        sh.setUniform('uViscosity', viscosity);
        sh.setUniform('uColorIntensity', colorIntensity);

        p.rect(0, 0, p.width, p.height);
    };
};

// Tunnel Sketch
const tunnelSketch = (p) => {
    let sh;

    p.setup = () => {
        let canvas = p.createCanvas(800, 384, p.WEBGL);
        sh = p.createShader(vertShader, tunnelFragShader);
        p.shader(sh);
    };

    p.draw = () => {
        let speed = parseFloat(document.getElementById('speed-slider').value);
        let intensity = parseFloat(document.getElementById('intensity-slider').value);
        let depth = parseFloat(document.getElementById('depth-slider').value);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uLightIntensity', intensity);
        sh.setUniform('uDepth', depth);

        p.rect(0, 0, p.width, p.height);
    };
};

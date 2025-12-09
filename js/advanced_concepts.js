// ============================================================================
// ADVANCED SHADER CONCEPTS - Stunning Visual Demonstrations
// ============================================================================

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

// ============================================================================
// SHADER 1: COSMIC GALAXY PORTAL
// Swirling galaxy with stars, nebula clouds, and cosmic energy
// ============================================================================
const galaxyPortalShader = `
precision highp float;
varying vec2 vTexCoord;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uSpeed;
uniform float uZoom;

#define PI 3.14159265359
#define TAU 6.28318530718

// Hash functions for randomness
float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
    float n = sin(dot(p, vec2(41.0, 289.0)));
    return fract(vec2(262144.0, 32768.0) * n);
}

// Smooth noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

// Star field
float stars(vec2 uv, float t) {
    float n = 0.0;
    for (float i = 1.0; i < 4.0; i++) {
        vec2 grid = floor(uv * 50.0 * i) + i;
        vec2 id = hash22(grid);
        float brightness = pow(id.x, 20.0);
        float twinkle = sin(t * 3.0 + id.y * TAU) * 0.5 + 0.5;
        vec2 pos = fract(uv * 50.0 * i) - 0.5;
        float d = length(pos - (id - 0.5) * 0.5);
        n += smoothstep(0.05 / i, 0.0, d) * brightness * (0.5 + 0.5 * twinkle);
    }
    return n;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 mouse = (uMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    
    float time = uTime * uSpeed * 0.3;
    float zoom = 1.0 / (uZoom + 0.5);
    uv *= zoom;
    
    // Polar coordinates for spiral
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Galaxy spiral arms
    float spiral = sin(angle * 3.0 - radius * 10.0 + time * 2.0);
    spiral = pow(abs(spiral), 0.3) * exp(-radius * 2.0);
    
    // Nebula clouds using fbm
    vec2 nebula_uv = uv * 3.0 + time * 0.1;
    float nebula = fbm(nebula_uv + fbm(nebula_uv * 2.0 + time * 0.2));
    nebula *= exp(-radius * 1.5);
    
    // Core glow
    float core = 0.05 / (radius + 0.05);
    core *= uIntensity;
    
    // Stars
    float starField = stars(uv + time * 0.02, time);
    
    // Color palette
    vec3 col1 = vec3(0.1, 0.0, 0.3);  // Deep purple
    vec3 col2 = vec3(0.0, 0.3, 0.8);  // Blue
    vec3 col3 = vec3(1.0, 0.4, 0.1);  // Orange
    vec3 col4 = vec3(1.0, 0.8, 0.3);  // Gold
    vec3 col5 = vec3(0.8, 0.2, 0.5);  // Pink
    
    // Mix colors
    vec3 color = col1;
    color = mix(color, col2, spiral * 0.8);
    color = mix(color, col5, nebula * 0.6);
    color += col4 * core;
    color += col3 * starField * 0.5;
    color += vec3(1.0) * starField * 0.3;
    
    // Mouse interaction - creates bright spot
    float mouseDist = length(uv - mouse * zoom);
    color += col4 * 0.3 * exp(-mouseDist * 5.0);
    
    // Vignette
    color *= 1.0 - radius * 0.3;
    
    // Tone mapping
    color = pow(color, vec3(0.9));
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// ============================================================================
// SHADER 2: HYPERSPACE LIQUID
// Flowing liquid metal with iridescent colors and dynamic motion
// ============================================================================
const liquidShader = `
precision highp float;
varying vec2 vTexCoord;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uSpeed;
uniform float uComplexity;
uniform float uColorIntensity;

#define PI 3.14159265359

// Smooth noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Domain warping for fluid effect
float fbm(vec3 p) {
    float f = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        f += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 mouse = uMouse / uResolution;
    
    float time = uTime * uSpeed * 0.4;
    float complexity = uComplexity;
    
    // Create flowing liquid distortion
    vec3 p = vec3(uv * complexity, time * 0.5);
    
    // Domain warping - creates organic fluid motion
    vec3 q = vec3(
        fbm(p + vec3(0.0, 0.0, time * 0.1)),
        fbm(p + vec3(5.2, 1.3, time * 0.15)),
        fbm(p + vec3(2.1, 3.2, time * 0.12))
    );
    
    vec3 r = vec3(
        fbm(p + 4.0 * q + vec3(1.7, 9.2, time * 0.2)),
        fbm(p + 4.0 * q + vec3(8.3, 2.8, time * 0.25)),
        fbm(p + 4.0 * q + vec3(3.5, 7.1, time * 0.22))
    );
    
    float f = fbm(p + 4.0 * r);
    
    // Iridescent color palette
    vec3 col1 = vec3(0.0, 0.2, 0.4);   // Deep teal
    vec3 col2 = vec3(0.1, 0.6, 0.8);   // Cyan
    vec3 col3 = vec3(0.8, 0.3, 0.6);   // Magenta
    vec3 col4 = vec3(1.0, 0.7, 0.2);   // Gold
    vec3 col5 = vec3(0.2, 0.8, 0.4);   // Green
    
    // Mix colors based on flow patterns
    vec3 color = mix(col1, col2, clamp((f * f) * 4.0, 0.0, 1.0));
    color = mix(color, col3, clamp(length(q) * 0.5, 0.0, 1.0));
    color = mix(color, col4, clamp(length(r) * 0.3, 0.0, 1.0));
    
    // Add specular highlights
    float spec = pow(max(0.0, f), 3.0);
    color += vec3(1.0) * spec * 0.5;
    
    // Mouse ripple effect
    float mouseDist = length(uv - (mouse - 0.5) * 2.0);
    float ripple = sin(mouseDist * 30.0 - time * 5.0) * exp(-mouseDist * 3.0) * 0.3;
    color += vec3(0.5, 0.8, 1.0) * ripple;
    
    // Intensity adjustment
    color *= uColorIntensity;
    
    // Add subtle glow
    color += col2 * 0.1 * exp(-length(uv) * 2.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// ============================================================================
// SHADER 3: LIGHT SPEED HYPERSPACE TUNNEL
// Warp speed effect with streaking stars and energy ribbons
// ============================================================================
const hyperspaceShader = `
precision highp float;
varying vec2 vTexCoord;
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uIntensity;
uniform float uDepth;

#define PI 3.14159265359
#define TAU 6.28318530718

// Random functions
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

// Star streak
float starStreak(vec2 uv, float t, float seed) {
    float angle = hash(seed) * TAU;
    float dist = hash(seed + 1.0) * 0.8 + 0.1;
    float speed = hash(seed + 2.0) * 2.0 + 1.0;
    float size = hash(seed + 3.0) * 0.003 + 0.001;
    
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 pos = dir * dist;
    
    // Move towards center over time
    float progress = fract(t * speed * 0.2 + hash(seed + 4.0));
    pos *= 1.0 - progress;
    
    // Calculate streak
    vec2 diff = uv - pos;
    float streak = dot(diff, dir);
    float dist_to_streak = length(diff - dir * streak);
    
    // Streak length increases as it approaches
    float streakLength = progress * 0.5;
    float brightness = smoothstep(streakLength, 0.0, streak) * smoothstep(-0.01, 0.0, streak);
    brightness *= smoothstep(size * (1.0 + progress * 5.0), 0.0, dist_to_streak);
    brightness *= progress * progress; // Brighter as it gets closer
    
    return brightness;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    
    float time = uTime * uSpeed;
    
    // Radial coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Tunnel effect
    float tunnelZ = 1.0 / (radius + 0.1) + time * 2.0;
    float tunnelAngle = angle + tunnelZ * 0.1;
    
    // Create tunnel rings
    float rings = sin(tunnelZ * uDepth * 5.0) * 0.5 + 0.5;
    rings *= exp(-radius * 0.5);
    
    // Energy ribbons spiraling through tunnel
    float ribbons = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        float ribbonAngle = angle + i * TAU / 6.0 + time * (0.5 + i * 0.1);
        float ribbon = sin(ribbonAngle * 3.0 + tunnelZ * 2.0);
        ribbon = smoothstep(0.8, 1.0, ribbon);
        ribbon *= exp(-radius * 2.0);
        ribbons += ribbon;
    }
    
    // Star streaks
    float stars = 0.0;
    for (float i = 0.0; i < 100.0; i++) {
        stars += starStreak(uv, time, i);
    }
    stars = min(stars, 1.0);
    
    // Central core glow
    float core = 0.02 / (radius + 0.02);
    core *= uIntensity;
    
    // Speed lines emanating from center
    float speedLines = 0.0;
    for (float i = 0.0; i < 20.0; i++) {
        float lineAngle = i * TAU / 20.0 + time * 0.1;
        float angleDiff = abs(mod(angle - lineAngle + PI, TAU) - PI);
        float line = smoothstep(0.05, 0.0, angleDiff);
        line *= smoothstep(0.0, 0.3, radius) * smoothstep(1.0, 0.3, radius);
        speedLines += line * 0.1;
    }
    
    // Color scheme - blue/white hyperspace
    vec3 col1 = vec3(0.0, 0.0, 0.1);     // Deep space
    vec3 col2 = vec3(0.0, 0.3, 0.8);     // Blue
    vec3 col3 = vec3(0.3, 0.6, 1.0);     // Light blue
    vec3 col4 = vec3(0.8, 0.9, 1.0);     // White-blue
    vec3 col5 = vec3(1.0, 1.0, 1.0);     // Pure white
    
    vec3 color = col1;
    color = mix(color, col2, rings * 0.5);
    color = mix(color, col3, ribbons * 0.3);
    color += col4 * stars;
    color += col5 * core;
    color += col3 * speedLines;
    
    // Add chromatic aberration effect near edges
    float aberration = radius * 0.1;
    color.r *= 1.0 + aberration;
    color.b *= 1.0 - aberration * 0.5;
    
    // Intensity
    color *= uIntensity;
    
    // Vignette
    color *= 1.0 - radius * 0.2;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// ============================================================================
// P5.JS SKETCH IMPLEMENTATIONS
// ============================================================================

// Galaxy Portal Sketch
const synapseSketch = (p) => {
    let sh;
    let container;

    p.setup = () => {
        container = document.getElementById('synapse-demo');
        if (!container) return;
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('synapse-demo');
        p.noStroke();

        try {
            sh = p.createShader(vertShader, galaxyPortalShader);
            p.shader(sh);
        } catch (e) {
            console.error("Shader compile error:", e);
        }
    };

    p.draw = () => {
        if (!sh) return;

        // Map controls
        let intensity = 1.0, speed = 1.0, zoom = 1.0;

        let slider1 = document.getElementById('particle-slider');
        if (slider1) intensity = p.map(parseFloat(slider1.value), 50, 300, 0.5, 3.0);

        let slider2 = document.getElementById('distance-slider');
        if (slider2) speed = p.map(parseFloat(slider2.value), 50, 120, 0.2, 2.0);

        let slider3 = document.getElementById('mouse-slider');
        if (slider3) zoom = p.map(parseFloat(slider3.value), 0, 200, 0.5, 2.0);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.height - p.mouseY]);
        sh.setUniform('uIntensity', intensity);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uZoom', zoom);

        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    };

    p.windowResized = () => {
        container = document.getElementById('synapse-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

// Liquid Metal Sketch
const fluidsSketch = (p) => {
    let sh;
    let container;

    p.setup = () => {
        container = document.getElementById('fluids-demo');
        if (!container) return;
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('fluids-demo');
        p.noStroke();

        try {
            sh = p.createShader(vertShader, liquidShader);
            p.shader(sh);
        } catch (e) {
            console.error("Shader compile error:", e);
        }
    };

    p.draw = () => {
        if (!sh) return;

        let speed = 1.0, complexity = 3.0, colorIntensity = 1.0;

        let slider1 = document.getElementById('flow-slider');
        if (slider1) speed = p.map(parseFloat(slider1.value), 1, 10, 0.3, 2.0);

        let slider2 = document.getElementById('viscosity-slider');
        if (slider2) complexity = p.map(parseFloat(slider2.value), 10, 100, 2.0, 6.0);

        let slider3 = document.getElementById('color-slider');
        if (slider3) colorIntensity = p.map(parseFloat(slider3.value), 0, 100, 0.5, 1.5);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uMouse', [p.mouseX, p.height - p.mouseY]);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uComplexity', complexity);
        sh.setUniform('uColorIntensity', colorIntensity);

        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    };

    p.windowResized = () => {
        container = document.getElementById('fluids-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

// Hyperspace Tunnel Sketch
const tunnelSketch = (p) => {
    let sh;
    let container;

    p.setup = () => {
        container = document.getElementById('tunnel-demo');
        if (!container) return;
        let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL);
        canvas.parent('tunnel-demo');
        p.noStroke();

        try {
            sh = p.createShader(vertShader, hyperspaceShader);
            p.shader(sh);
        } catch (e) {
            console.error("Shader compile error:", e);
        }
    };

    p.draw = () => {
        if (!sh) return;

        let speed = 1.0, intensity = 1.0, depth = 1.0;

        let slider1 = document.getElementById('speed-slider');
        if (slider1) speed = p.map(parseFloat(slider1.value), 1, 10, 0.5, 3.0);

        let slider2 = document.getElementById('intensity-slider');
        if (slider2) intensity = p.map(parseFloat(slider2.value), 0, 100, 0.3, 2.0);

        let slider3 = document.getElementById('depth-slider');
        if (slider3) depth = p.map(parseFloat(slider3.value), 1, 10, 0.5, 3.0);

        sh.setUniform('uTime', p.millis() / 1000.0);
        sh.setUniform('uResolution', [p.width, p.height]);
        sh.setUniform('uSpeed', speed);
        sh.setUniform('uIntensity', intensity);
        sh.setUniform('uDepth', depth);

        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    };

    p.windowResized = () => {
        container = document.getElementById('tunnel-demo');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };
};

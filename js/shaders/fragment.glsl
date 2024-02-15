uniform float uTime;
uniform vec3 uLight;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

const float PI = 3.141592653589793238;

/**
 * @see https://ijdykeman.github.io/graphics/simple_fog_shader
 * @see https://gist.github.com/akella/fbc8ec75b2cb1586388f19e32ceaf1f2
 */
float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d) {
  // light to ray origin
  vec3 q = cameraPos - lightPos;

  // coefficients
  float b = dot(dir, q);
  float c = dot(q, q);

  // evaluate integral
  float t = c - b * b;
  float s = 1.0 / sqrt(max(0.0001, t));
  float l = s * (atan((d + b) * s) - atan(b * s));

  return pow(max(0.0, l / 250.0), 0.4);
}

void main() {
  vec2 uv = vUv;

  vec3 cameraToWorld = vWorldPosition - cameraPosition;
  vec3 cameraToWorldDir = normalize(cameraToWorld);
  float cameraToWorldDist = length(cameraToWorld);

  vec3 lightToWorld = normalize(uLight - vWorldPosition);
  float diffuse = max(0.0, dot(vNormal, lightToWorld));
  float dist = length(uLight - vPosition);

  float scatter = getScatter(cameraPosition, cameraToWorldDir, uLight, cameraToWorldDist);

  float final = diffuse + scatter;
  vec3 ambient = vec3(0.05, 0.0, 0.15);
  vec3 color = vec3(final, 0.0, 0.0) + ambient;
  gl_FragColor = vec4(color, 1.0);
}
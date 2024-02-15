uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;

  vPosition = position;
  vNormal = normal;
  vWorldPosition =(modelMatrix * vec4(position, 1.0)).xyz;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
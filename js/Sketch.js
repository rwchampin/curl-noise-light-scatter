import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import vertexShaderTubes from './shaderTubes/vertex.glsl';
import fragmentShaderTubes from './shaderTubes/fragment.glsl';

const SimplexNoise = require('simplex-noise');
const simplex = new SimplexNoise(Math.random);

/**
 * Curl Noise
 * @see https://al-ro.github.io/projects/embers/
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 */
const computeCurl = (x, y, z) => {
  let eps = 0.0001;

  let curl = new THREE.Vector3();

  //Find rate of change in YZ plane
  let n1 = simplex.noise3D(x, y + eps, z); 
  let n2 = simplex.noise3D(x, y - eps, z); 
  //Average to find approximate derivative
  let a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise3D(x, y, z + eps); 
  n2 = simplex.noise3D(x, y, z - eps); 
  //Average to find approximate derivative
  let b = (n1 - n2)/(2 * eps);
  curl.x = a - b;

  //Find rate of change in XZ plane
  n1 = simplex.noise3D(x, y, z + eps); 
  n2 = simplex.noise3D(x, y, z - eps); 
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise3D(x + eps, y, z); 
  n2 = simplex.noise3D(x + eps, y, z); 
  b = (n1 - n2)/(2 * eps);
  curl.y = a - b;

  //Find rate of change in XY plane
  n1 = simplex.noise3D(x + eps, y, z); 
  n2 = simplex.noise3D(x - eps, y, z); 
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise3D(x, y + eps, z); 
  n2 = simplex.noise3D(x, y - eps, z); 
  b = (n1 - n2)/(2 * eps);
  curl.z = a - b;

  return curl;
};

/**
 * @see https://www.youtube.com/watch?v=8PG4RrNwby0
 * @see https://lusion.co/
 */
class Sketch {
  /**
   * @param {Object} options 
   * @param {Element} options.dom 
   */
  constructor({ dom }) {
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();

    this.container = dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1.0);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);
    
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 0.5);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.eMouse = new THREE.Vector2();
    this.elasticMouse = new THREE.Vector2();
    this.tmp = new THREE.Vector2();
    this.elasticMouseVel = new THREE.Vector2();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.isPlaying = true;

    this.boundRender = this.render.bind(this);
    this.boundResize = this.resize.bind(this);

    this.addObjects();
    this.raycast();
    // this.initGui();

    window.requestAnimationFrame(this.boundRender);
    window.addEventListener('resize', this.boundResize);
  }

  raycast() {
    this.raycastPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100, 100),
      // new THREE.MeshBasicMaterial({ color: 0xcb0d02 })
      this.material
    );

    this.light = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.005, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    this.scene1.add(this.raycastPlane);
    this.scene.add(this.light);

    this.container.addEventListener('mousemove', (event) => {
      const { clientX, clientY } = event;
      this.mouse.x = (clientX / this.width) * 2 - 1;
      this.mouse.y = -(clientY / this.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      this.eMouse.x = clientX;
      this.eMouse.y = clientY;

      const intersects = this.raycaster.intersectObjects([this.raycastPlane]);
      if (intersects.length) {
        const p = intersects[0].point;
        this.light.position.copy(p);

        this.eMouse.x = p.x;
        this.eMouse.y = p.y;
      }
    });
  }

  initGui() {
    this.settings = {
      progress: 0
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable'
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: this.time },
        uLight: { value: new THREE.Vector3(0, 0, 0) }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader,
      fragmentShader
    });
    
    this.materialTubes = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable'
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: this.time },
        uLight: { value: new THREE.Vector3(0, 0, 0) }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertexShaderTubes,
      fragmentShader: fragmentShaderTubes
    });

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

    for (let i = 0; i < 300; i++) {
      const path = new THREE.CatmullRomCurve3(
        this.getCurve(
          new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).multiplyScalar(0.45)
        )
      );
      const geometry = new THREE.TubeBufferGeometry(path, 300, 0.0025, 4, false);
  
      const curve = new THREE.Mesh(geometry, this.materialTubes);
      this.scene.add(curve);
    }
  }

  /**
   * @param {THREE.Vector3} start 
   */
  getCurve(start) {
    const scale = .75;
    const points = [];

    points.push(start);
    const currentPoint = start.clone();

    for (let i = 0; i < 500; i++) {
      const v = computeCurl(
        currentPoint.x / scale,
        currentPoint.y / scale,
        currentPoint.z / scale
      );
      currentPoint.addScaledVector(v, 0.0003 + 0.0002 * (i / 500));
      points.push(currentPoint.clone());
    }

    return points;
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) {
      return;
    }

    // document.querySelector('.cursor').style.transform = `translate3d(${ this.elasticMouse.x }px, ${ this.elasticMouse.y }px, 0)`;

    this.tmp.copy(this.eMouse).sub(this.elasticMouse).multiplyScalar(0.15);
    this.elasticMouseVel.add(this.tmp);
    this.elasticMouseVel.multiplyScalar(0.8);
    this.elasticMouse.add(this.elasticMouseVel);

    this.light.position.x = this.elasticMouse.x;
    this.light.position.y = this.elasticMouse.y;
    this.material.uniforms.uLight.value.copy(this.light.position);
    this.materialTubes.uniforms.uLight.value.copy(this.light.position);

    this.time += 1.0;
    this.material.uniforms.uTime.value = this.time;
    this.materialTubes.uniforms.uTime.value = this.time;

    this.renderer.clear();
    this.renderer.render(this.scene1, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.boundRender);
  }
}

export { Sketch };

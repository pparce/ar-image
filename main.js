import * as LocAR from 'locar';
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.001, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// Malla de prueba (un cubo rojo)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(2,2,2),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);

// LocAR: escena basada en ubicación + cámara del dispositivo
const locar = new LocAR.LocationBased(scene, camera);
const cam = new LocAR.WebcamRenderer(renderer);

// GPS real (clave de Part 2)
locar.startGps();

// Añade el cubo en una lat/lon cercana a ti (ajusta a tu zona)
locar.add(cube, -0.72, 51.0501);

// Controles de orientación (clave de Part 2)
const deviceOrientationControls = new LocAR.DeviceOrientationControls(camera);

renderer.setAnimationLoop(() => {
  deviceOrientationControls.update();
  cam.update();
  renderer.render(scene, camera);
});

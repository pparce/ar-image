import * as LocAR from 'locar';
import * as THREE from 'three';

const scene   = new THREE.Scene();
const camera  = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.001, 1000);
const renderer= new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// LocAR base
const locar = new LocAR.LocationBased(scene, camera);
locar.startGps({ enableHighAccuracy: true });

// Webcam (soporta ambas APIs)
let cam = null;
if (typeof LocAR.Webcam === 'function') {
  cam = new LocAR.Webcam({
    onVideoStarted: (videoTexture) => { scene.background = videoTexture; }
  });
} else if (typeof LocAR.WebcamRenderer === 'function') {
  cam = new LocAR.WebcamRenderer(renderer);
}

// Controles
const deviceOrientationControls = new LocAR.DeviceOrientationControls(camera);

// Cubo de prueba
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(2,2,2),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);

// Esperar PRIMER fix de GPS ANTES de añadir nada
function waitFirstFix(timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const onOk = (pos) => {
      navigator.geolocation.clearWatch(wid);
      resolve(pos);
    };
    const onErr = (err) => {
      navigator.geolocation.clearWatch(wid);
      reject(err);
    };
    const wid = navigator.geolocation.watchPosition(onOk, onErr, {
      enableHighAccuracy: true, maximumAge: 0
    });
    setTimeout(() => {
      try { navigator.geolocation.clearWatch(wid); } catch {}
      reject(new Error('Timeout esperando primera posición'));
    }, timeoutMs);
  });
}

(async () => {
  try {
    // Garantiza que el navegador otorgó ubicación
    await waitFirstFix();

    // OJO: orden es (lon, lat)
    const lon = 8.888188134011767;
    const lat = 45.5502440452437;

    // Ahora sí: ya hay origen interno y no dará "No initial position determined"
    locar.add(cube, lon, lat);
  } catch (e) {
    console.error('GPS init error:', e);
  }
})();

// Render loop
renderer.setAnimationLoop(() => {
  deviceOrientationControls.update();
  if (cam && typeof cam.update === 'function') cam.update(); // solo API vieja
  renderer.render(scene, camera);
});

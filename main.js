import * as LocAR from 'locar';
import * as THREE from 'three';

const $start = document.getElementById('start');
const $btn = document.getElementById('btn');
const $err = document.getElementById('err');

function showError(e) {
    $err.hidden = false;
    $err.textContent = (e && e.stack) ? e.stack : String(e);
    console.error(e);
}

async function requestIOSMotionPermissionIfNeeded() {
    // iOS requiere permiso explícito para sensores
    const w = window;
    const D = w.DeviceMotionEvent || w.DeviceOrientationEvent;
    const needs = D && typeof D.requestPermission === 'function';
    if (needs) {
        const res = await D.requestPermission();
        if (res !== 'granted') throw new Error('Permiso de sensores denegado');
    }
}

async function init() {
    try {
        // 1) Permisos (iOS sensores)
        await requestIOSMotionPermissionIfNeeded();

        // 2) Geolocalización (pedir temprano para que el navegador muestre prompt)
        await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(() => resolve(), reject, { enableHighAccuracy: true })
        );

        // 3) THREE + LocAR
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.001, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(innerWidth, innerHeight);
        document.body.appendChild(renderer.domElement);

        addEventListener('resize', () => {
            renderer.setSize(innerWidth, innerHeight);
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
        });

        // 4) LocAR
        const locar = new LocAR.LocationBased(scene, camera);
        const cam = new LocAR.WebcamRenderer(renderer);

        // Inicia GPS real y cámara
        locar.startGps();           // 🔑 GPS real
        await cam.start();          // 🔑 Cámara (si falla, lanza error)

        // 5) Controles de orientación del dispositivo
        const controls = new LocAR.DeviceOrientationControls(camera);

        // 6) Imagen en un plano (cartel que mira a la cámara)
        const url = new URL('./assets/imagen.png', import.meta.url).href; // usa tu imagen
        const tex = await new THREE.TextureLoader().loadAsync(url);
        const aspect = tex.image.width / tex.image.height;
        const h = 1;                 // 1 m alto
        const w = h * aspect;

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );

        // Pon la imagen cerca de tu posición actual (offset ~50 m al norte)
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            const metersNorth = 50;
            const metersEast = 0;
            const dLat = metersNorth / 111111;            // aprox
            const dLon = metersEast / (111111 * Math.cos(lat * Math.PI / 180));
            const targetLat = lat + dLat;
            const targetLon = lon + dLon;
            locar.add(plane, targetLon, targetLat);
        }, showError, { enableHighAccuracy: true });

        // Render loop
        renderer.setAnimationLoop(() => {
            try {
                controls.update();
                plane.lookAt(camera.position);
                cam.update();
                renderer.render(scene, camera);
            } catch (e) { showError(e); }
        });

    } catch (e) {
        showError(e);
    }
}

$btn.addEventListener('click', async () => {
    $start.style.display = 'none';
    await init();
});

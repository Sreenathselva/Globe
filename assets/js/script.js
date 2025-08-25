
        let scene, camera, renderer, earth, clouds, atmosphere;
        let isRotating = true;
        let isWireframe = false;
        let mouseX = 0, mouseY = 0;
        let targetRotationX = 0, targetRotationY = 0;
        let markers = [];
        let controls = {
            mouseDown: false,
            mouseX: 0,
            mouseY: 0
        };

        // Earth parameters
        const EARTH_RADIUS = 5;
        const CAMERA_DISTANCE = 15;
        
        // Sample locations for markers
        const locations = [
            { name: "New York", lat: 40.7128, lon: -74.0060, color: 0x00ff00 },
            { name: "London", lat: 51.5074, lon: -0.1278, color: 0x00ff88 },
            { name: "Tokyo", lat: 35.6762, lon: 139.6503, color: 0x00ffaa },
            { name: "Sydney", lat: -33.8688, lon: 151.2093, color: 0x00ff44 },
            { name: "São Paulo", lat: -23.5505, lon: -46.6333, color: 0x44ff00 }
        ];

        function init() {
            // Create scene
            scene = new THREE.Scene();
            
            // Create camera
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, CAMERA_DISTANCE);
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 1);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('canvas-container').appendChild(renderer.domElement);
            
            // Add lights
            addLights();
            
            // Create Earth
            createEarth();
            
            // Create atmosphere
            createAtmosphere();
            
            // Add markers
            addMarkers();
            
            // Add event listeners
            addEventListeners();
            
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            
            // Start animation
            animate();
        }

        function addLights() {
            // Ambient light
            const ambientLight = new THREE.AmbientLight(0x002200, 0.2);
            scene.add(ambientLight);
            
            // Directional light (main light)
            const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.8);
            directionalLight.position.set(5, 3, 5);
            scene.add(directionalLight);
            
            // Point light for accent
            const pointLight = new THREE.PointLight(0x00ff44, 0.3);
            pointLight.position.set(-10, 0, -10);
            scene.add(pointLight);
        }

        function createEarth() {
            const earthGroup = new THREE.Group();
            
            // Main wireframe sphere
            const wireframeGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x004400,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
            earthGroup.add(wireframeSphere);
            
            // Create continent outlines using line geometry
            createContinents(earthGroup);
            
            // Add latitude/longitude grid
            createLatLonGrid(earthGroup);
            
            // Add inner glow sphere
            const innerGlowGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 0.98, 16, 16);
            const innerGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0x003300,
                transparent: true,
                opacity: 0.15
            });
            
            const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
            earthGroup.add(innerGlow);
            
            earth = earthGroup;
            scene.add(earthGroup);
        }

        function createContinents(parentGroup) {
            // Simplified continent data (lat, lon coordinates for major landmasses)
            const continentData = {
                // North America outline
                northAmerica: [
                    [71, -156], [70, -141], [69, -133], [68, -133], [66, -162], [64, -165], 
                    [60, -165], [59, -151], [58, -137], [56, -132], [54, -130], [52, -128], 
                    [49, -125], [47, -125], [45, -124], [42, -124], [39, -123], [36, -121], 
                    [33, -118], [30, -115], [28, -97], [26, -97], [26, -80], [28, -80], 
                    [30, -81], [32, -81], [35, -76], [37, -76], [40, -74], [42, -71], 
                    [45, -68], [47, -60], [49, -54], [52, -55], [55, -57], [58, -61], 
                    [60, -64], [62, -68], [65, -74], [68, -81], [70, -95], [71, -156]
                ],
                // South America outline
                southAmerica: [
                    [13, -59], [10, -61], [6, -61], [2, -60], [-2, -60], [-6, -63], 
                    [-10, -65], [-14, -67], [-18, -65], [-22, -64], [-26, -60], 
                    [-30, -58], [-34, -58], [-38, -62], [-42, -65], [-46, -67], 
                    [-50, -69], [-53, -68], [-55, -67], [-55, -65], [-54, -63], 
                    [-52, -59], [-48, -58], [-44, -57], [-40, -38], [-37, -38], 
                    [-34, -38], [-30, -38], [-26, -43], [-22, -43], [-18, -39], 
                    [-14, -39], [-10, -35], [-6, -35], [-2, -48], [2, -49], 
                    [6, -51], [10, -60], [13, -59]
                ],
                // Africa outline
                africa: [
                    [32, 22], [31, 25], [30, 30], [24, 32], [18, 38], [15, 39], 
                    [11, 42], [4, 41], [-1, 41], [-6, 20], [-11, 17], [-15, 12], 
                    [-18, 12], [-22, 14], [-26, 15], [-29, 17], [-33, 18], 
                    [-35, 20], [-34, 28], [-29, 29], [-24, 31], [-20, 40], 
                    [-15, 48], [-11, 51], [-6, 51], [0, 51], [4, 48], [8, 47], 
                    [12, 43], [16, 40], [20, 37], [24, 34], [28, 31], [31, 29], [32, 22]
                ],
                // Europe outline
                europe: [
                    [36, -9], [43, -8], [44, -2], [46, 2], [48, 2], [50, 4], 
                    [53, 5], [55, 10], [58, 11], [60, 23], [61, 28], [69, 33], 
                    [71, 40], [70, 55], [68, 60], [65, 58], [63, 55], [61, 50], 
                    [58, 49], [55, 37], [53, 32], [50, 30], [48, 29], [46, 16], 
                    [44, 12], [43, 7], [41, 3], [38, 0], [36, -9]
                ],
                // Asia outline (simplified)
                asia: [
                    [70, 40], [68, 60], [65, 80], [60, 100], [55, 120], [50, 135], 
                    [45, 140], [40, 140], [35, 138], [30, 135], [25, 125], [20, 95], 
                    [15, 75], [25, 65], [35, 60], [45, 50], [55, 45], [65, 40], [70, 40]
                ],
                // Australia outline
                australia: [
                    [-12, 130], [-15, 132], [-20, 135], [-25, 140], [-30, 145], 
                    [-35, 150], [-38, 148], [-37, 145], [-35, 140], [-32, 135], 
                    [-28, 130], [-25, 125], [-22, 120], [-18, 115], [-15, 115], 
                    [-12, 120], [-12, 130]
                ]
            };

            // Create lines for each continent
            Object.keys(continentData).forEach(continent => {
                const points = continentData[continent];
                createContinentLine(points, parentGroup);
            });
        }

        function createContinentLine(coordinates, parentGroup) {
            const points = [];
            
            coordinates.forEach(coord => {
                const lat = coord[0];
                const lon = coord[1];
                
                // Convert lat/lon to 3D coordinates
                const phi = (90 - lat) * Math.PI / 180;
                const theta = (lon + 180) * Math.PI / 180;
                
                const x = -EARTH_RADIUS * 1.001 * Math.sin(phi) * Math.cos(theta);
                const y = EARTH_RADIUS * 1.001 * Math.cos(phi);
                const z = EARTH_RADIUS * 1.001 * Math.sin(phi) * Math.sin(theta);
                
                points.push(new THREE.Vector3(x, y, z));
            });
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ff00,
                linewidth: 2,
                transparent: true,
                opacity: 0.8
            });
            
            const line = new THREE.Line(geometry, material);
            parentGroup.add(line);
        }

        function createLatLonGrid(parentGroup) {
            // Create latitude lines
            for (let lat = -80; lat <= 80; lat += 20) {
                const points = [];
                for (let lon = -180; lon <= 180; lon += 5) {
                    const phi = (90 - lat) * Math.PI / 180;
                    const theta = (lon + 180) * Math.PI / 180;
                    
                    const x = -EARTH_RADIUS * 1.002 * Math.sin(phi) * Math.cos(theta);
                    const y = EARTH_RADIUS * 1.002 * Math.cos(phi);
                    const z = EARTH_RADIUS * 1.002 * Math.sin(phi) * Math.sin(theta);
                    
                    points.push(new THREE.Vector3(x, y, z));
                }
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x004400,
                    transparent: true,
                    opacity: 0.4
                });
                
                const line = new THREE.Line(geometry, material);
                parentGroup.add(line);
            }
            
            // Create longitude lines
            for (let lon = -180; lon <= 180; lon += 30) {
                const points = [];
                for (let lat = -90; lat <= 90; lat += 3) {
                    const phi = (90 - lat) * Math.PI / 180;
                    const theta = (lon + 180) * Math.PI / 180;
                    
                    const x = -EARTH_RADIUS * 1.002 * Math.sin(phi) * Math.cos(theta);
                    const y = EARTH_RADIUS * 1.002 * Math.cos(phi);
                    const z = EARTH_RADIUS * 1.002 * Math.sin(phi) * Math.sin(theta);
                    
                    points.push(new THREE.Vector3(x, y, z));
                }
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x004400,
                    transparent: true,
                    opacity: 0.4
                });
                
                const line = new THREE.Line(geometry, material);
                parentGroup.add(line);
            }
        }

        function createAtmosphere() {
            const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.2, 32, 32);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                        float pulse = sin(time * 2.0) * 0.2 + 0.8;
                        gl_FragColor = vec4(0.0, 1.0, 0.2, intensity * pulse * 0.6);
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            });
            
            atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            scene.add(atmosphere);
        }

        function addMarkers() {
            locations.forEach(location => {
                const marker = createMarker(location);
                markers.push({ mesh: marker, data: location });
                scene.add(marker);
            });
        }

        function createMarker(location) {
            const markerGroup = new THREE.Group();
            
            // Convert lat/lon to 3D coordinates
            const phi = (90 - location.lat) * Math.PI / 180;
            const theta = (location.lon + 180) * Math.PI / 180;
            
            const x = -EARTH_RADIUS * 1.15 * Math.sin(phi) * Math.cos(theta);
            const y = EARTH_RADIUS * 1.15 * Math.cos(phi);
            const z = EARTH_RADIUS * 1.15 * Math.sin(phi) * Math.sin(theta);
            
            // Create holographic marker
            const markerGeometry = new THREE.OctahedronGeometry(0.15, 0);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: location.color,
                transparent: true,
                opacity: 0.9
            });
            const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
            
            // Create pulsing ring around marker
            const ringGeometry = new THREE.RingGeometry(0.2, 0.25, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: location.color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.lookAt(new THREE.Vector3(0, 0, 0));
            
            // Create beam effect
            const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: location.color,
                transparent: true,
                opacity: 0.6
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(0, 0.5, 0);
            
            markerGroup.add(markerMesh);
            markerGroup.add(ring);
            markerGroup.add(beam);
            markerGroup.position.set(x, y, z);
            markerGroup.lookAt(new THREE.Vector3(0, 0, 0));
            
            // Add animation data
            markerGroup.userData = { 
                originalScale: 1,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                location: location
            };
            
            return markerGroup;
        }

        function addEventListeners() {
            // Mouse events
            renderer.domElement.addEventListener('mousedown', onMouseDown);
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('mouseup', onMouseUp);
            renderer.domElement.addEventListener('wheel', onMouseWheel);
            
            // Touch events
            renderer.domElement.addEventListener('touchstart', onTouchStart);
            renderer.domElement.addEventListener('touchmove', onTouchMove);
            renderer.domElement.addEventListener('touchend', onTouchEnd);
            
            // Window resize
            window.addEventListener('resize', onWindowResize);
            
            // Click events for markers
            renderer.domElement.addEventListener('click', onMouseClick);
        }

        function onMouseDown(event) {
            controls.mouseDown = true;
            controls.mouseX = event.clientX;
            controls.mouseY = event.clientY;
        }

        function onMouseMove(event) {
            if (controls.mouseDown) {
                const deltaX = event.clientX - controls.mouseX;
                const deltaY = event.clientY - controls.mouseY;
                
                targetRotationY += deltaX * 0.01;
                targetRotationX += deltaY * 0.01;
                targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
                
                controls.mouseX = event.clientX;
                controls.mouseY = event.clientY;
            }
        }

        function onMouseUp() {
            controls.mouseDown = false;
        }

        function onMouseWheel(event) {
            camera.position.z += event.deltaY * 0.01;
            camera.position.z = Math.max(8, Math.min(25, camera.position.z));
        }

        function onTouchStart(event) {
            if (event.touches.length === 1) {
                controls.mouseDown = true;
                controls.mouseX = event.touches[0].clientX;
                controls.mouseY = event.touches[0].clientY;
            }
        }

        function onTouchMove(event) {
            if (event.touches.length === 1 && controls.mouseDown) {
                const deltaX = event.touches[0].clientX - controls.mouseX;
                const deltaY = event.touches[0].clientY - controls.mouseY;
                
                targetRotationY += deltaX * 0.01;
                targetRotationX += deltaY * 0.01;
                targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
                
                controls.mouseX = event.touches[0].clientX;
                controls.mouseY = event.touches[0].clientY;
            }
        }

        function onTouchEnd() {
            controls.mouseDown = false;
        }

        function onMouseClick(event) {
            // Raycasting for marker clicks
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            const markerMeshes = markers.map(m => m.mesh.children[0]);
            const intersects = raycaster.intersectObjects(markerMeshes);
            
            if (intersects.length > 0) {
                const clickedMarker = markers.find(m => m.mesh.children[0] === intersects[0].object);
                if (clickedMarker) {
                    alert(`Location: ${clickedMarker.data.name}\nCoordinates: ${clickedMarker.data.lat}°, ${clickedMarker.data.lon}°`);
                }
            }
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            
            // Auto rotation
            if (isRotating && !controls.mouseDown) {
                targetRotationY += 0.003;
            }
            
            // Smooth rotation
            if (earth) {
                earth.rotation.y += (targetRotationY - earth.rotation.y) * 0.05;
                earth.rotation.x += (targetRotationX - earth.rotation.x) * 0.05;
                
                if (atmosphere) {
                    atmosphere.rotation.y = earth.rotation.y * 0.3;
                    atmosphere.rotation.x = earth.rotation.x * 0.3;
                    // Update time uniform for atmosphere animation
                    atmosphere.material.uniforms.time.value = Date.now() * 0.001;
                }
            }
            
            // Animate markers
            markers.forEach(markerObj => {
                const marker = markerObj.mesh;
                const time = Date.now() * marker.userData.pulseSpeed;
                const scale = 1 + Math.sin(time) * 0.3;
                marker.scale.setScalar(scale);
                
                // Rotate markers with earth
                const group = new THREE.Group();
                group.rotation.y = earth.rotation.y;
                group.rotation.x = earth.rotation.x;
                group.updateMatrixWorld();
                
                const originalPosition = marker.userData.originalPosition || marker.position.clone();
                marker.userData.originalPosition = originalPosition;
                
                const rotatedPosition = originalPosition.clone();
                rotatedPosition.applyEuler(new THREE.Euler(earth.rotation.x, earth.rotation.y, 0));
                marker.position.copy(rotatedPosition);
            });
            
            renderer.render(scene, camera);
        }

        // Control functions
        function toggleRotation() {
            isRotating = !isRotating;
        }

        function resetView() {
            targetRotationX = 0;
            targetRotationY = 0;
            camera.position.set(0, 0, CAMERA_DISTANCE);
        }

        function addScanLines() {
            // Add scanning effect
            const scanGeometry = new THREE.RingGeometry(EARTH_RADIUS * 1.3, EARTH_RADIUS * 1.35, 32);
            const scanMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const scan = new THREE.Mesh(scanGeometry, scanMaterial);
            scene.add(scan);
            
            // Animate scan
            let scanAngle = 0;
            const animateScan = () => {
                scanAngle += 0.1;
                scan.rotation.z = scanAngle;
                scan.material.opacity = Math.sin(scanAngle * 2) * 0.2 + 0.3;
                if (scanAngle < Math.PI * 4) {
                    requestAnimationFrame(animateScan);
                } else {
                    scene.remove(scan);
                }
            };
            animateScan();
        }

        // Initialize the application
        init();
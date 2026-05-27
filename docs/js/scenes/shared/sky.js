function createSkyDome(scene) {
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uHorizon;
    uniform vec3 uMid;
    uniform vec3 uUpper;
    uniform vec3 uZenith;

    varying vec3 vWorldPosition;

    void main() {
      float h = normalize(vWorldPosition).y;
      h = clamp(h, 0.0, 1.0);

      vec3 color;
      if (h < 0.15) {
        color = mix(uHorizon, uMid, h / 0.15);
      } else if (h < 0.4) {
        color = mix(uMid, uUpper, (h - 0.15) / 0.25);
      } else {
        color = mix(uUpper, uZenith, (h - 0.4) / 0.6);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uHorizon: { value: PALETTE.skyHorizon },
      uMid:     { value: PALETTE.skyMid },
      uUpper:   { value: PALETTE.skyUpper },
      uZenith:  { value: PALETTE.skyZenith },
    },
    side: THREE.BackSide,
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);
  return skyMesh;
}

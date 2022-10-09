import * as THREE from "three";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";
import particleTexture from './particle-improved.png'

function lerp(a, b, t) {
 return a * (1-t) + b * t;
}
export default class Sketch {
	constructor(options) {
		this.scene = new THREE.Scene();

		this.container = options.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0x000000, 1);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.outputEncoding = THREE.sRGBEncoding;

		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();
		this.point = new THREE.Vector3();

		this.container.appendChild(this.renderer.domElement);

		this.camera = new THREE.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			0.001,
			1000
		);

		this.camera.position.set(0, 2, 2);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.time = 0;

		this.materials = [];

		this.isPlaying = true;

		let opts = [
			{
				min_radius: 1,
				max_radius: 2,
				color: "#f7b373",
				size: 1,
				uAmp: 1
			},
			{
				min_radius: 1,
				max_radius: 2,
				color: "#88b3ce",
				size: 0.5,
				uAmp: 3
			}
		];

		opts.forEach(op => {
			this.addObject(op)
		})
		this.raycasterEvent();

		// this.addMesh();
		this.resize();
		this.render();
		this.setupResize();
	}

	raycasterEvent() {
		let mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(10, 10, 10, 10).rotateX(-Math.PI / 2),
			new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
		);

		// let test = new THREE.Mesh(
		// 	new THREE.SphereGeometry(0.1, 10, 10),
		// 	new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
		// );

		// this.scene.add(test);

		this.scene.add(mesh)

		window.addEventListener("pointermove", e => {
			this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
			this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

			this.raycaster.setFromCamera(this.pointer, this.camera);
			let intersects = this.raycaster.intersectObjects([mesh]);
			if (intersects[0]) {
				console.log(intersects[0].point, this.pointer);
				// test.position.copy(intersects[0].point);
				this.point.copy(intersects[0].point);
			}

		});
	}

	settings() {
		let that = this;
		this.settings = {
			progress: 0,
		};
		this.gui = new GUI();
		this.gui.add(this.settings, "progress", 0, 1, 0.01);
	}

	setupResize() {
		window.addEventListener("resize", this.resize.bind(this));
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	addObject(opts) {
		let that = this;
		let count = 10000;
		let min_radius = opts.min_radius;
		let max_radius = opts.max_radius;
		let particlegeo = new THREE.PlaneGeometry(1, 1);
		let geo = new THREE.InstancedBufferGeometry();
		geo.instanceCount = count;
		geo.setAttribute('position', particlegeo.getAttribute('position'));
		geo.index = particlegeo.index;

		let pos = new Float32Array(count*3);
		for (let i = 0; i < count; i++) {
			let theta = Math.random() * 2 * Math.PI;

			let radius = lerp(min_radius, max_radius, Math.random());
			let x = radius * Math.sin(theta);
			let y = (Math.random() -0.5) * 0.1 ;
			let z = radius * Math.cos(theta);
			pos.set([
				x,y,z
			], i*3);
		}

		geo.setAttribute('pos', new THREE.InstancedBufferAttribute(pos, 3, false));


		let material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: "#extension GL_OES_standard_derivatives : enable",
			},
			side: THREE.DoubleSide,
			uniforms: {
				uTexture: { value: new THREE.TextureLoader().load(particleTexture) },
				time: { value: 0 },
				uAmp: { value: opts.uAmp },
				uMouse: { value: new THREE.Vector3() },
				size: { value: opts.size },
				uColor: { value: new THREE.Color(opts.color) },
				resolution: { value: new THREE.Vector4() },
			},
			// wireframe: true,
			transparent: true,
			depthTest: false,
			vertexShader: vertex,
			fragmentShader: fragment,
		});
		this.materials.push(material)

		this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
		this.points = new THREE.Mesh(geo, material);
		this.scene.add(this.points);
	}

	render() {
		this.time += 0.05;
		this.materials.forEach(m => {
			m.uniforms.time.value = this.time * 0.5;
			m.uniforms.uMouse.value = this.point;
		})
		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch({
	dom: document.getElementById("container"),
});

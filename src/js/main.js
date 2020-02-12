/**
 * WEBGL FPS Chicken World
 * ESGI 2A2
 * @author Maxime LE HENAFF
 * @author Sylvain BOUDACHER
 * @author Clément BOSSARD
 * @author Clément KHAROUBI
 */

import * as THREE from './three.module.js';
import  Stats from './stats.module.js';
import { GLTFLoader } from './GLTFLoader.js'
import { PointerLockControls } from '../jsm/controls/PointerLockControls.js';
import { FBXLoader } from './FBXLoader.js';

var rainGeo, rain,rainDrop;
var rainCount = 15000;
var camera, scene, renderer, controls;
var stats;
var container;
var rainMaterial;
var gun;
var listener;
var cloudParticles = [];
var objects = [];
var spotLight5, spotLight6;
var raycaster;
var spotLight;
var clock = new THREE.Clock();
var mixer;
var targetObject;
var rotationX = 0;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

/////////////////////////////////////////
// 		Paramètres des contrôles   	   //
/////////////////////////////////////////

const gui = new dat.GUI();
var environnementFolder = gui.addFolder( 'Environnement' );
var colorFolder = gui.addFolder('Color');

var params = {
    movSpeed: 50,
    rainColor: [255, 0, 255]
};

environnementFolder.add(params, 'movSpeed').name('Speed').min(0).max(60).step(1);
colorFolder.addColor(params , 'rainColor');

environnementFolder.open();

init();
animate();

function init(){

    // Creation of the DOM container
    container = document.createElement('div');
    document.body.appendChild(container);

    //Creation en poisitionning of the camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 30500 );
    camera.position.y = 0;
    camera.position.x= 150;
    camera.position.z= 500;
    camera.rotation.y= 4;
    camera.rotation.x = 0;
    camera.rotation.z = 0;

    //Audio listener
    listener = new THREE.AudioListener();
    camera.add( listener );

    //Creation de la scene
    // Pré-chargement d'une texture

    scene = new THREE.Scene();

    //Fog
    scene.fog = new THREE.Fog( 0x00001a, 0, 24500 );

    //shooter akimbo
    let body = document.getElementsByTagName("body")[0];
    body.addEventListener("click", shooterAkimbo, false);

    /*
     * CREATION DE LA SKYBOX
     */

    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_ft.jpg');
    let texture_bk = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_bk.jpg');
    let texture_up = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_up.jpg');
    let texture_dn = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_dn.jpg');
    let texture_rt = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_rt.jpg');
    let texture_lf = new THREE.TextureLoader().load( './src/textures/ame_nebula/purplenebula_lf.jpg');

    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

    for (let i = 0; i < 6; i++) {
        materialArray[i].side = THREE.BackSide;
    }

    let skyboxGeo = new THREE.BoxGeometry( 30000, 30000, 30000);
    let skybox = new THREE.Mesh(skyboxGeo, materialArray);

    scene.add(skybox);

    /**
     * Position de là où pointe la lumière (x, y, z)
     * Activation des ombres pour la lumière
     * Propriétés des ombres (width / height)
     */

    var ambient = new THREE.AmbientLight( 0xFFEFB1, 0.4 );
    scene.add( ambient );

    //House light
    spotLight = new THREE.SpotLight( 0xffffff, 1.9 );
    spotLight.position.set( 0, 100, 2 );
    spotLight.angle = Math.PI ;
    spotLight.penumbra = 0.05;
    spotLight.decay = 1.8;
    spotLight.distance = 2000;

    //Second light house
    var spotLight2 = new THREE.SpotLight( 0xff9900, 3 );
    spotLight2.position.set( 0, 100, 300 );
    spotLight2.angle = Math.PI
    spotLight2.penumbra = 0.05;
    spotLight2.decay = 1.8;
    spotLight2.distance = 1500;

    //Boat Light
    var spotLight3 = new THREE.SpotLight( 0xff9900, 4 );
    spotLight3.position.set( 750, 700, 2400 );
    spotLight3.angle = Math.PI;
    spotLight3.penumbra = 0.05;
    spotLight3.decay = 1.8;
    spotLight3.distance = 1900;

    //second boat light
    var spotLight4 = new THREE.SpotLight( 0xffffb3, 2 );
    spotLight4.position.set( 1600, 700, 3000 );
    spotLight4.angle = Math.PI;
    spotLight4.penumbra = 0.05;
    spotLight4.decay = 1.8;
    spotLight4.distance = 1950;

    //lightHouse global
    spotLight5 = new THREE.SpotLight( 0xffffb3, 10 );
    spotLight5.position.set( 5050, 4700, -9000 );
    spotLight5.angle = Math.PI;
    spotLight5.penumbra = 0;
    spotLight5.decay = 1.0;
    spotLight5.distance = 9500;

    //lightHouse main spot
    spotLight6 = new THREE.SpotLight( 0xffffb3, 5 );
    spotLight6.position.set( 5050, 4700, -9000 );
    spotLight6.angle = 0.05;
    spotLight6.penumbra = 0.05;
    spotLight6.decay = 0.2;
    spotLight6.distance = 13500;

    //target position spotlight6
    targetObject = new THREE.Object3D();

    scene.add(targetObject);

    spotLight6.target = targetObject;

    //Spotlight shadow
    spotLight3.castShadow = true;
    spotLight3.shadow.mapSize.width = 512;
    spotLight3.shadow.mapSize.height = 512;
    spotLight3.shadow.camera.near = 10;
    spotLight3.shadow.camera.far = 500;

    spotLight4.castShadow = true;
    spotLight4.shadow.mapSize.width = 512;
    spotLight4.shadow.mapSize.height = 512;
    spotLight4.shadow.camera.near = 10;
    spotLight4.shadow.camera.far = 500;

    spotLight6.castShadow = true;
    spotLight6.shadow.mapSize.width = 512;
    spotLight6.shadow.mapSize.height = 512;
    spotLight6.shadow.camera.near = 10;
    spotLight6.shadow.camera.far = 500;

    scene.add( spotLight );
    scene.add( spotLight2 );
    scene.add( spotLight3 );
    scene.add( spotLight4 );
    scene.add( spotLight5 );
    scene.add( spotLight5 );
    scene.add( spotLight6 );

    controls = new PointerLockControls(camera, document.body);

    // Screen with Keyboard instruction
    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );

    instructions.addEventListener( 'click', function () {
        controls.lock();
    }, false );

    // if control not lock -> instruction and blocker are hide
    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    // if control lock -> instruction and blocker are show
    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    //For raycaster collision
    scene.add( controls.getObject() );

    // Function when you press your Key on keyboard
    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += 450;
                canJump = false;
                break;
        }
    };

    // Function when you unpress your key on keyboard
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3());

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    document.body.appendChild( renderer.domElement );

    // LOADER //

    setStatsModule();
    render();
    grounds();
    loadIle();
    loadHouse();
    loadtree();
    loadboat();
    loadLightHouse();
    loadChickenCoop(800,-65,1200,3);
    loadChickenCoop(800,-65,1000,4);
    loadChickenCoop(600,-65,800,2.3);
    loadChicken(600,-58,800,0);

    // Loop to load flower on random position
    for (let i = 0; i < 40; i++){
        loadFlower(getRandomInt(-400,1000),-57,getRandomInt(-100,800),getRandomInt(0,100),getRandomInt(0.5,2.5));
    }

    rains();
    loadOldMan();

    // Add akimbo gun
    loadGun(-12, -5, -15, 1.7);
    loadGun(12, -5, -15, 1.4);

    window.addEventListener('resize', onWindowResize, false);
}

/*
 *  LOAD SOUND AND PARAMETERS SOUND CONTROLS
 */

// Load sound of CHICKEN
var sound0 = new THREE.PositionalAudio( listener );

// load a sound and set it as the PositionalAudio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load( './src/sound/poulSound.ogg', function( buffer ) {
    sound0.setBuffer( buffer );
    sound0.setLoop( true );
    sound0.setRefDistance( 20 );
    sound0.play();
});

// Global audio RAIN
var sound3 = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load( './src/sound/rainSound.ogg', function( buffer ) {
    sound3.setBuffer( buffer );
    sound3.setLoop( true );
    sound3.setVolume( 1.5 );
    sound3.play();
});

//Sea sound on boat
var sound1 = new THREE.PositionalAudio( listener );

// load a sound and set it as the PositionalAudio object's buffer
audioLoader.load( './src/sound/seaSound.ogg', function( buffer ) {
    sound1.setBuffer( buffer );
    sound1.setRefDistance( 50 );
    sound1.play();
});

// Set volume in function of UI parameters
var SoundControls = function () {
    this.chicken = sound0.getVolume();
    this.sea = sound1.getVolume();
    this.rain = sound3.getVolume();

};

var soundControls = new SoundControls();
var volumeFolder = gui.addFolder( 'Sounds' );

// Set parameters of control UI
volumeFolder.add( soundControls, 'chicken' ).min( 0.0 ).max( 5.0 ).step( 0.05 ).onChange( function () {
    sound0.setVolume( soundControls.chicken );
} );

volumeFolder.add( soundControls, 'sea' ).min( 0.0 ).max( 5.0 ).step( 0.05 ).onChange( function () {
    sound1.setVolume( soundControls.sea );
} );

volumeFolder.add( soundControls, 'rain' ).min( 0.0 ).max( 5.0 ).step( 0.05 ).onChange( function () {
    sound3.setVolume( soundControls.rain );
} );

volumeFolder.open();

function render() {
    renderer.render( scene, camera );
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function rains() {
    rainGeo = new THREE.Geometry();
    for(let i = 0; i < rainCount; i++) {
        rainDrop = new THREE.Vector3(
            getRandomInt(-8000, 8000),
            Math.random() * 10000 - 5000,
            getRandomInt(-8000, 8000)
        );

        rainDrop.velocity = {};
        rainDrop.velocity = 0;
        rainGeo.vertices.push(rainDrop);
    }

     rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 5,
        transparent: true
    });


    rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);
}

function loadOldMan(){
    // model
    var loader = new FBXLoader();
    loader.load( './src/objects/oldMan/SittingOldMan.fbx',
        function ( object ) {

            mixer = new THREE.AnimationMixer(object);

            var action = mixer.clipAction(object.animations[0]);
            action.play();

            object.traverse(function(child) {

                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add( object );
            object.scale.set(1.2,1.2,1.2); // THREE.Scene
            object.rotation.y = 4;
            object.position.x = 2000;
            object.position.z = 930;
            object.position.y = 145;
        } );
}

function loadIle() {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/terrain/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.castShadow = false;
                    child.receiveShadow = true;

                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene
            gltf.scene.scale.set(30,30,30); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = -300;
            gltf.scene.position.x = -200;
            gltf.scene.position.z = -10;
            gltf.scene.position.y = -830;
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded ile');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadChicken(Px,Py,Pz,Rt) {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/chicken/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene
            gltf.scene.scale.set(80,80,80); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = Rt;
            gltf.scene.position.x = Px;
            gltf.scene.position.z = Pz;
            gltf.scene.position.y = Py;
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded Chicken');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadGun(Px,Py,Pz,Ry) {
    gun = new GLTFLoader();
    gun.load(
        // Chemin de la ressource
        './src/objects/gun/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            } );

            camera.add (gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene
            gltf.scene.scale.set(1,1,1); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = Ry;

            camera.add(gltf.scene);
            //gltf.scene.position.set(7,-5,-15);
            gltf.scene.position.set(Px, Py, Pz);
        },
        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded gun');
        },
        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );
}

function loadChickenCoop(Px,Py,Pz,Rt) {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/chicken_coop/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene
            gltf.scene.scale.set(70,70,70); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = Rt;//3
            gltf.scene.position.x = Px;//800
            gltf.scene.position.z = Pz;//1200
            gltf.scene.position.y = Py;//-65
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded chicken coop');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function grounds() {

    // Pré-chargement d'une texture
    var loader = new THREE.TextureLoader();
    // Chargement de la texture du sol
    var groundTexture = loader.load('src/textures/waterNew.jpeg');
    // Activation du mode wrap pour la répétition de la texture
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.color = 0x1F4F4F;
    // Paramtère de répétition de la texture
    groundTexture.repeat.set(10,10);
    // Gestion du flou
    groundTexture.anisotropy = 30;
    // Encodage avec sRGBEncoding pour une image plus nette
    groundTexture.encoding = THREE.sRGBEncoding;
    // Liaison material <=> texture
    var groundMaterial = new THREE.MeshPhongMaterial({map: groundTexture});
    // Création de notre mesh
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry( 30000, 30000), groundMaterial);
    // Définition de la position Y de notre plateau
    mesh.position.y = -250;
    // Ajout d'une rotation en x
    mesh.rotation.x = -Math.PI / 2;
    // Activation des ombres sur le sol
    mesh.receiveShadow = true;

    // Ajout à la scène
    scene.add(mesh);
}

function loadHouse() {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/house/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scenes; // Array<THREE.Scene>
            gltf.scene.scale.set(120,120,120); // THREE.Scene
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y =  90 * Math.PI / 1;
            gltf.scene.position.x = -100;
            gltf.scene.position.z = -250;
            gltf.scene.position.y = 299;
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded house');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadtree() {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/tree/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {
                    child.castShadow = false;
                    child.receiveShadow = true;
                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene

            gltf.scenes; // Array<THREE.Scene>

            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
            gltf.scene.scale.set(10,10,10); // THREE.Scene
            gltf.scene.rotation.y = 0;
            gltf.scene.position.x = 12500;
            gltf.scene.position.z = -2200;
            gltf.scene.position.y = -3500;

            var sound2 = new THREE.PositionalAudio( listener );

            var audioLoader = new THREE.AudioLoader();
            // load a sound and set it as theioLoader();
            audioLoader.load( './src/sound/seaSound.ogg', function( buffer ) {
                sound2.setBuffer( buffer );
                sound2.setRefDistance( 200 );
                sound2.play();

            });
            gltf.scene.add( sound2);
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded tree');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadboat() {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/boat/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene.scale.set(15,15,15); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = 4;
            gltf.scene.position.x = 2200;
            gltf.scene.position.z = 1500;
            gltf.scene.position.y = -500;


            gltf.scene.add( sound1 );
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded boat');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadLightHouse() {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/village_lighthouse_team_creepy/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.castShadow = true;
                    child.receiveShadow = true;
                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene.scale.set(3,3,3); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object


            gltf.scene.rotation.y = 0;
            gltf.scene.position.x = -10000;
            gltf.scene.position.z = -9000;
            gltf.scene.position.y = -900;
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded lightHouse');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function loadFlower(Px,Py,Pz,Rt,sc) {
    var loader = new GLTFLoader();
    loader.load(
        // Chemin de la ressource
        './src/objects/flower1/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                }

            } );
            scene.add(gltf.scene);

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Scene
            gltf.scene.scale.set(sc,sc,sc); // THREE.Scene
            gltf.scenes; // Array<THREE.Scene>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            gltf.scene.rotation.y = Rt;
            gltf.scene.position.x = Px;
            gltf.scene.position.z = Pz;
            gltf.scene.position.y = Py;
        },

        // Fonction appelée lors du chargement
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded Flower');
        },

        // Fonction appelée lors d'une quelconque erreur
        function (error) {
            console.log('Une erreur est survenue');
            console.log(error)
        }
    );

}

function setStatsModule() {
    // Utilisation du module stats et ajout dans notre container
    stats = new Stats();
    container.appendChild(stats.dom);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function shooterAkimbo() {

    var soundGun = new THREE.Audio( listener );

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( './src/sound/shooter.ogg', function( buffer ) {
        soundGun.setBuffer( buffer );
        soundGun.setVolume( 1 );
        soundGun.play();
    });

}

function animate() {
    requestAnimationFrame(animate);

    cloudParticles.forEach(p => {
        p.rotation.z -=0.002;
    });

    rainGeo.vertices.forEach(p => {
        p.velocity -= 0.2 + Math.random() * 0.1;
        p.y += p.velocity;
        if (p.y < -3000) {
            p.y = 3000;
            p.velocity = 0;
        }
    });

    rainGeo.verticesNeedUpdate = true;

    rotationX += 10;

    if (rotationX > 6000){
        rotationX = -6000;
    }
    var delta = clock.getDelta();

    if ( mixer ) mixer.update( delta );

    if ( controls.isLocked === true ) {

        raycaster.ray.origin.copy( controls.getObject().position );

        var intersections = raycaster.intersectObjects( objects );

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime + params.movSpeed) / 400 ; //Speed

        velocity.x -= velocity.x * 10.0 * delta ;
        velocity.z -= velocity.z * 10.0 * delta ;

        velocity.y -= 9.8 * 90.0 * ( ( time - prevTime ) / 500 ); // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z  -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        if ( onObject === true ) {

            velocity.y = Math.max( 0, velocity.y );
            canJump = true;

        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }

        prevTime = time;
    }

    targetObject.position.set(rotationX, 100, 0);

    stats.update();
    renderer.render( scene, camera );
}
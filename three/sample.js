// Wait for loading page
window.addEventListener('load', init);

function init() {
    console.log("init...")
    // toggleFullScreen();

    // Candidate value for width & height
    // (480,640): Value in the official sample code for ar.js (nft.html)
    // -> When running it on smartphone, the display goes off the screen.
    // (640,480): maybe, good display balance
    // (1024,776): It slows down
    let width  = 640;
    let height = 480;
    let windowWidth  = window.innerWidth;
    let windowHeight = window.innerHeight;
    console.log("window-size:", windowWidth, windowHeight);

    console.log("THREEx.ArToolkitContext.baseURL:", THREEx.ArToolkitContext.baseURL);

    let renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'mediump',
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color('lightgrey'), 0)
    renderer.setSize( windowWidth, windowHeight );
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0px'
    renderer.domElement.style.left = '0px'
    document.body.appendChild( renderer.domElement );

    // Init for three.js
    var scene = new THREE.Scene();

    var camera = new THREE.Camera();
    scene.add(camera);

    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    // Handle arToolkitSource
    console.log("handle arToolkitSource...")
    var arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
        // resolution of at which we initialize in the source image
        sourceWidth: width,
        sourceHeight: height,
        // // resolution displayed for the source
        // // -> it works on a PC but not on a smartphone?
        // displayWidth: windowWidth,
        // displayHeight: windowHeight,
        // displayWidth: width,
        // displayHeight: height,
    })

    arToolkitSource.init(function onReady(){
        // Use a resize to fullscreen mobile devices
        console.log("use a resize to fullscreen mobile devices...");
        setTimeout(function() {
            onResize();
        }, 1000);
        //onResize();
    })

    // Handle resize
    window.addEventListener('resize', function(){
        onResize()
    })

    // Listener for end loading of NFT marker
    window.addEventListener('arjs-nft-loaded', function(ev){
        console.log("listener for end loading of NFT marker...");
    })

    function onResize(){
        console.log("onResize...")
        console.log("window-size:", windowWidth, windowHeight);
        console.log("window-inner-size:", window.innerWidth, window.innerHeight);

        // Update renderer size
        windowWidth  = window.innerWidth;
        windowHeight = window.innerHeight;
        console.log("window-size:", windowWidth, windowHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(windowWidth, windowHeight);
        // // Update camera aspect ratio
        // camera.aspect = windowWidth / windowHeight;
        // camera.updateProjectionMatrix();
        
        arToolkitSource.onResizeElement()
        arToolkitSource.copyElementSizeTo(renderer.domElement)
        if( arToolkitContext.arController !== null ){
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
        }
    }

    function toggleFullScreen(){
        console.log('make full screen...');

        var doc = window.document;
        var docEl = doc.documentElement;

        var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        } else {
            cancelFullScreen.call(doc);
        }
    }

    // Create atToolkitContext
    console.log("create atToolkitContext...")
    var arToolkitContext = new THREEx.ArToolkitContext({
        // the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
        detectionMode: 'mono',
        // resolution of at which we detect pose in the source image
        canvasWidth: width,
        canvasHeight: height,
        // // url of the camera parameters
        // cameraParametersUrl: '../resources/camera_para.dat',
    })

    // Initialize arToolkitContext
    console.log("initialize arToolkitContext...")
    arToolkitContext.init(function onCompleted(){
        // copy projection matrix to camera
        console.log("copy projection matrix to camera...")
        camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
    })

    // Create a ArMarkerControls

    // Set resource path
    let nftName = "ramen-1000px";
    //let nftUrl  = "../resources/nft/" + nftName; // for local test
    let nftUrl  = "https://followthedarkside.github.io/arjs-image-tracking-sample/resources/nft/" + nftName;
    //let nftUrl  = "https://arjs-cors-proxy.herokuapp.com/https://raw.githubusercontent.com/FollowTheDarkside/arjs-image-tracking-sample/resources/nft/" + nftName;
    //let nftUrl  = "https://arjs-cors-proxy.herokuapp.com/https://rawcdn.githack.com/FollowTheDarkside/arjs-image-tracking-sample/tree/master/resources/nft/" + nftName;

    // Init controls for camera
    let markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'nft',
        descriptorsUrl : nftUrl,
        changeMatrixMode: 'cameraTransformMatrix'
    })
    markerControls.addEventListener("markerFound", function(ev){
        console.log("markerFound...");
    })
    // // It seems that this event is not registered at least in AR.js ver 3.3.1
    // markerControls.addEventListener("markerLost", function(ev){
    //     console.log("markerLost...");
    // })

    scene.visible = false

    // Init display object
    let texture = new THREE.TextureLoader().load('../resources/Map-COL.jpg');
    let model = null;
    const loader = new THREE.GLTFLoader();
    loader.load(
        // resource URL
        "../resources/LeePerrySmith.glb",
        // called when the resource is loaded
        function ( gltf ){
            model = gltf.scene;
            model.name = "model-face";

            setObjectPosition();
            setObjectScale();
            setObjectRotation();

            // Set texture and
            gltf.scene.traverse( function ( child ) {
                if ( child.isMesh ) {
                    console.log("isMesh...");
                    child.material.map = texture;
                }
            });

            scene.add( model );
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has error
        function ( error ) {
            console.log('An error happened');
            console.log(error);
        }
    );

    // Init GUI by dat.gui
    console.log("init gui...")
    var guiCtrl = function(){
        this.posX = 0;
        this.posY = 0;
        this.posZ = 0;
        this.scaleX = 100;
        this.scaleY = 100;
        this.scaleZ = 100;
        this.rotateX = 0;
        this.rotateY = 0;
        this.rotateZ = 0;
        // this.reset = function(){
        //     console.log("reset object...");
        //     // model.position.set(0, 0, 0);
        //     // model.scale.set(100, 100, 1);
        //     // model.rotation.set(0, 0, 0);
        // };
        this.resize = function(){
            onResize()
        };
    };
    
    gui = new dat.GUI();
    guiObj = new guiCtrl();
    var folder = gui.addFolder('Folder');
    folder.add( guiObj, 'posX', -500, 500 ).onChange(setObjectPosition);
    folder.add( guiObj, 'posY', -500, 500 ).onChange(setObjectPosition);
    folder.add( guiObj, 'posZ', -500, 500 ).onChange(setObjectPosition);
    folder.add( guiObj, 'scaleX', 0, 500 ).onChange(setObjectScale);
    folder.add( guiObj, 'scaleY', 0, 500 ).onChange(setObjectScale);
    folder.add( guiObj, 'scaleZ', 0, 500 ).onChange(setObjectScale);
    folder.add( guiObj, 'rotateX', 0, 2*Math.PI ).onChange(setObjectRotation);
    folder.add( guiObj, 'rotateY', 0, 2*Math.PI ).onChange(setObjectRotation);
    folder.add( guiObj, 'rotateZ', 0, 2*Math.PI ).onChange(setObjectRotation);
    // folder.add( guiObj, 'reset' );
    folder.add( guiObj, 'resize' );
    folder.open();

    function setObjectPosition(){
        model.position.set(guiObj.posX, guiObj.posY, guiObj.posZ);
    }
    function setObjectScale(){
        model.scale.set(guiObj.scaleX, guiObj.scaleY, guiObj.scaleZ);
    }
    function setObjectRotation(){
        model.rotation.set(guiObj.rotateX, guiObj.rotateY, guiObj.rotateZ);
    }

    // for render
    var animate = function() {
        requestAnimationFrame(animate);

        if (!arToolkitSource.ready) {
            return;
        }

        arToolkitContext.update( arToolkitSource.domElement )

        // update scene.visible if the marker is seen
        scene.visible = camera.visible;

        renderer.render(scene, camera);
    };

    requestAnimationFrame(animate);
}
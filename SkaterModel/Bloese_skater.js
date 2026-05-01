/*
    Author: Andrew Bloese - abloese@asu.edu
    Description: 
    This is the main entry point of the WebGL application. 
    It handles:
    - initialization of canvas 
    - the initialization of the WebGL rendering context, 
    - uses helper functions to setup the hierarchical model 
    - sets up a perspective camera , and uses an instance matrix so that
      each model is just a transformation of a prototype cube. 
    - initializes all html inputs and begins listening to changes 
        - sliders for scale 
        - play/stop button and reset animation button 
    - When animation is on, the figure pushes his skateboard in a circle, 
      with each joint in the model rotating or translating in some way 
      during the animation cycle. 
    - A circular path is calculated and the root node is translated 
      along it over time (frames). 
*/


/**@type {HTMLCanvasElement|null}*/ let canvas;
/**@type {WebGLRenderingContext|undefined}*/ let gl;
/**@type {WebGLProgram} */ let program; 


//animation state... 

const animation = { 
    on: false,
    frame: 20
}

let followCam = FOLLOW_CAM_ORBIT;


// == uniform locations and values for matrices == \\ 
/**@type {WebGLUniformLocation} */ let u_instanceMatrix;
let instanceMatrix; 

/**@type {WebGLUniformLocation} */ let u_projectionMatrix; 
let projectionMatrix;


/**@type {WebGLUniformLocation} */ let u_modelViewMatrix; 
let modelViewMatrix; 


/* == location and buffer of vertex attribute buffers == *\
/**@type {WebGLBuffer}*/ let vPositionBuffer; 
/**@type {number} */ let vPosition;

/**@type {WebGLBuffer} */ let vNormalBuffer; 
/**@type {number} */ let vNormal;


/**@type {WebGLBuffer} */ let vTexCoordBuffer; 
/**@type {number} */ let vTexCoord;

/* == extra uniform values / locations == */

/**@type {WebGLUniformLocation} */ let u_texture; 
let uTexture; 


/**@type {WebGLUniformLocation} */ let u_texture_active
let uTextureActive = 0; 

/**@type {WebGLUniformLocation} */ let u_tint_color; 
let uTintColor = vec4(0.5);


/**@type {WebGLUniformLocation} */ let u_is_material;
let uIsMaterial = 0; 


// PHONG uniforms (optional)

/**@type {WebGLUniformLocation} */ let u_ambient;
let uAmbient = [0,0,0]; 
/**@type {WebGLUniformLocation} */ let u_diffuse;
let uDiffuse = [0,0,0]; 
/**@type {WebGLUniformLocation} */ let u_specular;
let uSpecular = [0,0,0]; 

/**@type {WebGLUniformLocation} */ let u_shininess; 
let uShininess = 1;

/**@type {WebGLUniformLocation} */ let u_light_position;
let uLightPosition = [-15,15,0];



/* == end extra uniform values / locations == */

//the avatar model 
/**@type {MyAvatar}*/ let myAvatar

// the floor 
/**@type {SimpleObject3D} */ let floor
//obstacles
/**@type {SimpleObject3D[]} */ let obstacles = [] 



const lerp=(a,b,t=0.99)=> a*(1-t)+b*t

//viewer state 
const CAM_INITIAL_POSITION = vec3(-3,1,-10)
const viewer = { 
    position: vec3(-3,1,-10),
    lookAt: vec3(0,0,0),
    up: vec3(0,1,0),
}

//perespective config 
const perspective_params = { 
    fov: 75, 
    aspect: 1, 
    near: 0.1, 
    far: 100, 
}



const pathConfig = { 
    radius: 5,
    speed: 0.01, 
    amplitude: 2, 
}


class PathHelper { 
    constructor(radius = 4, speed = 0.01, amplitude=2){
        this.radius = radius;
        this.speed = speed
        this.amplitude = amplitude
    }
    getFigure8(t){
        const { radius:r,speed:s } = this
        const x = r*Math.sin(t*s)
        const z = r*Math.sin(t*s*2)/2
        return vec3(x,0,z)
    }
    getCircle(t){
        const { radius:r,speed:s } = this
        const x = -r*Math.sin(t*s)
        const z = -r*Math.cos(t*s)
        return vec3(x,0,z)
    }

}



//plan to add sliders for the different scales
const avatar_scale_state = structuredClone(DEFAULT_SCALES); 


//custom pathing helper for various paramteric paths
const pathHelper = new PathHelper(pathConfig.radius,pathConfig.speed,pathConfig.amplitude);


// == setup helpers == 
/**
 * @param {WebGLRenderingContext} gl 
 */
function config_gl(gl){
    const w = canvas ? canvas.width : CANVAS_WIDTH;
    const h = canvas ? canvas.height : CANVAS_HEIGHT;
    //set viewport
    gl.viewport( 0 , 0 , w , h );

    INFO("config_gl",`gl viewport set to: ( 0 , 0 , ${w}, ${h})`)

    
    //config clear color
    gl.clearColor(...GL_CLEAR_COLOR);
    INFO("config_gl",`gl clear color set to: ( ${GL_CLEAR_COLOR.join(" , ")} )`)
    // enable depth test
    gl.enable(gl.DEPTH_TEST);
    INFO("config_gl", "Enabled depth test")
}


function compile_shaders(){
    const p = initShaders(gl,"vertex-shader","fragment-shader");
    if(!p){
        ERROR("compile_shaders", ERR_SHADER_PROGRAM);
        throw new Error(ERR_SHADER_PROGRAM);
    }
    return p;
}


function initialize_webgl(){

    //init canvas
    canvas = document.querySelector("#glCanvas");
    if(!canvas){
        ERROR("initialize_webgl", ERR_NO_CANVAS);
        throw new Error(ERR_NO_CANVAS);
    }
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;


    //init gl 
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) {
        ERROR("initialize_webgl", ERR_NO_GL);
        throw new Error(ERR_NO_GL);
    }
    
    //gl config 
    config_gl(gl);

    //compile shaders
    program = compile_shaders(); 
    gl.useProgram(program)
    INFO("initialize_webgl", MSG_INIT_SUCCESS )

    
}

// == end setup helpers ==

// == uniform setter helpers == 
// these simply send the current values in projectionMatrix and modelViewMatrix 
// to the GPU via their respective uniforms. 
function updateProjectionMatrix(){
    if(!projectionMatrix || !u_projectionMatrix){
        WARN("updateProjectionMatrix", "Either 'projectionMatrix' or 'u_projectionMatrix' or both were missing, aborting.");
        return;
    }

    gl.uniformMatrix4fv(u_projectionMatrix,false,flatten(projectionMatrix));
}

function updateModelViewMatrix(){
    if(!modelViewMatrix || !u_modelViewMatrix){
        WARN("updateModelViewMatrix", "Either 'modelViewMatrix' or 'u_modelViewMatrix' or both were missing, aborting");
        return
    }
    gl.uniformMatrix4fv(u_modelViewMatrix, false, flatten(modelViewMatrix));
}

function updateInstanceMatrix(){
    if(!instanceMatrix || !u_instanceMatrix){
        WARN("updateInstanceMatrix", "Either 'instanceMatrix' or 'u_instanceMatrix' or both were missing, aborting");
        return
    }
    gl.uniformMatrix4fv(u_instanceMatrix, false, instanceMatrix);
}

//== end uniform setter helpers == 



function main(){
    //do webgl init steps 
    try {
        initialize_webgl()
    } catch (error) {
        return ERROR("main",error instanceof Error ? error.message : `${error}`)
    }
    //webgl is all set up
    
    //create a "prototype" for cube instances using unit cube
    const instance_vertices = makePrototypeCube()
    
    //create buffer to hold prototype cube's points
    vPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(instance_vertices),gl.STATIC_DRAW);
    vPosition = gl.getAttribLocation(program,"vPosition"); 
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    INFO("main","Created buffer and uploaded data for vPosition attribute");


    
    //create a buffer to holde the normals for cube faces
    vNormalBuffer = gl.createBuffer();
    const cubeNormals = generateCubeNormals();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(cubeNormals),gl.STATIC_DRAW);
    vNormal = gl.getAttribLocation(program,"vNormal");
    gl.vertexAttribPointer(vNormal,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vNormal);
    INFO("main","Created buffer and uploaded data for vNormal attribute");

    
    //create a buffer to hold the texCoords for cube faces
    vTexCoordBuffer = gl.createBuffer()
    const cubeTexCoords = generateCubeTexCoords(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeTexCoords),gl.STATIC_DRAW)
    vTexCoord = gl.getAttribLocation(program,"vTexCoord");
    gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vTexCoord);

    INFO("main","Created buffer and uploaded data for vTexCoord attribute")


    // == setup uniforms for matrices == \\
    //1. model view matrix 
    modelViewMatrix = lookAt(viewer.position,viewer.lookAt,viewer.up);
    INFO("main","Created modelViewMatrix using lookAt: ", modelViewMatrix);
    u_modelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix"); 
    gl.uniformMatrix4fv(u_modelViewMatrix, false, flatten(modelViewMatrix));
    INFO("main","Got uniform location for u_modelViewMatrix and uploaded initial data");


    //2. projection (using perspective helper)
    const { fov, aspect, near, far} = perspective_params;
    projectionMatrix = perspective( fov, aspect, near, far);
    INFO("main", "Created projectionMatrix using perspective: ", projectionMatrix);
    u_projectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");
    gl.uniformMatrix4fv(u_projectionMatrix,false,flatten(projectionMatrix));
    INFO("main","Got uniform location for u_projectionMatrix and uploaded initial data");

    //3. instance - identity matrix to start... 
    instanceMatrix = mat4(); 
    INFO("main", "Created initial instanceMatrix (identity)", instanceMatrix); 
    u_instanceMatrix = gl.getUniformLocation(program, "u_instanceMatrix");
    gl.uniformMatrix4fv(u_instanceMatrix, false, flatten(instanceMatrix));
    INFO("main","Got uniform location for u_instanceMatrix, and uploaded initial data");


    // == setup uniforms for texture / tint \\ 
    /**@type {WebGLRenderingContext} */
    let _gl = gl
    //1. flag for if texture in use
    u_texture_active = gl.getUniformLocation(program,"u_texture_active"); 
    uTextureActive = 0;
    gl.uniform1i( u_texture_active, uTextureActive);
    INFO("main", "Got uniform location for u_texture_active and it is set to: ", uTextureActive == 1 ? "ON" : "OFF")



    u_texture = gl.getUniformLocation(program,"u_texture")
    INFO("main","Got uniform location for u_texture")
    
    u_tint_color = gl.getUniformLocation(program,"u_tint_color");
    INFO("main","Got uniform location for u_tint_color")
    gl.uniform4fv(u_tint_color,uTintColor);
    INFO("main","uploaded data for tint color: ", uTintColor);



    // material uniforms 

    u_is_material = gl.getUniformLocation(program,"u_is_material"); 
    INFO("main","Created uniform for 'is material' flag")
    gl.uniform1i(u_is_material,uIsMaterial)
    INFO("main","set 'u_is_material' to ", uIsMaterial)

    u_ambient = gl.getUniformLocation(program, "u_ambient");
    u_specular = gl.getUniformLocation(program,"u_specular");
    u_diffuse = gl.getUniformLocation(program,"u_diffuse");
    u_shininess = gl.getUniformLocation(program,"u_shininess");
    INFO("main","created uniforms for phong material shading u_(ambient,diffuse,specular,shininess)")


    gl.uniform3fv(u_ambient,uAmbient);
    gl.uniform3fv(u_diffuse, uDiffuse);
    gl.uniform3fv(u_specular,uSpecular);
    _gl.uniform1f(u_shininess,uShininess);

    INFO("main", "set initial uniforms for phong shading", )

    u_light_position = gl.getUniformLocation(program,"u_light_position")
    
    _gl.uniform3fv(u_light_position,uLightPosition);

    const ulocations = {
        u_projectionMatrix,
        u_modelViewMatrix,
        u_instanceMatrix,
        u_texture_active,
        u_texture,
        u_tint_color,
        u_is_material, 
        u_ambient,
        u_specular,
        u_diffuse,
        u_shininess,
    }
    //create the avatar
    myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,ulocations)


    floor = makeFloor(gl,ulocations)

    obstacles = makeBlocks(gl,ulocations)
    INFO("main","Made a floor", floor)






    //start frames 

    let ORBIT_FRAMES = 300
    let orbit_radius = 10.5
    //temporary orbit helper so i can look around the model...
    function getCameraOrbitPosition(t){
        
        const x = orbit_radius* Math.cos(t/ORBIT_FRAMES)
        const z = orbit_radius* Math.sin(t/ORBIT_FRAMES)
        


        viewer.position[0] = lerp(viewer.position[0],x)
        viewer.position[1] = 1
        viewer.position[2] = lerp(viewer.position[2],z)
        viewer.lookAt = [ 0 , 0 , 0 ]


    }


    let isPushing = true
    
    
    


    
    function render(){

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        // myAvatar.putArmsToSides(45*Math.abs(Math.cos(frame/10)))

        const frame = animation.frame; 
        if(animation.on){
            if(followCam == FOLLOW_CAM_ORBIT)
                getCameraOrbitPosition(frame);
            animation.frame++
            
        }

        const cycle = (frame / 15) % (2 * Math.PI);
        const cycle2 = (frame/30) % (2*Math.PI)
        
        if (isPushing) {

            

            //1. the pushing leg needs to swing
            const pushSwing = Math.sin(cycle) * 30; 
            myAvatar.upper_leg_r.setRotation(pushSwing, 0, 0);
            //2. Bend the pushing leg's knee
            const pushKneeBend = (pushSwing > 0) ? pushSwing * 1.5 : 10;
            myAvatar.lower_leg_r.setRotation(-pushKneeBend, 0, 0);


            //3. "crouch"
            const crouch = (Math.cos(cycle)*0.5+0.5)*0.1; 
            myAvatar.chest.setTranslation(0,-crouch,0)


            const crouchAngle = crouch*180
            const boardKneeAngle = -crouch* 360
            myAvatar.upper_leg_l.setRotation(crouchAngle,0,0)
            myAvatar.lower_leg_l.setRotation(boardKneeAngle,0,0)
            myAvatar.foot_l.setRotation(crouchAngle,0,0)

            const fwdLean = 7 - Math.sin(cycle) * 7; 
            
            myAvatar.chest.setRotation(-fwdLean,0,0)
            myAvatar.skateboard.setRotation(-fwdLean*0.1,0,0)
            myAvatar.torso.setRotation(fwdLean,0,0)

            

            myAvatar.upper_arm_l.setRotation(-pushSwing*0.5,0,-10)
            myAvatar.upper_arm_r.setRotation(pushSwing*0.5,0,10)

            myAvatar.lower_arm_l.setRotation(0,0,10)
            myAvatar.lower_arm_l.setRotation(
                0,
                50*(Math.cos(cycle2)*0.5+0.5),
                0,
            )
            myAvatar.lower_arm_r.setRotation(
                0,
                -50*(Math.sin(cycle2)*0.5+0.5),
                0,
            )
            
            
            
        }

        //head look left to right slowly
        const lcycle = (frame/60) % (2*Math.PI)
        myAvatar.head.setRotation(0,25*Math.cos(lcycle),0)

        //spin wheels 
        const wheelCycle = (frame/5) % (2*Math.PI);
        const wR = Math.abs(Math.sin(wheelCycle) * 360);
    

        [myAvatar.wheel_bl,myAvatar.wheel_fl]
        .forEach(lw=>lw.setRotation(wR,0,0));
        [myAvatar.wheel_br,myAvatar.wheel_fr]
        .forEach(lw=>lw.setRotation(wR,0,0));


        //movement here 
        const current = pathHelper.getCircle(frame)
        const next = pathHelper.getCircle(frame+5)
        const dir = subtract(next,current);
        const[dx,_,dz] = dir
        const angleRadians = Math.atan2(dx,dz);
        const angleDegrees = 360-angleRadians*(180/Math.PI)

        myAvatar.avatar.setTranslation(...current);
        myAvatar.avatar.setRotation(0,angleDegrees,0);

        
        if(followCam == FOLLOW_CAM_OFF){
            viewer.position = [...CAM_INITIAL_POSITION]
            viewer.lookAt = [ 0, 0 , 0 ]    
        }

        
        if(followCam == FOLLOW_CAM_FRONT) { 


            const cameraX = 3*Math.sin(angleRadians)+current[0]
            const cameraZ = 3*Math.cos(angleRadians)+current[2]
            viewer.position = [cameraX,1,cameraZ]
            viewer.lookAt = [...next]

        }

        if(followCam == FOLLOW_CAM_BACK){
            const offset = Math.PI

            const cameraX = 3*Math.sin(offset+angleRadians)+current[0]*1.5
            const cameraZ = 3*Math.cos(offset+angleRadians)+current[2]*1.5
            viewer.position = [cameraX,1,cameraZ]
            viewer.lookAt = [...next]
        }


        let v = lookAt(viewer.position, viewer.lookAt, viewer.up);



        floor.mvm = v;
        for(const obs of obstacles) obs.mvm = v
        myAvatar.mvm = v
        myAvatar.traverse(myAvatar.avatar);
        floor.render()

        for(const o of obstacles){
            o.render()
        }



        requestAnimationFrame(render)
    }
   
    UIInit()
    render()



}



function UIInit(){


    // camera mode select 

    const orbitBtn = document.querySelector("#orbitBtn");
    const followFrontBtn = document.querySelector("#followFrontBtn");
    const followBackBtn = document.querySelector("#followBackBtn");
    const fixedCamBtn = document.querySelector("#fixedCamBtn");

    const mode_buttons = [
        orbitBtn,followBackBtn,followFrontBtn,fixedCamBtn
    ]


    orbitBtn.addEventListener("click",()=>{
        followCam = FOLLOW_CAM_ORBIT
        for(const btn of mode_buttons){
            btn.classList.remove("enabled")
        }
        orbitBtn.classList.add("enabled")

    })
    followBackBtn.addEventListener("click",()=>{
        followCam = FOLLOW_CAM_BACK
        for(const btn of mode_buttons){
            btn.classList.remove("enabled")
        }
        followBackBtn.classList.add("enabled")

    })
    followFrontBtn.addEventListener("click",()=>{
        followCam = FOLLOW_CAM_FRONT
        for(const btn of mode_buttons){
            btn.classList.remove("enabled")
        }
        followFrontBtn.classList.add("enabled")

    })
    fixedCamBtn.addEventListener("click",()=>{
        followCam = FOLLOW_CAM_OFF;
        for(const btn of mode_buttons){
            btn.classList.remove("enabled")
        }
        fixedCamBtn.classList.add("enabled")
    })



    const toggleBtn = document.querySelector("#toggleAnimationButton");
    toggleBtn.addEventListener("click",()=>{
        animation.on = !animation.on
        toggleBtn.textContent = animation.on
            ? "Stop animation"
            : "Play animation";
    })

    const resetBtn = document.querySelector("#resetAnimationButton"); 
    resetBtn?.addEventListener("click",()=>{
        animation.frame = 0 
        viewer.position = [...CAM_INITIAL_POSITION]
        myAvatar.avatar.setTranslation(0,0,0)

    })

    const torso_slider = document.querySelector("#torso_size")

    torso_slider.addEventListener("change",(e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
                avatar_scale_state.torso = [ 0.68, 0.6, 0.32]
                break

            case 1: 
                avatar_scale_state.torso = [ ...DEFAULT_SCALES.torso]
                break
            case 2: 
                avatar_scale_state.torso = [ 0.7,0.6,0.44]
                break
            case 3: 
                avatar_scale_state.torso = [ 0.7,0.6,0.44]
                break
            case 4: 
                avatar_scale_state.torso = [ 0.72,0.6,0.5]
                break
        }

        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })



    })
    
    const chest_slider = document.querySelector("#chest_size")
    chest_slider.addEventListener("change",(e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
                avatar_scale_state.chest = [ 0.7, 0.35, 0.32]
                break

            case 1: 
                avatar_scale_state.chest = [ ...DEFAULT_SCALES.chest]
                break
            case 2: 
                avatar_scale_state.chest = [ 0.72,0.35,0.45]
                break
            case 3: 
                avatar_scale_state.chest = [ 0.73,0.35,0.46]
                break
            case 4: 
                avatar_scale_state.chest = [ 0.74,0.35,0.5 ]
                break
        }

        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })



    })


    const arm_slider = document.querySelector("#arm_size")
    arm_slider.addEventListener("change",(e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
                avatar_scale_state.upper_arm = [0.5,0.15,0.15]
                avatar_scale_state.lower_arm = [0.4,0.13,0.13]
                break

            case 1: 
                avatar_scale_state.upper_arm = [ ...DEFAULT_SCALES.upper_arm]
                avatar_scale_state.lower_arm = [ ...DEFAULT_SCALES.upper_arm]
                break
            case 2:
                avatar_scale_state.upper_arm = [ 0.5,0.22,0.22]
                avatar_scale_state.lower_arm = [ 0.4,0.2,0.2]
                
                break
            case 3: 
                avatar_scale_state.upper_arm = [ 0.5,0.24,0.24]
                avatar_scale_state.lower_arm = [ 0.4,0.22,0.22]
            case 4: 
                avatar_scale_state.upper_arm = [ 0.5,0.26,0.26]
                avatar_scale_state.lower_arm = [ 0.4,0.24,0.24]
                break
        }

        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })



    })


    const leg_slider = document.querySelector("#leg_size")
    leg_slider.addEventListener("change",(e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
    
                avatar_scale_state.upper_leg = [0.2,0.5,0.2]
                avatar_scale_state.lower_leg = [0.16,0.4,0.16]
                break

            case 1: 
                avatar_scale_state.upper_leg = [ ...DEFAULT_SCALES.upper_leg]
                avatar_scale_state.lower_leg = [ ...DEFAULT_SCALES.lower_leg]
                break
            case 2:
                avatar_scale_state.upper_leg = [0.27,0.5,0.27]
                avatar_scale_state.lower_leg = [0.23,0.4,0.23]
                
                break
            case 3: 
                avatar_scale_state.upper_leg = [0.3,0.5,0.3]
                avatar_scale_state.lower_leg = [0.26,0.4,0.26]
                break;
            case 4: 
                avatar_scale_state.upper_leg = [0.33,0.5,0.33]
                avatar_scale_state.lower_leg = [0.25,0.4,0.25]
                break
        }

        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })



    })

    
    const beard_slider = document.querySelector("#beard_size")
    beard_slider.addEventListener("change", (e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
                avatar_scale_state.beard = [ 0, 0, 0 ]
                avatar_scale_state.sides = [ 0, 0, 0 ]
                break
            case 1: 
                avatar_scale_state.beard = [ ...DEFAULT_SCALES.beard]
                avatar_scale_state.sides = [ ...DEFAULT_SCALES.sides]
            

        }
        
        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })
    })
    const mustache_slider = document.querySelector("#mustache_size")
    mustache_slider.addEventListener("change", (e)=>{
        const N = Number(e.target.value); 
        switch(N){
            case 0: 
                avatar_scale_state.mustache = [ 0, 0, 0 ]
                break
            case 1: 
                avatar_scale_state.mustache = [ ...DEFAULT_SCALES.mustache]
                break

            case 2: 
                avatar_scale_state.mustache = [0.57, 0.12,0.17]
                break;
            
            case 3: 
                avatar_scale_state.mustache = [0.58, 0.14,0.18]
                break;
        }
        
        myAvatar = new MyAvatar(avatar_scale_state,modelViewMatrix,gl,{
            u_projectionMatrix,
            u_modelViewMatrix,
            u_instanceMatrix,
            u_texture_active,
            u_texture,
            u_tint_color,
        })
    })
}


//run main once all page content loads
document.addEventListener("DOMContentLoaded", main); 
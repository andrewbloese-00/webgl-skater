
/*
Andrew Bloese - CSE 470 - ASU Spring 2026
Description: 
In this file an H-model is implemented of a humanoid, and it follows 
the following tree structure. 


(avatar) **root**
    |
    |--> chest
    |       |--> upper_arm_l 
    |       |       |--> lower_arm_l 
    |       |
    |       |--> upper_arm_r
    |       |       |--> lower_arm_r
    |       |
    |       |--> head 
    |       |      |--> hair
    |       |      |--> facial_hair
    |       |              |--> beard
    |       |              |--> mustache
    |       |              |--> beard
    |       |
    |       |--> torso 
    |              |--> upper_leg_l 
    |              |        |--> lower_leg_l 
    |              |                |--> foot_l 
    |              |--> upper_leg_r 
    |                      |--> lower_leg_r
    |                            |--> foot_r
    | 
    |--> skateboard
           |--> wheel_fr
           |--> wheel_fl
           |--> wheel_br
           |--> wheel_bl

*/

/**
* @typedef {Object} TextureConfig
* @property {WebGLTexture?} base 
* @property {WebGLTexture?} top 
* @property {WebGLTexture?} bottom 
* @property {WebGLTexture?} front
* @property {WebGLTexture?} back
* @property {WebGLTexture?} left
* @property {WebGLTexture?} right
*/
/**
* @typedef {Object} TintConfig
* @property {number[]?} base 
* @property {number[]?} top 
* @property {number[]?} bottom 
* @property {number[]?} front
* @property {number[]?} back
* @property {number[]?} left
* @property {number[]?} right
*/


//helper for generating a list of per-face textures based on 1 or more images/textures
/**
 * 
 * @param {TextureConfig} textures 
 */
const EZ_Textures = (textures) => {
    INFO("EZ_Textures","Generating textures")
    const faceTextures = Array(6).fill(textures.base)
    for(const key in textures){
        if(key == "base") continue; 

        const idx = FACE_LOOKUP[key];
        faceTextures[idx] = textures[key];
    }
    return faceTextures
}


// helper for generating per face tinting of textures 
/**
 * 
 * @param {TintConfig} tints 
 * @returns 
 */
const EZ_Tints = (tints) => {
    INFO("EZ_Tints", "Generating tints");
    const faceTints = Array.from({length: 6}, () => [...tints.base]);
    for(const key in tints){
        if(key == "base") continue
        INFO("EZ_Tints","setting " + key + " to: ", tints[key])
        const idx = FACE_LOOKUP[key]
        faceTints[idx] = tints[key]
    }


    return faceTints
} 


//helper to shorthand setting up a new Model node

/**
* @typedef {Object} NodeConfig
* @property {number[]} translation
* @property {number[]} scale
* @property {number[]} rotation
* @property {number[]} pivot
* @property { WebGLTexture[] | null } texture 
* @property { {ambient:number[],specular:number[], diffuse: number[], shininess: number }| null } material 
* @property { number[][]} 
*/
/**
 * 
 * @param {number[]} Txyz 
 * @param {number[]} Sxyz 
 * @param {number[]} Rxyz 
 * @param {number[]} Pxyz 
 * @param {WebGLTexture[] | null } Tex 
 * @param {number[][] | null } Tint
 * @param {{ambient:number[],specular:number[], diffuse: number[], shininess: number }| null } Mat
 * @returns 
 */
const NodeConfig = (Txyz=[0,0,0],Sxyz=[1,1,1],Rxyz=[0,0,0],Pxyz=[0,0,0],Tex=null,Tint=null,Mat=null) =>({
    translation: Txyz,
    scale: Sxyz,
    rotation: Rxyz,
    pivot: Pxyz,
    texture: Tex,
    tint: Tint,
    material: Mat
})

//model default settings... 
const DEFAULT_BEARD_SCALE_Y = 0.25
const DEFAULT_SCALES = {
    head: [0.5,0.5,0.5],
    chest: [0.72,0.35,0.4],
    torso: [0.7,0.6,0.39],
    upper_arm: [ 0.5,0.2,0.2],
    lower_arm: [0.4,0.18,0.18],
    upper_leg: [0.25,0.5,0.25],
    lower_leg: [0.22,0.4,0.22],
    foot: [0.23,0.1,0.27],

    hair: [0.53,0.1,0.53],
    mustache: [0.55, 0.12, 0.16], 
    beard: [0.52, DEFAULT_BEARD_SCALE_Y, 0.2],   
    sides: [0.15, DEFAULT_BEARD_SCALE_Y, 0.15],
    
    skateboard: [0.5,0.1,1],
    wheels: [0.1,0.1,0.1],

}
const DEFAULT_TINT_SHIRT = [0,0.4,0,1];
const DEFAULT_TINT_HAIR = [0.45, 0.16, 0.16,1.0];
const DEFAULT_TINT_PANTS = [0.2,0.2,0.3,1.0];
const DEFAULT_TINT_SKIN = [1.0, 0.8, 0.6, 1.0]



//avatar class encapsulates h-model logic
class MyAvatar {
    /**
     * 
     * @param {number[][]} mvm 
     * @param {WebGLRenderingContext} glCtx 
     * @param {Record<string,WebGLUniformLocation>} uLocations 
     */
    constructor(s=DEFAULT_SCALES,mvm=mat4(),glCtx,uLocations){
        INFO("new MyAvatar", "Building model with specified scales",s)
        this.gl = glCtx;
        this.uLocations = uLocations;
        this.mvm = mvm;
        this.globalPosition = vec3(0,0,0);
        this.globalRotation = vec3(0,0,0);
        this.stack = []; //traversal "matrix stack"

        const hair = generateGrayscaleHairTexture(glCtx,512)
        const shirt =generateFlannelShirtTexture(glCtx,512)
        const pants = generatePantsUpperTexture(glCtx,16)
        const face =  generateFaceTexture(glCtx,512)
        const skin = generateSkinTexture(glCtx,512)
        this.textures = {
            hair: EZ_Textures({base:hair}),
            shirt: EZ_Textures({base:shirt}),
            pants_upper: EZ_Textures({base: pants}),
            pants_lower: EZ_Textures({base: pants}),
            head: EZ_Textures({
                base: hair,
                front: face
            }),
            skin: EZ_Textures({base: skin}),
            skateboard: EZ_Textures({base:generateSkateboardTexture(glCtx,256)}),
            wheel: EZ_Textures({base: generateWheelTexture(glCtx,4)}),
        } 
        this.tints = { 
            hair: EZ_Tints({base:DEFAULT_TINT_HAIR}),
            shirt: EZ_Tints({base:DEFAULT_TINT_SHIRT}),
            pants: EZ_Tints({base:DEFAULT_TINT_PANTS}),
            head: EZ_Tints({
                base: DEFAULT_TINT_HAIR,
                front: DEFAULT_TINT_SKIN
            }),
            skin: EZ_Tints({base: DEFAULT_TINT_SKIN}),
            skateboard: EZ_Tints({base: DEFAULT_TINT_HAIR}),
            wheel: EZ_Tints({base: [0,0,0,1]})

        }



        console.time("constructAvatar")

        // --- ROOT ---
        this.avatar = new AvatarNode("avatar",NodeConfig([0,0,0],[0,0,0]))


        this.chest = new AvatarNode("chest", NodeConfig([0, 0, 0], s.chest,[0,0,0],[0,0,0],this.textures.shirt,DEFAULT_TINT_SHIRT));

        // --- HEAD ---
        const headPos = 0.5 * (s.chest[1])
        

        this.head = new AvatarNode("head", NodeConfig(
            [0, headPos, 0], 
            s.head,
            [0, 0, 0], 
            [0, 0.5 * s.head[1], 0] ,
            this.textures.head,
            this.tints.head
        ));

        // --- TORSO ---
        const torsoPos = -0.4*(s.chest[1])
        const torsoPivotZ = s.torso[2] < s.chest[2]? 0 : 0.5*s.torso[2] - 0.5*s.chest[2]
        this.torso = new AvatarNode("torso", NodeConfig(
            [0, torsoPos, 0],
            s.torso,
            [0, 0, 0],
            [0, -0.5 * s.torso[1], torsoPivotZ],
            this.textures.shirt,
            this.tints.shirt
            
        )); 

        // --- ARMS ---
        //note: less contribution from upper arm so when rotating the shoulder doesnt look disconnected.
        const upperArmPosX = (s.chest[0]+s.upper_arm[0]*0.01) * 0.5;
        const upperArmPosY = 0.2*s.chest[1]

        // LEFT ARM
        this.upper_arm_l = new AvatarNode("upper_arm_l", NodeConfig(
            [upperArmPosX, upperArmPosY, 0],
            s.upper_arm,
            [0, 0, 0],
            [0.5 * s.upper_arm[0], 0, 0],
            this.textures.shirt,
            this.tints.shirt
        ));
        this.lower_arm_l = new AvatarNode("lower_arm_l", NodeConfig(
            [0.5*(s.upper_arm[0]+s.lower_arm[0]), 0, 0], // Move to the end of the upper arm
            s.lower_arm,
            [0, 0, 0],
            [0.5 * s.lower_arm[0], 0, 0],
            this.textures.skin,
            this.tints.skin
        ));

        // RIGHT ARM (Mirror)
        this.upper_arm_r = new AvatarNode("upper_arm_r", NodeConfig(
            [-upperArmPosX, upperArmPosY, 0],
            s.upper_arm,
            [0, 0, 0],
            [-0.5 * s.upper_arm[0], 0, 0] ,
            this.textures.shirt,
            this.tints.shirt

        ));
        this.lower_arm_r = new AvatarNode("lower_arm_r", NodeConfig(
            [-0.5*(s.upper_arm[0]+s.lower_arm[0]), 0, 0],
            s.lower_arm,
            [0, 0, 0],
            [-0.5 * s.lower_arm[0], 0, 0],
            this.textures.skin,
            this.tints.skin
        ));

        // --- LEGS --- 
        const legOffsetX = s.torso[0] * 0.3;
        const hipPosY = -0.5 * (s.torso[1] + s.upper_leg[1])

        const kneePosY = -0.5 *(s.upper_leg[1] + s.lower_leg[1])
        

        // LEFT LEG
        this.upper_leg_l = new AvatarNode("upper_leg_l", NodeConfig(
            [legOffsetX, hipPosY, 0],
            s.upper_leg,
            [0, 0, 0],
            [0, -0.5 * s.upper_leg[1], 0],
            this.textures.pants_upper,
            this.tints.pants
        ));
        this.lower_leg_l = new AvatarNode("lower_leg_l", NodeConfig(
            [0, kneePosY, 0],
            s.lower_leg,
            [0, 0, 0],
            [0, -0.5 * s.lower_leg[1], 0] ,
            this.textures.pants_upper,
            DEFAULT_TINT_PANTS
        ));

        const anklePosY = -s.lower_leg[1]
        const anklePivotZ = -0.5*(s.foot[2]-s.lower_leg[2])
        this.foot_l = new AvatarNode("foot_l", NodeConfig(
            [0,anklePosY,0],
            s.foot,
            [0,0,0],
            [0,-s.foot[1]/2,-anklePivotZ],
            this.textures.pants_lower,
            [0,0,0,1]
        ))

        // RIGHT LEG (Mirror)
        this.upper_leg_r = new AvatarNode("upper_leg_r", NodeConfig(
            [-legOffsetX, hipPosY, 0],
            s.upper_leg,
            [0, 0, 0],
            [0, -0.5 * s.upper_leg[1], 0],
            this.textures.pants_upper,
            DEFAULT_TINT_PANTS
        ));
        this.lower_leg_r = new AvatarNode("lower_leg_r", NodeConfig(
            [0, kneePosY, 0],
            s.lower_leg,
            [0, 0, 0],
            [0, -0.5 * s.lower_leg[1], 0],
            this.textures.pants_lower,
            DEFAULT_TINT_PANTS
        ));

        this.foot_r = new AvatarNode("foot_r", NodeConfig(
            [0,anklePosY,0],
            s.foot,
            [0,0,0],
            [0,-s.foot[1]/2,-anklePivotZ],
            this.textures.pants_lower,
            [0,0,0,1]
        ))


        // FACIAL HAIR CONTAINER NODE 
        this.facial_hair = new AvatarNode("facial_hair", NodeConfig(
            // Move UP from neck, FORWARD to "skin"
            [0,0.1*s.head[1],0.5*s.head[2]],
            [0,0,0], //anchor node has no scale
            [0,0,0], //no rotation
            [0,0,0] //no pivot for anchor
        ))

        // facial hair nodes
        this.mustache = new AvatarNode("mustache", NodeConfig(
            [0,0.25*s.head[1],0], //above the "mouth", centered
            s.mustache, 
            [0,0,0], //does not rotate... 
            [0,0,0], //does not pivot...,
            this.textures.hair,
            DEFAULT_TINT_HAIR,

        ))

        this.beard = new AvatarNode("beard", NodeConfig(
            [0,-0.4*s.beard[1],0],
            s.beard,
            [0,0,0],
            [0,0,0],
            this.textures.hair,
            DEFAULT_TINT_HAIR
        ))

        const sidesY = -0.2*s.beard[1]
        this.sideburn_l = new AvatarNode("sideburn_l", NodeConfig(
            [0.40*s.head[0],sidesY,0],
            s.sides,
            [0,0,0],
            [0,0,0],
            this.textures.hair,
            DEFAULT_TINT_HAIR
        ))

        this.sideburn_r = new AvatarNode("sideburn_r", NodeConfig(
            [-0.4*s.head[0],sidesY,0],
            s.sides,
            [0,0,0],
            [0,0,0],
            this.textures.hair,
            DEFAULT_TINT_HAIR
        ))

        this.hair = new AvatarNode("hair",NodeConfig(
            [0,s.head[1],0],
            s.hair,
            [2,3,2],
            [0,s.hair[1]*-0.2,0.01],
            this.textures.hair,
            this.tints.hair
        ))

        
        const skateboard_relativeY =-(s.torso[1] + s.lower_leg[1] + s.upper_leg[1]+s.foot[1]/2) - 0.5*s.chest[1]

        this.skateboard = new AvatarNode("skateboard",NodeConfig(
            [legOffsetX,skateboard_relativeY,-0.2],
            s.skateboard,
            [0,0,0],
            [0,0,0],
            this.textures.skateboard,
            this.tints.skateboard
        ))

        const wheelsY = (s.skateboard[1] +s.wheels[1])*0.5;
        const wheelX = s.skateboard[0]*0.4
        const wheelZ = s.skateboard[2]*0.35
        this.wheel_fl = new AvatarNode("wheel_fl", NodeConfig(
            [wheelX,-wheelsY,wheelZ],
            s.wheels,
            [0,0,0],
            [0,0,0],
            this.textures.wheel,
            this.tints.wheel
        ))
        this.wheel_bl = new AvatarNode("wheel_bl", NodeConfig(
            [wheelX,-wheelsY,-wheelZ],
            s.wheels,
            [0,0,0],
            [0,0,0],
            this.textures.wheel,
            this.tints.wheel
        ))
        this.wheel_fr = new AvatarNode("wheel_fr", NodeConfig(
            [-wheelX,-wheelsY,wheelZ],
            s.wheels,
            [0,0,0],
            [0,0,0],
            this.textures.wheel,
            this.tints.wheel
        ))
        this.wheel_br = new AvatarNode("wheel_br", NodeConfig(
            [-wheelX,-wheelsY,-wheelZ],
            s.wheels,
            [0,0,0],
            [0,0,0],
            this.textures.wheel,
            this.tints.wheel
        ))
            
        //build h-relationships
        /*
            CHEST
             |-> Head
                    |-> facial hair
                        |-> beard
                        |-> mustache
                        |-> sideburns
             |-> Upper Arm (Left)
             |-> Upper Arm (Right)
             |-> Torso
        */
        this.avatar.childPtr = this.chest
        this.chest.siblingPtr = this.skateboard
        this.chest.childPtr = this.head;
        this.head.siblingPtr = this.upper_arm_l;
        this.upper_arm_l.siblingPtr = this.upper_arm_r;
        this.upper_arm_r.siblingPtr = this.torso;


        /*
        UPPER_ARM_(L|R)
            .child = LOWER_ARM_(L|R)
        */

        this.upper_arm_l.childPtr = this.lower_arm_l;
        this.upper_arm_r.childPtr = this.lower_arm_r;

        /*
        TORSO
            .child = UPPER_LEG_(L|R)
                .child = LOWER_LEG_(L|R)
        */

        this.torso.childPtr = this.upper_leg_l;
        this.upper_leg_l.childPtr = this.lower_leg_l;
        
        //make sibling link from upper left to upper right leg
        this.upper_leg_l.siblingPtr = this.upper_leg_r;
        this.upper_leg_r.childPtr = this.lower_leg_r;
        this.lower_leg_l.childPtr = this.foot_l;
        this.lower_leg_r.childPtr = this.foot_r;


        /*
        Head
            .child = FacialHair
                .child = beard
                    .sibling = moustache
                        .sibling = sideburns
                
                .sibling = hair        
        */
       this.head.childPtr = this.facial_hair
       this.facial_hair.childPtr = this.mustache
       this.mustache.siblingPtr = this.beard
       this.beard.siblingPtr = this.sideburn_l
       this.sideburn_l.siblingPtr = this.sideburn_r
    
       this.facial_hair.siblingPtr = this.hair



       this.skateboard.childPtr = this.wheel_fl
       this.wheel_fl.siblingPtr = this.wheel_fr
       this.wheel_fr.siblingPtr = this.wheel_bl
       this.wheel_bl.siblingPtr = this.wheel_br
    
       console.timeEnd("constructAvatar")
    }

    putArmsToSides(angleDegress=10,left=true,right=true){
        if(left) this.upper_arm_l.setRotation(0,0,-angleDegress);
        if(right) this.upper_arm_r.setRotation(0,0,angleDegress);

    }

    //change body scale and adjust part positions accordingly
    updateBody(s=DEFAULT_SCALES){
        this.chest.setScale(...s.chest);
        this.head.setScale(...s.head);
        this.torso.setScale(...s.torso);
        this.upper_arm_l.setScale(s.upper_arm);
        this.upper_arm_r.setScale(s.upper_arm);
        
        const headPos = 0.5 * s.chest[1]; 

        this.head.setTranslation(0,headPos,0);

        
        const wheelsY = (s.skateboard[1] +s.wheels[1])*0.5;
        const wheelX = s.skateboard[0]*0.4
        const wheelZ = s.skateboard[2]*0.35




    }

    
    /**
     * @param {AvatarNode} node 
     * @returns 
     */
    traverse(node){

        if(!node) return;
        this.stack.push(this.mvm);
  
        //apply local transform to model view matrix
        this.mvm = mult(this.mvm,node.transform);
        this.gl.uniformMatrix4fv(this.uLocations.u_modelViewMatrix,false, flatten(this.mvm));

        //send scale to instance matrix 
        this.gl.uniformMatrix4fv(this.uLocations.u_instanceMatrix, false, flatten(node.instanceMatrix));


        const ignored = []
        const NO_TINT = [0.5,0.5,0.5,1];
        if(!ignored.includes(node)){

            //dont even bother drawing items with 0 scale
            if (!node.scale.some(s=>s==0)){

                for(let i = 0; i < 6; i++){
                    // determine the texture(s)
                    if(node.texture){
                        this.gl.activeTexture(this.gl.TEXTURE0);
                        this.gl.bindTexture(this.gl.TEXTURE_2D,node.texture[i])
                        this.gl.uniform1i(this.uLocations.u_texture, 0)
                        this.gl.uniform1i(this.uLocations.u_texture_active,1)
    
                        
                        if(node.tint != null && node.tint[i]){
                            this.gl.uniform4fv(this.uLocations.u_tint_color, node.tint[i]) 
                        } else { 
                            this.gl.uniform4fv(this.uLocations.u_tint_color, NO_TINT)
                        }
    
    
                    } else { 
                        this.gl.uniform1i(this.uLocations.u_texture_active,0)   
                    }
                    this.gl.drawArrays(this.gl.TRIANGLE_FAN,i*4,4);
                }

            }



        }

        //check for children
        if(node.childPtr != null) this.traverse(node.childPtr);

        //get local mvm back from stack, 
        this.mvm = this.stack.pop();

        //check for sibling(s)
        if(node.siblingPtr != null) this.traverse(node.siblingPtr)
    }
}



//individual node can to a child and sibling
class AvatarNode { 
    #createTransformMatrix(translateXYZ,rotationXYZ){
  
        const [rx,ry,rz] = rotationXYZ;
        const [tx,ty,tz] = translateXYZ;


        const T_pos = translate(tx,ty,tz); //relative to parent

        //construct rotation matrix... 
        const RX = rotateX(rx);
        const RY = rotateY(ry);
        const RZ = rotateZ(rz);
        const R = mult(RZ, mult(RY, RX));
        
        return mult(T_pos,R);
    }


    setScale(sx,sy,sz){
        this.scale[0] = sx;
        this.scale[1] = sy;
        this.scale[2] = sz;
        this.instanceMatrix = scalem(sx,sy,sz);
    }

    setPivot(px,py,pz){
        this.pivotXYZ[0] = px;
        this.pivotXYZ[1] = py;
        this.pivotXYZ[2] = pz;
        this.transform = this.#createTransformMatrix(this.translation,this.rotation);
        this.#updateInstanceMatrix()
    }
    setRotation(rx,ry,rz){
        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;
        this.transform = this.#createTransformMatrix(this.translation,this.rotation,this.pivotXYZ);
    }
    setTranslation(tx,ty,tz){
        this.translation[0] = tx;
        this.translation[1] = ty;
        this.translation[2] = tz;
        this.transform = this.#createTransformMatrix(this.translation,this.rotation,this.pivotXYZ);
    }



    /**
     * @param {string} id unique name of the node
     * @param {NodeConfig} config configuration for the node transformation matrix
     */
    constructor(id,config){
        this.id = id
        this.pivotXYZ = config.pivot,
        this.translation = config.translation
        this.scale = config.scale 
        this.rotation = config.rotation
        this.texture = config.texture
        this.material = config.material 

        if (config.tint && !Array.isArray(config.tint[0])) {
            this.tint = Array(6).fill(config.tint);
        } else {
            this.tint = config.tint;
        }
        //precompute scaling of instance matrix
        this.instanceMatrix = scalem(...config.scale);
        this.#updateInstanceMatrix()

        this.transform = this.#createTransformMatrix(
            config.translation,
            config.rotation,
        );

        /**@type {AvatarNode|null} */
        this.childPtr = null
       
        /**@type {AvatarNode | null} */
        this.siblingPtr = null
    }

    #updateInstanceMatrix(){
        const T_off = translate(...this.pivotXYZ);
        const S = scalem(...this.scale);
        this.instanceMatrix = mult(T_off,S)
    }

    getBoundingBox(){
        const half_s = this.scale.map(s => 0.5*s);
        //min 
        // size of prototype is 1 so translation - (0.5*scale)
        
        const min = half_s.map((hs,i)=>this.translation[i]-hs);
        //max 
        // size of prototype is 1 so translation + (0.5*scale)
        const max = half_s.map((hs,i)=>this.translation[i]+hs);
        return {min,max}

    }
}


//a single object to be rendered, such as the floor and obstacles 
class SimpleObject3D { 
    constructor(config,gl,uLocations){
        this.gl = gl
        this.uLocations = uLocations; 
        this.mvm = mat4(); 
        this.stack = [] 
        this.root = new AvatarNode("root",config)
    }

    render(){
        this._traverse(this.root)

    }
    _traverse(node){
        if(!node) return
        this.stack.push(this.mvm); 
        this.mvm = mult(this.mvm, node.transform);
        this.gl.uniformMatrix4fv(this.uLocations.u_modelViewMatrix, false, flatten(this.mvm));
        this.gl.uniformMatrix4fv(this.uLocations.u_instanceMatrix, false, flatten(node.instanceMatrix));

        for(let i = 0; i < 6; i++) {

            //objects can have texture
            if(node.texture != null){
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, node.texture[i]);
                this.gl.uniform1i(this.uLocations.u_texture, 0);
                this.gl.uniform1i(this.uLocations.u_is_material, 0);
                this.gl.uniform1i(this.uLocations.u_texture_active, 1);
                this.gl.uniform4fv(this.uLocations.u_tint_color, node.tint[i] || [0.5,0.5,0.5,1]);
            }
            //or objects can have material 
            else if(node.material != null){
                this.gl.uniform1i(this.uLocations.u_texture_active, 0);
                this.gl.uniform1i(this.uLocations.u_is_material, 1);
                this.gl.uniform3fv(this.uLocations.u_ambient, node.material.ambient || [1.0,0,0]);
                this.gl.uniform3fv(this.uLocations.u_specular, node.material.specular || [0.5,0.5,0.5]);
                this.gl.uniform3fv(this.uLocations.u_diffuse, node.material.diffuse || [0.7,0,0]);

            } //if no material or texture, use debug texture (mix(uv,normal,0.5)) 
    
            else { 
                this.gl.uniform1i(this.uLocations.u_texture_active, 0)
                this.gl.uniform1i(this.uLocations.u_is_material, 0)
            }

            // Draw a cube instance
            this.gl.drawArrays(this.gl.TRIANGLE_FAN, i * 4, 4);
        }
        this.mvm = this.stack.pop();

    }
    
}


//generates a floor using the hair texture (looks sorta like sidewalk when its stretched out)

function makeFloor(gl,uLocations){
    // Grab a reference to a cached texture or generate a new one
    const floorTex = generateGrayscaleHairTexture(gl, 512);

    const floorTextureArray = EZ_Textures({ base: floorTex });
    const floorTintArray = EZ_Tints({ base: [0.8, 0.8, 0.8, 1.0] });

    const floorMaterial = {
        ambient: [0.7,0.7,0.7],
        diffuse: [0.6,0.5,0.5],
        specular: [1.0,1.0,1.0], 
        shininess: 1
    }
    
    const s = DEFAULT_SCALES
    const floorY = s.head[1] + s.chest[1] + s.torso[1] + s.lower_leg[1] + s.upper_leg[1] + s.foot[1] + s.skateboard[1] + s.wheels[1]
    const floor = new SimpleObject3D( NodeConfig(
        [15,-floorY,10],
        [100,0.1,100],[0,0,0],[0,0,0],
        floorTextureArray,
        floorTintArray,
        floorMaterial
    ), gl,uLocations)
    return floor

}


//generates the phong shaded "obstacles" on the floor. 

function makeBlocks(gl,uLocations){
    const redMaterial = {
        ambient: [1.0,0,0],
        diffuse: [0.7,0,0],
        specular: [0.5,0.5,0.5],
        shininess: 32
    }
    const greenMaterial = {
        ambient: [0,1.0,0],
        diffuse: [0,0.7,0],
        specular: [0.5,0.5,0.5],
        shininess: 1
    }
    const blueMaterial = {
        ambient: [0,0,1.0],
        diffuse: [0,0,0.7],
        specular: [0.5,0.5,0.5],
        shininess: 250
    }

    const magentaMaterial = { 
        ambient: [ 0.7, 0, 0.4],
        diffuse: [ 0.4,0,0.7],
        specular: [ 1, 1, 1 ],
        shininess: 1
    }


    //floor offset
    //the model's height scale cannot be modified so DEFAULT scales work fine for this calculation 
    const s = DEFAULT_SCALES
    const floorY = s.head[1] + s.chest[1] + s.torso[1] + s.lower_leg[1] + s.upper_leg[1] + s.foot[1] + s.skateboard[1] + s.wheels[1]

    // red block, no texture, uses custom material 
    const block1 = new SimpleObject3D(NodeConfig(
        [0,-floorY+0.5,0],
        [1,1,1],
        [0,0,0],
        [0,0,0],
        null,
        null,
        redMaterial
        
    ),gl,uLocations)

    //green block, no texture, custom material
    const block2 = new SimpleObject3D(NodeConfig(
        [-15,-floorY+0.5,0],
        [2,1,6],
        [0,0,0],
        [0,0,0],
        null,
        null,
        greenMaterial
    ),gl,uLocations)

    //blue block, no texture, custom material
    const block3 = new SimpleObject3D(NodeConfig(
        [15,-floorY+1,0],
        [2,floorY,2],
        [0,0,0],
        [0,0,0],
        null,
        null,
        blueMaterial
    ),gl,uLocations)

    //debug block, no texture, no material 

    const block4 = new SimpleObject3D(NodeConfig(
        [0,-floorY+1, 15],
        [2,10,2],
        [0,0,0],
        [0,0,0],
        null,
        null,
        null
    ),gl,uLocations)

    const block5 = new SimpleObject3D(NodeConfig(
        [0,-floorY+1, -15],
        [10,10,2],
        [0,0,0],
        [0,0,0],
        null,
        null,
        magentaMaterial
    ),gl,uLocations)

    


    INFO("makeBlocks",`Created 5 blocks`, [block1,block2,block3,block4,block5])

    return [block1,block2,block3,block4,block5]
    

}
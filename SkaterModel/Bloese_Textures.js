/*
Andrew Bloese - CSE 470 - ASU Spring 2026
- Misc generation functions for the various textures I use in the model. 
- Greyscale patterns support a "tint" for easy customizations
*/


const textures = {} 
//alpha is 1 (as u8 0...256 -> 256 )
const MAX = 255;

//generate a base texture for "hair" 
/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function generateGrayscaleHairTexture(gl,size=512){

    if(textures["hair"]){
        return textures["hair"]
    }

    // (size * size pixels) * 4 channels (RGBA)
    const nBytes = size*size*4; 

    // fill medium gray (as u8 0...256 -> 128)
    const MEDIUM_GRAY = 128;
    

    const MAX_VARIANCE = 20
    const STRIPES = 32;

    //init pixel buffer for texture
    const pixels = new Uint8Array(nBytes); 
    const shades = new Uint8Array(STRIPES);
    for(let x = 0; x < STRIPES; x++){
        const varInt = Math.floor(Math.random()*MAX_VARIANCE)
        const varSign = Math.random() > 0.5 ? 1 : -1
        shades[x] = MEDIUM_GRAY + (varInt*varSign);
        
    }

    const width = (size/STRIPES)

    for(let y = 0; y < size; y++){
        for(let x = 0; x < size; x++){
            const r = (x+y*size)*4;
            const g = r+1;
            const b = r+2;
            const a = r+3;

            const stripeIdx = Math.floor(x/width)

            
            const P_COLOR = shades[stripeIdx];
            pixels[r] = P_COLOR
            pixels[g] = P_COLOR
            pixels[b] = P_COLOR
            pixels[a] = MAX
        }
    }


    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        size,size, 0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["hair"] = texture
    return texture;
}


function generateFlannelShirtTexture(gl,size=512){
    if(textures["flannel_main"]){
        return textures["flannel_main"]
    }

    const bytes = size*size*4; 
    const pixels = new Uint8Array(bytes); 

    const gridSize = 64
    const thickStripeWidth = 30
    const thinStripeStart = 20 
    const thinStripeWidth = 20


    for(let y = 0; y < size; y++){
        for(let x = 0; x < size; x++){
            const lx = x %gridSize
            const ly = y % gridSize

            const isVert = ((lx < thickStripeWidth) || (lx > thinStripeStart && lx < thinStripeStart+thinStripeWidth))
            const isHoriz = (ly < thickStripeWidth) || (ly > thinStripeStart && ly < thinStripeStart+thinStripeWidth)
            let shade = 220; 

            if(isVert || isHoriz){
                shade = 140
                if(isVert && isHoriz) shade = 80
            }

            const r = (x+y*size)*4; 
            pixels[r] = shade
            pixels[r+1] = shade
            pixels[r+2] = shade
            pixels[r+3] = 255

        }   
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["flannel_main"] = texture;
    return texture;



}

function generatePantsUpperTexture(gl,size=512){
    if(textures["pants_upper"]) return textures["pants_upper"]; 

    const bytes = size*size*4
    const pixels = new Uint8Array(bytes); 


    for(let y = 0; y < size; y++){
        for(let x = 0; x < size; x++){
            const r= x+size*y*4
            pixels[r] = 0.5//*MAX
            pixels[r+1] = 0.5//*MAX
            pixels[r+2] = 0.5//*MAX
            pixels[r+3] = 1//*MAX
        }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["pants_upper"] = texture;
    return texture;
}
function generatePantsLowerTexture(gl,size=512){
    if(textures["pants_lower"]) return textures["pants_lower"]; 

    const bytes = size*size*4
    const pixels = new Uint8Array(bytes); 



    for(let y = 0; y < size; y++){
        const intensity = y < Infinity ? 0 : 0.5
        for(let x = 0; x < size; x++){
            const r= x+size*y*4
            pixels[r] = intensity
            pixels[r+1] = intensity
            pixels[r+2] = intensity
            pixels[r+3] = 1
        }
    }


    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["pants_lower"] = texture;
    return texture;
}

function generateSkinTexture(gl,size=512){
    if(textures["skin"]) return textures["skin"]

    const bytes = size*size*4
    const pixels = new Uint8Array(bytes); 



    for(let y = 0; y < size; y++){

        for(let x = 0; x < size; x++){
            const r= x+size*y*4
            pixels[r] = 0.55
            pixels[r+1] = 0.55
            pixels[r+2] = 0.55
            pixels[r+3] = 1
        }
    }


    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["skin"] = texture;
    return texture;



}


function generateFaceTexture(gl,size=512){

    if(textures["face"]) return textures["face"]
    const bytes = size*size*4
    const pixels = new Uint8Array(bytes)
    
    const EYE_SIZE = Math.floor(size * 0.12);
    const EYE_Y = Math.floor(size*0.55);

    const leftEyeX = Math.floor(size*0.2);
    const rightEyeX = Math.floor(size*0.8)-EYE_SIZE*1.5;

    const mouthY = Math.floor(size*0.18)
    const mouthHeight = Math.floor(size*0.05);
    const mouthLeft = Math.floor(size*0.35);
    const mouthRight = Math.floor(size*.65);

    for(let _y = 0; _y < size; _y++){
        let y = size - _y;
        for(let x = 0; x < size;x++){
            let shade = 220

            // Left eye
            if(x >= leftEyeX && x <=leftEyeX + 1.5*EYE_SIZE && y >= EYE_Y && y <= EYE_Y+EYE_SIZE){
                shade = 10
            }
            //right eye
            else if(x >= rightEyeX && x <= rightEyeX + 1.5*EYE_SIZE && y >= EYE_Y && y <= EYE_Y+EYE_SIZE){
                shade = 20
            }
            //mouth
            else if(x >= mouthLeft && x<= mouthRight && y >= mouthY && y <= mouthY + mouthHeight)
                shade= 80

            const r = (x+_y*size)*4
            pixels[r] = shade
            pixels[r+1] = shade
            pixels[r+2] = shade
            pixels[r+3] = 255

        }
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the eyes and mouth perfectly crisp and square
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["face"] = texture;
    return texture;
}

function generateWheelTexture(gl,size=512){
     if(textures["wheel"]) return textures["wheel"]


    const bytes = size*size*4
    const pixels = new Uint8Array(bytes); 



    for(let y = 0; y < size; y++){

        for(let x = 0; x < size; x++){
            const r= x+size*y*4
            pixels[r] = 0.0
            pixels[r+1] = 0.0
            pixels[r+2] = 0.0
            pixels[r+3] = 1
        }
    }


    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["wheel"] = texture;
    return texture;

}

function generateSkateboardTexture(gl,size=512){
    if(textures["skateboard"]) return textures["skateboard"]


    const bytes = size*size*4
    const pixels = new Uint8Array(bytes); 



    for(let y = 0; y < size; y++){

        for(let x = 0; x < size; x++){
            const r= x+size*y*4
            pixels[r] = 0.5
            pixels[r+1] = 0.5
            pixels[r+2] = 0.5
            pixels[r+3] = 1
        }
    }


    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nearest filtering keeps the crisp pixel-art/voxel look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures["skateboard"] = texture;
    return texture;

}
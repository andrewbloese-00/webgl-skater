/**
 * Andrew Bloese - CSE 470 - ASU Spring 2026
Description: handles the initial attributes of a prototype cube:
- normals
- texture coordinates
- vertex positions 
 */

// a prototype for vertices of a 1x1x1 cube
const CUBE_VERTICES = [
    vec4(-0.5, -0.5,  0.5, 1.0), 
    vec4(-0.5,  0.5,  0.5, 1.0), 
    vec4( 0.5,  0.5,  0.5, 1.0), 
    vec4( 0.5, -0.5,  0.5, 1.0), 
    vec4(-0.5, -0.5, -0.5, 1.0), 
    vec4(-0.5,  0.5, -0.5, 1.0), 
    vec4( 0.5,  0.5, -0.5, 1.0), 
    vec4( 0.5, -0.5, -0.5, 1.0)  
];


function _pushQuad(points,a,b,c,d){
	points.push(CUBE_VERTICES[a])
	points.push(CUBE_VERTICES[b])
	points.push(CUBE_VERTICES[c])
	points.push(CUBE_VERTICES[d])
}


//l.u.t for face index based on which face 
const FACE_LOOKUP = {
	front: 0,
	right: 1,
	bottom: 2, 
	top: 3,
	back: 4,
	left: 5, 
} 







function makePrototypeCube(){
	const points = [] 
	_pushQuad( points, 1, 0, 3, 2 ); //front
	_pushQuad( points, 2, 3, 7, 6 ); //right
    _pushQuad( points, 3, 0, 4, 7 ); //bottom
    _pushQuad( points, 6, 5, 1, 2 ); //top
    _pushQuad( points, 4, 5, 6, 7 ); //back
    _pushQuad( points, 5, 4, 0, 1 ); //left
	return points;
}

//in same order as quad pushes... 
const CUBE_NORMALS = [ 
	vec4(0,0,1,0), 	//front
	vec4(1,0,0,0), 	//right
	vec4(0,-1,0,0), //bottom
	vec4(0,1,0,0), 	//top
	vec4(0,0,-1,0), //back
	vec4(-1,0,0,0),	//left
];



function generateCubeNormals(){
	const normals = [] 
	for(const norm of CUBE_NORMALS){
		//4 verts per quad
		for(let v = 0; v < 4; v++){
			normals.push(norm)
		}
	}
	return normals
}


//a basic quad for texture coordinates...
const texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function generateCubeTexCoords() {
    const texCoords = [];
    // 6 faces on a cube
    for (let i = 0; i < 6; i++) {
        texCoords.push(...texCoord[0]);
        texCoords.push(...texCoord[1]);
        texCoords.push(...texCoord[2]);
        texCoords.push(...texCoord[3]);
    }
    return texCoords;
}
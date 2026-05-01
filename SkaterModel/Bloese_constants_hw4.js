/**
 Andrew Bloese - CSE 470 - ASU Spring 2026
 Description: 
    some constant values used for hw4
 */

const ERR_NO_CANVAS = "no html canvas found!";
const ERR_NO_GL = "failed to get webgl rendering context!";
const ERR_SHADER_PROGRAM = "Failed to initialize: failed to compile shader program"

const MSG_INIT_SUCCESS = "GL got compiled shader program!";

//512x512 resolution screen
const CANVAS_WIDTH = 1024, CANVAS_HEIGHT = 1024; 


let GL_CLEAR_COLOR = [ 
    1.0,1.0,1.0,1.0
]//white

GL_CLEAR_COLOR = [0,0,0,1] //black background


//ended up not finishing a full camera following system, 
const FOLLOW_CAM_OFF = 0
const FOLLOW_CAM_FRONT = 1
const FOLLOW_CAM_BACK = 2
const FOLLOW_CAM_ORBIT = 3
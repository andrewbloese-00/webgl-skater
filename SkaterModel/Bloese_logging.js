/*
Andrew Bloese - CSE 470 - ASU Spring 2026
Description: 
    custom logging helpers that can be toggled to show or not
    - includes path/label for better organization/format
*/
const VERBOSE_LOGS = true

/**
 * 
 * @param {string | string[]} path 
 * @param {string} message 
 * @param  {...any} args 
 */
function INFO(path,message,...args){
    if(!VERBOSE_LOGS) return; 

    const p = Array.isArray(path) ? path.join(":") : path
    const prefix = `[Info:${p}] -> ${message}`
    console.info(prefix,...args)
}
/**
 * 
 * @param {string | string[]} path 
 * @param {string} message 
 * @param  {...any} args 
 */
function LOG(path,message,...args){
    if(!VERBOSE_LOGS) return; 

    const p = Array.isArray(path) ? path.join(":") : path
    const prefix = `[Log:${p}] -> ${message}`
    console.log(prefix,...args)
}
/**
 * 
 * @param {string | string[]} path 
 * @param {string} message 
 * @param  {...any} args 
 */
function WARN(path,message,...args){
    if(!VERBOSE_LOGS) return;
    const p = Array.isArray(path) ? path.join(":") : path
    const prefix = `[Warn:${p}] -> ${message}`
    console.warn(prefix,...args)
}
/**
 * 
 * @param {string | string[]} path 
 * @param {string} message 
 * @param  {...any} args 
 */
function ERROR(path,message,...args){
    if(!VERBOSE_LOGS) return;
    const p = Array.isArray(path) ? path.join(":") : path
    const prefix = `[Error:${p}] -> ${message}`
    console.error(prefix,...args)
}




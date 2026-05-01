# Skater Hierarchical Model Demo

This project was completed as part of my Graphics course at ASU in Spring 2026. It features an animation of a hierarchical model following a circular path on a floor plane with various colored blocks strewn about the scene. It was implemented using WebGL and a a helper library (see `/Common/` folder). 


## Screenshots

<div style="display:grid; grid-template-columns: repeat(2,1fr); gap: 1rem">

<img src="/images/camera_back.png" alt="back follow camera view"/>
<img src="/images/camera_front.png" alt="front follow camera view"/>
<img src="/images/camera_orbit.png" alt="orbit camera view"/>
<img src="/images/camera_fixed.png" alt="fixed camera view"/>

</div>





## Features 
- A hierarchical model of a humanoid man on a skateboard. 
- Phong materials are used for the colored blocks on the map. 
- Grayscale textures for the shirt and hair patterns are generated as needed. 
- For textured objects, a "u_tint_color" uniform is used to make applying custom colors simple. 
- All objects in the scene are instances of the same prototype cube, each with unique instance matrices
- Animation controls: 
    - Pause / resume / reset animation
    - Choose between various camera modes
- A user interface for customizing the scale of each independent body part. 
- customizable facial hair option


## How To Run It? 
To run this application, simply open the index.html file in a webgl capable web browser (most modern browsers are). 






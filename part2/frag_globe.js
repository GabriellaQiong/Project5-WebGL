(function() {
    "use strict";
    /*global window,document,Float32Array,Uint16Array,mat4,vec3,snoise*/
    /*global getShaderSource,createWebGLContext,createProgram*/

    function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }

    var NUM_WIDTH_PTS = 64;
    var NUM_HEIGHT_PTS = 64;

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var gl = createWebGLContext(canvas, message);
    if (!gl) {
        return;
    }

    ///////////////////////////////////////////////////////////////////////////

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var persp = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, 0.1, 100.0, persp);

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    var positionLocation;
    var normalLocation;
    var texCoordLocation;
    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_CameraSpaceDirLightLocation;
    var u_DayDiffuseLocation;
    var u_NightLocation;
    var u_CloudLocation;
    var u_CloudTransLocation;
    var u_EarthSpecLocation;
    var u_BumpLocation;
    var u_timeLocation;
   
    var u_MoonLocation;
    var positionMoonLocation;
    var normalMoonLocation;
    var texCoordMoonLocation;
    var u_ModelMoonLocation;
    var u_InvTransMoonLocation;
    var u_ModelMoonLocation;
    var u_ViewMoonLocation;
    var u_PerspMoonLocation;
    var u_CameraSpaceDirLightMoonLocation;    
    var u_BumpMoonLocation;

    var u_BGLocation;
    var normalBGLocation;
    var texCoordBGLocation;
    var positionBGLocation;
    var u_ModelBGLocation;
    var u_ViewBGLocation;
    var u_PerspBGLocation;
    var u_InvTransBGLocation;

    var program;
    var program_moon;
    var program_starField;

    (function initializeShader() {
        var vs = getShaderSource(document.getElementById("vs"));
        var fs = getShaderSource(document.getElementById("fs"));

        program = createProgram(gl, vs, fs, message);
        positionLocation = gl.getAttribLocation(program, "Position");
        normalLocation = gl.getAttribLocation(program, "Normal");
        texCoordLocation = gl.getAttribLocation(program, "Texcoord");
        u_ModelLocation = gl.getUniformLocation(program,"u_Model");
        u_ViewLocation = gl.getUniformLocation(program,"u_View");
        u_PerspLocation = gl.getUniformLocation(program,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(program,"u_InvTrans");
        u_DayDiffuseLocation = gl.getUniformLocation(program,"u_DayDiffuse");
        u_NightLocation = gl.getUniformLocation(program,"u_Night");
        u_CloudLocation = gl.getUniformLocation(program,"u_Cloud");
        u_CloudTransLocation = gl.getUniformLocation(program,"u_CloudTrans");
        u_EarthSpecLocation = gl.getUniformLocation(program,"u_EarthSpec");
        u_BumpLocation = gl.getUniformLocation(program,"u_Bump");
        u_timeLocation = gl.getUniformLocation(program,"u_time");
        u_CameraSpaceDirLightLocation = gl.getUniformLocation(program,"u_CameraSpaceDirLight");

        var moon_vs = getShaderSource(document.getElementById("moon_vs")); 
        var moon_fs = getShaderSource(document.getElementById("moon_fs")); 

        program_moon = createProgram(gl, moon_vs, moon_fs, message);
        positionMoonLocation = gl.getAttribLocation(program_moon, "PositionMoon");
        normalMoonLocation = gl.getAttribLocation(program_moon, "NormalMoon");
        texCoordMoonLocation = gl.getAttribLocation(program_moon, "TexcoordMoon");
        u_ModelMoonLocation = gl.getUniformLocation(program_moon,"u_ModelMoon");
        u_ViewMoonLocation = gl.getUniformLocation(program_moon,"u_View");
        u_PerspMoonLocation = gl.getUniformLocation(program_moon,"u_Persp");
        u_InvTransMoonLocation = gl.getUniformLocation(program_moon,"u_InvTrans");
        u_CameraSpaceDirLightMoonLocation = gl.getUniformLocation(program_moon,"u_CameraSpaceDirLight");
        u_MoonLocation = gl.getUniformLocation(program_moon, "u_Moon");
        u_BumpMoonLocation = gl.getUniformLocation(program_moon, "u_BumpMoon");

        var vs_bg = getShaderSource(document.getElementById("vs_bg")); 
        var fs_bg = getShaderSource(document.getElementById("fs_bg")); 

        program_starField = createProgram(gl, vs_bg, fs_bg, message);
        u_BGLocation = gl.getUniformLocation(program_starField, "u_bg");
        texCoordBGLocation = gl.getAttribLocation(program_starField, "TexcoordBG");
        normalBGLocation = gl.getAttribLocation(program_starField, "NormalBG");
        positionBGLocation = gl.getAttribLocation(program_starField, "PositionBG");
        u_ModelBGLocation = gl.getUniformLocation(program_starField,"u_Model");
        u_ViewBGLocation = gl.getUniformLocation(program_starField,"u_View");
        u_PerspBGLocation = gl.getUniformLocation(program_starField,"u_Persp");
        u_InvTransBGLocation = gl.getUniformLocation(program_starField,"u_InvTrans");

   })();
   
    var dayTex       = gl.createTexture();
    var bumpTex      = gl.createTexture();
    var cloudTex     = gl.createTexture();
    var transTex     = gl.createTexture();
    var lightTex     = gl.createTexture();
    var specTex      = gl.createTexture();
    var moonTex      = gl.createTexture();
    var moonBumpTex  = gl.createTexture();
    var starFieldTex = gl.createTexture();

    function initLoadedTexture(texture){
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var numberOfIndices;

    (function initializeSphere() {
        function uploadMesh(positions, texCoords, indices) {
            // Positions
            var positionsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);
            
            // Normals
            var normalsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalLocation);
            
            // TextureCoords
            var texCoordsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texCoordLocation);

            // Indices
            var indicesName = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }
        var WIDTH_DIVISIONS = NUM_WIDTH_PTS - 1;
        var HEIGHT_DIVISIONS = NUM_HEIGHT_PTS - 1;

        var numberOfPositions = NUM_WIDTH_PTS * NUM_HEIGHT_PTS;

        var positions = new Float32Array(3 * numberOfPositions);
        var texCoords = new Float32Array(2 * numberOfPositions);
        var indices = new Uint16Array(6 * (WIDTH_DIVISIONS * HEIGHT_DIVISIONS));

        var positionsIndex = 0;
        var texCoordsIndex = 0;
        var indicesIndex = 0;
        var length;

        for( var j = 0; j < NUM_HEIGHT_PTS; ++j )
        {
            var inclination = Math.PI * (j / HEIGHT_DIVISIONS);
            for( var i = 0; i < NUM_WIDTH_PTS; ++i )
            {
                var azimuth = 2 * Math.PI * (i / WIDTH_DIVISIONS);
                positions[positionsIndex++] = Math.sin(inclination)*Math.cos(azimuth);
                positions[positionsIndex++] = Math.cos(inclination);
                positions[positionsIndex++] = Math.sin(inclination)*Math.sin(azimuth);
                texCoords[texCoordsIndex++] = i / WIDTH_DIVISIONS;
                texCoords[texCoordsIndex++] = j / HEIGHT_DIVISIONS;
            } 
        }

        for( var j = 0; j < HEIGHT_DIVISIONS; ++j )
        {
            var index = j*NUM_WIDTH_PTS;
            for( var i = 0; i < WIDTH_DIVISIONS; ++i )
            {
                    indices[indicesIndex++] = index + i;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS+1;
            }
        }

        uploadMesh(positions, texCoords, indices);
        numberOfIndices = indicesIndex;
    })();
    
   /*
    var numberOfIndicesBG;

    (function initializeBG() {
        function uploadMesh(positions, texCoords, indices) {
            // Positions
            var positionsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(positionBGLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionBGLocation);
            
            // Normals
            var normalsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalBGLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalBGLocation);
            
            // TextureCoords
            var texCoordsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            gl.vertexAttribPointer(texCoordBGLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texCoordBGLocation);

            // Indices
            var indicesName = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        } 

        var numberOfPositionsBG = 4;

        var positionsBG = new Float32Array(3 * numberOfPositionsBG);
        var texCoordsBG = new Float32Array(2 * numberOfPositionsBG);
        var indicesBG = new Uint16Array(6);

        var positionsIdx = 0;
        var texCoordsIdx = 0;
        var indicesIdx = 0;

        positionsBG[positionsIdx++] = 0.0;
        positionsBG[positionsIdx++] = 0.0;
        positionsBG[positionsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 0.0;
        
        positionsBG[positionsIdx++] = 1.0;
        positionsBG[positionsIdx++] = 0.0;
        positionsBG[positionsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 1.0;

        positionsBG[positionsIdx++] = 1.0;
        positionsBG[positionsIdx++] = 1.0;
        positionsBG[positionsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 0.0;
        texCoordsBG[texCoordsIdx++] = 1.0;
        
        positionsBG[positionsIdx++] = 0.0;
        positionsBG[positionsIdx++] = 1.0;
        positionsBG[positionsIdx++] = 1.0;
        texCoordsBG[texCoordsIdx++] = 0.0;
        texCoordsBG[texCoordsIdx++] = 0.0;
 
        indicesBG[indicesIdx++] = 0;
        indicesBG[indicesIdx++] = 1;
        indicesBG[indicesIdx++] = 2; 
        indicesBG[indicesIdx++] = 3;
        indicesBG[indicesIdx++] = 0;
        indicesBG[indicesIdx++] = 2;

        uploadMesh(positionsBG, texCoordsBG, indicesBG);
        numberOfIndicesBG = indicesIdx;
    })();*/

    var time = 0;
    var mouseLeftDown = false;
    var mouseRightDown = false;
    var lastMouseX = null;
    var lastMouseY = null;

    function handleMouseDown(event) {
        if( event.button == 2 ) {
            mouseLeftDown = false;
            mouseRightDown = true;
        }
        else {
            mouseLeftDown = true;
            mouseRightDown = false;
        }
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        mouseLeftDown = false;
        mouseRightDown = false;
    }

    function handleMouseMove(event) {
        if (!(mouseLeftDown || mouseRightDown)) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
        
        if( mouseLeftDown )
        {
            azimuth += 0.01 * deltaX;
            elevation += 0.01 * deltaY;
            elevation = Math.min(Math.max(elevation, -Math.PI/2+0.001), Math.PI/2-0.001);
        }
        else
        {
            radius += 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 10.0);
        }
        eye = sphericalToCartesian(radius, azimuth, elevation);
        view = mat4.create();
        mat4.lookAt(eye, center, up, view);

        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    function animate() {
        ///////////////////////////////////////////////////////////////////////////
        // Update
        var model = mat4.create();
        mat4.identity(model);
        mat4.rotate(model, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        mat4.rotate(model, Math.PI, [1.0, 0.0, 0.0]);
        mat4.rotate(model, -time, [0.0, 1.0, 0.0]);

        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        var lightdir = vec3.create([0.0, 0.0, 1.0]);
        var lightdest = vec4.create();
        vec3.normalize(lightdir);
        mat4.multiplyVec4(view, [lightdir[0], lightdir[1], lightdir[2], 0.0], lightdest);
        lightdir = vec3.createFrom(lightdest[0],lightdest[1],lightdest[2]);
        vec3.normalize(lightdir);

        ///////////////////////////////////////////////////////////////////////////
        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /*
        var model_star = model;
        mat4.scale(model_star, [100.0, 100.0, 100.0]);

        // Star Field Program
        gl.useProgram(program_starField);
        
        gl.uniformMatrix4fv(u_ModelBGLocation, false, model_star);
        gl.uniformMatrix4fv(u_ViewBGLocation, false, view);
        gl.uniformMatrix4fv(u_PerspBGLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransBGLocation, false, invTrans);

        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_2D, starFieldTex);
        gl.uniform1i(u_BGLocation, 8);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);
        */

        gl.useProgram(program);

        time += 0.001;
        gl.uniform1f(u_timeLocation, time);

        gl.uniformMatrix4fv(u_ModelLocation, false, model);
        gl.uniformMatrix4fv(u_ViewLocation, false, view);
        gl.uniformMatrix4fv(u_PerspLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransLocation, false, invTrans);
        gl.uniform3fv(u_CameraSpaceDirLightLocation, lightdir);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dayTex);
        gl.uniform1i(u_DayDiffuseLocation, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bumpTex);
        gl.uniform1i(u_BumpLocation, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, cloudTex);
        gl.uniform1i(u_CloudLocation, 2);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, transTex);
        gl.uniform1i(u_CloudTransLocation, 3);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, lightTex);
        gl.uniform1i(u_NightLocation, 4);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, specTex);
        gl.uniform1i(u_EarthSpecLocation, 5);
        gl.drawElements(gl.TRIANGLES, numberOfIndices, gl.UNSIGNED_SHORT,0);

        // Start moon program
        gl.useProgram(program_moon);
        
        // Moon transformation 
        var model_moon = mat4.create();
        mat4.identity(model_moon);
        mat4.rotate(model_moon, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        mat4.rotate(model_moon, Math.PI, [1.0, 0.0, 0.0]);
        mat4.rotate(model_moon, -2.3 * time, [0.0, 1.0, 0.0]);
        mat4.translate(model_moon, [-2.0, 0.0, 0.0]);
        mat4.scale(model_moon, [0.2, 0.2, 0.2]);
        mat4.rotate(model_moon,-0.01 * time, [0.0, 1.0, 0.0]);

        var mv_moon = mat4.create();
        mat4.multiply(view, model_moon, mv_moon);

        var invTrans_moon = mat4.create();
        mat4.inverse(mv_moon, invTrans_moon);
        mat4.transpose(invTrans_moon);

        gl.uniformMatrix4fv(u_ModelMoonLocation, false, model_moon);
        gl.uniformMatrix4fv(u_ViewMoonLocation, false, view);
        gl.uniformMatrix4fv(u_PerspMoonLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransMoonLocation, false, invTrans_moon);
        gl.uniform3fv(u_CameraSpaceDirLightMoonLocation, lightdir);

        // Moon texture activation and draw
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, moonTex);
        gl.uniform1i(u_MoonLocation, 6);
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, moonBumpTex);
        gl.uniform1i(u_BumpMoonLocation, 7);
        gl.drawElements(gl.TRIANGLES, numberOfIndices, gl.UNSIGNED_SHORT,0);

           window.requestAnimFrame(animate);
    }
    
    var textureCount = 0;
        
    function initializeTexture(texture, src) {
        texture.image = new Image();
        texture.image.onload = function() {
        initLoadedTexture(texture);

        // Animate once textures load.
        if (++textureCount === 9) {
            /*
            var stats = new Stats();
            stats.setMode(0); // 0: fps, 1: ms

            // Align top-left
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = '0px';
            stats.domElement.style.top = '0px';
    
            document.body.appendChild( stats.domElement );
            setInterval( function () {
                sats.begin();*/
                animate();           
               /* stats.end();
                }, 100 );*/   
            }
        }
        texture.image.src = src;
    }

    initializeTexture(dayTex, "earthmap1024.png");
    initializeTexture(bumpTex, "earthbump1024.png");
    initializeTexture(cloudTex, "earthcloud1024.png");
    initializeTexture(transTex, "earthtrans1024.png");
    initializeTexture(lightTex, "earthlight1024.png");
    initializeTexture(specTex, "earthspec1024.png");
    initializeTexture(moonTex, "moon1024.jpg");
    initializeTexture(moonBumpTex, "moonBump1024.jpg");
    initializeTexture(starFieldTex, "starField1024.jpg");
}());

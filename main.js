"use strict";

// ****************** This code is from me, Jonathan ******************

var RESOLUTION = 1; // 0.5 is half the resolution

function init()
{
	// This makes the body the full size of the window
	document.body.style.margin = "0px";
	document.body.style.padding = "0px";
	document.body.style.width = "100%";
	document.body.style.height = "100%";
	document.body.style.overflow = "hidden";
	
	// This resizes the webgl view to the full size of the window view
	let canvas = document.createElement("canvas");
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	
	document.body.appendChild(canvas);
	
	let fpsNode = document.createElement("div");
	fpsNode.style.backgroundColor = "rgba(50%, 50%, 50%, 0.5)";
	fpsNode.style.margin = "0px 5px";
	fpsNode.style.padding = "6px 5px";
	fpsNode.style.borderRadius = "5px";
	fpsNode.style.width = "50px";
	fpsNode.style.fontSize = "15px";
	fpsNode.style.textAlign = "center";
	fpsNode.style.color = "white";
	fpsNode.style.top = "15px";
	fpsNode.style.left = "10px";
	fpsNode.style.position = "fixed";
	fpsNode.style.display = "none";
	fpsNode.style.zIndex = 1;
	fpsNode.style.display = "block";
	fpsNode.innerHTML = "00FPS";
	
	document.body.appendChild(fpsNode);
	
	let cpuNode = document.createElement("div");
	cpuNode.style.backgroundColor = "rgba(50%, 50%, 50%, 0.5)";
	cpuNode.style.margin = "0px 5px";
	cpuNode.style.padding = "6px 5px";
	cpuNode.style.borderRadius = "5px";
	cpuNode.style.width = "60px";
	cpuNode.style.fontSize = "15px";
	cpuNode.style.textAlign = "center";
	cpuNode.style.color = "white";
	cpuNode.style.top = "15px";
	cpuNode.style.left = "80px";
	cpuNode.style.position = "fixed";
	cpuNode.style.display = "none";
	cpuNode.style.zIndex = 1;
	cpuNode.style.display = "block";
	cpuNode.innerHTML = "000MS";
	
	document.body.appendChild(cpuNode);

	let project = new Project(cpuNode, fpsNode, canvas);
	project.update();
}

function Project(cpuNode, fpsNode, canvas)
{
	this.canvas = canvas;
	let gl = getWebGLContext(this.canvas);

	if (!gl)
	{
		console.log("Failed to get the rendering context for WebGL");
		return;
	}

	let vertexShader = document.getElementById("vshader").innerText;
	let fragmentShader = document.getElementById("fshader").innerText;

	this.shaderProgram = initShaderProgram(gl, vertexShader, fragmentShader);
	
	if (!this.shaderProgram)
	{
		console.log("Failed to intialize shaders.");
		return;
	}

	this.floorColor = 0;
	this.shaderScene = 0;
	this.cpuNode = cpuNode;
	this.fpsNode = fpsNode;
	this.gl = gl;

	let self = this;
	
	document.addEventListener("keyup", function(event)
	{		
		// 0 is x and 1 is y
		switch (event.key)
		{
			case "w":
			case "ArrowUp":
				if (self.floorColor === 1)
				{
					self.floorColor = 0;
				}
				else
				{
					self.floorColor = 1;
				}
				
				gl.uniform1i(self.shaderProgram.u_floorColorLoc, self.floorColor);
			break;
						
			case "a":
			case "ArrowLeft":
				self.shaderScene--;
				self.shaderScene = Math.max(self.shaderScene, 0);
				
				gl.uniform1i(self.shaderProgram.u_shaderSceneLoc, self.shaderScene);
			break;
			
			case "d":
			case "ArrowRight":
				self.shaderScene++;
				self.shaderScene = Math.min(self.shaderScene, 9);
				
				gl.uniform1i(self.shaderProgram.u_shaderSceneLoc, self.shaderScene);
			break;
		}
	}, false);
	
	// iMouse pixel coords. xy: move position, zw: click position
	document.addEventListener("mousemove", function(event)
	{		
		gl.uniform2f(self.shaderProgram.u_mouseLoc, event.offsetX, (self.canvas.height - event.offsetY));
	}, false);
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	// Uniforms
	this.shaderProgram.u_resolutionLoc = gl.getUniformLocation(this.shaderProgram, "iResolution");
	this.shaderProgram.u_mouseLoc = gl.getUniformLocation(this.shaderProgram, "iMouse");
	this.shaderProgram.u_timeLoc = gl.getUniformLocation(this.shaderProgram, "iTime");
	this.shaderProgram.u_timeDeltaLoc = gl.getUniformLocation(this.shaderProgram, "iTimeDelta");
	
	// Keyboard Events
	this.shaderProgram.u_floorColorLoc = gl.getUniformLocation(this.shaderProgram, "u_floorColor");
	this.shaderProgram.u_shaderSceneLoc = gl.getUniformLocation(this.shaderProgram, "u_shaderScene");
	
	// Attributes
	this.shaderProgram.a_verticesLoc = gl.getAttribLocation(this.shaderProgram, "a_vertices");
		
	gl.useProgram(this.shaderProgram);
	
	this.verticesArray =
	[
		 1.0, 1.0,
		-1.0, 1.0,
		-1.0,-1.0,
		 1.0,-1.0
	];

	this.indicesArray =
	[
		 0, 1, 2, 0, 2, 3
	];
	
	this.vertexBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verticesArray), gl.STATIC_DRAW);
	
	this.indexBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicesArray), gl.STATIC_DRAW);

	// Create the VAO
	this.vao = gl.createVertexArray();
	gl.bindVertexArray(this.vao);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

	gl.enableVertexAttribArray(this.shaderProgram.a_verticesLoc);
	gl.vertexAttribPointer(this.shaderProgram.a_verticesLoc, 2, gl.FLOAT, false, 0, 0);
	
	// Clear VAO
	gl.bindVertexArray(null);
	
	// Frames per second
	this.frameLoop =
	{
		frameCount:0,
		timeElapsed:0,
		now:0,
		timeStep:0,
		// In milliseconds
		lastTime:Date.now(),
		averageTime:0,
		oldTime:0,
	}

	window.addEventListener("resize", function(event)
	{
		// event.preventDefault(); prevents a system beep from older browsers
		self.canvas.width = window.innerWidth * RESOLUTION;
		self.canvas.height = window.innerHeight * RESOLUTION;
		
		gl.viewport(0, 0, self.canvas.width, self.canvas.height);
	}, false);

	this.canvas.width = window.innerWidth * RESOLUTION;
	this.canvas.height = window.innerHeight * RESOLUTION;
	
	gl.viewport(0, 0, this.canvas.width, this.canvas.height);
}

Project.prototype.update = function()
{
	let frameLoop = this.frameLoop;
	let gl = this.gl;
	let self = this;
	let time = 0;
	
	var updateAnimation = function()
	{
		frameLoop.now = Date.now();
		// 1000 converts it to seconds
		frameLoop.timeStep = (frameLoop.now - frameLoop.lastTime) / 1000;
		frameLoop.lastTime = frameLoop.now;
		frameLoop.frameCount++;
		frameLoop.timeElapsed += frameLoop.timeStep;

		if (frameLoop.timeElapsed >= 1)
		{
			self.fpsNode.innerHTML = Math.round(frameLoop.frameCount / frameLoop.timeElapsed) + "FPS";
			frameLoop.frameCount = 0;
			frameLoop.timeElapsed = 0;
		}
		
		if (frameLoop.averageTime >= 10)
		{
			self.cpuNode.innerHTML = Math.round((Date.now() - frameLoop.oldTime) / frameLoop.averageTime) + "MS";
			frameLoop.averageTime = 0;
		}
		else if (frameLoop.averageTime === 0)
		{
			frameLoop.oldTime = Date.now();
			frameLoop.averageTime++;
		}
		else
		{
			frameLoop.averageTime++;
		}
		
		gl.uniform2f(self.shaderProgram.u_resolutionLoc, self.canvas.width, self.canvas.height);

		time += frameLoop.timeStep;
		gl.uniform1f(self.shaderProgram.u_timeLoc, time);
		gl.uniform1f(self.shaderProgram.u_timeDeltaLoc, frameLoop.timeStep);
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindVertexArray(self.vao);
		gl.drawElements(gl.TRIANGLES, self.indicesArray.length, gl.UNSIGNED_SHORT, 0);
		gl.bindVertexArray(null);
		
		window.requestAnimationFrame(updateAnimation);
	}

	updateAnimation();
}

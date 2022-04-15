"use strict";

// ****************** This code is from me, Jonathan ******************

var RESOLUTION = 1; // 0.5 is half the resolution

function create()
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
	fpsNode.style.backgroundColor = "rgba(100%, 100%, 100%, 0.5)";
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
	cpuNode.style.backgroundColor = "rgba(100%, 100%, 100%, 0.5)";
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

	this.position = [0,0,-9];
	this.rotation = [0,0,0];
	this.velocity = [0,0,0];
	this.angularVelocity = [0,0,0];
	this.lightColor = [0.67, 0.87, 0.93, 1.0];
	this.checkerboard = 0;
	this.shaderScene = 0;
	this.roundBox = 0;

	this.cpuNode = cpuNode;
	this.fpsNode = fpsNode;
	this.gl = gl;

	let self = this;
	
	document.addEventListener("keyup", function(event)
	{
		// Key Up alert (keep this)
		//alert("event: " + event.key);
		
		// 0 is x and 1 is y
		switch (event.keyCode)
		{
			case 87: // w
			case 38: // ArrowUp
				self.checkerboard = !self.checkerboard;
				gl.uniform1i(self.shaderProgram.u_checkerboardLoc, self.checkerboard);
			break;
						
			case 65: // a
			case 37: // ArrowLeft
				self.shaderScene--;
				self.shaderScene = Math.max(self.shaderScene, 0);
			break;
			
			case 68: // d
			case 39: // ArrowRight
				self.shaderScene++;
				self.shaderScene = Math.min(self.shaderScene, 9);
			break;
		}
	}, false);
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	// uniforms
	this.shaderProgram.u_aspectRatioLoc = gl.getUniformLocation(this.shaderProgram, "u_aspectRatio");
	this.shaderProgram.u_lightPositionLoc = gl.getUniformLocation(this.shaderProgram, "u_lightPosition");
	this.shaderProgram.u_lightColorLoc = gl.getUniformLocation(this.shaderProgram, "u_lightColor");
	this.shaderProgram.u_positionLoc = gl.getUniformLocation(this.shaderProgram, "u_position");
	this.shaderProgram.u_rotationLoc = gl.getUniformLocation(this.shaderProgram, "u_rotation");

	this.shaderProgram.u_shaderSceneLoc = gl.getUniformLocation(this.shaderProgram, "u_shaderScene");
	this.shaderProgram.u_checkerboardLoc = gl.getUniformLocation(this.shaderProgram, "u_checkerboard");
	this.shaderProgram.u_roundBoxLoc = gl.getUniformLocation(this.shaderProgram, "u_roundBox");

	// Attributes
	this.shaderProgram.a_position = gl.getAttribLocation(this.shaderProgram, "a_position");

	gl.useProgram(this.shaderProgram);
	gl.enableVertexAttribArray(this.shaderProgram.a_position);
	
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
	}, false);

	this.canvas.width = window.innerWidth * RESOLUTION;
	this.canvas.height = window.innerHeight * RESOLUTION;
}

Project.prototype.update = function()
{
	let frameLoop = this.frameLoop;
	let gl = this.gl;
	let self = this;
	
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
		
		self.position[0] += (frameLoop.timeStep * self.velocity[0]);
		self.position[1] += (frameLoop.timeStep * self.velocity[1]);
		self.position[2] += (frameLoop.timeStep * self.velocity[2]);
		self.rotation[0] += (frameLoop.timeStep * self.angularVelocity[0]);
		self.rotation[1] += (frameLoop.timeStep * 1.0);
		self.rotation[2] += (frameLoop.timeStep * self.angularVelocity[2]);
		self.roundBox += (frameLoop.timeStep * 1.0);
		
		let matrix = mat4AxisAngle(mat4Identity(), [-1.0, 0.0, 0.0], self.rotation[0]);
		matrix = mat4AxisAngle(matrix, [0.0,-1.0, 0.0], self.rotation[1]);
		matrix = mat4AxisAngle(matrix, [0.0, 0.0,-1.0], self.rotation[2]);
		matrix = mat4Translation(matrix, [1, 5,-6]);
		self.lightPosition = vec3TranslationMat4(matrix);
		
		gl.uniform1f(self.shaderProgram.u_aspectRatioLoc, self.canvas.width / self.canvas.height);
		gl.viewport(0, 0, self.canvas.width, self.canvas.height);
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		gl.uniform1i(self.shaderProgram.u_shaderSceneLoc, self.shaderScene);
		gl.uniform1i(self.shaderProgram.u_checkerboardLoc, self.checkerboard);
		
		gl.uniform1f(self.shaderProgram.u_roundBoxLoc, (Math.sin(self.roundBox) + 1.0) / 2.0);
		gl.uniform4f(self.shaderProgram.u_lightColorLoc, self.lightColor[0], self.lightColor[1], self.lightColor[2], self.lightColor[3]);
		gl.uniform3f(self.shaderProgram.u_lightPositionLoc, self.lightPosition[0], self.lightPosition[1], self.lightPosition[2]);
		
		gl.uniform3f(self.shaderProgram.u_positionLoc, self.position[0], self.position[1], self.position[2]);
		gl.uniform3f(self.shaderProgram.u_rotationLoc, self.rotation[0], self.rotation[1], self.rotation[2]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
		gl.vertexAttribPointer(self.shaderProgram.a_position, 2, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
		gl.drawElements(gl.TRIANGLES, self.indicesArray.length, gl.UNSIGNED_SHORT, 0);
	
		window.requestAnimationFrame(updateAnimation);
	}

	updateAnimation();
}

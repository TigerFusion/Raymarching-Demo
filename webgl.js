"use strict";

function mat4Identity()
{
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1];
}

function mat4Multiply(matA, matB)
{
	return matMulitply(matA, 4, 4, matB, 4, 4);
}

function matMulitply(matA, aRows, aCols, matB, bRows, bCols)
{
	if (aCols !== bRows)
	{
		return null;
	}
	
	let matrix = [];
	
	for (let i = 0; i < aRows; i++)
	{
		for (let j = 0; j < bCols; j++)
		{
			matrix.push(0);
			
			for (let k = 0; k < bRows; k++)
			{
				matrix[bCols * i + j] += matA[aCols * i + k] * matB[bCols * k + j];
			}
		}
	}
	
	return matrix;
}

// This is like OpenGL's glRotate() function
function mat4AxisAngle(matrix, axis, radians)
{
	let c = Math.cos(radians);
	let s = Math.sin(radians);
	let t = 1 - Math.cos(radians);
	
	let x = axis[0];
	let y = axis[1];
	let z = axis[2];
	
	if (magnitudeVec3Squared(axis) === 0)
	{
		return matrix;//mat4Identity();
	}
	
	let inverseLength = 1 / magnitudeVec3(axis);
	
	x *= inverseLength;
	y *= inverseLength;
	z *= inverseLength;
	
	return mat4Multiply(
	[
		t * (x * x) + c, t * x * y + s * z, t * x * z - s * y, 0,
		t * x * y - s * z, t * (y * y) + c, t * y * z + s * x, 0,
		t * x * z + s * y, t * y * z - s * x, t * (z * z) + c, 0,
		0, 0, 0, 1
	], matrix);
}

function mat4Translation(matrix, position)
{
	return mat4Multiply(
	[
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		position[0], position[1], position[2], 1
	], matrix);
}

// For a 4x4 matrix
function vec3TranslationMat4(matrix)
{
	return [matrix[12], matrix[13], matrix[14]];
}

function dotProductVec3(left, right)
{
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function magnitudeVec3(vector)
{
	return Math.sqrt(dotProductVec3(vector, vector));
}

function magnitudeVec3Squared(vector)
{
	return dotProductVec3(vector, vector);
}

function getWebGLContext(canvas)
{
	var context = canvas.getContext("webgl");

	if (context === null)
	{
		context = canvas.getContext("experimental-webgl");
	}
	
	if (context === null)
	{
		context = canvas.getContext("webkit-3d");
	}
	
	if (context === null)
	{
		context = canvas.getContext("moz-webgl");
	}

	return context;
}

function initShaderProgram(gl, vShader, fShader)
{
	var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vShader);
	var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fShader);

	if (!vertexShader || !fragmentShader)
	{
		return null;
	}

	var shaderProgram = gl.createProgram();
	
	if (!shaderProgram)
	{
		console.log("Error: cannot create program");
		return null;
	}
	
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Error: shader program " + gl.getProgramInfoLog(shaderProgram));
		gl.deleteProgram(shaderProgram);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}
	
	return shaderProgram;
}

function loadShader(gl, type, source)
{
	var shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		if (type == gl.VERTEX_SHADER)
		{
			alert("Error: vertex shader " + gl.getShaderInfoLog(shader));
		}
		else if (type == gl.FRAGMENT_SHADER)
		{
			alert("Error: fragment shader " + gl.getShaderInfoLog(shader));
		}
		
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Provides requestAnimationFrame in a cross browser
 * way.
 */
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();
}

/** * ERRATA: 'cancelRequestAnimationFrame' renamed to 'cancelAnimationFrame' to reflect an update to the W3C Animation-Timing Spec. 
 * 
 * Cancels an animation frame request. 
 * Checks for cross-browser support, falls back to clearTimeout. 
 * @param {number}  Animation frame request. */
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (window.cancelRequestAnimationFrame ||
                                 window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
                                 window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame ||
                                 window.msCancelAnimationFrame || window.msCancelRequestAnimationFrame ||
                                 window.oCancelAnimationFrame || window.oCancelRequestAnimationFrame ||
                                 window.clearTimeout);
}

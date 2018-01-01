// GlobalResources.js - Contains resources that are accessible
//                      from all areas of the demo
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js

function globalResources() {
	this.progressFunction = null;
	this.mainCanvasContext = null;
	this.overlayCanvasContext = null;
	this.overlayTexture = null;
	this.vertexShaderStandardPosition = null;
}

/**
 * Name of the vertex shader required to
 *  display scene geometry
 */
globalResources.vertexShaderStandardPositionName = "VertexShaderStandardPosition.shader";

/**
 * List of all fragment shader resource
 *  names
 */
globalResources.fragmentShaderNameList = [
	"FragmentShaderIfsFractalTree.shader"
];

/**
 * Will contain a collection of WebGL
 *  shader programs, compiled from
 *  vertex and fragment shader sources
 * @see globalResources.vertexShaderStandardPositionName
 * @see globalResources.fragmentShaderNameList
 */
globalResources.shaderProgramList = [];

// Main canvas context must have been initialized
globalResources.loadShaders = function() {
	var canvasContext = this.getMainCanvasContext();
	
	if (canvasContext != null) {	
		// Only one vertex shader will be used, as no special vertex-based
		// transformations will be employed.
		var vertexShaderSource = this.loadResourceFile(this.vertexShaderStandardPositionName);
		
		// Create a collection of shader programs, using a list of fragment
		// shaders, each combined with the single vertex shader.
		var fragmentShaderLoop = 0;
		for (fragmentShaderLoop = 0; fragmentShaderLoop < this.fragmentShaderNameList.length; fragmentShaderLoop++) {
			var fragmentShaderSourceName = globalResources.fragmentShaderNameList[fragmentShaderLoop];
			var fragmentShaderSource = this.loadResourceFile(fragmentShaderSourceName);
			
			var shaderProgram = createShaderProgram(canvasContext, vertexShaderSource, fragmentShaderSource);
			if (shaderProgram != null) {
				globalResources.shaderProgramList.push(shaderProgram);
			}
		}
	}
}

/**
 * Performs a synchronous load of a specified resource file
 * @param fileSpecification {string} Contains the URL of the resource to be loaded
 *                                   (can be a relative or absolute URL)
 * @return {DOMString} A DOM string object containing the loaded resource data
 *                     upon success, null otherwise
 */
globalResources.loadResourceFile = function(fileSpecification) {
	var fileData = null;
	
	if (validateVar(fileSpecification) && (typeof fileSpecification === "string")) {
		// Peform a synchronous HTTP request in order to load the file -
		// resource file loading is expected to be performed during initialization;
		// therefore, a synchronous request is acceptable.
		var httpRequest = new XMLHttpRequest();
		httpRequest.open("GET", fileSpecification, false);
		//httpRequest.responseType = "text";
		httpRequest.send();
		fileData = httpRequest.responseText;
	}
	
	return fileData;
}

/**
 * Returns the number of stored WebGL shader program resources
 * @return {number} The number of stored WebGL shader program resources
 */
globalResources.getShaderProgramCount = function() {
	return globalResources.shaderProgramList.length;
}

/**
 * Retrieves an internally-stored WebGL shader program resource
 * @param shaderProgramIndex {number} Index of the shader program
 *                                    to be retrieved
 * @return {WebGLProgram} A WebGL shader program upon success, null otherwise
 */
globalResources.getIndexedShaderProgram = function(shaderProgramIndex) {
	var shaderProgram = null;
	
	if (validateVar(shaderProgramIndex) && (shaderProgramIndex >= 0) &&
		(this.getShaderProgramCount() > shaderProgramIndex)) {
		
		shaderProgram = globalResources.shaderProgramList[shaderProgramIndex];
	}
	
	return shaderProgram;
}

/**
 * Returns the number of stored WebGL texture resources
 * @return {number} The number of stored WebGL texture resources
 */
globalResources.getTextureCount = function() {
	return globalResources.textureCollection.length;
}

/**
 * Retrieves an internally-stored WebGL texture resource
 * @param textureIndex {number} Index of the WebGL texture
 *                              to be retrieved
 * @return {WebGLProgram} A WebGL texture program upon success, null otherwise
 */
globalResources.getIndexedTexture = function(textureIndex) {
	var texture = null;
	
	if (validateVar(textureIndex) && (textureIndex >= 0) &&
		(this.getTextureCount() > textureIndex)) {
			
		texture = globalResources.textureCollection[textureIndex];
	}
	
	return texture;
}

/**
 * Sets a progress function, which receives loading progress
 *  updates
 * @param progressFunction {function} Function that receives a
 *                                    loading completion fraction
 *                                    value (0.0 - 1.0, inclusive)
 *
 */
globalResources.setProgressFunction = function(progressFunction) {
	this.progressFunction = progressFunction;
}

/**
 * Sends progress notifications to the progress function
 * @param progressFraction {number} Loading completion fraction
 *                                  (0.0 - 1.0, inclusive)
 *
 */
globalResources.notifyProgress = function(progressFraction) {
	if (validateVar(progressFraction) && (typeof progressFraction === "number") &&
		(progressFraction >= 0.0) && (progressFraction <= 1.0)) {
		
		if (typeof this.progressFunction === "function") {
			this.progressFunction(progressFraction);
		}
	}
}

/**
 * Sets the "main" canvas context used for drawing data to the
 *  browser window
 * @param mainCanvasContext {CanvasRenderingContext2D / WebGLRenderingContext}
 *						    The canvas context the
 *                          will be retrieved for drawing data to the browser
 *                          window
 */
globalResources.setMainCanvasContext = function(mainCanvasContext) {
	this.mainCanvasContext = mainCanvasContext;
}

/**
 * Sets the overlay canvas context used for drawing data that is
 *  to be superimposed on the main canvas
 * @param overlayCanvasContext {CanvasRenderingContext2D / WebGLRenderingContext}
 *						       The canvas context that will be retrieved for
 *                             drawing data over the main canvas
 */
globalResources.setOverlayCanvasContext = function(overlayCanvasContext) {
	this.overlayCanvasContext = overlayCanvasContext;
}

/**
 * Sets the overlay texture used for drawing data that is
 *  to be superimposed on the main texture
 * @param overlayTexture {WebGLTexture} The texture that is to be used
 *                                      as an overlay texture
 */
globalResources.setOverlayTexture = function(overlayTexture) {
	this.overlayTexture = overlayTexture;
}

/**
 * Retrieves the "main" canvas context used for drawing data
 *  to the browser window
 * @return {CanvasRenderingContext2D / WebGLRenderingContext}
 *			The canvas context used for drawing data to the
 *			browser window
 */
globalResources.getMainCanvasContext = function() {
	return typeof this.mainCanvasContext !== "undefined" ?
		this.mainCanvasContext : null;
}

/**
 * Retrieves the overlay canvas context used for drawing data
 *  to the browser window
 * @return {CanvasRenderingContext2D / WebGLRenderingContext}
 *			The canvas context used for drawing to be
 *			superimposed on the main canvas
 */
globalResources.getOverlayCanvasContext = function() {
	return typeof this.overlayCanvasContext !== "undefined" ?
		this.overlayCanvasContext : null;
}

/**
 * Retrieves the texture to be used for drawing data that is
 *  to be superimposed on the main texture
 * @return {WebGLTexture} The texture that is to be superimposed
 *                        on the main texture
 */
globalResources.getOverlayTexture = function() {
	return typeof this.overlayTexture !== "undefined" ?
		this.overlayTexture : null;
}

/**
 * Initializes the global resources, loading
 *  any resources that require pre-loading
 * @param completionFuction {function} Completion function executed
 *                                     upon completion of all global
 *                                     resource loading
 */
globalResources.initialize = function(completionFunction) {
	this.loadShaders();
	completionFunction();
}
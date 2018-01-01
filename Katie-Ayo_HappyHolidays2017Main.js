// Katie-Ayo_HappyHolidays2017Main.js - Happy Holidays 2017 demo entry point
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js
//  -InternalConstants.js
//  -WebGlUtility.js
//  -GlobalResources.js
//  -MainFractalRenderingScene.js
//  -ProgressElementController.js

/**
 * Initializes any required DOM resources
 *  (creates objects, etc.)
 * @param completionFunction {function} Function to be invoked after the
 *                                      DOM resource initialization has
 *                                      been completed.
 */
function initDomResources(completionFunction) {
	// Create the main canvas on which output
	// will be displayed..
	mainDiv = document.createElement("div");
	
	// Center the div within the window (the height centering will
	// not be retained if the window size has been altered).
	mainDiv.setAttribute("style", "text-align:center; margin-top: " +
		Math.round((window.innerHeight - Constants.defaultCanvasHeight) / 2.0) + "px");
		
	// Add the DIV to the DOM.
	document.body.appendChild(mainDiv);		
	var mainCanvas = document.createElement("canvas");
	var overlayCanvas = document.createElement("canvas");
	
    if (validateVar(mainCanvas) && validateVar(overlayCanvas) &&
		(typeof mainCanvas.getContext === 'function')) {
		mainCanvas.width = Constants.defaultCanvasWidth;
		mainCanvas.height = Constants.defaultCanvasHeight;
		
		overlayCanvas.width = Constants.overlayTextureWidth;
		overlayCanvas.height = Constants.overlayTextureHeight;
	
        // Store the WeblGL context that will be used
        // to write data to the canvas.
        var mainCanvasContext = getWebGlContextFromCanvas(mainCanvas);
		var overlayCanvasContext = overlayCanvas.getContext("2d");
    
		if (validateVar(mainCanvasContext) && validateVar(overlayCanvasContext)) {
			// Prepare the WebGL context for use.
			initializeWebGl(mainCanvasContext);
			
			// Add the canvas object DOM (within the DIV).
			mainDiv.appendChild(mainCanvas);
			
			// Create an overlay texture - this texture will be used primarily
			// to display the scroller text using multitexturing.
			var overlayTexture = createTextureFromCanvas(mainCanvasContext, overlayCanvas, false);
			if (validateVar(overlayTexture)) {
				globalResources.setOverlayTexture(overlayTexture);
			}
						
			globalResources.setMainCanvasContext(mainCanvasContext);
			globalResources.setOverlayCanvasContext(overlayCanvasContext);
		}
	}

	// Initialize DOM resources - upon completion of the
	// resource initialization, execute the provided
	// completion function.
	var progressBarElementController = new progressElementController();
	progressBarElementController.createProgressElement(mainDiv, Constants.progressElementWidth);
	function updateProgress(progressFraction) {
		progressBarElementController.updateProgressElement(progressFraction);
	}
	
	function loadCompletionFunction() {
		progressBarElementController.removeProgressElementFromDom();
		completionFunction();
	}
	
	globalResources.setProgressFunction(updateProgress);
	globalResources.initialize(loadCompletionFunction);	
}


/**
 * Completion function to be used with globalResources.initialize() -
 *  performs any final activities related to loading, and executes
 *  the main scene immediately after all image data has been loaded
 * @see globalResources.initialize
 */
finalizeLoading = function() {
	// The progress bar should not be visible after all image loading
	executeMainScene();
}

/**
 * Performs execution of the main demo scene
 */
executeMainScene = function() {
	// Create the main image transformation scene, and ultimately
	// invoke the start of the demo.
	var fractalRenderingScene = new mainFractalRenderingScene();
	sceneExecution(fractalRenderingScene);
}

/**
 * Main routine - function that is
 *  executed when page loading has
 *  completed
 */
onLoadHandler = function() {
	// Initalize the DOM resources, immediately
	// executing the demo after completion of
	// initialization.
	initDomResources(finalizeLoading);
}
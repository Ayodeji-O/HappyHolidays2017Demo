// MainFractalRenderingScene.js - Renders the shader-based IFS tree fractal 
//
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js
//  -WebGlUtility.js
//  -GlobalResources.js
//  -InternalConstants.js
//  -TextScroller.js

function mainFractalRenderingScene() {
	
}

mainFractalRenderingScene.prototype.initialize = function () {
	
	this.totalElapsedSceneTimeMs = 0.0;
	this.currentSceneRunningTimeMs = 0.0;
	
	// Maximum duration for each tree variant display.
	this.constMaxSceneRunningTimeMs = 15000.0;
	
	this.currentShaderProgramIndex = 0;
	this.currentShaderProgram = null;
	
	// Random offset added to the scene time for the current shader
	// in order to slight randomness.
	this.sceneTimeBaseValueForShaderProgram = 0.0;
	
		// Quad vertices - configured for drawing as triangle strips.
	this.imageQuadVertices =
	[
		// Upper left
		-1.0, 1.0, 0.0,
		// Lower left
		-1.0, -1.0, 0.0,
		// Upper right
		1.0, 1.0, 0.0,
		// Lower right
		1.0, -1.0, 0.0
	];
	
	// Texture coordinates for each quad vertex
	this.imageVertexTextureCoordinates =
	[
		// Upper left
		0.0, 0.0,
		// Lower left
		0.0, 1.0,
		// Upper right
		1.0, 0.0,
		// Lower right
		1.0, 1.0
	];
	
	this.vertexSize = 3;
	this.textureCoordinateSize = 2;
	this.imageQuadVertexCount = 4;
	
	this.imageQuadVertexBuffer = null;
	this.imageVertexTextureCoordinateBuffer = null;

	var webGlCanvasContext = globalResources.getMainCanvasContext();
	webGlCanvasContext.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Create the WebGL buffer for the image display geometry
	// (vertices).
	this.imageQuadVertexBuffer = webGlCanvasContext.createBuffer();
	webGlCanvasContext.bindBuffer(webGlCanvasContext.ARRAY_BUFFER, this.imageQuadVertexBuffer);
	webGlCanvasContext.bufferData(webGlCanvasContext.ARRAY_BUFFER, new Float32Array(this.imageQuadVertices), webGlCanvasContext.STATIC_DRAW);
	
	// Create the WebGL buffer for the per-vertex texture
	// coordinates.
	this.imageVertexTextureCoordinateBuffer = webGlCanvasContext.createBuffer();
	webGlCanvasContext.bindBuffer(webGlCanvasContext.ARRAY_BUFFER, this.imageVertexTextureCoordinateBuffer);
	webGlCanvasContext.bufferData(webGlCanvasContext.ARRAY_BUFFER, new Float32Array(this.imageVertexTextureCoordinates), webGlCanvasContext.STATIC_DRAW);
	
	// Current value that is used to alter the length of the tree
	// trunk.
	this.currentTrunkLengthMultiplier = 0.0;
	
	// Current value that is used to alter the length of all tree
	// branches.
	this.currentBranchLengthMultiplier = this.constMinBranchLengthMultiplier;
	
	// Maximum multiplier value.
	this.constMaxMultiplierValue = 1.0;
	
	this.constMinBranchLengthMultiplier = 0.3;
	
	// Duration of the trunk growth phase (milliseconds)
	this.constTrunkGrowthPhaseDuration = 3000.0;
	
	// Duration of the branch growth phase (milliseconds)
	this.constBranchGrowthPhaseDuration = 3000.0;
	
	// Inter-depth scaling factor - branches are
	// scaled by a random value within this range
	// during each depth iteration in order to reduce
	// the length of branches during depth iteration.
	this.constMinInterLevelScaleDownFactor = 0.37;
	this.constMaxInterLevelScaleDownFactor = 0.55;
	
	// Scaling factor that is applied to successive
	// levels along a host branch - this factor is
	// responsible for the tree shape that resembles
	// a typical conifer (low and high values are
	// separated to ensure that there is a well-defined
	// shape when random factors are generated)..
	this.constMinTreeLevelLowLengthFraction = 0.2;
	this.constMaxTreeLevelLowLengthFraction = 0.4;	
	
	this.constMinTreeLevelHighLengthFraction = 0.6;
	this.constMaxTreeLevelHighLengthFraction = 1.0;
	
	this.currentInterLevelScaleDownFactor = 0.0;
	this.currentMinTreeLengthFraction = 0.0;
	this.currentMaxTreeLengthFraction = 0.0;
	
	// Tree growth phase states - The trunk growth phase
	// occurs as the length multiplier for the trunk is adjusted,
	// while the branch growth phase occurs while the multiplier
	// for the branches is adjusted. The "idle" phase indicates that
	// all growth phases have been completed, and no factor
	// adjustment is in progress.
	this.constGrowthPhaseTrunk = 0;
	this.constGrowthPhaseBranches = 1;
	this.constGrowthPhaseIdle = 3;
	
	this.currentGrowthPhase = this.constGrowthPhaseTrunk;
	this.currentGrowthPhaseStateTime = 0.0;
	
	// Constants that are used to define limits for the sine/cosine
	// calls used to generate the "wind" effect.
	this.constMinSineAmplitude = 0.1;
	this.constMinSinePeriodMultiplier = 0.1;
	
	this.constMaxSineAmplitude = 2.0;
	this.constMaxSinePeriodMultiplier = 10.0;
	
	this.constMaxSinePeriodPhaseShift = Math.PI / 3.0;
	
	this.firstSineAmplitude = 0.0;
	this.firstSinePeriodMultiplier = 0.0;
	
	this.secondSineAmplitude = 0.0;
	this.secondSinePeriodMultiplier = 0.0;
	
	this.secondSinePhaseShift = 0.0;
	
	this.constMinTreeDepth = 2;
	this.constMaxTreeDepth = 3;
	this.currentTreeDepth = this.constMinTreeDepth;
	
	// Background color for the scroller section.
	this.scrollerBackgroundColor = new rgbColor(
		Constants.scrollerBackgroundUnitIntensity,
		Constants.scrollerBackgroundUnitIntensity,
		Constants.scrollerBackgroundUnitIntensity,		
		Constants.scrollerBackgroundUnitAlpha);
		
	// Position at which the scroller should be displayed.
	this.constScrollerOffsetFromBottom = 100;
	this.scrollerCoordX = 0;
	this.scrollerCoordY = Constants.overlayTextureHeight - this.constScrollerOffsetFromBottom;
	
	// Initialize the message scroller instance
	this.messageScroller = new textScroller(Constants.scrollerFontSizePx, Constants.scrollerFont, Constants.scrollerFontStyle);
	this.messageScroller.setSourceString(Constants.messageText);
	
	// Scroller states - lead-in in is the delay before any of the scroller is displayed,
	// fade in is the period where the background fades-in in, and the text display
	// phase indicates the phase where the scroller is actually operating.
	this.constScrollerStateLeadIn = 0;
	this.constScrollerStateFadeIn = 1;
	this.constScrollerStateDisplayText = 2;
	
	// Stores the current scroller state
	this.currentScrollerState = this.constScrollerStateLeadIn;
	
	// Tracks the time in the present scroller state.
	this.currentScrollerStateTime = 0;
	
	// Scroller lead-in time (milliseconds)
	this.constScrollerStateLeadInTime = 4000;
	
	// Scroller fade-in time (milliseconds)
	this.constScrollerStateFadeInTime = 3000;
	
	// Display update interval at which the scroller will be
	// updated
	this.constTextScrollerUpdateInterval = 2;
	
	// Current scroller update interval count (updating the scroller on each frame
	// can degrade performance).
	this.textScrollerIntervalCount = 0;
}

/**
 * Applies logic used to maintain factors that govern the data being
 *  displayed/rendered for the current scene
 * @param timeQuantum Time delta with respect to the previously-executed
 *                    animation step (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context associated with the
 *                                                      data being rendered
 */
mainFractalRenderingScene.prototype.updateScenePropertiesAsNecessary = function(timeQuantum, targetCanvasContext) {
	// Determine if the current image/transformation should be switched.
	if ((this.currentSceneRunningTimeMs > this.constMaxSceneRunningTimeMs) || !this.firstIterationExecuted) {
		this.currentSceneRunningTimeMs = 0.0;
		this.currentGrowthPhase = this.constGrowthPhaseTrunk;
		this.currentGrowthPhaseStateTime = 0.0;
		this.currentTrunkLengthMultiplier = 0.0;
		this.currentBranchLengthMultiplier = this.constMinBranchLengthMultiplier;
		
		this.generateNewTreeLengthFactors();
		this.computeNewWindSineFactors();
		this.generateRandomTreeDepth();
	}
	
	this.updateGrowthPhaseState(timeQuantum);
	
	this.textScrollerIntervalCount++;
	if (this.textScrollerIntervalCount > this.constTextScrollerUpdateInterval) {
		this.textScrollerIntervalCount = 0;
	}
}

/**
 * Updates/generates new values for the factors used to determine
 *  the time-parameterized tree sway "wind" value
 */
mainFractalRenderingScene.prototype.computeNewWindSineFactors = function() {
	
	this.firstSinePeriodMultiplier = this.generateRandomValueInRange(this.constMaxSinePeriodMultiplier, this.constMinSinePeriodMultiplier);
 	this.secondSinePeriodMultiplier = this.generateRandomValueInRange(this.constMaxSinePeriodMultiplier, this.constMinSinePeriodMultiplier);
	
	this.firstSineAmplitude = this.generateRandomValueInRange(this.constMaxSineAmplitude, this.constMinSineAmplitude);
	this.secondSineAmplitude = this.generateRandomValueInRange(this.constMaxSineAmplitude, this.constMinSineAmplitude);
	
	this.secondSinePhaseShift = this.generateRandomValueInRange(this.constMaxSinePeriodPhaseShift, 0.0);
}

/**
 * Generates a random value that is situated in the specified
 *  numeric range.
 * @param maxRangeValue {number} Upper bound of the numeric range in which
 *                               the random number should be generated
 * @param minRangeValue {number} Lower bound of the numberic range in which
 *                               the random number should be generated
 *
 * @return A random number within the specified numeric range
 */
mainFractalRenderingScene.prototype.generateRandomValueInRange = function(maxRangeValue, minRangeValue) {
	var randomValueInRange = 0.0;
	
	if (validateVar(minRangeValue) && validateVar(maxRangeValue)) {
		randomValueInRange = ((maxRangeValue - minRangeValue) * Math.random()) + minRangeValue;		
	}
	
	return randomValueInRange;
}

/**
 * Updates/generates the tree branch scaling factors that define the
 *  overall shape/inter-branch depth scaling
 */
mainFractalRenderingScene.prototype.generateNewTreeLengthFactors = function() {	
	this.currentInterLevelScaleDownFactor = this.generateRandomValueInRange(this.constMaxInterLevelScaleDownFactor, this.constMinInterLevelScaleDownFactor);
	this.currentMinTreeLengthFraction = this.generateRandomValueInRange(this.constMaxTreeLevelLowLengthFraction, this.constMinTreeLevelLowLengthFraction);
	this.currentMaxTreeLengthFraction = this.generateRandomValueInRange(this.constMaxTreeLevelHighLengthFraction, this.constMinTreeLevelHighLengthFraction);
}

/**
 * Updates the scaling factor for the trunk/branches of the tree, in addition
 *  to tracking/updating whether or not the trunk or the branch scaling
 *  factor(s) should be updated
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
mainFractalRenderingScene.prototype.updateGrowthPhaseState = function (timeQuantum) {
	
	this.currentGrowthPhaseStateTime += timeQuantum;
	
	if (this.currentGrowthPhase == this.constGrowthPhaseTrunk) {
		// Update the scaling factor for the trunk of the tree.
		this.currentTrunkLengthMultiplier = Math.min(this.constMaxMultiplierValue, (this.currentGrowthPhaseStateTime / this.constTrunkGrowthPhaseDuration));
		if (this.currentGrowthPhaseStateTime >= this.constTrunkGrowthPhaseDuration) {
			this.currentGrowthPhase = this.constGrowthPhaseBranches;
			this.currentBranchLengthMultiplier = this.constMinBranchLengthMultiplier;
			this.currentGrowthPhaseStateTime = 0.0;
		}
	}
	else if (this.currentGrowthPhase == this.constGrowthPhaseBranches) {
		// Update the scaling factor for all tree branches.
		var branchLengthMultiplierRangeDifference = (this.constMaxMultiplierValue - this.constMinBranchLengthMultiplier);
		var multiplierFractionInRange = (this.currentGrowthPhaseStateTime / this.constBranchGrowthPhaseDuration);
		this.currentBranchLengthMultiplier = Math.min(this.constMaxMultiplierValue,
			Math.max(this.constMinBranchLengthMultiplier, (branchLengthMultiplierRangeDifference * multiplierFractionInRange + this.constMinBranchLengthMultiplier)));
		if (this.currentGrowthPhaseStateTime >= this.constBranchGrowthPhaseDuration) {
			this.currentGrowthPhase = this.constGrowthPhaseIdle;
			this.currentGrowthPhaseStateTime = 0.0;
		}
	}
}

/**
 * Applies a globally-stored shader program, based on an index within the
 *  global shader program store, as the currently-active shader
 * @param textureIndex {number} An index used to reference a shader program
 *                              within the global shader program store
 * @param targetCanvasContext {WebGLRenderingContext2D} Context associated with the
 *                                                      data being rendered
 */
mainFractalRenderingScene.prototype.useIndexedShader = function(shaderIndex, targetCanvasContext) {
	if (shaderIndex < globalResources.getShaderProgramCount()) {
		var targetCanvasContext = globalResources.getMainCanvasContext();		
		if (targetCanvasContext != null) {
			var newShaderProgram = globalResources.getIndexedShaderProgram(shaderIndex);
			if (newShaderProgram != null) {
				// Activate the shader program...
				targetCanvasContext.useProgram(newShaderProgram);
				
				var vertexPositionAttribute = targetCanvasContext.getAttribLocation(newShaderProgram, "aVertexPosition");
				targetCanvasContext.enableVertexAttribArray(vertexPositionAttribute);
				
				var textureCoordinateAttribute = targetCanvasContext.getAttribLocation(newShaderProgram, "aTextureCoord");
				targetCanvasContext.enableVertexAttribArray(textureCoordinateAttribute);
				
				// Store the shader program for future access (shader
				// program parameters may need to be accessed during
				// rendering).
				this.currentShaderProgram = newShaderProgram;
				this.currentShaderProgramIndex = shaderIndex;
			}
		}
	}
}

/**
 * Updates/generates a sinusoidal wind "factor", which determines the
 *  instantaneous rotation of the tree trunk/branches
 */
mainFractalRenderingScene.prototype.computeWindFactor = function() {
	
	var baseSinePeriodDivisor = 3000.0;
	
	// Use the produce of two sine computations, each with random amplitudes,
	// periods, and phase shifts, in order to create an apparently-irregular
	// wind pattern.
	var firstSineComputation = this.firstSineAmplitude *
		Math.sin(this.firstSinePeriodMultiplier * this.currentSceneRunningTimeMs / baseSinePeriodDivisor);
	var secondSineComputation = this.secondSineAmplitude *
		Math.sin(this.secondSinePeriodMultiplier * this.currentSceneRunningTimeMs / baseSinePeriodDivisor + this.secondSinePhaseShift);
	
	var windFactor = firstSineComputation * secondSineComputation;
	
	return windFactor;
}

/**
 * Generates a random tree depth to be used during tree rendering,
 *  between the minimum and maximum specified tree depth values
 *
 * @see mainFractalRenderingScene.constMaxTreeDepth
 * @see mainFractalRenderingScene.constMinTreeDepth
 */
mainFractalRenderingScene.prototype.generateRandomTreeDepth = function() {	
	this.currentTreeDepth = Math.round(this.generateRandomValueInRange(this.constMaxTreeDepth, this.constMinTreeDepth));
}

/**
 * Renders the primary, texture-based portion of the scene
 * @param timeQuantum Time delta with respect to the previously-executed
 *                    animation step (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be drawn
 */
mainFractalRenderingScene.prototype.renderScene = function(timeQuantum, targetCanvasContext) {
	targetCanvasContext.clear(targetCanvasContext.COLOR_BUFFER_BIT);
	this.useIndexedShader(0);
	
	// Set the active vertex buffer...
	targetCanvasContext.bindBuffer(targetCanvasContext.ARRAY_BUFFER, this.imageQuadVertexBuffer);
	var vertexPositionAttribute = targetCanvasContext.getAttribLocation(this.currentShaderProgram, "aVertexPosition");
	targetCanvasContext.vertexAttribPointer(vertexPositionAttribute, this.vertexSize, targetCanvasContext.FLOAT, false, 0, 0);

	// Set the active texture coordinate buffer...
	targetCanvasContext.bindBuffer(targetCanvasContext.ARRAY_BUFFER, this.imageVertexTextureCoordinateBuffer);
	var textureCoordinateAttribute = targetCanvasContext.getAttribLocation(this.currentShaderProgram, "aTextureCoord");
	targetCanvasContext.vertexAttribPointer(textureCoordinateAttribute, this.textureCoordinateSize, targetCanvasContext.FLOAT, false, 0, 0);
	
	// Set the active texture...
	//targetCanvasContext.activeTexture(targetCanvasContext.TEXTURE0);
	// Set the active overlay [level 1] texture.
	var overlayTexture = globalResources.getOverlayTexture();
	if (overlayTexture != null) {
		targetCanvasContext.activeTexture(targetCanvasContext.TEXTURE1);
		targetCanvasContext.bindTexture(targetCanvasContext.TEXTURE_2D, overlayTexture);
		targetCanvasContext.uniform1i(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uOverlaySampler"), 1);
	}
	
	// Update the time quantum value within the shader program.
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_trunkLengthMultiplier"),
		this.currentTrunkLengthMultiplier);
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_branchLengthMultiplier"),
		this.currentBranchLengthMultiplier);
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_windFactor"),
		this.computeWindFactor());
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_interLevelScaleDownFactor"),
		this.currentInterLevelScaleDownFactor);
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_minTreeLengthFraction"),
		this.currentMinTreeLengthFraction);
	targetCanvasContext.uniform1f(targetCanvasContext.getUniformLocation(this.currentShaderProgram,	"uniform_maxTreeLengthFraction"),
		this.currentMaxTreeLengthFraction);
	targetCanvasContext.uniform1i(targetCanvasContext.getUniformLocation(this.currentShaderProgram, "uniform_maxTreeDepth"),
		this.currentTreeDepth);

	// ...Render the quad containing the scene texture.
	targetCanvasContext.drawArrays(targetCanvasContext.TRIANGLE_STRIP, 0, this.imageQuadVertexCount);
}

/**
 * Updates the display state of the scroller, depending upon the
 *  amount of total time that has elapsed in the scene execution
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
mainFractalRenderingScene.prototype.updateScrollerState = function(timeQuantum) {
	this.currentScrollerStateTime += timeQuantum;

	if ((this.currentScrollerState === this.constScrollerStateLeadIn) &&
		(this.currentScrollerStateTime >= this.constScrollerStateLeadInTime)) {
		
		// Lead-in time has been completed - advance the scroller to the
		// fade-in phase.
		this.currentScrollerState = this.constScrollerStateFadeIn;
		this.currentScrollerStateTime = 0;
	}
	else if ((this.currentScrollerState === this.constScrollerStateFadeIn) &&
		(this.currentScrollerStateTime >= this.constScrollerStateFadeInTime)) {
	
		// The scroller fade-in phase has been completed - display the scroller
		// text.
		this.currentScrollerState = this.constScrollerStateDisplayText;
		this.currentScrollerStateTime = 0;	
	}
}

/**
 * Renders the text scroller output to a specified canvas context
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {CanvasRenderingContext2D} The output canvas context
 *                                                       to which the text scroller
 *                                                       will be rendered
 * @param webGlCanvasContext {WebGLRenderingContext2D} A WebGL rendering context used for
 *                                                     writing the final output into a texture
 */
mainFractalRenderingScene.prototype.renderScrollerSection = function(timeQuantum, targetCanvasContext,
																		webGlCanvasContext) {
				
	// Determine whether not to draw/update the scroller, based upon the current update interval
	// count.
	var drawScroller = (this.textScrollerIntervalCount >= this.constTextScrollerUpdateInterval);
	if (validateVar(targetCanvasContext) && (this.currentScrollerState !== this.constScrollerStateLeadIn) &&
		drawScroller) {
			
		// Erase any existing scroller text...
		targetCanvasContext.clearRect(this.scrollerCoordX, this.scrollerCoordY,
			targetCanvasContext.canvas.width, this.messageScroller.getTextAreaHeight());
	
		// Draw a background strip in order to enhance scroller readability.
		targetCanvasContext.save();
		targetCanvasContext.fillStyle = this.scrollerBackgroundColor.getRgbaIntValueAsStandardString();
		
		// Set the alpha for the scroller background (the alpha is variable as the scroller background
		// fades-in).
		targetCanvasContext.globalAlpha = (this.currentScrollerState === this.constScrollerStateFadeIn) ?
			Constants.scrollerBackgroundUnitAlpha * (this.currentScrollerStateTime / this.constScrollerStateFadeInTime) :
			Constants.scrollerBackgroundUnitAlpha;
		targetCanvasContext.fillRect(this.scrollerCoordX, this.scrollerCoordY,
			targetCanvasContext.canvas.width, this.messageScroller.getTextAreaHeight());
			
		targetCanvasContext.restore();
		
		// Display the scroller text.
		if (this.currentScrollerState === this.constScrollerStateDisplayText) {
			this.messageScroller.renderScroller(targetCanvasContext, this.scrollerCoordX, this.scrollerCoordY);
			this.messageScroller.advanceScroller();
		}
	}
	
	// Write the canvas data into a texture.
	var overlayTexture = globalResources.getOverlayTexture();
	if ((overlayTexture != null) && drawScroller){
		updateDynamicTextureWithCanvas(webGlCanvasContext, overlayTexture, targetCanvasContext.canvas);
	}
	
	this.updateScrollerState(timeQuantum);
}

/**
 * Executes a time-parameterized single scene animation step
 * @param timeQuantum Time delta with respect to the previously-executed
 *                    animation step (milliseconds)
 * @param targetCanvasContext {CanvasRenderingContext2D} Context onto which
 *                            the scene data will be drawn
 * @param overlayCanvasContext {CanvasRenderingContext2D} Context onto which
 *                             data to be superimposed on the scene will be
 *                             drawn
 */
mainFractalRenderingScene.prototype.executeStep = function(timeQuantum, targetCanvasContext, overlayCanvasContext) {
	this.updateScenePropertiesAsNecessary(timeQuantum, targetCanvasContext);
	this.renderScrollerSection(timeQuantum, overlayCanvasContext, targetCanvasContext);
	this.renderScene(timeQuantum, targetCanvasContext);
	
	this.firstIterationExecuted = true;
	
	this.totalElapsedSceneTimeMs += timeQuantum;
	this.currentSceneRunningTimeMs += timeQuantum;
}
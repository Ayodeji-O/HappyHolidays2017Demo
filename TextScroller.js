// TextScroller.js - Encapsulates a scrolling text generator that renders its
//                   output to a canvas object
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js

function textScroller(fontSizePx, fontName, fontStyle) {
	// Will contain the scroller string
	this.sourceString = "";
	
	// The scroller text will be segmented, depending
	// upon the total length of the text - this array
	// will hold the scroller text segments.
	this.scrollerTextSegments = new Array();
	this.scrollerTextSegmentRenderedLengths = new Array();
	
	// Font name and style
	this.fontName = fontName;
	this.fontStyle = fontStyle;
	
	// Multiplier allotted in order to provide region for
	// the font descent.
	this.constFontDescentCompensationFactor = 1.5	
	
	// Size of the font used for the text
	this.renderedTextFontSizePx = fontSizePx;
	
	// Color of the text to be rendered.
	this.renderedTextColorString = "RGBA(255, 255, 255, 255)";
	
	// Current segment index.
	this.currentSegmentIndex = 0;
	
	// Current scroller position, within the current segment, in pixels.
	this.currentPositionInCurrentSegment = 0;
	
	// Increment for which the text should be scrolled.
	this.scrollIncrement = 4;
	
	// Will be true if the end of the scroller has been reached - the
	// scroller will be reset to the start of the text at the next
	// rendering attempt.
	this.endOfScrollerReached = false;
	
	// There will be two canvases, at most, that are presented on-screen
	// at once. Each canvas will display a text segment.
	this.leadTextCanvas = document.createElement("canvas");
	this.trailingTextCanvas = document.createElement("canvas");
}

/**
 * Initializes the scroller after a string has been assigned -
 *  this routine must be invoked after the scroller text has
 *  been altered
 * @param referenceCanvasContext {CanvasRenderingContext2D} The canvas that will
 *                                                          be used as reference
 *                                                          canvas when determining
 *                                                          text metrics
 */
textScroller.prototype.initializeAfterStringAssignment = function(referenceCanvasContext) {
	if (validateVar(referenceCanvasContext) && (referenceCanvasContext.canvas.width > 0)) {
		this.endOfScrollerReached = false;
		this.currentSegmentIndex = 0;
		this.currentPositionInCurrentSegment = 0;
	
		// Determine the number of text segments. A single text segment should not
		// be longer than the width of the screen when rendered.
		this.setScrollerFont(referenceCanvasContext);
		var totalTextOutputLength = referenceCanvasContext.measureText(this.sourceString).width;
		var numScrollerSegments =
			Math.ceil(totalTextOutputLength / referenceCanvasContext.canvas.width);
		
		this.clearTextSegmentData();
				
		this.createStringSegments(numScrollerSegments, referenceCanvasContext);
				
		this.setupInitialTextSegments(referenceCanvasContext.canvas.width);
	}
}

/**
 * Performs the initial set-up that is required before the first rendering
 *  of the scroller text
 * @param firstSegmentPositionOffset {number} Text offset required to start the scrolling text at
 *                                            the extreme edge of the target canvas
 */
textScroller.prototype.setupInitialTextSegments = function(firstSegmentPositionOffset) {
	if (validateVar(firstSegmentPositionOffset)) {
		// Offset the text such that it starts scrolling from the extreme edge of the
		// target canvas...
		this.currentPositionInCurrentSegment = -firstSegmentPositionOffset;

		// Render the initial segments to the internal canvases.
		this.renderTextToInternalCanvas(this.leadTextCanvas, this.scrollerTextSegments[0],
			this.scrollerTextSegmentRenderedLengths[0]);
		if (this.scrollerTextSegments.length > 1) {
			this.renderTextToInternalCanvas(this.trailingTextCanvas, this.scrollerTextSegments[1],
			this.scrollerTextSegmentRenderedLengths[1]);
		}
	}
}

/**
 * Removes internally-stored segmented text data (segmented
 *  text data is required in order to prevent rendering
 *  text to one large contiguous canvas)
 */
textScroller.prototype.clearTextSegmentData = function() {
	// Remove any previously-existing text segments...
	while (this.scrollerTextSegments.length > 0) {
		this.scrollerTextSegments.pop();
		this.scrollerTextSegmentRenderedLengths.pop();
	}
}

/**
 * Creates text segments that will be used during scrolling/
 *  text rendering (the text must be set beforehand with
 *  setSourceString(...))
 * @param numScrollerSegments {number} Number of segments into which
 *                                     the text will be divided
 * @param referenceCanvasContext {CanvasRenderingContext2D} The reference canvas that
 *                                                          will be used when determining
 *                                                          text metrics
 * @see textScroller.setSourceString
 */
textScroller.prototype.createStringSegments = function(numScrollerSegments, referenceCanvasContext) {
	// Create the list of string segments.	
	if (validateVar(numScrollerSegments) && validateVar(referenceCanvasContext)) {
		this.setScrollerFont(referenceCanvasContext);
		for (var segmentStorageLoop = 0; segmentStorageLoop < numScrollerSegments;
			segmentStorageLoop++) {
		
			var segmentStartIndex = segmentStorageLoop *
				Math.ceil(this.sourceString.length / numScrollerSegments);
			var segmentEndIndex = (segmentStorageLoop + 1) *
				Math.ceil(this.sourceString.length / numScrollerSegments);
			segmentEndIndex = Math.min(segmentEndIndex, this.sourceString.length);

			var currentStringSegment = this.sourceString.substring(segmentStartIndex, segmentEndIndex)
			this.scrollerTextSegments.push(currentStringSegment);
			this.scrollerTextSegmentRenderedLengths.push(
				Math.ceil(referenceCanvasContext.measureText(currentStringSegment).width));
		}
	}
}

/**
 * Sets the string that will be rendered by the scroller
 * @param sourceString {string} String that will be rendered by the scroller
 */
textScroller.prototype.setSourceString = function(sourceString) {
	if (validateVar(sourceString) && (typeof(sourceString) === 'string')) {
		this.sourceString = sourceString;
	}
}

/**
 * Retrieves the total approximate height of the text area in which
 *  the scroller will be rendered
 * @return {number} The height of the text area, in pixels
 */
textScroller.prototype.getTextAreaHeight = function() {
	return this.constFontDescentCompensationFactor * this.renderedTextFontSizePx
}

/**
 * Determines if the scroller has been initialized, and is ready for
 *  operation
 * @return {boolean} True if the scroller is initialized/operational, false
 *                   otherwise
 */
textScroller.prototype.isInitialized = function () {
	return (this.scrollerTextSegments.length > 0) && !this.endOfScrollerReached;
}

/**
 * Advances the position of the scroller, ensuring that the scroller
 *  output is correct before rendering
 */
textScroller.prototype.advanceScroller = function() {
	this.currentPositionInCurrentSegment += this.scrollIncrement;

	if (this.currentPositionInCurrentSegment > this.leadTextCanvas.width) {
		// The leading canvas is now completely off-screen - set the trailing
		// canvas to be the leading canvas, and create a new trailing canvas...
		this.currentPositionInCurrentSegment = (this.currentPositionInCurrentSegment -
			this.leadTextCanvas.width);
		this.currentSegmentIndex++;

		if (this.currentSegmentIndex < this.scrollerTextSegments.length) {
			this.leadTextCanvas = this.trailingTextCanvas;
			this.trailingTextCanvas = document.createElement("canvas");
			if ((this.currentSegmentIndex + 1) < this.scrollerTextSegments.length) {
				// Write the text that is to be contained in the trailing canvas.
				this.renderTextToInternalCanvas(this.trailingTextCanvas,
					this.scrollerTextSegments[this.currentSegmentIndex + 1],
					this.scrollerTextSegmentRenderedLengths[this.currentSegmentIndex + 1]);
			}
		}
		else {
			// Force the scroller to re-initialize itself at the next rendering attempt.
			this.endOfScrollerReached = true;
		}
	}
}

/**
 * Applies the scroller font to the specified target canvas
 * @param targetCanvasContext {CanvasRenderingContext2D} The context of the canvas that is to have
 *                                                       the scroller font applied
 */
textScroller.prototype.setScrollerFont = function(targetCanvasContext) {
	if (validateVar(targetCanvasContext)) {
		targetCanvasContext.font = this.fontStyle + " " + this.renderedTextFontSizePx + "px " + this.fontName;
	}
}

/**
 * Renders the scroller to the target canvas in order to create scroller
 *   segments (called by advanceScroller - should not be directly invoked by
 *   clients - clients should instead use renderScroller)
 * @param targetCanvas {HTMLCanvasElement} Canvas object onto which the text will be rendered
 * @param sourceText {string} Text to be rendered to the cavans
 * @param renderedLength {number} Previously-determined length of the rendrered text,
 *                                in pixels, to be rendered to the canvas
 * @see textScroller.advanceScroller
 * @see textScroller.renderScroller
 */
textScroller.prototype.renderTextToInternalCanvas = function(targetCanvas, sourceText, renderedLength) {
	if (validateVar(sourceText) && validateVar(targetCanvas)) {
		// Size the canvas in a manner that is appropriate for the text being
		// received...
		targetCanvas.width = renderedLength;
		targetCanvas.height = this.getTextAreaHeight();
		var targetCanvasContext = targetCanvas.getContext("2d");
		
		// Write the text to the canvas.
		clearContext(targetCanvasContext, "RGBA(0, 0, 0, 0)");
		this.setScrollerFont(targetCanvasContext);
		targetCanvasContext.fillStyle = this.renderedTextColorString;
		targetCanvasContext.fillText(sourceText, 0, this.renderedTextFontSizePx);
	}
}

/**
 * Renders the scroller to a target canvas
 * @param targetCanvasContext The rendering context of the canvas in which the scroller
 *                            should be rendered
 * @param targetCoordX X-coordinate of the upper-left corner of the text position
 * @param targetCoordY Y-coordinate of the upper-left corner of the text position
 */
textScroller.prototype.renderScroller = function(targetCanvasContext, targetCoordX, targetCoordY) {
	if (validateVar(targetCanvasContext) && validateVar(targetCoordX) && validateVar(targetCoordY)) {
		if (!this.isInitialized()) {
			this.initializeAfterStringAssignment(targetCanvasContext);
		}
	
		// Render the text on the canvas, rendering both segments, since
		// the text may be truncated towards the end of the screen if
		// both segments are not drawn.
		targetCanvasContext.drawImage(this.leadTextCanvas,
			(targetCoordX - this.currentPositionInCurrentSegment),
			targetCoordY);
		targetCanvasContext.drawImage(this.trailingTextCanvas,
			(targetCoordX + this.leadTextCanvas.width - this.currentPositionInCurrentSegment),
			targetCoordY);
	}
}
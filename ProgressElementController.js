
function progressElementController() {
	this.progressDomElement = null;
	this.progressElementWidth = 0;
}

/**
 * Creates a progress bar, and inserts the progress
 *  bar into the DOM
 * @param parentElement {HTMLElement} The element that will serve
 *                                    as the parent container for the
 *                                    progress bar
 */
progressElementController.prototype.createProgressElement = function(parentElement, progressElementWidth) {
	var progressElement = null;
	var constProgressElementHeight = 40;
	var outerRectMargin = 1;
	
	if (validateVar(parentElement) && (parentElement instanceof HTMLElement)) {
		progressElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		progressElement.setAttribute("width", Constants.progressElementWidth);
		var absoluteVertCenteredHorizStyle = "position: absolute; top: 70%; left: 50%; transform: translateX(-50%)"
		progressElement.style = absoluteVertCenteredHorizStyle
		var innerProgressElements = this.buildInnerProgressElementsWithProgresFraction(
			this.progressDomElement, 0.0, Constants.progressElementWidth);
		parentElement.appendChild(progressElement);
	}
	
	this.progressElement = progressElement
	this.progressElementWidth = progressElementWidth;
}

/**
 * Completion function to be used with
 *  globalResources.setProgressFunction() - updates/draws
 *  a progress bar to be used during loading of image
 *  resources
 * @param progressFraction {number} Progress completion fraction
 *                                  (0.0 - 1.0, inclusive)
 * @see globalResources.setProgressFunction
 */
progressElementController.prototype.updateProgressElement = function(progressFraction) {
	if ((progressFraction >= 0.0) && (progressFraction <= 1.0))
	{
		while (this.progressDomElement.firstChild !== null) {
			progressElement.removeChild(progressElement.firstChild);
		}
		
		var innerProgressElements = this.buildInnerProgressElementsWithProgresFraction(this.progressDomElement,
			progressFraction, this.progressElementWidth);
	}
}


/**
 * Creates the inner constituent elements of a progress
 *  indicator, and inserts the elements into a DOM
 *  sub-tree using a specified parent element
 * @param progressParentElement The element that will ultimately
 *                              be used to contain the created
 *                              progress element
 * @param progressFraction A fraction indicating the progress of
 *                         a particular operation (0.0 - 1.0, inclusive)
 * @param elementWidth The desired width of the progress element to be
 *                     added
 * @return The created inner progress element upon success, null otherwise
 */
progressElementController.prototype.buildInnerProgressElementsWithProgresFraction = function(progressParentElement, progressFraction, elementWidth) {
	var innerProgressElements = null;
	
	var progressElement = null;
	var constProgressElementHeight = 40;
	var outerRectMargin = 2;
	
	if (validateVar(progressParentElement) && validateVar(progressFraction) && (typeof progressFraction == "number")) {
		var svgOuterRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		var svgInnerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		progressParentElement.appendChild(svgOuterRect);
		progressParentElement.appendChild(svgInnerRect);
		var outerRectWidth = elementWidth;		
		var innerRectMaxWidth = outerRectWidth -(2 * outerRectMargin);
		var innerRectHeight = constProgressElementHeight - (2 * outerRectMargin);
		svgOuterRect.setAttribute("width", outerRectWidth);
		svgOuterRect.setAttribute("height", constProgressElementHeight);
		svgOuterRect.setAttribute("x", 0);
		svgOuterRect.setAttribute("y", 0);
		svgOuterRect.style = "fill: #606060";
		
		svgInnerRect.setAttribute("width", innerRectMaxWidth * progressFraction);
		svgInnerRect.setAttribute("height", innerRectHeight);
		svgInnerRect.setAttribute("x", outerRectMargin);
		svgInnerRect.setAttribute("y", outerRectMargin);
		svgInnerRect.style = "fill: #8f8f8f";
		innerProgressElements = svgOuterRect;
	}
	
	return innerProgressElements;
}

/**
 * Removes the progress indication element from the
 *  DOM
 */
progressElementController.prototype.removeProgressElementFromDom = function() {
	if (validateVar(this.progressDomElement) && (this.progressDomElement instanceof Element) &&
		validateVar(this.progressDomElement.parentElement) ) {	
		
		var elementParent = this.progressDomElement.parentElement;
		elementParent.removeChild(this.progressDomElement);
	}
}
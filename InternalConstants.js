// InternalConstants.js - Contains common constants used within various classes/routines
// Author: Ayodeji Oshinnaiye

var Constants = {
	/**
	 * Width of front buffer canvas (and associated
	 *  backbuffer canvases)
	 */
	defaultCanvasWidth : 960,
	
	/**
	 * Height of front buffer canvas (and associated
	 *  backbuffer canvases)
	 *
	 */
	defaultCanvasHeight : 720,
	
	/**
	 * Width of the internally-stored image bitmap
	 *  representation of each source image
	 */
	internalBitmapWidth : 1024,
	
	/**
	 * Height of the internally-stored image bitmap
	 *  representation of each source image
	 */
	internalBitmapHeight: 1024,
			
	/**
	 * Width of the texture that will be used as
	 *  an overlay with respect to the primary
	 *  image textures
	 */
	overlayTextureWidth: 960,
	
	/**
	 * Height of the texture that will be used as
	 *  an overlay with respect to the primary
	 *  image textures
	 */
	overlayTextureHeight: 600,
	
	/**
	 * Width of the initially-displayed progress
	 *  bar/element
	 */
	progressElementWidth: 800,
	
	/**
	 * Number of milliseconds contained in one second
	 */
	millisecondsPerSecond : 1000,
	
	/**
	 * Maximum angular measurement, in degrees
	 */
	maxAngleDegrees : 360,
	
	/**
	 * Height of the scroller font, in pixels
	 */
	scrollerFontSizePx: 20,
	
	/**
	 * Font name of the scroller font
	 */
	scrollerFont: "Arial",
	
	/**
	 * Style applied to the scroller font
	 */
	scrollerFontStyle: "Italic",
	
	/**
	 * Alpha (transparency) value for the scroller background
	 */
	scrollerBackgroundUnitAlpha: 0.4,
	
	/**
	 * Intensity of the scroller background
	 */
	scrollerBackgroundUnitIntensity: 0.1,
	
	/**
	 * Message text to be used by the message text
	 *  scroller
	 */
	messageText: "Merry holidays from Katie and Ayo! May your holidays be cheery and bright! We hope that you enjoy our tree (even though there are no presents included with it)."
}
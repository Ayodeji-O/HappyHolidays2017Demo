// Utility.js - Classes and utility routines used within the "Happy Holidays 2017" demo
// Author: Ayodeji Oshinnaiye

/**
 * Validates a variable, ensuring that it
 *  is defined and non-null
 * @param [any] variable Variable to be validated
 * @return True if the variable is defined and
 *         non-null, false otherwise
 */
function validateVar(variable) {
    // Ensure that the variable is usable.
    return ((typeof(variable) !== 'undefined') &&
        (variable !== null));
}

/**
 * Validates and returns a number, returning the
 *  provided number if the number is valid, zero otherwise
 * @param sourceNumber The number to be validated and returned
 * @return The provided number if the number is valid, zero otherwise
 */
function returnValidNumOrZero(sourceNumber) {
	return (typeof(sourceNumber) === "number" ? sourceNumber : 0.0);
}

/** 
 * Clears a context, using the specified fill style
 * @param targetContext The context that is to be cleared
 * @param fillStyleStr A string that specifies the type
 *                     of fill pattern/color that will be
 *                     used to clear the context
 */
function clearContext(targetContext, fillStyleStr) {
    if (validateVar(targetContext)) {
        targetContext.fillStyle = fillStyleStr;
        targetContext.fillRect(0, 0,
            targetContext.canvas.width,
            targetContext.canvas.height);
    }
}

/**
 * Retrieves a random value between the closed interval
 *  specified by two provided values
 * @param minRandomValue Minimum random value that will be returned
 * @param maxRandomValue Maximum random value that will be returned
 * @return A value within the specified close interval upon success,
 *         zero otherwise
 */
function getRangedRandomValue(minRandomValue, maxRandomValue) {
	rangedRandomValue = 0.0;

	if (validateVar(minRandomValue) && validateVar(maxRandomValue) &&
		(minRandomValue <= maxRandomValue)) {
		rangedRandomValue = (maxRandomValue - minRandomValue) * Math.random() + minRandomValue;
	}
	
	return rangedRandomValue;
}

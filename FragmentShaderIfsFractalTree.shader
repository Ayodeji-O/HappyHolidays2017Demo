// FragmentShaderIfsFractalTree.shader - Generates an iterative-fractal
//  system conifer tree using a numeric L-system.
//
// L-system concept (which resolves inability to use recursive
// function calls in fragment shaders) adapted from the
// a Lindenmayer Systems (L-System) fragment shader implementation
// presented on Shadertoy.com:
// 
// https://www.shadertoy.com/view/XtyGzh 
//
// Author: Ayodeji Oshinnaiye

precision highp float;

varying mediump vec2 vTextureCoord;
uniform sampler2D uOverlaySampler;

uniform float uniform_trunkLengthMultiplier;
uniform float uniform_branchLengthMultiplier;
uniform float uniform_windFactor;

// Scaling factor applied to host branches during
// successive depth recursions.
uniform float uniform_interLevelScaleDownFactor;

// Length ratio between the highest branch level and the host branch.
uniform float uniform_minTreeLengthFraction;
// Length ratio between the lowest branch level and the host branch.
uniform float uniform_maxTreeLengthFraction;
// Maximum recursion depth
uniform int uniform_maxTreeDepth;


// Microsoft Edge browser won't evaluate acos(-1.0) during shader compilation...
const float PI = 3.1415926535897932384626433832795;
//const float PI = acos(-1.0);
const float BRANCH_WIDTH = 0.020;
const int SUBBRANCHES_PER_HOST_BRANCH = 8;
const int MAX_RECURSION_DEPTH = 3;
// Microsoft Edge browser won't evaluate int(pow(float(SUBBRANCHES_PER_HOST_BRANCH), float(MAX_RECURSION_DEPTH))) during shader compilation...
const int MAX_TOTAL_BRANCHES = 512;
//const int MAX_TOTAL_BRANCHES = int(pow(float(SUBBRANCHES_PER_HOST_BRANCH), float(MAX_RECURSION_DEPTH)));

// Distance from the branch where the maximum color intensity will be rendered for a fragment.
const float DISTANCE_THRESHOLD = 0.001;
// Minimum distance to branch at which a fragment will be depicted for the branch.
const float OUTER_DISTANCE_THRESHOLD = DISTANCE_THRESHOLD * 1.5;

const vec2 VECTOR_UP = vec2(0.0, 1.0);
const vec2 POINT_ORIGIN = vec2(0.5, 0.5);
const vec2 POINT_ZERO_ORIGIN = vec2(0.0, 0.0);

const float GREENCOMPONENT_INITIAL = 0.4;
const float GREENCOMPONENT_FINAL = 0.9;

const float BRANCHES_PER_SIDE = (float(SUBBRANCHES_PER_HOST_BRANCH) / 2.0);
// Distance between branches along the host branch.
const float BRANCH_DISPLACEMENT_FRACTION_ALONG_HOST = 1.0 / BRANCHES_PER_SIDE;

float MAX_TREE_LEVEL_LENGTH_FRACTION = uniform_maxTreeLengthFraction;
float MIN_TREE_LEVEL_LENGTH_FRACTION = uniform_minTreeLengthFraction;

float INTERLEVEL_SCALE_DOWN_FACTOR = uniform_interLevelScaleDownFactor;
const float BRANCH_ROTATION_ANGLE = (PI * 3.2/4.0);
const float WIND_MAX_ROTATION_ANGLE = (PI / 20.0);

const vec2 INITIAL_TRUNK_VECTOR = vec2( 0.0, -0.6 );
const vec2 INITIAL_TRUNK_BASE_POINT = vec2( 0.5, 0.8 );

const float TRUNK_MAX_SWAY_ANGLE_AMPLITUDE = PI / 60.0;

float SUBBRANCH_COUNT_LOGARITHM = log2(float(SUBBRANCHES_PER_HOST_BRANCH));

// Maximum distance from the base trunk point for pixels
// in which the tree computation is to be performed.
// (Microsoft Edge browser won't evaluate length(INITIAL_TRUNK_VECTOR) during shader compilation...)
const float MAX_INCLUSION_DISTANCE = 0.60 * 0.70;

float MAX_BRANCH_INCLUSION_DISTANCE_FRACTION = INTERLEVEL_SCALE_DOWN_FACTOR * 2.5;

/**
 * Rotates a point around a provided point, using the specified rotation
 *  angle
 *  
 * @param targetPoint The point that is to be rotated
 * @param rotationOrigin The center/origin of the rotation operation
 * @param rotationAngle The angle for the target point to be rotated, in radians
 *
 * @return The rotated point
 */    
vec2 rotatePoint( vec2 targetPoint, vec2 rotationOrigin, float rotationAngle )
{
    // 2D Rotation
    // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/2drota.htm
    // x' = x cos Θ - y sin Θ
	// y' = x sin Θ + y cos Θ
    
    mat2 rotationMatrix = mat2(cos(rotationAngle), sin(rotationAngle), -sin(rotationAngle), cos(rotationAngle));
    vec2 rotatedPoint = (targetPoint - rotationOrigin) * rotationMatrix;
    
    rotatedPoint += rotationOrigin;

    return rotatedPoint;
}

/**
 * Returns the signed distance to a cylinder (centered at the origin) with
 *  flat ends
 *  
 * @param queryPoint The point for which the distance to a cylinder
 *                   should be determined
 * @param cylinderDimensions Dimensions of the cylinder (x component defines
 *                           the cylinder width, y component defines the cylinder
 *                           height)
 *
 * @return The distance to the defined cylinder
 */    
float signedDistanceToCappedCylinder(const vec2 queryPoint, const vec2 cylinderDimensions)
{
    vec2 queryPoint2 = queryPoint - vec2(0.0, cylinderDimensions.y);
	// Adapted from signed distance function for a capped cylinder
	// "Modeling with Distance Functions"
	// http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
	vec2 distance = abs(vec2(length(queryPoint2.x), queryPoint2.y)) - cylinderDimensions;
	return min(max(distance.x, distance.y), 0.0) + length(max(distance, 0.0));	
}

/**
 * Returns the signed distance to a cylinder with rounded
 *  ends
 *  
 * @param queryPoint The point for which the distance to a capsule
 *                   should be determined
 * @param capStartPoint Start of the capsule for which
 *                      the distance should be determined
 * @param capEndPoint End of the capsule for which the distance
 *                    should be determined
 * @param endRadius Radius for the terminal points of the capsule
 *
 * @return The distance to the defined line segment
 */
float signedDistanceToCapsule( vec2 queryPoint, vec2 capStartPoint, vec2 capEndPoint, float endRadius )
{
	// Adapted from signed distance function for a capsule/line
	// "Modeling with Distance Functions"
	// http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
    vec2 pa = queryPoint - capStartPoint, ba = capEndPoint - capStartPoint;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - endRadius;
}


/**
 * Returns the signed distance to a specified line segment
 *  
 * @param queryPoint The point for which the distance to a line
 *                   segment should be determined
 * @param segmentStartPoint Start of the line segment for which
 *                          the distance should be determined
 * @param segmentWidth Width of the line segment
 * @param segmentVector Vector that defines the direction/length
 *                      of the line segment
 *
 * @return The distance to the defined line segment
 */
float distanceToLineSegment(const vec2 queryPoint, const vec2 segmentStartPoint, const float segmentWidth, const vec2 segmentVector)
{
    float distanceToSegment = 0.0;
        
	float segmentVectorLength = length(segmentVector);
    vec2 translatedQueryPoint = queryPoint - segmentStartPoint;
    vec3 crossProduct = cross(vec3(segmentVector, 0.0), vec3(VECTOR_UP, 0.0));
    // Inverse cosine of the dot product will only yield angles between 0.0 and PI.
    // Use the cross product in order to determine the proper size on with the vector
    // lies with respect to the up vector.
    float angleSideMultiplier = (2.0 * step(0.0, crossProduct.z)) - 1.0;
    float rotationAngle = -angleSideMultiplier * acos(dot(segmentVector, VECTOR_UP) / (segmentVectorLength * length(VECTOR_UP)));
    vec2 rotTransQueryPoint = rotatePoint(translatedQueryPoint, vec2(0, 0), rotationAngle);
    //vec2 cylinderDimensions = vec2(segmentWidth, segmentVectorLength * 0.5);
    //distanceToSegment = signedDistanceToCappedCylinder(rotTransQueryPoint, cylinderDimensions);
	
	const float kEndPointRadius = BRANCH_WIDTH / 2.0;
	distanceToSegment = signedDistanceToCapsule(rotTransQueryPoint, POINT_ZERO_ORIGIN, vec2(0, segmentVectorLength), kEndPointRadius);

	return distanceToSegment;
}

/**
 * Returns the nearest power of a number in the given numeric
 *  base (branch count) that is less than or equal to a specific
 *  number. (Log of a specific numeric base, rounded up to the nearest
 *  integer)
 *
 * @param queryNumber The number for which the power should
 *                    be determined
 *
 * @return The nearest power of a given number in the
 *         given numeric base that is less than or equal
 *         to a specific number
 *
 * @see SUBBRANCH_COUNT_LOGARITHM
 */
int nearestPowerOfBranchCountBase(float queryNumber)
{
	return int(log2(max(1.0, queryNumber)) / SUBBRANCH_COUNT_LOGARITHM);
}

/**
 * Returns the nearest power of a number in the given numeric
 *  base (branch count) that is greater than or equal to a specific
 *  number. (Log of a specific numeric base, rounded up to the nearest
 *  integer)
 *
 * @param queryNumber The number for which the power should
 *                    be determined
 *
 * @return The nearest power of a given number in the
 *         given numeric base that is greater than or equal
 *         to a specific number
 *
 * @see SUBBRANCH_COUNT_LOGARITHM
 */
int nearestPowerOfBranchCountBaseGreaterEqual(float queryNumber)
{
	return int(max(ceil(log2(max(1.0, queryNumber) / SUBBRANCH_COUNT_LOGARITHM)), 1.0));
}

/**
 * Determines the appropriate fragment color for a fragment at a particular
 *  location, as required in order to generate a tree representation
 * @param currentPoint     Location of the fragment for which the color is
 *                         to be determined
 * @param branchHalfWidth  Half-width of a tree branch
 *
 * @return A four-component fragment color
 */
vec4 treeSceneFragColor( const vec2 currentPoint, const float branchHalfWidth )
{
    vec4 finalFragmentColor = vec4(0.0, 0.0, 0.0, 0.0);
    
    // Prevent unnecessary computations - if the fragment is not near
    // the tree, do not perform a tree branch computation.
    if (distance(INITIAL_TRUNK_BASE_POINT + (INITIAL_TRUNK_VECTOR / 2.0), currentPoint) <= MAX_INCLUSION_DISTANCE)
    {
		vec2 trunkVector = rotatePoint((INITIAL_TRUNK_VECTOR * uniform_trunkLengthMultiplier), vec2(0, 0), TRUNK_MAX_SWAY_ANGLE_AMPLITUDE * uniform_windFactor);
	
        float distanceToTrunk = distanceToLineSegment(currentPoint,
                                                      INITIAL_TRUNK_BASE_POINT,
                                                      branchHalfWidth,
                                                      trunkVector);
		float finalDistanceToTree = OUTER_DISTANCE_THRESHOLD;
		
		// Recursion depth evaluated for the branch that was determined to be within
		// the distance threshold.
		int depthAtEvaluatedDistance = 0;

        bool branchDistanceThresholdReached = false;
		int totalBranchCount = int(pow(float(SUBBRANCHES_PER_HOST_BRANCH), float(uniform_maxTreeDepth)));
        int branchCount = totalBranchCount;
        for (int subBranchLoop = 0; subBranchLoop < MAX_TOTAL_BRANCHES; subBranchLoop++)
        {   
            if (branchDistanceThresholdReached || (branchCount < 0))
            {
                break;
            }

			vec2 currentHostVector = trunkVector;
            vec2 currentStartPoint = INITIAL_TRUNK_BASE_POINT;

            // Tree depth is proportional to the base x logarithm of the
            // branch count, where x is the number of branches per hsot
            // branch.
            int currentMaxDepth = nearestPowerOfBranchCountBaseGreaterEqual(float(branchCount));

            // An L-system, coded in base x, where x is the number of branches
            // per host branch.
            float branchLineageCoding = float(branchCount - 1);
			int currentDepth = uniform_maxTreeDepth;
            for (int depthLoop = MAX_RECURSION_DEPTH; depthLoop >= 1 ; depthLoop--)
            {
				currentDepth = depthLoop - (MAX_RECURSION_DEPTH - uniform_maxTreeDepth);
				if (currentDepth == 0)
				{
					break;
				}
				
				// Nearest power of x^n, where x is the number of branches per host branch.
				float nearestBranchBaseNumber = pow(float(SUBBRANCHES_PER_HOST_BRANCH), float(currentDepth - 1));
				// "Level" of branch along host branch.
				int branchLevel = int(branchLineageCoding / nearestBranchBaseNumber);
				float halfBranchLevel = float(branchLevel / 2);
				
				// The branches will start a short distance away from the base of the
				// host branch/trunk
				vec2 branchStartPoint = ((currentHostVector * BRANCH_DISPLACEMENT_FRACTION_ALONG_HOST * (halfBranchLevel + 1.0)) + currentStartPoint);
				vec2 branchEndPoint = POINT_ZERO_ORIGIN;

				// Distance verification - abort early if the current pixel is not
				// near the branch.
				if (distance(branchStartPoint, currentPoint) <= (MAX_BRANCH_INCLUSION_DISTANCE_FRACTION * length(currentHostVector)))
				{
					// Update the number of branches, which will be interpreted as a base x
					// number (where x is the number of sub-branches per branch - the digits
					// are used as an L-system in order to describe a specific lineage path
					// within the tree).
					branchLineageCoding = branchLineageCoding - (nearestBranchBaseNumber * float(branchLevel));

					// Reduce the length of the branches that are further along the tree,
					// in order to simulate a conifer tree profile.
					float branchLength = mix(MAX_TREE_LEVEL_LENGTH_FRACTION, MIN_TREE_LEVEL_LENGTH_FRACTION, halfBranchLevel / float(SUBBRANCHES_PER_HOST_BRANCH / 2)) * uniform_branchLengthMultiplier;
					currentHostVector *= branchLength;

					// Divide the branches into left and right sides along the host branch.
					int directionBias = int(mod(float(branchLevel), 2.0) * 2.0);
					float rotationDirectionBias = float(directionBias) - 1.0;
					branchEndPoint = ((currentHostVector * INTERLEVEL_SCALE_DOWN_FACTOR) + branchStartPoint);
					// ...Apply a "wind" factor for branch rotation.
					float windRotationAngle = WIND_MAX_ROTATION_ANGLE * float(currentDepth) / float(uniform_maxTreeDepth) * uniform_windFactor;
					branchEndPoint = rotatePoint(branchEndPoint, branchStartPoint, ((BRANCH_ROTATION_ANGLE * rotationDirectionBias) + windRotationAngle));
					vec2 branchVector = branchEndPoint - branchStartPoint;                

					currentHostVector = branchVector;
					currentStartPoint = branchStartPoint;

					float distanceToBranch = distanceToLineSegment(currentPoint, branchStartPoint, branchHalfWidth, branchVector);

					finalDistanceToTree = min(distanceToBranch, distanceToTrunk);
					if (finalDistanceToTree < OUTER_DISTANCE_THRESHOLD)                        
					{
						branchDistanceThresholdReached = true;
						depthAtEvaluatedDistance = currentDepth;
						break;
					}
				}
				else
				{
					// Subtract the lineage-coded number from the branch count,
					// ensuring that this branch never visited again, as it failed
					// the rough distance threshold test.
					branchCount = branchCount - (int(nearestBranchBaseNumber) + 1);
					break;
				}
            }

            branchCount--;
        }
		
		float distBasedColorComponent = 0.0;

		// Darken branches that are deeper within the branch hierarchy.
		float currentGreenComponent = mix(GREENCOMPONENT_INITIAL, GREENCOMPONENT_FINAL, float(depthAtEvaluatedDistance) / float(MAX_RECURSION_DEPTH) );
        if (finalDistanceToTree < OUTER_DISTANCE_THRESHOLD)                        
        {
			float unitDistanceFactor = smoothstep(DISTANCE_THRESHOLD, 0.0, finalDistanceToTree);
			distBasedColorComponent = currentGreenComponent * unitDistanceFactor;
			finalFragmentColor = vec4(0.0, 0.5, 0.0, distBasedColorComponent);
        }
    }
	
    return finalFragmentColor;
}





void main() {
	
	// Blend the output with the overlay texture.
	vec4 baseColor = treeSceneFragColor(vTextureCoord, BRANCH_WIDTH / 2.0);
	vec4 overlayColor = texture2D(uOverlaySampler, vec2(vTextureCoord.s, vTextureCoord.t));	
	vec4 baseColorMultiplier = vec4(1.0, 1.0, 1.0, 1.0) - overlayColor.wwww;

	gl_FragColor = (baseColor * baseColorMultiplier) + (overlayColor * vec4(overlayColor.www, 1.0));
}
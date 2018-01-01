// Author: Ayodeji Oshinnaiye

attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

varying mediump vec2 vTextureCoord;

void main() {
	// Position the vertex in its specified position (no transformations)
	gl_Position = vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
}

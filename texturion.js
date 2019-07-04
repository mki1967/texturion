var makeShaderProgramTool= function(gl, vertexShaderSource, fragmentShaderSource){
    /* Parameters:
       gl - WebGL context
    */

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(vertexShader));
	return null;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(fragmentShader));
	return null;
    }

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	console.log("Could not initialise shaders");
	return null;
    }
    // SUCCESS
    return shaderProgram;
};


const texSize= 256;
var renderTextureVS=""+
    "const float PI = " + Math.PI +";\n"+
    "const int texSize= "+texSize+";\n"+
    "float R(float x,float y){ return  0.5; }\n"+
    "float G(float x,float y){ return  0.5; }\n"+
    "float B(float x,float y){ return  0.5; }\n"+
    "float A(float x,float y){ return  1.0; }\n"+
    "attribute float h;\n"+
    "uniform float v;\n"+
    "const float depth=1.0;\n"+
    "uniform mat3 xyz;\n"+
    "varying vec4 color;\n"+
    "void main()\n"+
    "{\n"+
    "  float  args[6];\n"+
    "  float h=h-float(texSize)/2.0;\n"+
    "  float v=v-float(texSize)/2.0;\n"+
    "  float x= h/float(texSize); \n"+
    "  float y= v/float(texSize); \n"+
    "  color= vec4( R(x,y), G(x,y), B(x,y), A(x,y) );\n"+
    "  gl_Position = vec4( x, y, 0.0, 0.5 );\n"+ /// w=0.5 for perspective division
    "  gl_PointSize=1.0;\n"+ /// test it
    "}\n";


var renderTextureFS=""+
    "precision mediump float;\n"+
    "varying vec4 color;\n"+
    "void main()\n"+
    "{\n"+
    "  gl_FragColor= color;\n"+
    "}\n";


var texturion={}

window.onload= function(){
    texturion.canvas=document.getElementById("canvas");
    texturion.gl= texturion.canvas.getContext("webgl");
    let gl=texturion.gl;
    /* make texture rendering program */
    if( texturion.renderTextureShaderProgram ) gl.deleteProgram( texturion.renderTextureShaderProgram );
    texturion.renderTextureShaderProgram=  makeShaderProgramTool(texturion.gl, renderTextureVS , renderTextureFS );
    /* load buffer data */
    if( !texturion.hBufferId ) {
	texturion.hBufferId= gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texturion.hBufferId );

	let hIn=[];
	for(var i=0; i< texSize+4; i++) {
	    hIn.push(i-2);
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( hIn ) , gl.STATIC_DRAW );
    }

    console.log(texturion);
}

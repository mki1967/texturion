var makeShaderProgramTool= function(gl, vertexShaderSource, fragmentShaderSource){
    /* Parameters:
       gl - WebGL context
    */

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(vertexShader));
	console.log(vertexShaderSource);
	return null;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(fragmentShader));
	console.log(fragmentShaderSource);
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

var def={};
def.R="0.5*(1.0+sin(2.0*PI*y))";
def.G="0.5*(1.0+cos(2.0*PI*x))";
def.B="G(x,y)";
def.A="1.0";


const texSize= 256;
const canvasSize=2*texSize;

// def contains fields def.R, def.G, def.B, def.A with strings defining R,G,B,A dependencies on x,y coordinates
var renderTextureVS= function(def){
    return ""+
	"const float PI = " + Math.PI +";\n"+
	"const int texSize= "+texSize+";\n"+
	"float R(float x,float y){ return  "+def.R+"; }\n"+
	"float G(float x,float y){ return  "+def.G+"; }\n"+
	"float B(float x,float y){ return  "+def.B+"; }\n"+
	"float A(float x,float y){ return  "+def.A+"; }\n"+
	"attribute float h;\n"+
	"uniform float v;\n"+
	"varying vec4 color;\n"+
	"void main()\n"+
	"{\n"+
	"  float  args[6];\n"+
	"  float h=h-float(texSize)/2.0;\n"+
	"  float v=v-float(texSize)/2.0;\n"+
	"  float x= 2.0*h/float(texSize); \n"+
	"  float y= 2.0*v/float(texSize); \n"+
	"  color= vec4( R(x,y), G(x,y), B(x,y), A(x,y) );\n"+
	"  gl_Position = vec4( x, y, 0.0, 1.0 );\n"+ /// w=0.5 for perspective division
	"  gl_PointSize=1.0;\n"+ /// test it
	"}\n";
}

var renderTextureFS=""+
    "precision mediump float;\n"+
    "varying vec4 color;\n"+
    "void main()\n"+
    "{\n"+
    "  gl_FragColor= color;\n"+
    "}\n";


var drawTextureVS=""+
    "attribute vec3 posAttr;\n"+
    "attribute vec2 texAttr;\n"+
    "varying vec2 texCoords;\n"+
    "void main()\n"+
    "{\n"+
    "    gl_Position = vec4(posAttr.xyz, 1.0);\n"+
    "    texCoords = texAttr;\n"+
    "}\n";

var drawTextureFS=""+
    "precision mediump float;\n"+
    "varying vec2 texCoords;\n"+
    "uniform sampler2D texSampler;\n"+
    "void main()\n"+
    "{\n"+
    "    gl_FragColor = texture2D(texSampler, texCoords);\n"+
    "}\n";

var posAttrFloat32Array= new Float32Array( [
    -1,  -1,  0,
    -1,  +1,  0,
    +1,  +1,  0,
    +1,  +1,  0,
    +1,  -1,  0,
    -1,  -1,  0 
] );

var texAttrFloat32Array= new Float32Array( [
    0,  0,
    0,  2,
    2,  2,
    2,  2,
    2,  0,
    0,  0 
] );



var setRGBATextAreas= function( def ){
    document.getElementById("defR").value=def.R;
    document.getElementById("defG").value=def.G;
    document.getElementById("defB").value=def.B;
    document.getElementById("defA").value=def.A;
}

var geRGBATextAreas= function( def ){
    def.R=document.getElementById("defR").value;
    def.G=document.getElementById("defG").value;
    def.B=document.getElementById("defB").value;
    def.A=document.getElementById("defA").value;
}

var texturion={}


var   applyDefs= function( def){
    if(!texturion.canvas){
	texturion.canvas=document.getElementById("canvas");
    }
    if(! texturion.gl) {
	texturion.gl= texturion.canvas.getContext("webgl");
    }
    let gl=texturion.gl;
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


    if(!texturion.textureId) {
	/* create texture object and allocate image memories */
	texturion.textureId=gl.createTexture();
	// gl.activeTexture(gl.TEXTURE0+sbx_textureUnit);
	gl.bindTexture(gl.TEXTURE_2D, texturion.textureId);
	gl.texImage2D(gl.TEXTURE_2D , 0, gl.RGBA, texSize, texSize, 0 /* border */,
		      gl.RGBA, gl.UNSIGNED_BYTE, null);   
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    
    if(!texturion.frameBufferId) {
	/* create framebuffer object */
	texturion.frameBufferId=gl.createFramebuffer();
    }

    /* make texture rendering program */
    if( texturion.renderTextureShaderProgram ){
	gl.deleteProgram( texturion.renderTextureShaderProgram );
    }
    texturion.renderTextureShaderProgram=  makeShaderProgramTool(texturion.gl, renderTextureVS(def) , renderTextureFS );
    texturion.hLocation=gl.getAttribLocation(texturion.renderTextureShaderProgram, "h");
    texturion.vLocation=gl.getUniformLocation(texturion.renderTextureShaderProgram, "v");

    /* render texture */
    gl.useProgram(texturion.renderTextureShaderProgram);
    gl.bindTexture(gl.TEXTURE_2D, texturion.textureId);
    
    let defaultFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, texturion.frameBufferId);
    gl.viewport(0,0,texSize,texSize);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texturion.textureId, 0);

    gl.enableVertexAttribArray(texturion.hLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texturion.hBufferId);
    for( j=0; j<texSize+4; j++) {
	gl.uniform1f(texturion.vLocation, j-2);
	gl.vertexAttribPointer( texturion.hLocation, 1, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.POINTS, 0, texSize+4);
    }
    
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindFramebuffer(gl.FRAMEBUFFER, defaultFBO); // return to default screen FBO
    gl.viewport(0,0,canvasSize,canvasSize);
    

    if( !texturion.drawTextureShaderProgram ){
	texturion.drawTextureShaderProgram=  makeShaderProgramTool(texturion.gl, drawTextureVS , drawTextureFS );
	texturion.posAttr=gl.getAttribLocation(texturion.drawTextureShaderProgram, "posAttr");
	texturion.texAttr=gl.getAttribLocation(texturion.drawTextureShaderProgram, "texAttr");
	texturion.texSampler=gl.getUniformLocation(texturion.drawTextureShaderProgram, "texSampler");
	// create and load data buffers
	texturion.posAttrBufferId= gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texturion.posAttrBufferId );
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( posAttrFloat32Array ) , gl.STATIC_DRAW );
	texturion.texAttrBufferId= gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texturion.texAttrBufferId );
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( texAttrFloat32Array ) , gl.STATIC_DRAW );
    }

    /// TODO: draw texture
    gl.useProgram(texturion.drawTextureShaderProgram);
    gl.enableVertexAttribArray(texturion.posAttr);
    gl.enableVertexAttribArray(texturion.texAttr);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, texturion.posAttrBufferId );
    gl.vertexAttribPointer( texturion.posAttr, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texturion.texAttrBufferId );
    gl.vertexAttribPointer( texturion.texAttr, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturion.textureId );
    gl.uniform1i(texturion.texSampler, 0 );

    gl.clearColor( 0,0,0,1 );
    gl.clear(gl.COLOR_BUFFER_BIT );
    gl.drawArrays(gl.TRIANGLES, 0, 6 );
    console.log(texturion);
}

var RGBAbuttonCallback=function(){
    geRGBATextAreas(def);
    applyDefs(def);
}

window.onload= function(){
    setRGBATextAreas(def);
    geRGBATextAreas(def);
    applyDefs(def);
    document.getElementById("RGBAbutton").onclick=RGBAbuttonCallback;
}

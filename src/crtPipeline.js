export class CRTPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game){
        const fragShader = `
    precision mediump float;
    uniform sampler2D uMainSampler;
    varying vec2 outTexCoord;
    uniform float time;
    void main(){
      vec2 uv = outTexCoord;
      // Barrel distortion
      vec2 cc = uv - 0.5;
      float dist = dot(cc, cc) * 0.2;
      uv += cc * dist;
      // Scanlines
      float scan = 0.9 + 0.1 * sin((uv.y + time*0.5) * 800.0);
      // Slight vignette
      float vig = 1.0 - 0.15 * length(cc);
      vec4 col = texture2D(uMainSampler, uv);
      gl_FragColor = vec4(col.rgb * scan * vig, col.a);
    }`;
        super({ game, fragShader, uniforms: [ 'uProjectionMatrix', 'uMainSampler', 'time' ] });
    }
}

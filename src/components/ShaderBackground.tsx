import { useEffect, useRef } from "react";

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      time += 0.003;
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Downsample for performance
      const scale = 4;
      const sw = Math.ceil(width / scale);
      const sh = Math.ceil(height / scale);

      for (let sy = 0; sy < sh; sy++) {
        for (let sx = 0; sx < sw; sx++) {
          const nx = sx / sw;
          const ny = sy / sh;

          // Neural network-like pattern
          const v1 = Math.sin(nx * 6 + time) * Math.cos(ny * 4 + time * 0.7);
          const v2 = Math.sin((nx + ny) * 5 + time * 1.3) * 0.5;
          const v3 = Math.cos(nx * 3 - ny * 7 + time * 0.5);
          const pattern = (v1 + v2 + v3) / 3;

          // Indigo to cyan gradient
          const r = Math.floor(Math.max(0, Math.min(255, (pattern * 0.3 + 0.1) * 99)));
          const g = Math.floor(Math.max(0, Math.min(255, (pattern * 0.2 + 0.15) * 102 + pattern * 40)));
          const b = Math.floor(Math.max(0, Math.min(255, (pattern * 0.4 + 0.3) * 241)));
          const a = Math.floor(Math.max(0, Math.min(255, (Math.abs(pattern) * 0.15 + 0.02) * 255)));

          // Fill scaled block
          for (let dy = 0; dy < scale && sy * scale + dy < height; dy++) {
            for (let dx = 0; dx < scale && sx * scale + dx < width; dx++) {
              const idx = ((sy * scale + dy) * width + (sx * scale + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = a;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default ShaderBackground;

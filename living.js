/* Ana sayfadaki canlı avatar sahnesi: 10 saniyelik döngü */

(() => {
  const AVATAR = "https://cdn.discordapp.com/app-icons/1403088729542754476/5ee74bbc23884167918ec7cd42c73c08.png?size=256";
  const LOOP_MS = 10000;
  const TAU = Math.PI * 2;

  const band = document.getElementById("living");
  const view = band && band.querySelector("canvas");
  if (!view) return;
  const ctx = view.getContext("2d");

  /* ---------- avatarın arka planını ayır ---------- */

  function cutOut(image) {
    const size = image.naturalWidth;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(image, 0, 0);
    const pic = g.getImageData(0, 0, size, size);
    const d = pic.data;
    const near = (i, limit) => {
      const r = d[i] - 150, gr = d[i + 1] - 134, b = d[i + 2] - 172;
      return r * r + gr * gr + b * b < limit * limit;
    };

    const isBack = new Uint8Array(size * size);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const at = y * size + x;
      if (isBack[at] || !near(at * 4, 50)) return;
      isBack[at] = 1;
      stack.push(at);
    };
    for (let i = 0; i < size; i++) {
      push(i, 0);
      push(0, i);
      push(size - 1, i);
    }
    while (stack.length) {
      const at = stack.pop();
      const x = at % size, y = (at - x) / size;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }

    /* Arka plandaki kalpler gibi küçük adacıkları da sil */
    const seen = new Uint8Array(size * size);
    for (let s = 0; s < size * size; s++) {
      if (isBack[s] || seen[s]) continue;
      const part = [s];
      seen[s] = 1;
      for (let p = 0; p < part.length; p++) {
        const at = part[p];
        const x = at % size, y = (at - x) / size;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const n = ny * size + nx;
          if (!isBack[n] && !seen[n]) {
            seen[n] = 1;
            part.push(n);
          }
        }
      }
      if (part.length < size * size * 0.02) part.forEach((at) => { isBack[at] = 1; });
    }

    /* Kenarı yumuşat */
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0, count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            sum += isBack[ny * size + nx] ? 0 : 1;
            count++;
          }
        }
        const i = (y * size + x) * 4;
        const alpha = sum / count;
        d[i + 3] = alpha * 255;
        if (isBack[y * size + x]) {
          d[i] = 40;
          d[i + 1] = 28;
          d[i + 2] = 44;
        }
      }
    }
    g.putImageData(pic, 0, 0);
    return c;
  }

  /* ---------- avatarı oynatan gölgelendirici ---------- */

  const VERT = `attribute vec2 p; varying vec2 v;
    void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;

  const FRAG = `precision mediump float;
    uniform sampler2D tex; uniform float a; varying vec2 v;
    const vec2 MC = vec2(.500, .563);
    const float TILT = -.30;
    vec2 rot(vec2 p, float r){ float c = cos(r), s = sin(r); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
    float pulse(float t, float c, float w){ return smoothstep(w, 0., abs(fract(t - c + .5) - .5)); }
    float eye(vec2 uv, vec2 c, out vec2 e){ e = rot(uv - c, -TILT) / vec2(.078, .050); return smoothstep(1., .72, length(e)); }
    void main(){
      vec2 uv = v;
      float t = a / 6.2831853;
      uv.y += .007 * sin(a * 2.) * (1. - uv.y);
      float head = smoothstep(.92, .5, uv.y);
      vec2 pivot = vec2(.5, .82);
      uv = pivot + rot(uv - pivot, .022 * sin(a) * head);
      float side = smoothstep(.20, .46, abs(uv.x - .5));
      float low = smoothstep(.12, .85, uv.y);
      uv.x += (.013 * sin(a * 2. - uv.y * 7.) + .006 * sin(a * 3. - uv.y * 14.)) * side * low;
      vec2 m = rot(uv - MC, -TILT);
      float area = smoothstep(1., .5, length(m / vec2(.175, .08)));
      float wig = sin(a * 14.) * (pulse(t, .22, .075) + pulse(t, .70, .05));
      float tip = m.x / .13;
      m.y += wig * .022 * area * tip * tip;
      uv = MC + rot(m, TILT);
      vec4 col = texture2D(tex, uv);
      float blink = pulse(t, .46, .016) + pulse(t, .53, .014);
      blink = clamp(blink, 0., 1.);
      if (blink > .001) {
        vec2 e1, e2;
        float m1 = eye(uv, vec2(.345, .470), e1);
        float m2 = eye(uv, vec2(.608, .376), e2);
        vec3 skin = vec3(.93, .79, .74);
        col.rgb = mix(col.rgb, skin, m1 * blink);
        col.rgb = mix(col.rgb, skin, m2 * blink);
        float l1 = smoothstep(.20, .05, abs(e1.y - .10 + e1.x * e1.x * .35)) * smoothstep(1.05, .85, abs(e1.x));
        float l2 = smoothstep(.20, .05, abs(e2.y - .10 + e2.x * e2.x * .35)) * smoothstep(1.05, .85, abs(e2.x));
        col.rgb = mix(col.rgb, vec3(.14, .10, .17), max(l1, l2) * blink);
      }
      float fade = smoothstep(0., .13, v.x) * smoothstep(1., .87, v.x);
      col.a *= mix(1., fade, smoothstep(.45, .75, v.y));
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }`;

  function makeAvatar(source) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 768;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return null;
    const compile = (type, text) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, text);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.bindAttribLocation(program, 0, "p");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "p"), 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    const angle = gl.getUniformLocation(program, "a");
    return {
      canvas,
      draw(a) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(angle, a);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  }

  /* ---------- sahne ---------- */

  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const stars = Array.from({ length: 170 }, () => ({
    x: rand(), y: rand(), r: .5 + rand() * 1.5, k: 1 + Math.floor(rand() * 4), p: rand() * TAU,
  }));
  const hearts = Array.from({ length: 14 }, () => ({
    x: rand(), p: rand(), s: 7 + rand() * 12, k: 1 + Math.floor(rand() * 2), w: rand() * TAU,
  }));
  const sparks = Array.from({ length: 46 }, () => ({ p: rand(), o: (rand() - .5) * 46, r: .8 + rand() * 2 }));

  const RIBBON = ["#ffc42e", "#ff9a3d", "#ff5fa2", "#b78cff", "#5fd4ff", "#6dffb0"];

  function ribbonY(x, w, h, a, lane) {
    const u = x / w;
    return h * (.76 + .14 * u * u) + Math.sin(u * 5 + a) * h * .035 + Math.sin(u * 11 - a * 2) * h * .01 + lane;
  }

  function drawRibbon(w, h, a, alpha, shift) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    RIBBON.forEach((color, i) => {
      const lane = (i - RIBBON.length / 2) * Math.max(4, h * .013) + shift;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 14) {
        const y = ribbonY(x, w, h, a, lane);
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, h * .012);
      ctx.shadowColor = color;
      ctx.shadowBlur = h * .018;
      ctx.stroke();
    });
    ctx.restore();
  }

  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y, x - s * .5, y - s * .2, x - s * .5, y + s * .1);
    ctx.bezierCurveTo(x - s * .5, y + s * .45, x, y + s * .7, x, y + s);
    ctx.bezierCurveTo(x, y + s * .7, x + s * .5, y + s * .45, x + s * .5, y + s * .1);
    ctx.bezierCurveTo(x + s * .5, y - s * .2, x, y, x, y + s * .3);
    ctx.fill();
  }

  function drawClock(cx, cy, R, a) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = "#cdb7ff";
    ctx.shadowBlur = R * .07;
    ctx.strokeStyle = "rgba(226, 214, 255, .75)";
    ctx.lineWidth = Math.max(1.5, R * .008);
    for (const r of [R, R * .86]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
    }
    ctx.save();
    ctx.rotate(-a / 6);
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      ctx.save();
      ctx.rotate(i * TAU / 60);
      ctx.beginPath();
      ctx.moveTo(0, -R * .985);
      ctx.lineTo(0, -R * (big ? .875 : .94));
      ctx.lineWidth = Math.max(1, R * (big ? .016 : .006));
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.save();
    ctx.rotate(a / 4);
    const dash = (TAU * R * 1.14) / 144;
    ctx.setLineDash([dash, dash]);
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.14, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255, 196, 46, .95)";
    ctx.shadowColor = "#ffc42e";
    ctx.lineCap = "round";
    ctx.save();
    ctx.rotate(-a);
    ctx.lineWidth = Math.max(2, R * .018);
    ctx.beginPath();
    ctx.moveTo(0, R * .12);
    ctx.lineTo(0, -R * .82);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  let avatar = null;
  let width = 0, height = 0;

  function resize() {
    const box = band.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    view.width = Math.round(width * ratio);
    view.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function render(a) {
    const w = width, h = height;
    const t = a / TAU;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#160d24";
    ctx.fillRect(0, 0, w, h);

    const size = Math.min(h * 1.04, w * .92);
    const cx = w * .5;
    const headY = h - size * .62;

    const glow = ctx.createRadialGradient(cx, headY, 0, cx, headY, size * .95);
    glow.addColorStop(0, "rgba(152, 112, 214, .62)");
    glow.addColorStop(.5, "rgba(92, 56, 150, .28)");
    glow.addColorStop(1, "rgba(22, 13, 36, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      const v = .5 + .5 * Math.sin(a * s.k + s.p);
      ctx.fillStyle = `rgba(240, 232, 255, ${.2 + .8 * v * v})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, TAU);
      ctx.fill();
    }

    drawClock(cx, headY, size * .50, a);
    drawRibbon(w, h, a, .4, -h * .3);

    if (avatar) {
      avatar.draw(a);
      ctx.drawImage(avatar.canvas, cx - size / 2, h - size + size * .02, size, size);
    }

    ctx.save();
    ctx.fillStyle = "#c9a5ff";
    ctx.shadowColor = "#c9a5ff";
    ctx.shadowBlur = 14;
    for (const heart of hearts) {
      const life = (heart.p + t * heart.k) % 1;
      const x = heart.x * w + Math.sin(a * heart.k + heart.w) * 22;
      const y = h * 1.04 - life * h * 1.12;
      ctx.globalAlpha = Math.min(1, Math.min(life, 1 - life) * 6) * .9;
      heartPath(x, y, heart.s);
    }
    ctx.restore();

    const floor = ctx.createLinearGradient(0, h * .66, 0, h);
    floor.addColorStop(0, "rgba(22, 13, 36, 0)");
    floor.addColorStop(1, "rgba(22, 13, 36, 1)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * .66, w, h * .34);

    drawRibbon(w, h, a, .82, 0);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of sparks) {
      const u = (s.p + t * 2) % 1;
      const x = u * (w + 40) - 20;
      const y = ribbonY(x, w, h, a, s.o);
      ctx.globalAlpha = Math.min(1, Math.min(u, 1 - u) * 8) * (.45 + .55 * Math.abs(Math.sin(a * 3 + s.p * 40)));
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- döngü ---------- */

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let onScreen = true, frame = 0;

  function tick(now) {
    render(((now % LOOP_MS) / LOOP_MS) * TAU);
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    if (still) render(TAU * .1);
    else if (onScreen && !document.hidden) frame = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(band);
  document.addEventListener("visibilitychange", sync);
  addEventListener("resize", () => {
    resize();
    if (still) render(TAU * .1);
  });

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      avatar = makeAvatar(cutOut(image));
    } catch (error) {
      avatar = null;
    }
    if (!avatar) {
      band.hidden = true;
      return;
    }
    resize();
    sync();
  };
  image.onerror = () => { band.hidden = true; };
  image.src = AVATAR;
})();

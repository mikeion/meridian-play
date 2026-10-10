// Loaded by the web export (export_presets.cfg head_include) before the engine starts.
// 1. Caps the render resolution: iPhones report a pixel ratio of 3, which with 3D
//    anti-aliasing can exhaust Safari's graphics memory. ?dpr=1|2|3 overrides the cap.
// 2. Stops Safari's own page pinch-zoom and double-tap zoom, which fight the game's pinch.
// 3. Only on the home network (or with ?debug): sends console output, errors, WebGL
//    context loss and a heartbeat (frames per second) to the server's /log, so a phone can
//    be debugged from the Mac. Published builds (itch.io) send nothing.
(function () {
  var q = new URLSearchParams(location.search);
  var real = window.devicePixelRatio || 1;
  var cap = Number(q.get("dpr") || 2);
  var dpr = Math.min(real, cap);
  try { Object.defineProperty(window, "devicePixelRatio", { get: function () { return dpr; } }); } catch (e) {}
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (k) {
    document.addEventListener(k, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener("touchmove", function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  var vp = document.querySelector('meta[name="viewport"]');
  if (!vp) { vp = document.createElement("meta"); vp.name = "viewport"; document.head.appendChild(vp); }
  vp.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  var t0 = Date.now();
  var lan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|localhost$|127\.)/.test(location.hostname);
  if (!lan && !q.has("debug")) return;
  function send(kind, msg) {
    var body = JSON.stringify({ t: ((Date.now() - t0) / 1000).toFixed(1), kind: kind, msg: String(msg).slice(0, 2000) });
    try { navigator.sendBeacon("/log", body); } catch (e) {}
  }
  ["log", "warn", "error"].forEach(function (k) {
    var orig = console[k].bind(console);
    console[k] = function () { orig.apply(null, arguments); send(k, Array.prototype.join.call(arguments, " ")); };
  });
  window.addEventListener("error", function (e) { send("onerror", e.message + " @" + e.filename + ":" + e.lineno); });
  window.addEventListener("unhandledrejection", function (e) { send("rejection", e.reason); });
  document.addEventListener("visibilitychange", function () { send("visibility", document.visibilityState); });
  var frames = 0;
  (function tick() { frames++; requestAnimationFrame(tick); })();
  setInterval(function () { send("heartbeat", Math.round(frames / 5) + " fps"); frames = 0; }, 5000);
  var hooked = setInterval(function () {
    var c = document.querySelector("canvas");
    if (!c) return;
    clearInterval(hooked);
    c.addEventListener("webglcontextlost", function () { send("webgl", "CONTEXT LOST"); }, false);
    c.addEventListener("webglcontextrestored", function () { send("webgl", "context restored"); }, false);
  }, 200);
  send("start", "real dpr " + real + ", using " + dpr + ", screen " + screen.width + "x" + screen.height + ", " + navigator.userAgent);
})();

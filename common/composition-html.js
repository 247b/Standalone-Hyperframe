import { buildOstClipHtml } from "./ost-style.js";

function camelToKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function styleObjectToString(style) {
  return Object.entries(style)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join("; ");
}

function truncateDuration(duration) {
  return Math.floor(duration * 100) / 100;
}

function buildClipHtml(clip) {
  const {
    id: clipId,
    type = "text",
    start = 0,
    duration = 5,
    trackIndex = 0,
    content = "",
    style = {},
    mediaDuration = null,
    hasAudio = true,
  } = clip;

  const baseAttrsArr = [
    `id="${clipId}"`,
    `class="clip"`,
    `data-start="${start}"`,
    `data-duration="${duration}"`,
    `data-track-index="${trackIndex}"`,
  ];
  if (mediaDuration != null) {
    baseAttrsArr.push(`data-media-duration="${mediaDuration}"`);
  }
  const baseAttrs = baseAttrsArr.join(" ");
  const customStyle = styleObjectToString(style);

  if (type === "text") {
    const defaultStyle =
      "position: absolute; top: 0; left: 0; font-size: 64px; color: #fff; padding: 40px;";
    return `<div ${baseAttrs} style="${defaultStyle} ${customStyle}">${content}</div>`;
  }
  if (type === "titleText") {
    const defaultStyle = [
      "position: absolute",
      "inset: 0",
      "display: flex",
      "align-items: center",
      "justify-content: center",
      "padding: 140px",
      "color: #FFFFFF",
      "font-family: 'Inter', 'Geist', sans-serif",
      "font-size: 85px",
      "font-weight: 700",
      "line-height: 1.15",
      "text-align: center",
      "overflow-wrap: break-word",
      "text-wrap: balance",
      "pointer-events: none",
    ].join("; ");
    return `<div ${baseAttrs} style="${defaultStyle} ${customStyle}">${content}</div>`;
  }
  if (type === "image") {
    const defaultStyle =
      "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; will-change: transform;";
    return `<img ${baseAttrs} src="${content}" style="${defaultStyle} ${customStyle}" alt="" />`;
  }
  if (type === "topRightImage") {
    const defaultStyle =
      "position: absolute; top: 38px; right: 38px; width: 120px; height: 120px; object-fit: contain;";
    return `<img ${baseAttrs} src="${content}" style="${defaultStyle} ${customStyle}" alt="" />`;
  }
  if (type === "video") {
    const defaultStyle =
      "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;";
    const audioAttrs = hasAudio
      ? `data-has-audio="true" data-volume="1"`
      : "muted";
    return `<video ${baseAttrs} src="${content}" style="${defaultStyle} ${customStyle}" playsinline preload="auto" ${audioAttrs}></video>`;
  }
  if (type === "audio") {
    return `<audio ${baseAttrs} src="${content}" preload="auto" data-volume="1"></audio>`;
  }
  if (type === "ost") {
    return buildOstClipHtml({ baseAttrs, clipId, content });
  }
  if (type === "shape") {
    const defaultStyle = "position: absolute; top: 0; left: 0;";
    return `<div ${baseAttrs} style="${defaultStyle} ${customStyle}"></div>`;
  }
  return "";
}

function buildAnimationScript(clips, compositionId) {
  const tweens = clips
    .filter((c) => c.type !== "audio")
    .map((clip) => {
      const {
        id,
        type,
        start = 0,
        duration = 5,
        animation = null,
        pan = false,
        panDuration = null,
        panEnterDuration = null,
        panExitDuration = null,
      } = clip;
      const fadeIn = animation?.fadeIn ?? 0.3;
      const fadeOut = animation?.fadeOut ?? 0.3;

      if (type === "image" && pan) {
        if (panEnterDuration != null || panExitDuration != null) {
          const enterDur = Math.min(
            duration,
            truncateDuration(Math.max(0, panEnterDuration ?? 0)),
          );
          const exitDur = Math.min(
            Math.max(0, duration - enterDur),
            truncateDuration(Math.max(0, panExitDuration ?? 0)),
          );
          const exitStart = truncateDuration(start + duration - exitDur);
          return [
            `  tl.set("#${id}", { opacity: 1 }, ${start});`,
            `  tl.fromTo("#${id}", { x: "-10%", scale: 1.25 }, { x: "0%", scale: 1.25, duration: ${enterDur}, ease: "power2.out" }, ${start});`,
            `  tl.to("#${id}", { x: "-10%", scale: 1.25, duration: ${exitDur}, ease: "power2.in" }, ${exitStart});`,
            `  tl.set("#${id}", { opacity: 0 }, ${start + duration});`,
          ].join("\n");
        }

        if (panDuration != null) {
          const moveDur = Math.min(
            duration,
            truncateDuration(Math.max(0, panDuration)),
          );
          const panStart = truncateDuration(start + (duration - moveDur) / 2);
          return [
            `  tl.set("#${id}", { opacity: 1 }, ${start});`,
            `  tl.fromTo("#${id}", { x: "4%", scale: 1.1 }, { x: "-4%", scale: 1.1, duration: ${moveDur}, ease: "none" }, ${panStart});`,
            `  tl.set("#${id}", { opacity: 0 }, ${start + duration});`,
          ].join("\n");
        }

        const moveDur = Math.min(0.6, truncateDuration(duration * 0.25));
        return [
          `  tl.set("#${id}", { opacity: 1 }, ${start});`,
          `  tl.fromTo("#${id}", { x: "-4%", scale: 1.1 }, { x: "0%", scale: 1.1, duration: ${moveDur}, ease: "power2.out" }, ${start});`,
          `  tl.fromTo("#${id}", { x: "0%", scale: 1.1 }, { x: "-4%", scale: 1.1, duration: ${moveDur}, ease: "power2.in" }, ${truncateDuration(start + duration - moveDur)});`,
          `  tl.set("#${id}", { opacity: 0 }, ${start + duration});`,
        ].join("\n");
      }

      if (type === "ost") {
        const chipSel = `#${id}-chip`;
        return [
          `  tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0 }, ${start});`,
          `  tl.to("#${id}", { opacity: 0, duration: 0 }, ${start + duration});`,
          `  tl.fromTo("${chipSel}", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: ${fadeIn}, ease: "power3.out" }, ${start});`,
          `  tl.to("${chipSel}", { opacity: 0, duration: ${fadeOut}, ease: "power2.in" }, ${start + duration - fadeOut});`,
        ].join("\n");
      }

      const hold = duration - fadeIn - fadeOut;
      return [
        `  tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: ${fadeIn} }, ${start});`,
        hold > 0
          ? `  tl.to("#${id}", { opacity: 0, duration: ${fadeOut} }, ${start + fadeIn + hold});`
          : `  tl.to("#${id}", { opacity: 0, duration: ${fadeOut} }, ${start + fadeIn});`,
      ].join("\n");
    })
    .join("\n");

  return `
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
${tweens}
    (function attachMediaSync(){
      const medias = Array.from(document.querySelectorAll('video.clip, audio.clip')).map(el => ({
        el,
        start: parseFloat(el.dataset.start) || 0,
        duration: parseFloat(el.dataset.duration) || 0,
        mediaStart: parseFloat(el.dataset.mediaStart) || 0,
        mediaDuration: parseFloat(el.dataset.mediaDuration) || Infinity,
      }));
      medias.forEach(m => { if (m.el.tagName === 'VIDEO') { m.el.playsInline = true; } });
      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        for (const m of medias) {
          const local = t - m.start;
          if (local >= 0 && local < m.duration) {
            const target = Math.min(m.mediaStart + local, m.mediaStart + m.mediaDuration - 0.04);
            if (Math.abs(m.el.currentTime - target) > 0.04) {
              try { m.el.currentTime = target; } catch (_) {}
            }
          } else if (local < 0) {
            if (m.el.currentTime !== m.mediaStart) {
              try { m.el.currentTime = m.mediaStart; } catch (_) {}
            }
          }
        }
      });
    })();
    window.__timelines["${compositionId}"] = tl;
  `.trim();
}

export function generateCompositionHtml(timelineData) {
  const {
    id = "main",
    duration = 10,
    width = 1920,
    height = 1080,
    background = "#000",
    clips = [],
    audio = null,
  } = timelineData;

  const clipsHtml = clips.map(buildClipHtml).join("\n      ");
  const audioHtml = audio
    ? `<audio id="track-audio" data-start="0" src="${audio}"></audio>`
    : "";
  const animScript = buildAnimationScript(clips, id);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background: ${background};
        font-family: 'Geist', sans-serif;
      }
      .clip { opacity: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${id}" data-start="0" data-duration="${duration}" data-width="${width}" data-height="${height}">
      ${clipsHtml}
      ${audioHtml}
    </div>
    <script>
      ${animScript}
    </script>
  </body>
</html>`;
}

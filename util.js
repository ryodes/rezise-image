const cmToPx = (cm, dpi) => Math.max(1, Math.round((cm * dpi) / 2.54));
const pxToCm = (px, dpi) => Math.max(0.01, +((px * 2.54) / dpi).toFixed(2));

const fileInput = document.getElementById("file");
const fileNameEl = document.getElementById("fileName");
const unitSelect = document.getElementById("unit");
const dpiInput = document.getElementById("dpi");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const keepRatio = document.getElementById("keepRatio");
const formatSelect = document.getElementById("format");
const qualityInput = document.getElementById("quality");
const downloadBtn = document.getElementById("downloadBtn");
const previewWrap = document.getElementById("previewWrap");
const originalMeta = document.getElementById("originalMeta");
const targetMeta = document.getElementById("targetMeta");
const cmToPxSpan = document.getElementById("cmToPx");
const unitLabelW = document.getElementById("unitLabelW");
const unitLabelH = document.getElementById("unitLabelH");
const canvas = document.getElementById("canvas");

let img = new Image();
let imgUrl = "";
let imgMeta = { w: 0, h: 0 };
let lastEdited = "w";

function updateCmToPx() {
  const dpi = Number(dpiInput.value) || 96;
  cmToPxSpan.textContent = cmToPx(1, dpi);
}

dpiInput.addEventListener("input", () => {
  updateCmToPx();
});

unitSelect.addEventListener("change", () => {
  const prev = unitSelect.dataset.prev || "px";
  const now = unitSelect.value;
  unitSelect.dataset.prev = now;
  const dpi = Number(dpiInput.value) || 96;
  if (prev === now) return;
  if (now === "px") {
    widthInput.value = Math.round(cmToPx(Number(widthInput.value) || 0, dpi));
    heightInput.value = Math.round(cmToPx(Number(heightInput.value) || 0, dpi));
  } else {
    widthInput.value = pxToCm(Number(widthInput.value) || 0, dpi);
    heightInput.value = pxToCm(Number(heightInput.value) || 0, dpi);
  }
  unitLabelW.textContent = now;
  unitLabelH.textContent = now;
  renderTargetMeta();
});

function setDefaultsFromImage() {
  if (!imgMeta.w) return;
  const dpi = Number(dpiInput.value) || 96;
  const maxW = Math.min(imgMeta.w, 1600);
  const ratio = imgMeta.w / imgMeta.h || 1;
  const targetW = maxW;
  const targetH = Math.round(targetW / ratio);

  if (unitSelect.value === "px") {
    widthInput.value = targetW;
    heightInput.value = targetH;
  } else {
    widthInput.value = pxToCm(targetW, dpi);
    heightInput.value = pxToCm(targetH, dpi);
  }
  renderTargetMeta();
}

function renderPreview() {
  previewWrap.innerHTML = "";
  if (!imgUrl) {
    previewWrap.innerHTML =
      '<div style="border:1px dashed #e6edf6;padding:12px;border-radius:8px;text-align:center;color:var(--muted)">Aucune image chargée.</div>';
    originalMeta.textContent = "";
    targetMeta.textContent = "";
    downloadBtn.disabled = true;
    return;
  }

  const imgEl = document.createElement("img");
  imgEl.src = imgUrl;
  imgEl.className = "preview";
  imgEl.onload = () => {
    originalMeta.textContent = `Original: ${imgMeta.w}×${imgMeta.h} px`;
    renderTargetMeta();
  };
  previewWrap.appendChild(imgEl);
  downloadBtn.disabled = false;
}

function renderTargetMeta() {
  if (!imgUrl) return;
  const dpi = Number(dpiInput.value) || 96;
  const unit = unitSelect.value;
  const w = Number(widthInput.value) || 0;
  const h = Number(heightInput.value) || 0;
  const wPx = unit === "px" ? Math.round(w) : cmToPx(w, dpi);
  const hPx = unit === "px" ? Math.round(h) : cmToPx(h, dpi);
  if (unit === "cm") {
    targetMeta.textContent = `Cible: ${wPx}×${hPx} px (${w}×${h} cm @ ${dpi} DPI)`;
  } else {
    targetMeta.textContent = `Cible: ${wPx}×${hPx} px`;
  }
}

widthInput.addEventListener("input", () => {
  lastEdited = "w";
  if (keepRatio.checked && imgMeta.w && imgMeta.h) {
    const dpi = Number(dpiInput.value) || 96;
    const ratio = imgMeta.w / imgMeta.h;
    if (unitSelect.value === "px") {
      const wPx = Math.max(1, Math.round(Number(widthInput.value) || 0));
      const hPx = Math.max(1, Math.round(wPx / ratio));
      heightInput.value = unitSelect.value === "px" ? hPx : pxToCm(hPx, dpi);
    } else {
      const wPx = cmToPx(Number(widthInput.value) || 0, dpi);
      const hPx = Math.max(1, Math.round(wPx / ratio));
      heightInput.value = pxToCm(hPx, dpi);
    }
  }
  renderTargetMeta();
});

heightInput.addEventListener("input", () => {
  lastEdited = "h";
  if (keepRatio.checked && imgMeta.w && imgMeta.h) {
    const dpi = Number(dpiInput.value) || 96;
    const ratio = imgMeta.w / imgMeta.h;
    if (unitSelect.value === "px") {
      const hPx = Math.max(1, Math.round(Number(heightInput.value) || 0));
      const wPx = Math.max(1, Math.round(hPx * ratio));
      widthInput.value = unitSelect.value === "px" ? wPx : pxToCm(wPx, dpi);
    } else {
      const hPx = cmToPx(Number(heightInput.value) || 0, dpi);
      const wPx = Math.max(1, Math.round(hPx * ratio));
      widthInput.value = pxToCm(wPx, dpi);
    }
  }
  renderTargetMeta();
});

fileInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return reset();
  fileNameEl.textContent = `Fichier: ${f.name}`;
  if (imgUrl) URL.revokeObjectURL(imgUrl);
  imgUrl = URL.createObjectURL(f);
  img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    imgMeta.w = img.naturalWidth;
    imgMeta.h = img.naturalHeight;
    setDefaultsFromImage();
    renderPreview();
  };
  img.src = imgUrl;
});

function reset() {
  if (imgUrl) URL.revokeObjectURL(imgUrl);
  imgUrl = "";
  img = new Image();
  imgMeta = { w: 0, h: 0 };
  fileNameEl.textContent = "";
  widthInput.value = "";
  heightInput.value = "";
  renderPreview();
}

downloadBtn.addEventListener("click", () => {
  if (!imgUrl) return;
  const dpi = Number(dpiInput.value) || 96;
  const unit = unitSelect.value;
  let w = Number(widthInput.value) || 0;
  let h = Number(heightInput.value) || 0;
  if (unit === "cm") {
    w = cmToPx(w, dpi);
    h = cmToPx(h, dpi);
  } else {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
  }
  if (w <= 0 || h <= 0) return alert("Dimensions invalides");

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  const drawingImage = new Image();
  drawingImage.crossOrigin = "anonymous";
  drawingImage.onload = () => {
    ctx.drawImage(drawingImage, 0, 0, w, h);
    const fmt = formatSelect.value;
    if (fmt === "png") {
      const dataUrl = canvas.toDataURL("image/png");
      triggerDownload(dataUrl, buildFileName(w, h, "png"));
    } else {
      canvas.toBlob(
        (blob) => {
          if (!blob) return alert("Erreur lors de la génération");
          const url = URL.createObjectURL(blob);
          triggerDownload(
            url,
            buildFileName(w, h, fmt === "jpeg" ? "jpg" : "webp")
          );
          setTimeout(() => URL.revokeObjectURL(url), 15000);
        },
        fmt === "jpeg" ? "image/jpeg" : "image/webp",
        Number(qualityInput.value) || 0.92
      );
    }
  };
  drawingImage.src = imgUrl;
});

function buildFileName(w, h, ext) {
  const original =
    fileInput.files && fileInput.files[0]
      ? fileInput.files[0].name.replace(/\.[^.]+$/, "")
      : "image";
  return `${original}_${w}x${h}.${ext}`;
}

function triggerDownload(urlOrData, filename) {
  const a = document.createElement("a");
  a.href = urlOrData;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

updateCmToPx();
unitSelect.dataset.prev = unitSelect.value;

window._resizer = { reset };

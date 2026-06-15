"use client";

import QRCode from "qrcode";
import type { ProviderMatch } from "@/lib/providers";

function shortText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function textLines(value: string, maxLength: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.map((line, index) => (index === maxLines - 1 ? shortText(line, maxLength) : line));
}

function googleMapsCoordinateUrl(provider: ProviderMatch) {
  return `https://www.google.com/maps?q=${provider.clinicLatitude.toFixed(6)},${provider.clinicLongitude.toFixed(6)}`;
}

function qrPathForUrl(value: string, size: number) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const moduleSize = size / qr.modules.size;
  const commands: string[] = [];

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let col = 0; col < qr.modules.size; col += 1) {
      if (qr.modules.get(row, col)) {
        const x = Number((col * moduleSize).toFixed(3));
        const y = Number((row * moduleSize).toFixed(3));
        commands.push(`M${x} ${y}h${moduleSize.toFixed(3)}v${moduleSize.toFixed(3)}h-${moduleSize.toFixed(3)}z`);
      }
    }
  }

  return commands.join("");
}

function barcodeBars(value: string, width: number, height: number) {
  const bits = value
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
  const barCount = 64;
  const unit = width / barCount;

  return Array.from({ length: barCount }, (_, index) => {
    const bit = bits[index % bits.length];
    const nextBit = bits[(index + 5) % bits.length];
    const barWidth = bit === "1" ? unit * 0.72 : unit * 0.34;
    const barHeight = nextBit === "1" ? height : height * 0.72;
    return {
      height: Number(barHeight.toFixed(3)),
      width: Number(barWidth.toFixed(3)),
      x: Number((index * unit).toFixed(3)),
      y: Number((height - barHeight).toFixed(3)),
    };
  });
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

async function svgToJpegBytes(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    .svg-card-brand{fill:#17477f;font-family:Georgia,"Times New Roman",serif;font-size:35px;font-weight:700}
    .svg-card-number{fill:#1f2933;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:500}
    .svg-card-label,.svg-card-label-bold{fill:#244a86;font-family:Arial,Helvetica,sans-serif;font-size:21px}
    .svg-card-label-bold{font-weight:700}
    .svg-card-value{fill:#1f2933;font-family:Arial,Helvetica,sans-serif;font-size:28px}
    .svg-card-tree{fill:#1f2933;font-family:Arial,Helvetica,sans-serif;font-size:29px;font-weight:700}
    .svg-card-body,.svg-card-body-quiet,.svg-card-small{fill:#1f2933;font-family:Arial,Helvetica,sans-serif;font-size:21px}
    .svg-card-body-quiet,.svg-card-small{font-size:16px}
    .svg-card-rule{stroke:#244a86;stroke-width:3}
  `;
  clone.insertBefore(style, clone.firstChild);
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render card SVG."));
    });
    image.src = url;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = 1712;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare card canvas.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.94)),
      height: canvas.height,
      width: canvas.width,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function createCardPdf(images: Array<{ bytes: Uint8Array; height: number; width: number }>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const addString = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const addBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const startObject = (id: number) => {
    offsets[id] = byteLength;
    addString(`${id} 0 obj\n`);
  };
  const endObject = () => addString("endobj\n");

  const pageWidth = 612;
  const pageHeight = 792;
  const cardWidth = 3.375 * 72;
  const cardHeight = 2.125 * 72;
  const cardGap = 36;
  const cardStartX = (pageWidth - cardWidth * 2 - cardGap) / 2;
  const cardStartY = 388;
  const objectCount = 7;

  addString("%PDF-1.4\n");
  startObject(1);
  addString("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObject();

  startObject(2);
  addString("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n");
  endObject();

  const [front, back] = images;
  const frontX = cardStartX;
  const backX = cardStartX + cardWidth + cardGap;
  const labelY = cardStartY + cardHeight + 24;
  const noteY = cardStartY - 34;
  const content = [
    "BT /F1 9 Tf 0.18 0.34 0.22 rg",
    `${frontX.toFixed(2)} ${labelY.toFixed(2)} Td (FRONT) Tj`,
    `${(backX - frontX).toFixed(2)} 0 Td (BACK) Tj`,
    "ET",
    "BT /F1 8 Tf 0.28 0.39 0.32 rg",
    `${frontX.toFixed(2)} ${noteY.toFixed(2)} Td (Print at 100% / Actual Size. Each card side is 3.375 in x 2.125 in.) Tj`,
    "ET",
    `q 0.7 w 0.75 0.82 0.76 RG ${frontX.toFixed(2)} ${cardStartY.toFixed(2)} ${cardWidth.toFixed(2)} ${cardHeight.toFixed(2)} re S Q`,
    `q 0.7 w 0.75 0.82 0.76 RG ${backX.toFixed(2)} ${cardStartY.toFixed(2)} ${cardWidth.toFixed(2)} ${cardHeight.toFixed(2)} re S Q`,
    `q ${cardWidth.toFixed(2)} 0 0 ${cardHeight.toFixed(2)} ${frontX.toFixed(2)} ${cardStartY.toFixed(2)} cm /FrontCard Do Q`,
    `q ${cardWidth.toFixed(2)} 0 0 ${cardHeight.toFixed(2)} ${backX.toFixed(2)} ${cardStartY.toFixed(2)} cm /BackCard Do Q`,
  ].join("\n");

  startObject(3);
  addString(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> /XObject << /FrontCard 5 0 R /BackCard 4 0 R >> >> /Contents 7 0 R >>\n",
  );
  endObject();

  [
    { id: 4, image: back },
    { id: 5, image: front },
  ].forEach(({ id, image }) => {
    startObject(id);
    addString(
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
    );
    addBytes(image.bytes);
    addString("\nendstream\n");
    endObject();
  });

  startObject(6);
  addString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
  endObject();

  startObject(7);
  addString(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream\n`);
  endObject();

  const xrefOffset = byteLength;
  addString(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id += 1) {
    addString(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  addString(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob([concatBytes(chunks)], { type: "application/pdf" });
}

export async function downloadProviderCardPdf(cardIdPrefix: string, provider: ProviderMatch) {
  const front = document.getElementById(`${cardIdPrefix}-front`) as SVGSVGElement | null;
  const back = document.getElementById(`${cardIdPrefix}-back`) as SVGSVGElement | null;
  if (!front || !back) throw new Error("Card is not ready yet.");

  const pdf = createCardPdf([await svgToJpegBytes(front), await svgToJpegBytes(back)]);
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pct-provider-card-${provider.providerId}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function PctProviderCardSvgPair({
  cardIdPrefix = "pct-provider-card",
  provider,
  zipcode,
}: {
  cardIdPrefix?: string;
  provider: ProviderMatch;
  zipcode: string;
}) {
  const doctorId = String(provider.providerId);
  const visitLine = `${provider.clinicAddress}, ${provider.clinicCity}, ${provider.clinicState} ${provider.clinicZipcode}`;
  const primaryProviderLines = textLines(provider.speciesCommon, 26, 2);
  const clinicLines = textLines(provider.clinicName, 34, 2);
  const addressLines = textLines(visitLine, 50, 2);
  const specialtyLines = textLines(provider.medicalSpecialty, 28, 2);
  const conditionLines = textLines(provider.searchableConditions.slice(0, 6).join(" / "), 34, 3);
  const availabilityLabel = provider.weekendAvailability ? "Weekend visits available" : "Weekday visits only";
  const mapsUrl = googleMapsCoordinateUrl(provider);
  const mapsQrPath = qrPathForUrl(mapsUrl, 112);
  const providerBarcode = barcodeBars(`PCT-${doctorId}`, 500, 72);
  const frontTitleId = `${cardIdPrefix}-front-title`;
  const backTitleId = `${cardIdPrefix}-back-title`;
  const frontShadowId = `${cardIdPrefix}-front-shadow`;
  const backShadowId = `${cardIdPrefix}-back-shadow`;

  return (
    <div className="insurance-card-pair">
      <article className="insurance-card-panel" aria-label="Primary Care Tree provider card front">
        <span className="insurance-card-side-label">Front</span>
        <svg
          id={`${cardIdPrefix}-front`}
          className="insurance-card-svg"
          viewBox="0 0 856 540"
          role="img"
          aria-labelledby={frontTitleId}
        >
          <title id={frontTitleId}>Primary Care Tree provider card front</title>
          <defs>
            <filter id={frontShadowId} x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#063d22" floodOpacity="0.18" />
            </filter>
          </defs>
          <rect x="10" y="10" width="836" height="520" rx="24" fill="#ffffff" filter={`url(#${frontShadowId})`} />
          <rect x="10" y="10" width="836" height="520" rx="24" fill="none" stroke="#007a34" strokeOpacity="0.36" />

          <g transform="translate(42 44)">
            {[0, 1, 2, 3, 4].map((tree) => (
              <g key={tree} transform={`translate(${tree * 17} 0)`}>
                <path d="M8 0 C18 16 19 38 8 48 C-3 38 -2 16 8 0Z" fill="#007a34" />
                <rect x="6" y="45" width="4" height="22" fill="#007a34" />
              </g>
            ))}
            <text x="102" y="32" className="svg-card-brand">PrimaryCareTree</text>
            <text x="104" y="58" className="svg-card-small">NYC Open Data tree provider card by PCT</text>
          </g>

          <text x="42" y="136" className="svg-card-label">Provider ID</text>
          <text x="190" y="136" className="svg-card-number">{doctorId}</text>
          <text x="520" y="136" className="svg-card-label">Search ZIP</text>
          <text x="745" y="136" textAnchor="end" className="svg-card-value">{zipcode}</text>
          <line x1="42" y1="165" x2="814" y2="165" className="svg-card-rule" />

          <text x="42" y="204" className="svg-card-label">Primary Tree Provider</text>
          {primaryProviderLines.map((line, index) => (
            <text key={line} x="42" y={242 + index * 36} className="svg-card-tree">
              {line}
            </text>
          ))}
          <text x="42" y="322" className="svg-card-body-quiet">{shortText(provider.speciesScientific, 44)}</text>

          <text x="470" y="204" className="svg-card-label">Clinical Specialty</text>
          {specialtyLines.map((line, index) => (
            <text key={line} x="470" y={242 + index * 33} className="svg-card-value">
              {line}
            </text>
          ))}

          <rect x="42" y="370" width="266" height="86" rx="12" fill="#f3f7f0" stroke="#007a34" strokeOpacity="0.32" />
          <text x="62" y="404" className="svg-card-label">Care rating</text>
          <text x="62" y="438" className="svg-card-value">{provider.careRating.toFixed(1)} / 5</text>

          <rect x="342" y="370" width="472" height="86" rx="12" fill="#f3f7f0" stroke="#007a34" strokeOpacity="0.32" />
          <text x="362" y="404" className="svg-card-label">Availability</text>
          <text x="362" y="438" className="svg-card-body">{availabilityLabel}</text>

          <text x="42" y="505" className="svg-card-small">Distance from search location: {provider.distanceLabel}</text>
          <text x="814" y="505" textAnchor="end" className="svg-card-small">Neighborhood: {shortText(provider.clinicNeighborhood, 30)}</text>
        </svg>
      </article>

      <article className="insurance-card-panel" aria-label="Primary Care Tree provider card back">
        <span className="insurance-card-side-label">Back</span>
        <svg
          id={`${cardIdPrefix}-back`}
          className="insurance-card-svg"
          viewBox="0 0 856 540"
          role="img"
          aria-labelledby={backTitleId}
        >
          <title id={backTitleId}>Primary Care Tree provider card back</title>
          <defs>
            <filter id={backShadowId} x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#063d22" floodOpacity="0.18" />
            </filter>
          </defs>
          <rect x="10" y="10" width="836" height="520" rx="24" fill="#ffffff" filter={`url(#${backShadowId})`} />
          <rect x="10" y="10" width="836" height="520" rx="24" fill="none" stroke="#007a34" strokeOpacity="0.36" />

          <g transform="translate(42 44)">
            {[0, 1, 2, 3, 4].map((tree) => (
              <g key={tree} transform={`translate(${tree * 14} 0)`}>
                <path d="M7 0 C16 14 17 34 7 43 C-2 34 -2 14 7 0Z" fill="#007a34" />
                <rect x="5.5" y="40" width="3" height="18" fill="#007a34" />
              </g>
            ))}
            <text x="92" y="30" className="svg-card-brand">Provider Record</text>
            <text x="94" y="56" className="svg-card-small">Fields shown from selected PCT data</text>
          </g>

          <text x="42" y="140" className="svg-card-label-bold">Visit Site</text>
          {clinicLines.map((line, index) => (
            <text key={line} x="42" y={174 + index * 26} className="svg-card-body">
              {line}
            </text>
          ))}
          {addressLines.map((line, index) => (
            <text key={line} x="42" y={240 + index * 24} className="svg-card-body-quiet">
              {line}
            </text>
          ))}

          <text x="470" y="140" className="svg-card-label-bold">Condition Focus</text>
          {conditionLines.map((line, index) => (
            <text key={line} x="470" y={174 + index * 26} className="svg-card-body">
              {line}
            </text>
          ))}

          <line x1="42" y1="336" x2="814" y2="336" className="svg-card-rule" />

          <a href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${provider.speciesCommon} in Google Maps`}>
            <g transform="translate(42 364)">
              <rect x="0" y="0" width="146" height="146" rx="10" fill="#ffffff" stroke="#007a34" strokeOpacity="0.32" />
              <rect x="17" y="17" width="112" height="112" fill="#ffffff" />
              <path d={mapsQrPath} fill="#063d22" transform="translate(17 17)" />
              <text x="73" y="139" textAnchor="middle" className="svg-card-small">Scan for map</text>
            </g>
          </a>

          <g transform="translate(226 378)">
            <text x="0" y="0" className="svg-card-label-bold">Provider Barcode</text>
            <rect x="0" y="24" width="540" height="92" rx="8" fill="#ffffff" stroke="#007a34" strokeOpacity="0.24" />
            <g transform="translate(20 34)">
              {providerBarcode.map((bar, index) => (
                <rect key={`${bar.x}-${index}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="#063d22" />
              ))}
            </g>
            <text x="270" y="106" textAnchor="middle" className="svg-card-small">PCT-{doctorId}</text>
          </g>
        </svg>
      </article>
    </div>
  );
}

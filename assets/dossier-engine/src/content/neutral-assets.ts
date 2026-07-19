import type { ImageAsset } from "../schema/types";

function svgData(content: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
}

function xmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function neutralStoryboardImage(number: string, label: string): ImageAsset {
  const palette = ["#5068FF", "#E7FF3C", "#D9D7CE", "#F2F0E9"] as const;
  const numeric = Number.parseInt(number, 10);
  const accent = palette[Number.isFinite(numeric) ? numeric % palette.length : 0] ?? palette[0];
  return {
    id: `fixture:neutral-storyboard-${number}`,
    src: svgData(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480">
        <rect width="720" height="480" fill="#171815"/>
        <circle cx="520" cy="120" r="190" fill="none" stroke="${accent}" stroke-width="18"/>
        <path d="M70 370h580M70 410h420" stroke="#777A70" stroke-width="8"/>
        <rect x="70" y="70" width="150" height="150" fill="${accent}"/>
        <text x="145" y="170" text-anchor="middle" fill="#171815" font-family="Arial" font-size="72" font-weight="700">${xmlText(number)}</text>
      </svg>
    `),
    alt: `Plan ${number}, ${label}`,
    credit: "Fixture storyboard vectorielle neutre",
    fit: "cover",
  };
}

export const neutralProofImage: ImageAsset = {
  id: "fixture:neutral-proof-image",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
      <rect width="720" height="900" fill="#5068FF"/>
      <rect x="72" y="90" width="576" height="190" fill="#F2F0E9"/>
      <rect x="72" y="322" width="576" height="190" fill="#171815"/>
      <rect x="72" y="554" width="576" height="256" fill="#E7FF3C"/>
      <circle cx="150" cy="184" r="36" fill="#171815"/>
      <circle cx="150" cy="416" r="36" fill="#E7FF3C"/>
      <path d="M220 160h330M220 205h230M220 392h330M220 437h260" stroke="#777A70" stroke-width="14"/>
      <path d="M130 650h460M130 702h360M130 754h410" stroke="#171815" stroke-width="18"/>
    </svg>
  `),
  alt: "Composition vectorielle neutre évoquant plusieurs preuves sociales",
  credit: "Fixture vectorielle neutre",
  fit: "cover",
};

export const neutralRiskImage: ImageAsset = {
  id: "fixture:neutral-risk-image",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
      <rect width="720" height="900" fill="#171815"/>
      <path d="M-80 760 360 60l440 700" fill="none" stroke="#E7FF3C" stroke-width="64"/>
      <path d="M-20 820 360 220l380 600" fill="none" stroke="#5068FF" stroke-width="18"/>
      <rect x="332" y="330" width="56" height="260" fill="#F2F0E9"/>
      <circle cx="360" cy="674" r="34" fill="#F2F0E9"/>
    </svg>
  `),
  alt: "Signal vectoriel neutre représentant une zone de risque",
  credit: "Fixture vectorielle neutre",
  fit: "cover",
};

export const neutralStudioPortrait: ImageAsset = {
  id: "fixture:neutral-studio-portrait",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
      <rect width="720" height="900" fill="#D9D7CE"/>
      <circle cx="360" cy="294" r="142" fill="#171815"/>
      <path d="M110 900c18-250 112-390 250-390s232 140 250 390" fill="#5068FF"/>
      <path d="M72 90h576M72 810h576" stroke="#E7FF3C" stroke-width="12"/>
      <path d="M94 110v680M626 110v680" stroke="#777A70" stroke-width="3"/>
    </svg>
  `),
  alt: "Portrait studio vectoriel neutre sans identité réelle",
  credit: "Fixture vectorielle neutre",
  fit: "cover",
  position: "center",
  sourceDimensions: { height: 900, width: 720 },
  subjectSafeBox: { height: .74, width: .7, x: .15, y: .1 },
};

export const neutralMotifFull: ImageAsset = {
  id: "fixture:neutral-motif-full",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <circle cx="300" cy="300" r="252" fill="none" stroke="#E7FF3C" stroke-width="20"/>
      <circle cx="300" cy="300" r="174" fill="none" stroke="#5068FF" stroke-width="8"/>
      <path d="M108 300h384M300 108v384" stroke="#F2F0E9" stroke-width="12"/>
      <path d="m185 415 230-230M185 185l230 230" stroke="#777A70" stroke-width="4"/>
      <rect x="268" y="268" width="64" height="64" fill="#171815" stroke="#F2F0E9" stroke-width="8"/>
    </svg>
  `),
  alt: "Motif vectoriel neutre composé d'orbites et d'axes",
  credit: "Fixture vectorielle neutre",
  fit: "contain",
};

export const neutralMotifQuiet: ImageAsset = {
  id: "fixture:neutral-motif-quiet",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <circle cx="300" cy="300" r="252" fill="none" stroke="#777A70" stroke-width="6" opacity=".62"/>
      <circle cx="300" cy="300" r="174" fill="none" stroke="#777A70" stroke-width="3" opacity=".38"/>
      <path d="M108 300h384M300 108v384" stroke="#777A70" stroke-width="3" opacity=".5"/>
      <rect x="280" y="280" width="40" height="40" fill="#777A70" opacity=".42"/>
    </svg>
  `),
  alt: "Version discrète du motif vectoriel neutre",
  credit: "Fixture vectorielle neutre",
  fit: "contain",
};

export const neutralPageMarker: ImageAsset = {
  id: "fixture:neutral-page-marker",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="43" fill="none" stroke="#777A70" stroke-width="5"/>
      <path d="M50 8v84M8 50h84" stroke="#777A70" stroke-width="4"/>
      <rect x="39" y="39" width="22" height="22" fill="#5068FF"/>
    </svg>
  `),
  alt: "Marqueur de page vectoriel neutre",
  credit: "Fixture vectorielle neutre",
  fit: "contain",
};

export const neutralSurfaceBackground: ImageAsset = {
  id: "fixture:neutral-surface-background",
  src: svgData(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1414">
      <rect width="2000" height="1414" fill="#D9D7CE"/>
      <g fill="none" stroke="#777A70" opacity=".13">
        <path d="M0 212h2000M0 424h2000M0 636h2000M0 848h2000M0 1060h2000M0 1272h2000"/>
        <path d="M236 0v1414M472 0v1414M708 0v1414M944 0v1414M1180 0v1414M1416 0v1414M1652 0v1414M1888 0v1414"/>
      </g>
      <circle cx="1710" cy="210" r="460" fill="none" stroke="#5068FF" stroke-width="18" opacity=".08"/>
    </svg>
  `),
  alt: "Fond vectoriel neutre quadrillé avec une orbite discrète",
  fit: "cover",
};

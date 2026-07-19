import type {
  CompositionFamily,
  ClaimRef,
  Dossier,
  DossierSlide,
  ImageAsset,
  MediaNature,
  MediaRole,
  VisualIntent,
} from "../schema/types";
import { substantiveContentEntries } from "../schema/content-claims";
import { exampleDossier } from "./example";
import { neutralPageMarker, neutralProofImage, neutralRiskImage } from "./neutral-assets";

const canonicalStudio = "Black Flower Creative House";
const signature = "BlackFlower";

interface VisualPlan {
  readonly family: CompositionFamily;
  readonly intent: VisualIntent;
  readonly peak: boolean;
  readonly rationale: string;
}

const plans: Readonly<Record<string, VisualPlan>> = {
  "01-ouverture": { family: "silent-cover", intent: "typographic", peak: true, rationale: "Une ouverture silencieuse installe le territoire sans faux visuel." },
  "02-architecture": { family: "diagrammatic-system", intent: "diagram", peak: false, rationale: "La relation entre matière, point de vue, formats et mémoire doit être lue." },
  "03-pourquoi-maintenant": { family: "editorial-columns", intent: "typographic", peak: false, rationale: "Trois signaux courts se comparent sans illustration décorative." },
  "04-preuves": { family: "evidence-field", intent: "image-led", peak: false, rationale: "Le document visuel porte la crédibilité de la page." },
  "05-manifeste": { family: "typographic-manifesto", intent: "typographic", peak: true, rationale: "Le manifeste crée un changement de rythme par la seule voix." },
  "06-risque": { family: "editorial-split", intent: "image-led", peak: false, rationale: "Une image dramatise la perte avant le détail des risques." },
  "07-basculements": { family: "image-dominant", intent: "image-led", peak: false, rationale: "La transformation doit être ressentie avant d'être explicitée." },
  "08-systeme": { family: "diagrammatic-system", intent: "diagram", peak: false, rationale: "Les couches du système exigent une lecture relationnelle unique." },
  "09-methode": { family: "editorial-sequence", intent: "image-supported", peak: false, rationale: "Une séquence d'images ancre chaque phase dans une matière réelle." },
  "10-film-hero": { family: "object-overlap", intent: "image-led", peak: true, rationale: "La scène et le cutout rendent le film immédiatement concret." },
  "11-storyboard-hero": { family: "storyboard-grid", intent: "image-led", peak: false, rationale: "Les plans doivent être inspectables comme une continuité visuelle." },
  "12-film-serie": { family: "object-overlap", intent: "image-led", peak: false, rationale: "Le still principal occupe le champ filmique avant la lecture éditoriale." },
  "13-storyboard-serie": { family: "storyboard-grid", intent: "image-led", peak: true, rationale: "Le rythme sériel se prouve par une suite d'images lisibles." },
  "14-activation": { family: "image-dominant", intent: "image-supported", peak: false, rationale: "La matière d'activation évite une simple liste de canaux." },
  "15-production": { family: "portrait-profile", intent: "image-led", peak: true, rationale: "Le portrait établit une présence derrière la production." },
  "16-references": { family: "reference-wall", intent: "image-led", peak: false, rationale: "Les références sont jugées visuellement, jamais par des cartes texte." },
  "17-merci": { family: "closing-letter", intent: "typographic", peak: false, rationale: "La conclusion revient à une adresse directe et calme." },
  "18-signature": { family: "lockup", intent: "typographic", peak: false, rationale: "Le mot-symbole BlackFlower clôt le dossier sans pseudo-symbole." },
};

function finalMedia(asset: ImageAsset, mediaRole: MediaRole, mediaNature: MediaNature, credit = true): ImageAsset {
  const { credit: originalCredit, ...base } = asset;
  return {
    ...base,
    ...(credit && originalCredit ? { credit: originalCredit } : {}),
    mediaNature,
    mediaRole,
    presentation: mediaRole === "product" ? "cutout" : "frame",
    productionStatus: "final",
  };
}

function requiredMedia(
  asset: ImageAsset | undefined,
  mediaRole: MediaRole,
  nature: MediaNature,
  credit = true,
): ImageAsset {
  if (!asset) throw new Error(`Média requis pour le rôle ${mediaRole}.`);
  return finalMedia(asset, mediaRole, nature, credit);
}

function planned(slide: DossierSlide) {
  const plan = plans[slide.id];
  if (!plan) throw new Error(`Plan visuel absent: ${slide.id}.`);
  const deep = slide.type === "cover" || slide.type === "lockup";
  return {
    backgroundField: deep ? "cover" : "body",
    compositionFamily: plan.family,
    tone: deep ? "ink" : "paper",
    visualIntent: plan.intent,
    visualIntentRationale: plan.rationale,
    visualPeak: plan.peak,
  } as const;
}

function proposalClaimed<T extends DossierSlide>(slide: T): T & { claims: readonly ClaimRef[] } {
  const claims = substantiveContentEntries(slide).map((entry): ClaimRef => ({
    contentPath: entry.path,
    kind: "proposal",
    text: typeof entry.value === "string"
      ? entry.value
      : `${entry.value.value} ${entry.value.label}`,
  }));
  return { ...slide, claims };
}

function annotateSlide(slide: DossierSlide): DossierSlide {
  const visual = planned(slide);
  switch (slide.type) {
    case "cover": return {
      ...slide,
      relationshipLabel: `Proposition indépendante pour ${slide.client}, par ${canonicalStudio}`,
      ...visual,
    };
    case "architecture": return { ...slide, image: requiredMedia(slide.image, "evidence", "document"), ...visual };
    case "proof": return { ...slide, image: requiredMedia(slide.image, "evidence", "document"), ...visual };
    case "risk": return { ...slide, image: requiredMedia(slide.image, "editorial", "photograph"), ...visual };
    case "opportunity": return {
      ...slide,
      image: finalMedia(neutralRiskImage, "editorial", "photograph", false),
      ...visual,
    };
    case "timeline": return {
      ...slide,
      steps: slide.steps.map((step) => ({
        ...step,
        image: finalMedia(neutralProofImage, "editorial", "screenshot", false),
      })),
      ...visual,
    };
    case "film-concept": return {
      ...slide,
      image: requiredMedia(slide.image, "film-still", "photograph"),
      ...(slide.id === "10-film-hero" ? {
        productCutout: {
          ...finalMedia(neutralPageMarker, "product", "product-cutout", false),
          fit: "contain",
        },
      } : {}),
      ...visual,
    };
    case "storyboard": return {
      ...slide,
      frames: slide.frames.map((frame) => ({
        ...frame,
        image: requiredMedia(frame.image, "storyboard-frame", "storyboard"),
      })),
      ...visual,
    };
    case "activation": return {
      ...slide,
      image: finalMedia(neutralProofImage, "editorial", "screenshot", false),
      ...visual,
    };
    case "production": {
      const production = proposalClaimed({
        id: slide.id,
        type: "production",
        variant: "black-flower-portrait",
        title: "PRODUCTION BLACKFLOWER",
        lead: "Donner forme à la précision.",
        role: "Nous tenons le fil entre stratégie, écriture, direction visuelle et fabrication, afin que chaque image serve la même idée.",
        approach: [
          "Un cadrage resserré avant toute production.",
          "Une direction unique du concept aux déclinaisons.",
          "Une matière pensée dès le tournage pour plusieurs formats.",
          "Des validations courtes aux moments décisifs.",
        ],
        strength: "La même équipe protège le regard, le niveau d'exécution et la continuité du dossier jusqu'aux livrables finaux.",
        portraitCaption: "BlackFlower · Direction créative et production",
        image: {
          ...requiredMedia(slide.image, "portrait", "portrait", false),
          fit: "contain",
          presentation: "frame",
        },
        ...visual,
      });
      return {
        ...production,
        claims: production.claims.map((claim) => claim.contentPath === "portraitCaption"
          ? { ...claim, kind: "fact", evidenceIds: ["fixture:contact-card"] }
          : claim),
      };
    }
    case "references": return {
      ...slide,
      references: slide.references.map((reference) => ({
        ...reference,
        image: finalMedia(neutralProofImage, "reference", "document", false),
      })),
      ...visual,
    };
    case "thank-you": return proposalClaimed({
      id: slide.id,
      type: "thank-you",
      variant: "black-flower-letter",
      title: "MERCI",
      paragraphs: [
        "Ce dossier part d'une conviction simple: Prospect Démo possède déjà la matière, les gestes et les preuves nécessaires pour construire un récit distinctif.",
        "La plateforme proposée ne cherche pas à ajouter une couche de communication. Elle organise ce qui existe, choisit un point de vue et donne à chaque format une fonction précise.",
        "BlackFlower peut apporter ce regard, tenir la continuité créative et produire un système assez sobre pour durer, assez vivant pour être reconnu et assez concret pour être activé.",
      ],
      closing: "Merci encore et à bientôt !",
      signature: "BLACKFLOWER × PROSPECT DÉMO",
      platform: "La précision en mouvement",
      image: {
        ...finalMedia(neutralPageMarker, "product", "product-cutout", false),
        fit: "contain",
        presentation: "cutout",
      },
      ...visual,
    });
    case "lockup": return {
      id: slide.id,
      type: "lockup",
      variant: "black-flower-co-mark",
      client: slide.client,
      clientMark: {
        ...finalMedia(neutralProofImage, "identity", "brand-mark", false),
        fit: "contain",
        presentation: "cutout",
      },
      studioMark: {
        ...finalMedia(neutralPageMarker, "identity", "brand-mark", false),
        fit: "contain",
        presentation: "cutout",
      },
      separator: "times",
      ...visual,
    };
    default: return { ...slide, ...visual };
  }
}

export const blackFlowerValidationFixture: Dossier = {
  ...structuredClone(exampleDossier),
  meta: {
    ...structuredClone(exampleDossier.meta),
    frameworkProfile: "black-flower",
    generativeAssets: "authorized",
    generativeAssetsAuthorization: {
      status: "explicitly-authorized",
      authorizedBy: "Fixture validator",
      reference: "fixture:black-flower-generative-authorization",
    },
    campaignMode: "campaign-platform",
    backgroundRhythm: "stable",
    creativeRouteCount: 2,
    studio: canonicalStudio,
    studioIdentity: { canonicalName: canonicalStudio, signature },
    version: "0.3-test",
  },
  assets: exampleDossier.assets.map((asset) => ({
    ...structuredClone(asset),
    origin: "provided",
    rightsBasis: "Simulation de métadonnées externes réservée aux tests du validateur Black Flower.",
  })),
  theme: {
    ...structuredClone(exampleDossier.theme),
    motif: {
      ...structuredClone(exampleDossier.theme.motif),
      derivation: "prospect-derived",
      kind: "none",
    },
    chrome: {
      footer: "minimal",
      runningHeader: {
        align: "left",
        showOnCover: true,
        text: "Strategic creative campaign proposal · BlackFlower",
      },
    },
    pageMarker: { kind: "number" },
  },
  slides: exampleDossier.slides.map(annotateSlide),
};

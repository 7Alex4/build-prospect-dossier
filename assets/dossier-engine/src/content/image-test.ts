import type { Dossier } from "../schema/types";
import { exampleDossier } from "./example";
import { neutralAssetRegistry } from "./neutral-asset-registry";
import { neutralProofImage, neutralRiskImage, neutralStudioPortrait } from "./neutral-assets";

export const imageTestDossier = {
  meta: {
    title: "Test structurel des slides avec image",
    client: "Entreprise neutre",
    language: "fr-CH",
    version: "1.0-test",
    date: "2026-07-18",
    distributionMode: "public",
    relationshipStatus: "independent-proposal",
    generativeAssets: "forbidden",
    stage: "draft",
    forbiddenClientTerms: ["client officiel"],
  },
  evidence: [],
  assets: neutralAssetRegistry,
  theme: {
    ...exampleDossier.theme,
    name: "Fixture visuelle neutre",
    logo: { ...exampleDossier.theme.logo, textFallback: "ENTREPRISE NEUTRE" },
    chrome: {
      ...exampleDossier.theme.chrome,
      runningHeader: {
        align: "right",
        showOnCover: false,
        text: "ENTREPRISE NEUTRE · DOSSIER DE TEST",
      },
    },
  },
  slides: [
    {
      id: "test-cover-gouvernance",
      type: "cover",
      tone: "ink",
      client: "Entreprise neutre",
      title: "Fixture visuelle neutre",
      subtitle: "Un dossier public destiné à vérifier les variantes du moteur.",
      proposition: "Contrôle des images et des compositions optionnelles",
      tag: "Démonstration",
      relationshipLabel: "Proposition indépendante pour Entreprise neutre",
    },
    {
      id: "test-proof-image",
      type: "proof",
      eyebrow: "Preuves qualitatives",
      title: "La confiance existe avant les chiffres",
      proofPoints: [
        "Une recommandation précise et attribuable",
        "Un cas client documenté avec son contexte",
        "Une démonstration observable du savoir-faire",
      ],
      image: neutralProofImage,
    },
    {
      id: "test-risk-image",
      type: "risk",
      tone: "ink",
      eyebrow: "Risque",
      title: "Voir clairement ce qui peut se perdre",
      lead: "Le visuel porte la tension pendant que le texte précise ses conséquences.",
      risks: [
        { label: "Confusion", consequence: "Le message central disparaît dans les variantes.", severity: 3 },
        { label: "Retard", consequence: "La décision arrive après le moment utile.", severity: 2 },
      ],
      image: neutralRiskImage,
    },
    {
      id: "test-production-portrait",
      type: "production",
      eyebrow: "Studio",
      title: "Une équipe visible, un dispositif lisible",
      lead: "Le portrait ancre la proposition dans une présence réelle.",
      workstreams: [
        { name: "Direction", detail: "Un regard commun sur le récit et les arbitrages.", owner: "Studio" },
        { name: "Fabrication", detail: "Une chaîne courte de la captation aux exports.", owner: "Production" },
      ],
      deliverables: ["Master", "Déclinaisons", "Guide de continuité"],
      image: neutralStudioPortrait,
    },
    {
      id: "test-thank-you-sans-contact",
      type: "thank-you",
      tone: "accent",
      eyebrow: "Conclusion",
      title: "Une conclusion peut rester pleinement éditoriale.",
      message: "Le message final demeure structuré même lorsqu'aucun contact explicite n'est affiché.",
      nextStep: "Prochaine étape: reprendre la conversation au bon moment.",
    },
    {
      id: "test-storyboard-brouillon",
      type: "storyboard",
      eyebrow: "Brouillon",
      title: "Un storyboard peut signaler les visuels encore en travail",
      frames: [
        { number: "01", beat: "Ouverture", visual: "Premier plan à préparer." },
        { number: "02", beat: "Développement", visual: "Deuxième plan à préparer." },
        { number: "03", beat: "Conclusion", visual: "Dernier plan à préparer." },
      ],
    },
    {
      id: "test-lockup-silencieux",
      type: "lockup",
      tone: "ink",
      client: "Entreprise neutre",
      relationshipLabel: "Proposition indépendante pour Entreprise neutre",
      legal: "Fixture de fin silencieuse",
    },
  ],
} satisfies Dossier;

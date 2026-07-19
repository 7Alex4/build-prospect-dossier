# Black Flower Prospect Dossier Engine

Moteur React et TypeScript pour produire les dossiers de prospection Black Flower. Il génère des slides PNG de 2000 × 1414 px, un PDF A4 paysage et un rapport de traçabilité JSON. Le profil `neutral` reste disponible pour intégrer le moteur sans identité commerciale.

## Prérequis

Les commandes s'exécutent depuis un checkout source complet. Le tarball npm expose la bibliothèque compilée, ses types et les scripts métier, mais pas les fichiers de configuration du checkout.

- Node.js 20.19 ou plus récent
- pnpm 10
- Chromium Playwright pour le rendu
- Poppler, avec `pdfinfo` et `pdftoppm`, pour l'audit du PDF livré
- les fichiers de fontes locales licenciées pour le dossier produit

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
```

## Commandes

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm validate src/content/example.ts
corepack pnpm build
corepack pnpm check
corepack pnpm render src/content/example.ts --out rendered
corepack pnpm preview src/content/example.ts
```

Le rendu refuse les assets HTTP. Utilisez un chemin local ou une URI `data:image/...`.

## Contrat du dossier

`meta.frameworkProfile` est obligatoire:

- `black-flower`: active l'identité, la cadence image-led, les médias finaux, le chrome éditorial et les garde-fous anti-gabarit;
- `neutral`: conserve le schéma générique, les claims, les droits et le rendu déterministe sans imposer la direction Black Flower.

`meta.stage` est obligatoire:

- `draft`: les claims fournis sont contrôlés, mais une couverture complète n'est pas exigée. Les frames de storyboard peuvent rester sans image;
- `final`: tous les textes substantiels visibles exigent un claim valide. Chaque frame de storyboard exige une image locale. Les tokens provisoires sont interdits.

`meta.studio` est optionnel dans le profil `neutral`. Dans une proposition indépendante, la slide `cover` doit afficher une relation explicite. Si le studio est fourni, ce libellé doit aussi le nommer. Le lockup Black Flower final reste volontairement silencieux.

En mode `black-flower` final, l'identité est fixe:

```ts
{
  frameworkProfile: "black-flower",
  studio: "Black Flower Creative House",
  studioIdentity: {
    canonicalName: "Black Flower Creative House",
    signature: "BlackFlower"
  },
  backgroundRhythm: "stable"
}
```

Le thème fournit `Strategic creative campaign proposal · BlackFlower` en haut à gauche et la pagination en bas à gauche sur les pages intérieures éligibles. La couverture et le lockup final silencieux n'affichent aucun chrome. Les signatures de rendu Nexaia sont refusées. Le copyright technique du paquet n'est pas injecté dans les slides.

Un dossier Black Flower final contient strictement 15 à 20 pages. Il doit suivre l'ordre diagnostic, preuve, risque, opportunité, plateforme, route créative, exécution, production, remerciement et lockup.

Les IDs de slides utilisent uniquement l'ASCII kebab-case, par exemple `01-cover`. Les collisions après normalisation sont refusées. Un ID reste technique et ne sert jamais de texte de footer par défaut.

## Claims et preuves

Chaque `ClaimRef` contient:

```ts
{
  text: "Le texte client exact",
  kind: "fact",
  contentPath: "metrics[0]",
  evidenceIds: ["source:01"]
}
```

`contentPath` est relatif à la slide. La syntaxe accepte les propriétés et index, par exemple `title`, `columns[0].body` ou `frames[2].onScreen`. Un chemin absolu comme `slides[0].title` est refusé.

Le texte doit correspondre au champ ciblé après normalisation Unicode, casse et espaces. Pour une métrique, il doit contenir sa valeur et son libellé.

Les claims `fact`, `quote` et `observation` exigent au moins un `evidenceId`. La preuve doit exister dans le registre racine et être `verified` ou `official-only`. Les correspondances de type sont contrôlées. Une preuve `rejected` ne peut jamais être citée.

Le moteur ne fournit aucun classeur automatique qui transformerait tous les champs en propositions. L'exemple final contient une cartographie explicite, champ par champ.

## Registre d'assets et droits

Chaque `ImageAsset` exige un `id`, un `src` local et un texte alternatif. La racine du dossier contient un registre `assets`. Son `id` doit être unique et correspondre à l'image. Le registre fournit soit le même `src`, soit un `ledgerId` vers la ligne de registre externe. Il consigne aussi l'origine, la base de droits, le statut et les scopes autorisés:

```ts
{
  id: "asset:hero-01",
  src: "../../assets/processed/hero-01.png",
  origin: "licensed-library",
  rightsBasis: "Licence commerciale archivée sous LIC-2026-041",
  status: "approved",
  allowedDistributionScopes: ["private-prospecting"]
}
```

Un asset traversé est refusé s'il manque au registre, n'est pas `approved`, ne couvre pas `meta.distributionMode` ou provient de `generated` sans `meta.generativeAssets: "authorized"` et un bloc `generativeAssetsAuthorization` complet. Le profil seul n'accorde aucune autorisation. Un asset généré ne peut jamais porter le rôle de preuve, produit exact, personne identifiée ou identité, ni la nature de capture, document, archive, portrait, cutout produit ou marque. Lorsque le registre fournit `src`, cette valeur doit être identique à celle de l'image. Le champ manuel `slide.assetIds` est interdit. Le moteur dérive les identifiants depuis les images réellement traversées, y compris les assets du thème et des storyboards.

### Métadonnées visuelles Black Flower

Chaque média client d'un dossier `black-flower` final doit déclarer:

```ts
{
  mediaRole: "film-still",
  mediaNature: "photograph",
  presentation: "frame",
  productionStatus: "final"
}
```

`mediaRole` décrit le travail éditorial du média: `hero`, `evidence`, `editorial`, `product`, `portrait`, `film-still`, `storyboard-frame` ou `reference`. `mediaNature` décrit ce qui est réellement montré: photographie, cutout produit, screenshot, document, archive, illustration, storyboard ou portrait. `productionStatus: "placeholder"` est bloqué en final Black Flower.

Un portrait Production déclare aussi ses dimensions source et une safe box normalisée:

```ts
{
  sourceDimensions: { width: 1600, height: 2000 },
  subjectSafeBox: { x: 0.12, y: 0.06, width: 0.76, height: 0.86 }
}
```

Le ratio source doit rester vertical, entre 0.65 et 1. La safe box conserve au moins 3% d'air vertical. Une page complète 2000 × 1414 réutilisée comme portrait est refusée.

`presentation` contrôle la mise en scène de l'asset: `frame`, `background` ou `cutout`. Un `cutout` utilise `contain`, conserve son débordement et peut chevaucher la scène. Une slide `film-concept` accepte `productCutout` en plus de son image principale. Chaque `TimelineStep` accepte une image afin de produire une séquence de méthode visuelle.

Les assets de fond, motifs et identités ne comptent pas comme médias de contenu. Une page ne peut donc pas satisfaire son quota avec un quadrillage, un logo, une texture ou un décor de thème.

## Contrat visuel Black Flower

Chaque slide finale déclare un `visualIntent` parmi:

- `image-led`: l'image porte l'idée principale;
- `image-supported`: l'image apporte une preuve ou une présence nécessaire;
- `typographic`: la composition repose volontairement sur le texte;
- `diagram`: une relation, une séquence ou une architecture doit réellement être expliquée.

Elle déclare aussi `visualIntentRationale`, `compositionFamily` et `visualPeak`. La rationale explique pourquoi cette page mérite son traitement. La famille décrit sa composition réelle. `visualPeak` marque un pic volontaire dans le rythme du contact sheet.

Le moteur impose ensuite les seuils suivants sur l'ensemble du dossier:

- 45 à 65% de pages `image-led`, avec une cible signalée à 55%;
- 2 diagrammes au maximum;
- aucun diagramme consécutif;
- 2 pages sans média consécutives au maximum;
- un média principal obligatoire pour chaque page `risk`, `film-concept`, `activation` et `production` finale;
- un rythme de fond `stable` ou `binary-chapter`, avec quatre transitions majeures maximum en mode stable;
- une couverture typographique silencieuse autorisée, sans pseudo-visuel de remplacement;
- une image pour chaque référence et chaque frame de storyboard finale;
- une Production `black-flower-portrait` avec les trois blocs fixes et un portrait vertical isolé;
- un Merci `black-flower-letter` de 3 à 4 paragraphes, 75 à 135 mots, avec retour d'un objet prospect;
- un lockup `black-flower-co-mark` dont le premier plan contient uniquement le vrai logo prospect, `×` et la fleur Black Flower; le motif documenté du champ de couverture peut rester en arrière-plan;
- au moins 6 familles de composition et 3 pics visuels;
- une seule série contiguë de 2 à 4 pages `film-concept` peut répéter un master compatible lorsque toutes les routes du dossier appartiennent au bloc et que sa longueur égale exactement `meta.creativeRouteCount`; l'adjacence reste interdite aux frontières et les usages hors bloc restent plafonnés à trois;
- au moins 60% des pages visuelles contenant un média réel ou documentaire issu d'une origine admissible;
- au maximum 40% des pages visuelles contenant un asset généré;
- aucun motif générique `frame`, `orbit`, `grid` ou `signal`;
- un motif asset uniquement s'il est déclaré `prospect-derived` ou `typographic-system`.

Les deux ratios d'origine sont indépendants. Une page composite avec scène générée et vrai produit compte à la fois comme page avec asset généré et comme page documentaire lorsque le produit réel est correctement enregistré.

Une page visuelle est toute page qui rend au moins un média substantiel dans son contenu. Son `visualIntent` ne peut ni l'exclure du dénominateur, ni masquer une origine générée.

Le profil Black Flower remplace les cartes, compteurs de sévérité, blocs sombres systématiques et typographie mono dominante par une composition éditoriale. Le corps essentiel est maintenu à 24 px ou plus. Les légendes et micro-informations restent entre 18 et 22 px. Le contenu commence à 140 px des bords. Sur les pages intérieures éligibles, le chrome commence à 84 px et la pagination utilise 36 px.

Ajouter seulement `frameworkProfile: "black-flower"` à un ancien dossier schématique ne suffit pas. Le validateur échoue aussi sur les intentions visuelles, les rationales, les familles, le ratio image-led, la cadence, le source mix, les pages film, risque, activation et production, puis sur les fallbacks restants.

`src/content/black-flower-validation-fixture.ts` est une fixture technique. Ses SVG neutres servent uniquement à tester le schéma, jamais à guider une direction visuelle ou à représenter un document, une archive, une personne ou un produit réel.

## Garde-fous finaux

Le mode `final` bloque notamment:

- tout champ substantiel sans claim;
- un claim dont le chemin ou le texte ne correspond pas;
- les tokens `TODO`, `TBD`, `TBC`, `lorem`, `placeholder`, `[insert` et `à compléter`;
- une frame de storyboard sans image locale;
- une page Black Flower `risk`, `film-concept`, `activation` ou `production` sans média principal;
- un asset HTTP;
- une source de référence sans libellé.

Le scan client couvre aussi les alt d'images, numéros, indices, timecodes et textes réellement rendus par le thème. Ces champs structurels ne demandent pas de `ClaimRef`. Un site web affiché dans le contact est au contraire un champ substantif et exige un claim exact.

### Codes stables du profil Black Flower

Les intégrations peuvent traiter ces codes comme l'API de validation de la version `0.3.x`:

| Code | Niveau | Condition |
|---|---|---|
| `black-flower-required-media` | erreur | Une page risk, film, activation ou production finale n'a pas d'image principale. |
| `black-flower-studio` | erreur | Le nom canonique Black Flower est absent ou différent. |
| `black-flower-identity` | erreur | L'objet d'identité ou la signature `BlackFlower` est invalide. |
| `black-flower-header` | erreur | Le contrat de micro-en-tête exact pour les pages intérieures éligibles ou son alignement gauche manque. |
| `black-flower-page-marker` | erreur | Le contrat de pagination numérique en bas à gauche des pages intérieures éligibles manque. |
| `black-flower-footer` | erreur | Le contrat de footer minimal requis pour la pagination intérieure manque. |
| `black-flower-foreign-signature` | erreur | Nexaia apparaît dans un texte visible, un alt ou le thème rendu. |
| `black-flower-slide-count` | erreur | Le dossier final ne contient pas 15 à 20 pages. |
| `black-flower-narrative-required` | erreur | Une étape narrative obligatoire manque. |
| `black-flower-narrative-order` | erreur | Les étapes narratives sont dans le mauvais ordre. |
| `black-flower-brand-truth` | erreur | La vérité de marque n'a pas son média documentaire. |
| `black-flower-current-baseline` | erreur | L'état actuel n'a pas son média documentaire. |
| `black-flower-diagnostic-media` | erreur | La vérité de marque ou l'état actuel utilise un média non documentaire ou généré. |
| `black-flower-campaign-mode` | erreur | Le mode focused-opportunity ou campaign-platform manque. |
| `black-flower-route-count` | erreur | Le nombre de routes film annoncé ne correspond pas aux pages. |
| `black-flower-route-depth` | erreur | Une plateforme de campagne contient moins de deux routes. |
| `black-flower-claim-mix` | erreur | Le diagnostic ne contient pas assez de claims sourcés non-proposal. |
| `black-flower-grounded-section` | erreur | Une page de diagnostic obligatoire ne contient aucun claim sourcé. |
| `black-flower-visual-intent` | erreur | Une slide finale n'a pas d'intention visuelle valide. |
| `black-flower-visual-rationale` | erreur | La rationale visuelle manque. |
| `black-flower-composition-family` | erreur | La famille de composition manque ou est invalide. |
| `black-flower-visual-peak` | erreur | Le booléen de pic visuel manque. |
| `black-flower-intent-media` | erreur | Une intention image-led ou image-supported n'a pas de média. |
| `black-flower-image-led-ratio` | erreur | Le ratio image-led sort de la plage 45 à 65%. |
| `black-flower-image-led-target` | avertissement | Le ratio reste valide mais s'éloigne de la cible 55%. |
| `black-flower-media-cadence` | erreur | Trois pages consécutives ou plus sont sans média. |
| `black-flower-composition-diversity` | erreur | Le dossier utilise moins de six familles de composition. |
| `black-flower-composition-binding` | erreur | La famille déclarée ne pilote pas ce type de page. |
| `black-flower-composition-overuse` | erreur | Une famille est utilisée plus de trois fois hors série film admissible. |
| `black-flower-adjacent-compositions` | erreur | Une famille se répète sur deux pages consécutives hors série film admissible ou à sa frontière. |
| `black-flower-visual-peak-count` | erreur | Le dossier contient moins de trois pics visuels. |
| `black-flower-real-documentary-ratio` | erreur | Moins de 60% des pages visuelles contiennent un média réel ou documentaire admissible. |
| `black-flower-generated-ratio` | erreur | Plus de 40% des pages visuelles contiennent un asset généré. |
| `black-flower-diagram-cap` | erreur | Le dossier contient plus de deux diagrammes. |
| `black-flower-adjacent-diagrams` | erreur | Deux diagrammes sont consécutifs. |
| `black-flower-diagram-family` | erreur | Un diagramme utilise une famille de page inadaptée. |
| `black-flower-generic-motif` | erreur | Le thème utilise un motif générique. |
| `black-flower-motif-derivation` | erreur | La dérivation du motif asset n'est pas documentée. |
| `black-flower-media-role` | erreur | Le rôle éditorial du média manque ou est décoratif. |
| `black-flower-media-nature` | erreur | La nature réelle du média manque ou est décorative. |
| `black-flower-media-final` | erreur | Le média est un placeholder ou son statut final manque. |
| `black-flower-reference-media` | erreur | Une référence finale utilise encore le fallback texte. |
| `black-flower-production-master` | erreur | La Production n'utilise pas la variante portrait stricte. |
| `black-flower-portrait-ratio` | erreur | Le portrait source n'est pas un média vertical isolé. |
| `black-flower-portrait-safe-box` | erreur | La safe box ne protège pas le sujet et l'air autour de la tête. |
| `black-flower-thanks-master` | erreur | Le Merci n'utilise pas la lettre éditoriale stricte. |
| `black-flower-thanks-letter` | erreur | Le nombre de paragraphes ou le budget de mots est invalide. |
| `black-flower-lockup-master` | erreur | Le final n'utilise pas le co-mark silencieux. |
| `black-flower-finish-silence` | erreur | Un champ CTA, légal, relationnel ou opérationnel pollue un master de fin. |
| `black-flower-background-transitions` | erreur | Le rythme stable dépasse quatre transitions cover/body. |

## Sorties vérifiables

Un dossier `final` exige `theme.typography.faces`. Chaque entrée relie un rôle `display`, `body` ou `mono` à sa famille primaire, son style, ses graisses, sa licence et sa source. Pour une production, utilisez `kind: "local"`, un chemin relatif, le format et le SHA-256 exact du fichier. `kind: "system"` sert aux fixtures techniques et doit énumérer les familles que Chromium peut réellement résoudre sur les environnements admis.

Le renderer vérifie le hash de chaque fichier local avant de l'injecter comme `@font-face`. Il crée ensuite une sonde pour chaque couple famille, style et graisse. Chromium doit charger la fonte, puis son protocole de débogage doit confirmer la famille réellement utilisée, le nom PostScript et l'état webfont ou système. Un fallback non déclaré bloque le rendu.

Chaque page PDF contient deux entrées dans son dictionnaire:

- `/DossierSourceSHA256`: SHA-256 hexadécimal des bytes du PNG embarqué;
- `/DossierSourceFile`: nom du fichier PNG source.

Ces marqueurs permettent de vérifier le contenu et l'ordre des pages. L'audit externe doit aussi rastériser le PDF avec Poppler `pdftoppm` et comparer le contenu visuel réel de chaque page au PNG ordonné.

`render-report.json` utilise le schéma `1.0`. Il consigne au niveau racine `stage`, `totalSlides`, `renderedCount`, `selectionApplied`, les sélecteurs dans `selection` et les IDs réellement rendus dans `renderedSlideIds`. `themeAssetIds` et chaque entrée de `traceability[].assetIds` sont dérivés des objets réellement traversés. Le résumé `assetRegistry` conserve droits, scopes et un SHA-256 du contenu hydraté, jamais le `src` brut ni une data URI. `fontAudit` conserve le contrat de fontes, son hash, chaque graisse réellement résolue, son nom PostScript, sa licence et le hash de sa source. Le bloc `integrity` relie le fichier source, le dossier chargé, chaque PNG et le PDF. `render-report.sha256` protège le rapport lui-même. Un rapport `draft`, partiel, minimal ou contenant une preuve `internal-only` ne constitue jamais une livraison.

L'hydratation est plafonnée à 32 MiB par asset et 256 MiB cumulés par défaut. Les sources locales identiques sont lues une seule fois et les data URI sont soumises aux mêmes plafonds avant rendu.

## Déterminisme

Un rendu pixel-identique est garanti uniquement avec le même OS, la même version de Chromium et les mêmes fichiers de fontes locales. Chaque dossier réel doit utiliser des fontes locales licenciées, hashées et documentées dans `theme.typography.faces`. Les fixtures publiques emploient des fontes système autorisées pour faciliter le démarrage. Elles vérifient le fonctionnement du moteur et l'absence de fallback inattendu, mais ne constituent pas une garantie pixel-identique entre plateformes.

## Bibliothèque

Le paquet exporte `App`, `SlideRenderer`, `validateDossier`, `assertDossier`, les types du schéma et `themeStyle`. La feuille de style compilée est disponible via `prospect-dossier-engine/styles.css`.

Licence MIT.

# Prospect Dossier Engine

Moteur React et TypeScript pour produire des dossiers de prospection déterministes. Il génère des slides PNG de 2000 × 1414 px, un PDF A4 paysage et un rapport de traçabilité JSON.

## Prérequis

Les commandes de développement ci-dessous s'exécutent depuis un checkout source complet. Le tarball npm expose la bibliothèque compilée, ses types et les scripts métier, mais pas les fichiers de configuration du checkout.

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

`meta.stage` est obligatoire:

- `draft`: les claims fournis sont contrôlés, mais une couverture complète n'est pas exigée. Les frames de storyboard peuvent rester sans image.
- `final`: tous les textes substantiels visibles exigent un claim valide. Chaque frame de storyboard exige une image locale. Les tokens provisoires sont interdits.

`meta.studio` est optionnel. Dans une proposition indépendante, les slides `cover` et `lockup` doivent afficher une relation explicite. Si le studio est fourni, ce libellé doit aussi le nommer.

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

Un asset traversé est refusé s'il manque au registre, n'est pas `approved`, ne couvre pas `meta.distributionMode` ou provient de `generated` sans `meta.generativeAssets: "authorized"`. Lorsque le registre fournit `src`, cette valeur doit être identique à celle de l'image. Le champ manuel `slide.assetIds` est interdit. Le moteur dérive les identifiants depuis les images réellement traversées, y compris les assets du thème et des storyboards.

## Garde-fous finaux

Le mode `final` bloque notamment:

- tout champ substantiel sans claim;
- un claim dont le chemin ou le texte ne correspond pas;
- les tokens `TODO`, `TBD`, `TBC`, `lorem`, `placeholder`, `[insert` et `à compléter`;
- une frame de storyboard sans image locale;
- un asset HTTP;
- une source de référence sans libellé.

Le scan client couvre aussi les alt d'images, numéros, indices, timecodes et textes réellement rendus par le thème. Ces champs structurels ne demandent pas de `ClaimRef`. Un site web affiché dans le contact est au contraire un champ substantif et exige un claim exact.

## Sorties vérifiables

Chaque page PDF contient deux entrées dans son dictionnaire:

- `/DossierSourceSHA256`: SHA-256 hexadécimal des bytes du PNG embarqué;
- `/DossierSourceFile`: nom du fichier PNG source.

Ces marqueurs permettent de vérifier le contenu et l'ordre des pages. L'audit externe doit aussi rastériser le PDF avec Poppler `pdftoppm` et comparer le contenu visuel réel de chaque page au PNG ordonné.

`render-report.json` utilise le schéma `1.0`. Il consigne au niveau racine `stage`, `totalSlides`, `renderedCount`, `selectionApplied`, les sélecteurs dans `selection` et les IDs réellement rendus dans `renderedSlideIds`. `themeAssetIds` et chaque entrée de `traceability[].assetIds` sont dérivés des objets réellement traversés. Le résumé `assetRegistry` conserve droits, scopes et un SHA-256 de l'identité source, jamais le `src` brut ni une data URI. Un rapport `draft` ou partiel ne constitue jamais une livraison.

L'hydratation est plafonnée à 32 MiB par asset et 256 MiB cumulés par défaut. Les sources locales identiques sont lues une seule fois et les data URI sont soumises aux mêmes plafonds avant rendu.

## Déterminisme

Un rendu pixel-identique est garanti uniquement avec le même OS, la même version de Chromium et les mêmes fichiers de fontes locales. Chaque dossier réel doit utiliser des fontes locales licenciées et documentées. La fixture neutre emploie l'Arial ou l'Helvetica du système pour faciliter le démarrage. Elle vérifie le fonctionnement du moteur, mais n'est pas pixel-identique entre plateformes.

## Bibliothèque

Le paquet exporte `App`, `SlideRenderer`, `validateDossier`, `assertDossier`, les types du schéma et `themeStyle`. La feuille de style compilée est disponible via `prospect-dossier-engine/styles.css`.

Licence MIT.

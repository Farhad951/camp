# À propos de Camp

Camp est une appli personnelle pour iPhone qui réunit la boxe, la salle, la nutrition, la peau et le suivi des progrès. Elle s'installe depuis Safari sur l'écran d'accueil, sans App Store ni compte.

Ce document explique comment elle fonctionne et comment elle est construite. L'installation, la commande des tests et les crédits détaillés des vidéos sont dans le [README](README.md).

## Philosophie

- **Sur mesure :** le programme suit une semaine précise : boxe mardi, jeudi et samedi, salle dimanche et lundi, repos mercredi et vendredi.
- **Sans serveur :** le site est un ensemble de fichiers statiques, publié sur GitHub Pages. Il n'y a ni compte ni base de données en ligne, et aucune donnée n'est envoyée à un serveur de Camp.
- **Données sur le téléphone :** séances, repas, pesées et photos restent sur l'appareil. Trois services extérieurs, tous facultatifs, peuvent recevoir une demande : Gemini, Open Food Facts et YouTube (voir plus bas).
- **Hors ligne :** après un premier lancement avec du réseau, tout s'ouvre sans connexion, y compris les clips d'exercices. Seuls l'IA, le scan de produits et les vidéos YouTube demandent du réseau.
- **Gratuit :** aucun service payant, aucun abonnement.
- **Règles de contenu :** halal, sans porc ni alcool. Les objectifs ne descendent jamais sous 2 300 kcal. L'analyse des photos ne donne jamais de note de beauté.

## Les cinq onglets

### Jour

La semaine en un coup d'œil, le statut de chaque jour et ce qu'il reste à faire aujourd'hui. Une séance de boxe ratée propose un rattrapage On Air. Un aperçu résume les calories, les protéines et l'eau du jour.

### Entraîner

- **On Air :** deux séances de rattrapage, A et B, bloc par bloc, en version complète ou légère.
- **Chrono :** minuteur de rounds de boxe, avec cloche.

Les séances de salle s'ouvrent depuis l'écran du jour. Chaque exercice a un clip hors ligne, ses étapes, le suivi des séries et un minuteur de repos.

- **Trois modes :** complète, express ou allégée. L'allégée divise les séries par deux à charges égales, et ne compte ni pour les plateaux ni pour les courbes.
- **Plan B :** 20 exercices ont un remplaçant si le poste est pris. Ses séries valident l'étape sans toucher aux records de l'exercice principal.
- **Rappels du coach :** un ajustement retenu depuis le bilan revient sur la carte de l'exercice, jusqu'à ce qu'il soit marqué appliqué.

### Bouffe

- **Saisie :** un repas se note par une phrase écrite ou dictée, un favori, un repas fréquent, une photo ou la reprise d'un repas d'hier.
- **Sans IA :** la lecture locale comprend les synonymes, les portions naturelles (« une boîte de thon ») et les fautes de frappe. Elle ne remplace jamais du porc ou de l'alcool par un autre aliment.
- **Eau :** +0,5 L les jours de boxe ou d'On Air, +0,5 L sur chantier, soit +1 L au plus. L'appli dit pourquoi.
- **Passé minuit :** entre 0 h et 4 h, un geste rattache le repas, l'eau ou la routine de peau à la veille si la soirée n'est pas finie.

### Visage

- **Peau :** routine, journal, photos analysées par l'IA.
- **Sèche :** phase avec date de fin, signaux d'arrêt calculés, note du matin qui révèle ce qui fait gonfler.

### Progrès et Plan

- **Corps :** photos comparées par l'IA, mensurations et pesées à la date de ton choix.
- **Force :** tonnage, records et plateaux.
- **Boxe :** carnet des notes du club et d'On Air, ressenti par semaine, assiduité.
- **Régularité :** le suivi des séances dans le temps.
- **Le plan et les réglages :** la logique de la semaine, la progression, la sauvegarde et les options.

## L'intelligence artificielle

L'IA est facultative et ne passe que par Gemini de Google. L'appli l'appelle directement avec ta clé, sans intermédiaire.

- **Clé :** elle est collée une fois sur le téléphone, reste hors des sauvegardes et n'entre jamais dans ce dépôt public.
- **Modèles gratuits :** tous les 3 jours, l'appli lit la liste des modèles ouverts à ta clé et ne garde que les Flash et Flash-Lite stables, jamais Pro.
- **Choix selon la tâche :**

| Tâche | Effort | Premier modèle essayé |
|---|---|---|
| Lire un emballage ou un frigo | Léger | Flash-Lite |
| Analyser un repas | Moyen | Flash le plus récent |
| Bilan, recette, peau, corps | Poussé | Flash le plus récent |

- **Quotas :** un modèle saturé passe la main au suivant, et l'appli s'arrête à 60 demandes par jour.
- **Bilan de la semaine :** il propose jusqu'à 3 ajustements, sans rien changer tout seul.
- **Photos :** elles ne partent qu'après ton accord, donné une fois pour le visage et une fois pour le corps.
- **Sans clé ni réseau :** tout le reste fonctionne. Un repas noté hors ligne peut être analysé au retour du réseau.

**Ce qui sort du téléphone :** avec l'IA, les textes et photos envoyés vont chez Google. D'après le texte affiché dans l'appli, les conditions de Google excluent pour la France leur usage pour améliorer ses produits, mais Google les garde 55 jours pour détecter les abus, et un employé peut voir un contenu signalé. Le scan interroge Open Food Facts, et « Voir le geste » charge le lecteur YouTube sans cookie.

## Les médias

Les 29 clips pèsent environ 3 Mo. Chacun est muet, recadré en 544 × 408 et décrit dans `outils/selection.json`.

| Origine | Clips | Licence |
|---|---:|---|
| wger | 8 | CC BY-SA 4.0 |
| Wikimedia Commons | 4 | CC BY ou CC BY-SA |
| Pixabay | 9 | Licence Pixabay |
| Pexels | 2 | Licence Pexels |
| Photos free-exercise-db animées par RIFE | 6 | Unlicense, RIFE sous MIT |

23 clips sont donc de vraies vidéos. Les 6 autres (nordic, sauts latéraux, landmine, Pallof, cou, mountain climbers) partent de deux photos, et RIFE dessine le mouvement entre les deux. Quand le geste filmé diffère du tien, la carte de l'exercice le signale.

Trois réserves :

- **Licences :** celles de Pixabay et Pexels sont gratuites, mais ce ne sont pas des licences open source.
- **Photos :** le dépôt free-exercise-db ne documente pas leur origine.
- **Netteté :** quand le corps se déplace beaucoup, comme dans les sauts latéraux ou le landmine, une ou deux images de transition restent floues.

« Voir le geste » ouvre 31 vidéos YouTube détaillées, en français quand il en existe une bonne.

## Sauvegarde et résilience

- **Stockage :** les données sont dans `localStorage`, les photos et les sauvegardes automatiques dans IndexedDB.
- **Sauvegardes automatiques :** 14 au plus sur le téléphone, une par jour et avant chaque import ou effacement.
- **Export :** un fichier à garder ailleurs, avec ou sans photos. L'appli le rappelle tous les 30 jours. C'est la seule protection si l'appli est supprimée du téléphone.
- **Import :** les fichiers sont fusionnés et nettoyés, et un fichier corrompu est refusé sans perte.
- **Données illisibles :** elles sont mises de côté, et l'appli propose de restaurer.
- **Écran en erreur :** un écran de secours s'affiche et propose d'exporter, sans toucher aux données.
- **Minuteurs :** la fin du repos est programmée dans le moteur audio. Au retour, l'appli affiche « Repos terminé il y a 25 s » et lance un rappel. Si iOS ferme la page, le repos et la séance reviennent, mais pas le minuteur de rounds.
- **Mises à jour :** le service worker sert la version en cache, puis télécharge la suivante en arrière-plan.

## Architecture

| Élément | Rôle |
|---|---|
| `index.html` | Toute l'appli : interface, données et logique, en JavaScript sans framework, avec la bibliothèque d'animation Motion intégrée |
| `clips.js` | Liste des clips, générée par l'outil |
| `sw.js` | Service worker. Son nom de cache `camp-<empreinte>` suit `index.html` et `clips.js` |
| `videos/` | Clips et images d'attente |
| `demarrage/` | 13 écrans de démarrage iPhone, identiques au premier frame de l'ouverture |
| `outils/` | `videos.mjs` (clips), `cache.js` (nom du cache), `demarrage.js` et `icones.js` (images) |
| `tests/` | Parcours rejoués dans Chrome sans interface |

Après une retouche, trois règles gardent l'ensemble synchronisé :

- `index.html` ou `clips.js` modifié : lancer `node outils/cache.js`.
- Ouverture modifiée : lancer `node outils/demarrage.js`.
- Dans tous les cas : lancer `npm test`, qui vérifie le cache et les écrans de démarrage.

`.env` (clés) et `tests/fixtures/` (vraie sauvegarde) restent sur le PC, Git les ignore.

## Tests et limites

`npm test` lance 14 suites : thème et contrastes, parcours, cohérence, hors ligne, réseau, Bouffe et Visage, IA simulée, robustesse, glissements, vraie sauvegarde, cas extrêmes, nouveautés, saisie de nuit et largeurs d'écran de 320 à 440 px. `npm run test:youtube` vérifie la lecture des 31 vidéos.

Ces tests tournent dans Chrome. Ils ne remplacent pas un essai sur un vrai iPhone, surtout pour trois points propres à iOS : les minuteurs écran verrouillé, le son et la vibration au retour dans l'appli.

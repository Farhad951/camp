# Camp

Appli d'entraînement personnelle : boxe (mardi, jeudi, samedi) et salle (dimanche, lundi).

- La semaine en un coup d'œil, avec le statut de chaque jour.
- Séances de salle : un clip hors ligne et les étapes d'exécution pour chaque exercice, un bouton « Voir le geste » vers une vidéo YouTube détaillée, en français quand il en existe une bonne, le suivi des séries (charge et répétitions), la progression conseillée et un minuteur de repos.
- Séances de rattrapage On Air quand une séance de boxe saute, avec un clip et une vidéo par bloc et par station.
- Minuteur de rounds avec cloche.
- Bouffe : photo ou description d'un plat vers macros, grammes et repères sans balance, recettes générées depuis tes ingrédients ou une photo du frigo, scan de produits français (Open Food Facts), eau, journal du jour, idées de repas selon ce qu'il reste à manger.
- Visage : routine de peau (adapalène, Cutacnyl, tes produits), journal et photos analysées par l'IA, phase de sèche avec date de fin, signaux d'arrêt calculés, note du matin qui révèle ce qui fait gonfler.
- Progrès : photos de progression comparées par l'IA, rappel toutes les 3 semaines, mensurations, tonnage, plateaux, records, bilan de la semaine.
- Fonctionne hors ligne une fois installée.

## Installer sur iPhone

1. Ouvre https://farhad951.github.io/camp/ dans Safari.
2. Partager → Sur l'écran d'accueil → Ajouter.
3. Lance l'appli une première fois avec du réseau. Ensuite, elle marche sans réseau.

Les séances sont enregistrées sur le téléphone uniquement. Pense à faire Progrès → Le plan et les réglages → Exporter de temps en temps. Les photos restent sur le téléphone et ne sont pas dans la sauvegarde.

## IA

L'appli n'a pas de serveur : elle appelle directement Gemini avec ta clé, à coller une fois dans Bouffe → Objectif → IA. La clé ne doit jamais entrer dans ce dépôt, qui est public : elle reste dans le navigateur, hors sauvegarde et hors synchro, et dans `.env` (ignoré par Git) pour les tests. Seul Gemini est branché, aucun service payant. L'appli essaie plusieurs modèles Flash si l'un est saturé et s'arrête à 60 demandes par jour. Les photos ne partent qu'après ton accord, donné une fois pour le visage et une fois pour le corps. Sans clé ni réseau, tout le reste fonctionne.

Open Food Facts (gratuit, sans clé) fournit les produits français.

## Tests

Il faut Node et Chrome. L'appli elle-même ne demande aucune installation.

    npm install
    npm test

`npm test` ouvre l'appli dans Chrome sans interface et rejoue les parcours : thème et contrastes, séance complète, cohérence des textes, lecture hors ligne, préchargement, Bouffe et Visage (services d'IA simulés, caméra factice). Il faut du réseau pour le lecteur YouTube. Les captures vont dans `tests/sortie/`.

- `npm run test:ia` essaie le vrai Gemini avec la clé de `.env`. Il consomme un peu de quota.
- `npm run test:youtube` vérifie que les 31 vidéos se lisent dans le lecteur.
- `npm run test:vitesse` mesure le site publié avec un processeur ralenti et trois réseaux lents.

Ces tests ne remplacent pas un essai sur un vrai iPhone.

## Thème

Elegant Luxury, avec la police du système : rien à télécharger. `node outils/icones.js` redessine les icônes et les écrans de démarrage de l'iPhone.

## Vidéos

Les clips de `videos/` sont décrits dans `outils/selection.json` et produits par `node outils/videos.mjs appliquer`. Ce sont des extraits recadrés, compressés et sans son.

- Rowing assis, développé incliné, élévations latérales et à la poulie, oiseau, curl, extension triceps et face pull : Goulart, via [wger](https://wger.de), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les extraits restent sous cette licence.
- Tractions : FitnessScape, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.fr).
- Swing : Taco Fleur, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kettlebell_Swing_Hip_Hinge_Style.webm), CC BY-SA 4.0. Burpee : Gyglim, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Burpee_How_To.webm), CC BY-SA 3.0.
- Sac lourd : UncleSamPatriot, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Boxing_Heavy_Bag_Analysis.webm), CC BY 4.0.
- Pompes, shadow boxing : via [Pixabay](https://pixabay.com), [licence Pixabay](https://pixabay.com/service/license-summary/).
- Les 15 autres clips sont deux photos des positions, en fondu, faute de vidéo libre : [free-exercise-db](https://github.com/yuhonas/free-exercise-db), publié sous Unlicense. L'origine des photos elles-mêmes n'est pas documentée par ce dépôt. `node outils/videos.mjs installer <exo> <fichier>` les remplace par ta propre vidéo.

La liste complète est dans `outils/selection.json`.

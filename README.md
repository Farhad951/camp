# Camp

Appli d'entraînement personnelle : boxe (mardi, jeudi, samedi) et salle (dimanche, lundi).

- La semaine en un coup d'œil, avec le statut de chaque jour.
- Séances de salle avec un bouton « Voir le geste » vers une vidéo YouTube choisie pour chaque exercice, en français quand il en existe une bonne, un clip hors ligne quand il existe (voir `outils/videos.mjs`), le suivi des séries (charge et répétitions), la progression conseillée et un minuteur de repos.
- Séances de rattrapage On Air quand une séance de boxe saute, avec une vidéo par bloc et par station.
- Minuteur de rounds avec cloche.
- Fonctionne hors ligne une fois installée.

## Installer sur iPhone

1. Ouvre https://farhad951.github.io/camp/ dans Safari.
2. Partager → Sur l'écran d'accueil → Ajouter.
3. Lance l'appli une première fois avec du réseau. Ensuite, elle marche sans réseau.

Les séances sont enregistrées sur le téléphone uniquement. Pense à faire Plan → Exporter de temps en temps.

## Tests

Il faut Node et Chrome. L'appli elle-même ne demande aucune installation.

    npm install
    npm test

`npm test` ouvre l'appli dans Chrome sans interface et rejoue les parcours : thème et contrastes, séance complète, cohérence des textes, lecture hors ligne, préchargement. Il faut du réseau pour le lecteur YouTube. Les captures vont dans `tests/sortie/`.

- `npm run test:youtube` vérifie que les 31 vidéos se lisent dans le lecteur.
- `npm run test:vitesse` mesure le site publié avec un processeur ralenti et trois réseaux lents.

Ces tests ne remplacent pas un essai sur un vrai iPhone.

## Thème

Elegant Luxury, avec la police du système : rien à télécharger. `node outils/icones.js` redessine les icônes et les écrans de démarrage de l'iPhone.

## Vidéos

Les clips de `videos/` sont décrits dans `outils/selection.json` et produits par `node outils/videos.mjs appliquer`. Ce sont des extraits recadrés, compressés et sans son.

- Rowing assis, développé incliné, élévations latérales, oiseau, curl, extension triceps et face pull : Goulart, via [wger](https://wger.de), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les extraits restent sous cette licence.
- Tractions : FitnessScape, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.fr).

Un exercice sans clip garde sa figure animée, ou un lien YouTube s'il n'en a pas.

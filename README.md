# Camp

Appli d'entraînement personnelle : boxe (mardi, jeudi, samedi) et salle (dimanche, lundi).

- La semaine en un coup d'œil, avec le statut de chaque jour.
- Séances de salle avec une vidéo par exercice (voir `outils/videos.mjs`), le suivi des séries (charge et répétitions), la progression conseillée et un minuteur de repos.
- Séances de rattrapage On Air quand une séance de boxe saute.
- Minuteur de rounds avec cloche.
- Fonctionne hors ligne une fois installée.

## Installer sur iPhone

1. Ouvre https://farhad951.github.io/camp/ dans Safari.
2. Partager → Sur l'écran d'accueil → Ajouter.
3. Lance l'appli une première fois avec du réseau. Ensuite, elle marche sans réseau.

Les séances sont enregistrées sur le téléphone uniquement. Pense à faire Plan → Exporter de temps en temps.

## Vidéos

Les clips de `videos/` sont décrits dans `outils/selection.json` et produits par `node outils/videos.mjs appliquer`. Ce sont des extraits recadrés, compressés et sans son.

- Rowing assis, développé incliné, élévations latérales, oiseau, curl, extension triceps et face pull : Goulart, via [wger](https://wger.de), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les extraits restent sous cette licence.
- Tractions : FitnessScape, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.fr).

Un exercice sans clip garde sa figure animée, ou un lien YouTube s'il n'en a pas.

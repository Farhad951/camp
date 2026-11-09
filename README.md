# Camp

Appli d'entraînement personnelle : boxe (mardi, jeudi, samedi) et salle (dimanche, lundi).

- La semaine en un coup d'œil, avec le statut de chaque jour.
- Séances de salle : un clip hors ligne et les étapes d'exécution pour chaque exercice, un bouton « Voir le geste » vers une vidéo YouTube détaillée, en français quand il en existe une bonne, le suivi des séries (charge et répétitions), la progression conseillée et un minuteur de repos.
- Séance allégée en un geste (toutes les 6 semaines, semaine de combat, fatigue) : moitié moins de séries, mêmes charges, validée à 100 %, jamais comptée pour les plateaux. L'appli la propose après une nuit courte, une fatigue notée le matin même ou six semaines sans allègement.
- Plan B : poste pris, la carte bascule sur le remplaçant. Ses séries valident l'étape sans toucher aux records de l'exercice principal, et gardent leur propre suivi.
- Rappels du coach : un ajustement du bilan se retient et revient sur la carte de l'exercice, à la salle, jusqu'à ce que tu le marques appliqué.
- Minuteurs : verrou d'éveil repris automatiquement, fin programmée dans le moteur audio, et au retour dans l'appli « Repos terminé il y a 25 s » avec un rappel. Si iOS ferme la page, le repos et la séance reviennent. Réglage « Minuteur écran verrouillé » : un son muet garde le minuteur actif écran éteint, mais il coupe ta musique, donc il est désactivé par défaut.
- Séances de rattrapage On Air quand une séance de boxe saute, avec un clip et une vidéo par bloc et par station.
- Minuteur de rounds avec cloche.
- Bouffe : un repas se note en écrivant ou en dictant une phrase (« hier soir, 2 naans et un karahi »), en un geste depuis les favoris et les repas fréquents, ou en photo, à n'importe quelle date. Pour retirer un repas : glisse sa ligne vers la gauche ou touche sa corbeille, avec Annuler pendant 6 s. Recettes depuis tes ingrédients, scan de produits français (Open Food Facts), eau, idées de repas selon ce qu'il reste à manger. Sans réseau, le repas est noté et analysé au retour de la connexion. Sans IA, la lecture locale comprend les synonymes (« coca », « cabillaud »), les portions naturelles (« une boîte de thon », « 2 blancs de poulet », « un pot de skyr », « une poignée d'amandes »), les fautes de frappe, et ce que tu as déjà noté ou scanné. « Reprendre d'hier » recopie un repas de la veille, portion ajustable. L'objectif d'eau monte de 0,5 L les jours de boxe ou d'On Air, et de 0,5 L sur chantier, soit +1 L quand les deux tombent le même jour. L'appli dit pourquoi. Passé minuit, tant que la soirée d'hier n'est pas finie, un geste rattache le repas, l'eau ou la routine de peau à hier soir.
- Visage : routine de peau (adapalène, Cutacnyl, tes produits), journal et photos analysées par l'IA, phase de sèche avec date de fin, signaux d'arrêt calculés, note du matin qui révèle ce qui fait gonfler.
- Progrès : photos de progression comparées par l'IA, rappel toutes les 3 semaines, mensurations et pesées à la date de ton choix, tonnage, plateaux, records, bilan de la semaine, carnet de boxe (notes du club et d'On Air, ressenti par semaine, assiduité).
- Fonctionne hors ligne une fois installée.

## Installer sur iPhone

1. Ouvre https://farhad951.github.io/camp/ dans Safari.
2. Partager → Sur l'écran d'accueil. Laisse « Ouvrir en tant qu'app web » activé, puis Ajouter. Sinon, iOS crée un simple signet qui s'ouvre avec les barres de Safari.
3. Lance l'appli une première fois avec du réseau. Ensuite, elle marche sans réseau.

Les séances sont enregistrées sur le téléphone uniquement. Pense à faire Progrès → Le plan et les réglages → Exporter de temps en temps : l'appli te le rappelle tous les 30 jours. Le bouton Photos ajoute tes photos au fichier. L'appli garde aussi 14 sauvegardes automatiques sur le téléphone (Importer → Sauvegardes automatiques), une par jour et avant chaque import ou effacement. Elles ne protègent pas contre la suppression de l'appli : seul l'export le fait.

## IA

L'appli n'a pas de serveur : elle appelle directement Gemini avec ta clé, à coller une fois dans Bouffe → Objectif → IA. La clé ne doit jamais entrer dans ce dépôt, qui est public : elle reste dans le navigateur, hors sauvegarde et hors synchro, et dans `.env` (ignoré par Git) pour les tests. Seul Gemini est branché, aucun service payant. L'appli lit la liste des modèles que Google ouvre à ta clé (tous les 3 jours) et ne garde que les Flash et Flash-Lite stables, gratuits : jamais de Pro, payant. Chaque demande a son effort : lire un emballage ou un frigo passe d'abord par Flash-Lite, rapide, avec une réflexion légère ; un repas par le Flash le plus récent ; un bilan, une recette, la peau ou le corps par le Flash le plus récent, avec une réflexion poussée. Un modèle saturé ou à court de quota passe la main au suivant, et l'appli s'arrête à 60 demandes par jour. Le bilan de la semaine lit aussi tes 4 dernières semaines de salle, ton poids et ton ressenti, et propose jusqu'à 3 ajustements du programme, sans rien changer tout seul. Les photos ne partent qu'après ton accord, donné une fois pour le visage et une fois pour le corps. Sans clé ni réseau, tout le reste fonctionne.

Open Food Facts (gratuit, sans clé) fournit les produits français.

## Tests

Il faut Node et Chrome. L'appli elle-même ne demande aucune installation.

    npm install
    npm test

`npm test` ouvre l'appli dans Chrome sans interface et rejoue les parcours : thème et contrastes, séance complète, cohérence des textes, lecture hors ligne, préchargement, Bouffe et Visage, IA, parcours critiques et cas limites : repas passés, hors ligne, import et export, données abîmées, coupure réseau totale puis synchro au retour, import de fichiers corrompus, appli ouverte pendant minuit, clé Gemini refusée et quota épuisé, image de démarrage identique au premier frame de l’ouverture, règles de progression, suppression d’un repas par glissement ou corbeille, bannière d’installation, et ta vraie sauvegarde si elle est dans tests/fixtures/sauvegarde-test.json (ce dossier reste sur le PC, Git l’ignore) : import, Bouffe, rattrapage selon le jour raté, On Air bloc par bloc, bascule Complète / Légère dans le minuteur (services d'IA simulés, caméra factice). Les suites `nouveautes` et `nuit` couvrent la séance allégée, le Plan B, le carnet de boxe, les rappels du coach, l'eau du jour, la copie de repas, la lecture locale, la saisie passé minuit, les pesées antidatées, les minuteurs au retour de l'arrière-plan, et vérifient que le cache correspond à cette version. Il faut du réseau pour le lecteur YouTube. Les captures vont dans `tests/sortie/`.

- `npm run test:ia` essaie le vrai Gemini avec la clé de `.env`. Il consomme un peu de quota.
- `npm run test:youtube` vérifie que les 31 vidéos se lisent dans le lecteur.
- `npm run test:vitesse` mesure le site publié avec un processeur ralenti et trois réseaux lents.

Ces tests ne remplacent pas un essai sur un vrai iPhone.

## Thème

Elegant Luxury, avec la police du système : rien à télécharger. `node outils/icones.js` redessine les icônes. `node outils/demarrage.js` refait les écrans de démarrage de l'iPhone à partir du premier frame de l'ouverture : à relancer après toute retouche de l'ouverture (`npm test` vérifie qu'ils correspondent). `node outils/cache.js` met à jour le nom du cache du service worker : à relancer après toute retouche de `index.html` ou `clips.js`, sinon le téléphone garde l'ancienne version (`npm test` le vérifie aussi).

## Vidéos

Les clips de `videos/` sont décrits dans `outils/selection.json` et produits par `node outils/videos.mjs appliquer`. Ce sont des extraits recadrés, compressés et sans son.

- Rowing assis, développé incliné, élévations latérales et à la poulie, oiseau, curl, extension triceps et face pull : Goulart, via [wger](https://wger.de), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les extraits restent sous cette licence.
- Tractions : FitnessScape, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.fr).
- Swing : Taco Fleur, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kettlebell_Swing_Hip_Hinge_Style.webm), CC BY-SA 4.0. Burpee : Gyglim, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Burpee_How_To.webm), CC BY-SA 3.0.
- Sac lourd : UncleSamPatriot, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Boxing_Heavy_Bag_Analysis.webm), CC BY 4.0.
- Pompes, shadow boxing, corde (Engin_Akyurt) ; soulevé, rowing, crunch, planche latérale et frappe (tixonov_valentin) : via [Pixabay](https://pixabay.com), [licence Pixabay](https://pixabay.com/service/license-summary/). Quand le geste filmé n'est pas exactement le tien, la carte le dit.
- Lancer rotatif au médecine-ball : RDNE Stock project, via [Pexels](https://www.pexels.com/video/man-working-out-at-the-gym-7187420/), [licence Pexels](https://www.pexels.com/license/).
- Les 7 derniers (nordic, sauts sur box, sauts latéraux, landmine, Pallof, cou, mountain climbers) n'ont pas de vidéo libre retenue : deux photos des positions de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, origine des photos non documentée par ce dépôt), et le mouvement entre les deux dessiné par [RIFE](https://github.com/nihui/rife-ncnn-vulkan) (MIT, gratuit, tourne sur le PC). Mets `RIFE_BIN=<chemin de rife-ncnn-vulkan.exe>` dans `.env` pour les refaire, sinon l'outil retombe sur ffmpeg, moins net. Quand le corps se déplace beaucoup (sauts latéraux, landmine), une ou deux images de transition restent floues : c'est mieux qu'un fondu, moins net qu'une vraie vidéo. `node outils/videos.mjs installer <exo> <fichier>` les remplace par ta propre vidéo.

La liste complète est dans `outils/selection.json`.

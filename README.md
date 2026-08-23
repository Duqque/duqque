# Duqque Sports

Site vitrine de l'association **Duqque Sports** — accompagnement des sportives et des sportifs
sur la gestion de carrière, l'image, la communication et les partenariats.

## Nature du projet

HTML statique, sans étape de build ni dépendance. Trois fichiers portent tout :

| Fichier | Rôle |
|---|---|
| `css/style.css` | feuille globale : variables de marque, barre de navigation, menu, composants |
| `js/main.js` | composants injectés (nav, menu, pied de page, révélations au défilement, partage) |
| `*.html` | une page par fichier, chacune avec son propre bloc `<style>` |

Le bloc `<style>` de chaque page est chargé **après** `style.css` : à spécificité égale,
c'est la règle de la page qui l'emporte.

## Lancer en local

```bash
python3 -m http.server 5178
```

Puis ouvrir http://localhost:5178/home.html

## Conventions

- **Cache-busting** : chaque `<link>` et `<script>` porte `?v=AAAAMMJJ`. **Incrémenter
  la valeur dans tous les fichiers HTML à chaque modification de `style.css` ou `main.js`**,
  sinon les navigateurs servent l'ancienne version.
- **Contraste** : le site vise le niveau WCAG **AAA** (7:1 pour le texte courant,
  4.5:1 à partir de 24px, ou 18.66px en gras). Toute nouvelle couleur doit être vérifiée.
- **Articles** : ajouter l'entrée correspondante dans le tableau `ARTICLES` de `js/main.js`,
  qui alimente l'index affiché dans la colonne de droite des articles.
- **Menu** : la liste des liens vit dans `MENU_LINKS` (`js/main.js`).

## Polices

`assets/fonts/` contient des polices sous licence commerciale (Gilroy, LT Museum,
TT Mussels). **Ce dépôt doit rester privé** tant que les licences n'autorisent pas
leur redistribution.

## Images

Les photographies sont pour l'instant des placeholders Unsplash, à remplacer par les
visuels réels des athlètes et des structures accompagnées.

# Tahlila — laboratoire Laravel + React

L’application Laravel existante sert maintenant les pages React avec Vite. Les données, sessions, URLs métier et contrôleurs de sauvegarde restent dans Laravel. Le navigateur charge des fichiers compilés : aucun serveur Node n’est nécessaire en utilisation normale.

## Démarrage local et LAN

Dans le projet déjà installé :

```sh
npm run build
php artisan serve --host=0.0.0.0 --port=8000
```

Sur le serveur : `http://127.0.0.1:8000`. Sur un autre appareil du même réseau : `http://IP_LOCALE_DU_SERVEUR:8000`. Utilisez l’adresse du serveur, et non `localhost`, sur les autres appareils. Autorisez le port 8000 dans le pare-feu et désactivez l’isolation des clients Wi-Fi si elle empêche la connexion.

Les liens et les formulaires utilisent le même domaine que la page. Dans `.env`, `APP_URL` doit correspondre à l’adresse utilisée pour les liens générés et les e-mails. Pour un test LAN en HTTP, `SESSION_SECURE_COOKIE` doit être `false` et `SESSION_DOMAIN` vide. Après modification de `.env` : `php artisan config:clear`.

Si vous avez lancé `npm run dev`, arrêtez-le avant de tester la version compilée. Le fichier `public/hot` doit être absent pour que Laravel utilise `public/build/manifest.json`.

## Installation sur une nouvelle machine

Prérequis : PHP et extensions demandés par Composer, Composer, base de données configurée, Node.js compatible avec Vite 7 (Node 22.18 utilisé pour cette compilation).

```sh
composer install
npm ci
```

Configurez `.env` pour votre base existante. Ne remplacez pas sa clé `APP_KEY`. Générez une clé avec `php artisan key:generate` seulement pour une installation neuve. Faites une sauvegarde avant toute migration, puis exécutez `php artisan migrate` pour installer les rôles et l’espace patient sans réinitialiser la base.

Pour une base neuve uniquement, exécutez les migrations habituelles. `php artisan storage:link` rend les logos téléchargés accessibles depuis `public/storage`. Puis compilez et démarrez avec les commandes précédentes.

Les comptes de démonstration documentés avant la refonte, s’ils ont été créés dans votre base, sont :

- `admin@tahlila.test` / `password`
- `reception@tahlila.test` / `password`

La refonte ne recrée pas les comptes et ne réinitialise aucun mot de passe.

## Pages et parcours

| Domaine      | Parcours React                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Accueil      | Compteurs réels, derniers dossiers, activité par jour/mois/année                                                                 |
| Patients     | Recherche paginée, création, modification, suppression, historique, nouveau dossier                                              |
| Analyses     | Sélection individuelle, par groupe ou catégorie ; devis ; paiement ; modification ; conservation des résultats maintenus         |
| Sample Collection | Statut, date, étiquettes standard et par consommable, codes-barres et QR codes                                              |
| Résultats    | Deux valeurs et unités, références, âge/poids/taille, conclusion, statut, compte rendu imprimable, notification e-mail           |
| Factures     | Liste, document imprimable/PDF via le navigateur, solde et règlement                                                             |
| Catalogue    | Analyses, tarifs, groupes, catégories et champs nécessaires aux résultats                                                        |
| Stocks       | Création, modification, quantités, couleurs et suppression                                                                       |
| Paramètres   | Laboratoire et logo, paiement, SMTP, couleurs, langues et traductions                                                            |
| Espace patient | Activation administrateur, premier accès par e-mail, mot de passe oublié, suivi des dossiers et résultats validés              |
| Compte       | Connexion employés, récupération et changement de mot de passe, vérification e-mail, profil et suppression du compte             |

L’interface reprend les espaces, les verts et la simplicité de navigation inspirés de [Wise](https://wise.com/), avec des écrans adaptés au laboratoire.

## Architecture

- `routes/lims.php` expose le document React pour les accès directs et une API JSON sous `/api/lims/...`, avec les mêmes protections de session. Les anciennes vues Blade inutilisées ont été supprimées.
- `app/Http/Controllers/LimsPageController.php` fournit les données de lecture et les schémas de formulaires.
- `resources/views/react.blade.php` charge les ressources Vite et transmet des données JSON échappées.
- `resources/views/email/templates/test_result_ready.blade.php` est le modèle HTML du courriel de notification. Il ne participe pas à l’interface utilisateur.
- `resources/js/lims/` contient les composants partagés, les pages React et les contrats TypeScript de données. Les pages sont en JSX ; les modules de données et de traduction sont typés.
- `app/Services/SaveLaboratoryOrder.php` valide les sélections, calcule les montants côté serveur et enregistre le dossier dans une transaction.
- React Router contrôle les URLs et charge les écrans depuis l’API JSON Laravel sans recharger le document. Les liens standards restent utilisables lors d’un accès direct ou sans historique client.
- Les formulaires sont envoyés avec `fetch` et conservent les sessions, la protection CSRF, les validations, les fichiers et les redirections Laravel. Les erreurs 422 sont affichées directement dans l’écran React.
- Les polices système et les ressources locales permettent l’utilisation sans CDN sur le LAN.
- Les textes React traduisibles sont recensés dans `resources/js/lims/messages.json` et utilisent les fichiers de langue existants. La page d’édition inclut les nouvelles clés ; les traductions absentes utilisent un libellé de remplacement.
- L’espace patient utilise des comptes séparés des employés. Activez-le dans `Paramètres → Espace patient`. Les patients ayant un e-mail valide et unique utilisent « Premier accès ou mot de passe oublié » pour définir leur mot de passe. Configurez SMTP et `APP_URL` avant l’envoi des liens, notamment avec l’adresse IP du serveur pour un usage LAN.
- L’inscription publique des employés est désactivée. L’ancienne URL `/register` redirige vers la connexion patient ; les employés sont créés exclusivement par un administrateur depuis la page Équipe.

## Vérification

```sh
npm run build
php artisan test
LIMS_CAPTURE_DIR=/private/tmp/tahlila-ui-tests php artisan test --filter=LimsWorkflowTest
npm run test:ui -- /private/tmp/tahlila-ui-tests
```

PHPUnit force SQLite `:memory:` : les tests ne doivent jamais employer la base du laboratoire. Les tests React utilisent des données fictives produites par ces tests PHP, puis vérifient le rendu dans jsdom et la sélection/soumission des analyses. Ce contrôle ne remplace pas une validation visuelle dans un navigateur, sur téléphone et avec vos imprimantes.

Sur PHP 8.5, le Laravel installé émet des avertissements de dépréciation concernant `PDO::MYSQL_ATTR_SSL_CA` dans ses propres fichiers de configuration. Ils sont distincts des échecs de tests ; les fichiers de `vendor` ne sont pas modifiés.

## Production

Utilisez PHP-FPM avec Nginx ou Apache pour la production. `php artisan serve` est réservé au développement et aux essais LAN. Un exemple Nginx est fourni dans `deploy/nginx.conf.example` ; adaptez le domaine, le chemin `public`, le socket PHP et la configuration TLS.

```sh
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Copiez également `public/build` sur le serveur. Node n’a pas à y rester installé. Configurez `APP_ENV=production`, `APP_DEBUG=false`, l’URL HTTPS et les cookies sécurisés. Le compte PHP doit pouvoir écrire dans `storage` et `bootstrap/cache`. La modification des traductions requiert aussi un accès en écriture aux fichiers `lang/*.json`.

## Limites héritées, rendues explicites

- La page Équipe permet aux administrateurs de créer les comptes, choisir un rôle et ajouter des permissions individuelles. Les pages React, l’API JSON et les actions Laravel utilisent le même registre central `config/lims_permissions.php` et le même middleware d’autorisation.
- Les anciennes pages Licence et Mise à jour étaient des maquettes sans service backend. Elles affichent désormais cet état, sans fausse activation ni faux bouton de mise à jour.
- Le schéma historique ne stocke pas de prix et de taxe figés par ligne de dossier. Les documents distinguent le montant enregistré des tarifs actuels du catalogue. Un changement de paiement seul conserve le total historique ; changer les analyses recalcule le total à partir du catalogue.
- L’impression des étiquettes ne décrémente pas automatiquement le stock, comme dans le parcours existant.
- L’envoi d’e-mails dépend de vos identifiants SMTP ; aucun e-mail réel n’est envoyé par les tests.

## portail patient

/patient/login

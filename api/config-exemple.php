<?php
/* Secrets de l'administration Duqque.
   EXCLU DU DÉPÔT : le dépôt est public. Ce fichier se dépose à la main sur
   l'hébergement, dans public_html/api/, à côté de _commun.php.

   Le mot de passe n'est pas ici : seule sa dérivation PBKDF2 y figure, la même
   que dans acces-cle.js. Le retrouver depuis ces valeurs demanderait de casser
   250 000 itérations de PBKDF2-HMAC-SHA256. */
return [
  'sel'            => '27bffd3e81c1d8f238081d67bb796a00',
  'iterations'     => 250000,
  'cle'            => '16f2045301d3f60f04253a665a189f95b9809078b39c9f3c57ca2c59ad15704f',

  // Signe les jetons de session et anonymise les adresses IP.
  // Le changer déconnecte immédiatement toutes les sessions ouvertes.
  'secret_session' => 'REMPLACEZ-MOI-PAR-64-CARACTERES-ALEATOIRES',
];

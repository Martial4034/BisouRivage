# À 18 ans : Réalisation de la Marketplace [BisouRivage.fr](https://bisourivage.fr) pour un Client

## Introduction

À seulement **18 ans**, collaboration avec un client souhaitant créer une plateforme dédiée aux artistes photographes français. **Bisourivage** est une marketplace en ligne conçue sur mesure, permettant aux artistes de vendre leurs œuvres en édition limitée tout en offrant aux amateurs d'art un accès à des photographies originales et uniques. 
Ce projet a été une démonstration concrète de mes compétences en développement web et en gestion de projet, répondant aux besoins spécifiques du client avec professionnalisme et efficacité.

![enter image description here](https://i.imgur.com/280dRrs.png)

[English Version](https://github.com/Martial4034/BisouRivage/edit/main/en-README.md)

## Table des Matières

1.  [Défis et Objectifs](#d%C3%A9fis-et-objectifs)
2.  [Approche Stratégique](#approche-strat%C3%A9gique)
3.  [Description du Projet](#description-du-projet)
4.  [Fonctionnalités Clés](#fonctionnalit%C3%A9s-cl%C3%A9s)
5.  [Technologies Utilisées](#technologies-utilis%C3%A9es)
6.  [Instructions d’Utilisation](#instructions-dutilisation)
8.  [SEO & Accessibilité](#seo--accessibilit%C3%A9)
9.  [Ressources Visuelles](#ressources-visuelles)
10.  [Enseignements et Compétences Acquises](#enseignements-et-comp%C3%A9tences-acquises)
11.  [Contact](#contact)

## Défis et Objectifs

### Défis

-   **Création d'une Marketplace Performante** : Développer une plateforme robuste capable de gérer les inscriptions des artistes, la gestion des ventes et les transactions sécurisées.
-   **Expérience Utilisateur Optimale** : Assurer une navigation fluide et intuitive pour les utilisateurs, qu'ils soient artistes ou acheteurs.
-   **Intégration de Systèmes de Paiement Sécurisés** : Mettre en place un système de paiement fiable et sécurisé pour garantir la confiance des utilisateurs.
-   **Gestion des Notifications** : Assurer une communication efficace entre les artistes et les acheteurs via des notifications automatisées.

### Objectifs

-   **Connecter Artistes et Amateurs d'Art** : Offrir une plateforme où les artistes peuvent facilement vendre leurs œuvres et où les collectionneurs peuvent découvrir des pièces uniques.
-   **Faciliter la Vente en Ligne** : Permettre aux artistes de gérer leurs ventes de manière autonome et efficace.
-   **Assurer la Sécurité des Transactions** : Garantir des paiements sécurisés et une gestion fiable des données des utilisateurs.

## Approche Stratégique

### Identification des Besoins

Des sessions de brainstorming approfondies avec le client ont permis de définir les besoins clés et les fonctionnalités essentielles de la marketplace. L'objectif principal était de créer une plateforme intuitive qui répondrait aux attentes des artistes et des acheteurs.

### Élaboration et Développement

-   **Planification** : Définition des différentes phases de développement avec des jalons clairs.
-   **Développement Agile** : Adoption d'une méthodologie agile pour permettre des ajustements rapides en fonction des retours du client.
-   **Tests Rigoureux** : Mise en place de tests continus pour assurer la qualité et la performance de la plateforme.

### Déploiement et Maintenance

-   **Déploiement sur Vercel** : Utilisation de Vercel pour un hébergement rapide et optimisé.
-   **Suivi et Maintenance** : Surveillance continue de la plateforme pour garantir sa stabilité et son évolutivité.

## Description du Projet

**Bisourivage** est une marketplace en ligne dédiée aux artistes photographes français souhaitant vendre leurs œuvres en édition limitée. La mission de Bisourivage est de connecter les amateurs d'art avec des photographies originales, signées et disponibles dans divers formats, offrant ainsi une expérience artistique unique.

### Objectif

Bisourivage permet aux artistes de partager leur art avec une audience plus large et aux collectionneurs de découvrir et d'acquérir des œuvres uniques, renforçant ainsi le lien entre création artistique et collection privée.

## Fonctionnalités Clés

-   **Authentification Utilisateur** : Système sécurisé via Firebase avec vérification par e-mail et code OTP.
-   **Inscription et Gestion des Artistes** : Les artistes peuvent créer un compte, proposer leurs œuvres, définir les formats, les prix et les quantités disponibles.
-   **Galerie Interactive** : Navigation optimisée et expérience visuelle immersive pour découvrir les œuvres.
-   **Panier et Paiement** : Gestion du panier avec paiement sécurisé via Stripe.
-   **Notifications Automatisées** : Système de notifications transactionnelles avec Resend pour informer les artistes de chaque vente et des détails de la commande.
-   **Optimisation SEO** : Pratiques SEO intégrées pour maximiser la visibilité du site sur les moteurs de recherche.

## Technologies Utilisées

- ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) **Next.js 14**: Framework principal pour le développement frontend et backend.
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS**: Stylisation rapide et responsive du sondage et du dashboard.
- ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) **Firebase Firestore**: Base de données NoSQL pour stocker les réponses au sondage et les informations des utilisateurs.
- ![Resend](https://img.shields.io/badge/Resend-0A0A0A?style=for-the-badge&logo=resend&logoColor=white) **Resend**: Service d'envoi d'emails transactionnels pour la confirmation et le remerciement des participants.
- ![NextAuth](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextauthdotjs&logoColor=white) **NextAuth + Middleware**: Gestion de l'authentification sécurisée des employés accédant au dashboard.
- ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white) **Chart.js**: Bibliothèque de graphiques pour la visualisation des données.
- ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) **Vercel**: Plateforme de déploiement pour une mise en production rapide et fiable.

### Explication Détaillée

-   **Next.js 14 (App Router)** : Choisi pour son rendu côté serveur performant et sa capacité à offrir une expérience utilisateur fluide. L'App Router facilite la gestion des routes et l'organisation du code.
-   **Firebase** : Utilisé pour l'authentification des utilisateurs, la gestion de la base de données en temps réel et le stockage sécurisé des œuvres photographiques.
-   **Vercel** : Plateforme d'hébergement optimisée pour Next.js, offrant un déploiement rapide et une performance optimale avec un scaling automatique.
-   **Resend** : Gestion des e-mails transactionnels et des notifications pour assurer une communication efficace entre la plateforme et les utilisateurs.
-   **Stripe** : Solution de paiement intégrée qui assure des transactions financières sécurisées et une expérience de paiement fluide pour les utilisateurs.


## Instructions d’Utilisation

### Pour les Utilisateurs

-   **Navigation dans la Galerie** : Parcourez la collection d'œuvres photographiques disponibles. Utilisez les filtres pour affiner votre recherche.
-   **Ajout au Panier** : Sélectionnez les œuvres que vous souhaitez acquérir et ajoutez-les à votre panier.
-   **Passage en Caisse** : Une fois vos choix faits, rendez-vous au panier et suivez les instructions pour le paiement sécurisé via Stripe.
-   **Gestion des Commandes** : Recevez un e-mail de confirmation avec tous les détails de votre commande. Suivez l'état de votre livraison directement depuis votre compte.

### Pour les Artistes

-   **Inscription** : Créez un compte artiste en quelques clics en vous inscrivant sur la plateforme.
-   **Interface de Gestion** : Accédez à votre tableau de bord pour ajouter de nouvelles œuvres, définir les formats disponibles, les prix et les quantités en stock.
-   **Suivi des Ventes** : Recevez des notifications à chaque vente grâce à Resend et consultez l'historique de vos transactions pour suivre vos performances.

## SEO & Accessibilité

### SEO

Grâce à **Next.js**, nous avons intégré les meilleures pratiques SEO pour assurer que Bisourivage soit bien référencé sur les moteurs de recherche. Cela inclut des métadonnées optimisées, des sitemaps automatiques et une structure de site organisée, garantissant une visibilité maximale.

![seo-proof](https://i.imgur.com/MSZlZTQ.png)

### Accessibilité

Nous avons conçu Bisourivage en pensant à tous les utilisateurs :

-   **Balises Alt** pour toutes les images, facilitant l'accès aux contenus pour les utilisateurs malvoyants.
-   **Navigation au Clavier** pour ceux qui préfèrent utiliser des raccourcis clavier.
-   **Contrastes de Couleurs** optimisés pour une meilleure lisibilité.
-   **Compatibilité avec les Lecteurs d'Écran** pour une expérience utilisateur inclusive.

## Enseignements et Compétences Acquises

Ce projet m'a permis de développer et de renforcer plusieurs compétences clés :

-   **Développement Full-Stack** : Maîtrise des technologies frontend et backend pour créer une plateforme complète.
-   **Gestion de Projet Agile** : Expérience en planification, développement itératif et gestion des feedbacks clients.
-   **Intégration de Services Tiers** : Compétence dans l'intégration de services comme Firebase, Stripe et Resend.
-   **Optimisation SEO** : Compréhension approfondie des meilleures pratiques pour améliorer la visibilité en ligne.
-   **Accessibilité Web** : Connaissance des normes d'accessibilité pour créer des sites inclusifs.

## Contact

Pour toute question, suggestion ou demande de collaboration, n'hésitez pas à me contacter à martial.laubier@orange.fr. 
Je suis toujours ouvert à de nouvelles opportunités et à discuter de projets passionnants.

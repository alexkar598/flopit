# FlopIt!

## Configuration

> [!WARNING]
> FlopIt ne va pas marcher si le fichier .env n'existe pas ou s'il n'est pas valide. Le fichier .env.example contient
> des valeurs par défaut pour tester FlopIt

Copier .env.example à .env
Optionellement, changer les valeurs de configuration (voir la prochaine section)

### Référence de configuration

> [!NOTE]
> Pour tester, le fichier .env.example contient toutes les valeures requises. Cependant, cette configuration n'est pas
> sécuritaire puisque les clés sont pas sécurisées

| Nom de la valeur        | Description                                                |
|-------------------------|------------------------------------------------------------|
| PUBLIC_URL              | URL d'où FlopIt sera accessible                            |
| MARIADB_DB              | Nom de la base de données flopit                           |
| MARIADB_USER            | Nom de l'utilisateur pour la BD                            |
| MARIADB_PASSWORD        | Mot de passe de l'utilisateur pour la BD                   |
| MARIADB_ROOT_PASSWORD   | Mot de passe de l'utilisateur root pour la BD              |
| PRISMA_MARIADB_URL      | Ne pas changer                                             |
| PRISMA_ROOT_MARIADB_URL | Ne pas changer                                             |
| S3_REGION               | Ne pas changer                                             |
| S3_ACCESS_KEY           | Nom d'utilisateur pour stockage d'images                   |
| S3_SECRET_KEY           | Mot de passe pour stockage d'images                        |
| IMGPROXY_KEY            | Clé de signature des images                                |
| IMGPROXY_SALT           | Sel pour la signature des images                           |
| JWT_SIGNING_KEY         | Clé de signature des jetons d'authentication               |
| VAPID_PUBLIC_KEY        | Clé publique pour l'identification du serveur pour WebPush |
| VAPID_PRIVATE_KEY       | Clé privée pour l'identification du serveur pour WebPush   |
| VAPID_SUBJECT           | Email pour l'identification du serveur pour WebPush        |

## URLs
| Url                           | Description               |
|-------------------------------|---------------------------|
| http://localhost:8080         | Page client               |
| http://localhost:8080/graphql | Console GraphQL           |
| http://localhost:8080/_db     | Console SQL               |
| http://localhost:8080/_minio  | Console stockage d'images |

## Commandes

### Démarrage
> [!NOTE]
> Cette commande prend plusieurs minutes à exécuter la première fois. Il faut être patient. Les exécutions subséquentes sont plus rapides.
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build --detach
```
### Ajout de données de test dans la BD
> [!WARNING]
> Cette commande efface toutes les données dans la base de données

> [!NOTE]
> Cette commande prend plusieurs minutes à exécuter. Il faut être patient. 
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up seed --build && docker compose -f docker-compose.yml -f docker-compose.prod.yml rm -f seed 
```

### Arrêt
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop
```

### Destruction
> [!WARNING]
> Cette commande détruit toutes les données.
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 0 --volumes
```

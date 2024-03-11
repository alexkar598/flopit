# FlopIt!

## Configuration
Copier .env.example à .env
Optionellement, changer les valeurs de configuration
| Nom de la valeur        | Description                                   |
|-------------------------|-----------------------------------------------|
| PUBLIC_URL              | URL d'où FlopIt sera accessible               |
| MARIADB_DB              | Nom de la base de données flopit              |
| MARIADB_USER            | Nom de l'utilisateur pour la BD               |
| MARIADB_PASSWORD        | Mot de passe de l'utilisateur pour la BD      |
| MARIADB_ROOT_PASSWORD   | Mot de passe de l'utilisateur root pour la BD |
| PRISMA_MARIADB_URL      | Ne pas changer                                |
| PRISMA_ROOT_MARIADB_URL | Ne pas changer                                |
| S3_REGION               | Ne pas changer                                |
| S3_ACCESS_KEY           | Nom d'utilisateur pour stockage d'images      |
| S3_SECRET_KEY           | Mot de passe pour stockage d'images           |
| IMGPROXY_KEY            | Clé de signature des images                   |
| IMGPROXY_SALT           | Sel pour la signature des images              |
| JWT_SIGNING_KEY         | Clé de signature des jetons d'authentication  |

## Commandes
### Démarrage
> [!NOTE]
> Cette commande prend plusieurs minutes à exécuter la première fois. Il faut être patient. Les exécutions subséquentes sont plus rapides.
```bash
docker compose up --build --detach
```
### Ajout de données de test dans la BD
> [!WARNING]
> Cette commande efface toutes les données dans la base de données

> [!NOTE]
> Cette commande prend plusieurs minutes à exécuter. Il faut être patient. 
```bash
docker compose up seed --build
```

### Arrêt
```bash
docker compose stop
```

### Destruction
> [!WARNING]
> Cette commande détruit toutes les données.
```bash
docker compose down --timeout 0 --volumes
```

# FlopIt!

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
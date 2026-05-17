## Comment l'utiliser

```bash
# 1. Créer un nouveau dépôt depuis le template (bouton "Use this template" sur GitHub)
# 2. Cloner, installer
symfony composer install
npm install

# 3. Configurer l'environnement
cp .env .env.local  # adapter les variables

# 4. Préparer la base
symfony console doctrine:migrations:migrate -n
symfony console doctrine:fixtures:load -n

# 5. Démarrer
symfony serve
```

Cinq commandes, dix minutes, et on écrit du code métier.

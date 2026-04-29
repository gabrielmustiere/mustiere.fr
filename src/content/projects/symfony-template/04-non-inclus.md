## Ce qui n'y est pas — intentionnellement

- **Pas de Redis, RabbitMQ ou ElasticSearch préconfiguré**. La majorité des projets n'en a pas besoin avant plusieurs mois, et mieux vaut les ajouter au moment
  où la contrainte apparaît que les traîner dès le départ.
- **Pas de CI GitHub Actions livrée**. Elle est trop dépendante du contexte (qui est notifié, quelles branches protégées, quels déploiements) pour qu'un
  template impose une version générique qui finira à la poubelle.
- **Pas de design system**. Tailwind est câblé, le reste est volontairement vide — un template visuel mal choisi est plus coûteux à retirer qu'à ajouter.
- **Pas d'API Platform**. Trop structurant pour être par défaut. On l'ajoute en cinq minutes quand le projet est effectivement une API.

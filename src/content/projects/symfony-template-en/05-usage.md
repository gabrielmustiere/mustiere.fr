## How to use it

```bash
# 1. Create a new repo from the template ("Use this template" button on GitHub)
# 2. Clone, install
symfony composer install
npm install

# 3. Configure the environment
cp .env .env.local  # adjust variables

# 4. Prepare the database
symfony console doctrine:migrations:migrate -n
symfony console doctrine:fixtures:load -n

# 5. Start
symfony serve
```

Five commands, ten minutes, and you're writing business code.

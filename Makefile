HOST := mustiere.wip
PORT := 4321
URL  := http://$(HOST):$(PORT)

.PHONY: help install serve dev build preview check format wrap-md clean hosts-add hosts-remove

help:
	@echo "Commandes disponibles :"
	@echo "  make install       Installer les dépendances npm"
	@echo "  make serve         Lancer le dev server sur $(URL)"
	@echo "  make dev           Lancer le dev server (localhost classique)"
	@echo "  make build         Build de production"
	@echo "  make preview       Prévisualiser le build"
	@echo "  make check         Astro check (types + diagnostics)"
	@echo "  make format        Prettier sur tout le projet"
	@echo "  make wrap-md       Hard-wrap des fichiers .md / .mdx à 160 colonnes"
	@echo "  make clean         Supprimer dist/ et node_modules/.astro"
	@echo "  make hosts-add     Ajouter $(HOST) dans /etc/hosts (sudo)"
	@echo "  make hosts-remove  Retirer $(HOST) de /etc/hosts (sudo)"

install:
	npm install

serve: hosts-add
	@echo "→ Ouverture de $(URL)"
	@( sleep 2 && open $(URL) ) &
	npm run dev -- --host $(HOST) --port $(PORT)

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

check:
	npm run check

format:
	npm run format

wrap-md:
	npx prettier --write --prose-wrap always --print-width 160 \
		--ignore-path /dev/null \
		"src/**/*.md" "src/**/*.mdx" "*.md"

clean:
	rm -rf dist node_modules/.astro

hosts-add:
	@if grep -q "[[:space:]]$(HOST)$$" /etc/hosts; then \
		echo "✓ $(HOST) déjà présent dans /etc/hosts"; \
	else \
		echo "→ Ajout de $(HOST) dans /etc/hosts (sudo requis)"; \
		echo "127.0.0.1 $(HOST)" | sudo tee -a /etc/hosts > /dev/null; \
		echo "✓ $(HOST) ajouté"; \
	fi

hosts-remove:
	@echo "→ Retrait de $(HOST) de /etc/hosts (sudo requis)"
	@sudo sed -i '' '/[[:space:]]$(HOST)$$/d' /etc/hosts
	@echo "✓ $(HOST) retiré"

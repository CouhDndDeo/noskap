#!/usr/bin/env bash
# Сборка статической версии карты для GitHub Pages.
# Результат: ./pages-dist — содержимое можно целиком залить в ветку gh-pages
# или в папку /docs основной ветки.
set -euo pipefail

cd "$(dirname "$0")"

STATIC_BASE=./ bun run build:web

rm -rf pages-dist
cp -r packages/web/dist pages-dist

# Аналитика Runable лежит рядом с index.html — делаем путь относительным
sed -i 's|src="/runable.js"|src="./runable.js"|' pages-dist/index.html

# Чтобы GitHub Pages не пропускал файлы через Jekyll (папки с _ и т.п.)
touch pages-dist/.nojekyll

# SPA-фолбэк: любой неизвестный путь отдаёт то же приложение
cp pages-dist/index.html pages-dist/404.html

echo "Готово: $(pwd)/pages-dist ($(du -sh pages-dist | cut -f1))"

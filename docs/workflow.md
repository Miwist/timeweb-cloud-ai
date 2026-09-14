# Процесс разработки

## Цепочка

1. Создать **issue** (цель, acceptance).
2. Ветка: `<номер>-<кратко>`.
3. **Один коммит** с номером задачи и bump версии в `package.json`.
4. **Один PR** в default branch; в title тоже `#N`.
5. После **merge** GitHub Actions публикует пакет в npm.

## Язык

Issue, PR, коммиты и документация — на русском.

## Версии

Версию поднимаем в том же коммите, что и изменения (`package.json`).  
Повторная публикация той же версии не выполняется (npm отклонит).

## Секреты

В настройках репозитория: `NPM_TOKEN` (Automation token с правом publish).

Для provenance поле `repository.url` в `package.json` должно совпадать с GitHub
(регистр владельца важен: `Miwist`, не `miwist`). Рекомендуемый вид:
`https://github.com/Miwist/<pkg>.git`.


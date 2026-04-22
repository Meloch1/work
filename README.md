# StreamRush — Telegram Mini App

Казино-платформа с 5 играми: Краш, Монета, Мины, Колесо, Кости.
Оплата через Telegram Stars. Вывод от 500 ⭐. Реферальная система (+50 ⭐).
Панель администратора.

## Деплой на Railway

### 1. GitHub → Railway
1. Залей папку в GitHub репозиторий
2. Railway → New Project → Deploy from GitHub repo

### 2. PostgreSQL
Railway → New → Database → Add PostgreSQL → DATABASE_URL подставится сам

### 3. Переменные окружения
| Переменная | Значение |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `APP_DOMAIN` | URL сервиса на Railway (напр. `streamrush.up.railway.app`) |

### 4. Настроить вебхук (один раз после деплоя)
```
POST https://streamrush.up.railway.app/api/payments/setup-webhook
```

### 5. BotFather
```
/setmenubutton → Web App → https://streamrush.up.railway.app
```

## Структура
```
server.js    — Express сервер (API + статика)
public/      — Собранный React фронт
package.json — Зависимости
railway.json — Конфиг Railway
```

## Адмін-панель
Доступна только для Telegram User ID: 8147164463
Открывается в приложении как вкладка 🛡️

## API
- GET  /api/healthz
- POST /api/online/ping | GET /api/online/count
- GET  /api/balance/:userId | POST /api/balance/save
- POST /api/game-history/log | GET /api/game-history/:userId
- POST /api/withdraw/request | GET /api/withdraw/history/:userId
- GET  /api/admin/stats | /admin/users | /admin/withdrawals
- POST /api/admin/give-stars | /admin/process-withdrawal | /admin/broadcast | /admin/set-balance
- POST /api/payments/invoice | /payments/webhook | /payments/setup-webhook
- GET  /api/payments/credits/:userId
- POST /api/referral/register | GET /api/referral/list/:userId

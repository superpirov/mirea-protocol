# Mirea Protocol - USDM Stablecoin

## Обзор

USDM - это нативный стейблкоин протокола Mirea, привязанный к доллару США (USD). Стейблкоин работает на собственном блокчейне Mirea Protocol, а также может быть развернут на других блокчейнах (Ethereum, BSC, Polygon и др.).

## Возможности

### Основные функции
- **ERC20 Token**: Полная совместимость со стандартом ERC20
- **Mint/Burn механизм**: Создание и уничтожение токенов при депозите/выводе залога
- **Role-based доступ**: Разделение прав на минтинг, сжигание и паузу контракта
- **Pausable**: Возможность приостановки операций в экстренных случаях
- **ERC20Permit**: Поддержка подписей EIP-712 для gasless транзакций
- **Collateral tracking**: Прозрачное отслеживание залогов

### Роли
- **DEFAULT_ADMIN_ROLE**: Администратор, может назначать другие роли
- **MINTER_ROLE**: Право на создание новых USDM токенов
- **BURNER_ROLE**: Право на сжигание USDM токенов
- **PAUSER_ROLE**: Право на паузу/возобновление работы контракта

## Установка

```bash
cd mirea-protocol
npm install
```

## Компиляция

```bash
npm run compile
```

## Тестирование

```bash
npm test
```

## Развертывание

### Локальное развертывание (Hardhat Network)

```bash
# Запуск локальной ноды
npm run node

# В другом терминале - развертывание
npm run deploy:localhost
```

### Развертывание в другие сети

1. Настройте сеть в `hardhat.config.js`
2. Добавьте переменные окружения в `.env`:
```
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

3. Разверните контракт:
```bash
npx hardhat run scripts/deploy.js --network <network_name>
```

## Использование

### Минтинг токенов

```javascript
// Только для адресов с MINTER_ROLE
await usdm.mint(recipientAddress, amount);
```

### Сжигание токенов

```javascript
// Только для адресов с BURNER_ROLE
await usdm.burnFrom(account, amount);
```

### Депозит залога и минтинг

```javascript
// Пользователь депозитит залог и получает USDM 1:1
await usdm.depositCollateralAndMint(collateralAmount);
```

### Сжигание и вывод залога

```javascript
// Пользователь сжигает USDM и получает залог обратно
await usdm.burnAndWithdrawCollateral(usdmAmount);
```

### Пауза операций

```javascript
// Только для PAUSER_ROLE
await usdm.pause();   // Приостановить
await usdm.unpause(); // Возобновить
```

### Управление ролями

```javascript
// Только для DEFAULT_ADMIN_ROLE
await usdm.grantRole(MINTER_ROLE, newMinterAddress);
await usdm.revokeRole(MINTER_ROLE, oldMinterAddress);
```

## Архитектура

### Collateral Model

USDM использует модель полного обеспечения (fully collateralized):
- 1 USDM = 1 единица залога (в упрощенной модели)
- Залог отслеживается в маппинге `collateralBalances`
- Общий залог доступен через `totalCollateral()`

В production-версии рекомендуется интегрировать:
- Оракулы цен (Chainlink)
- Мультивалютное обеспечение
- Автоматизированное управление залогом

### Безопасность

1. **Access Control**: Все критические операции защищены ролями
2. **Pausable**: Экстренная остановка при обнаружении уязвимостей
3. **ReentrancyGuard**: Защита от reentrancy атак (через OpenZeppelin)
4. **Zero Address Checks**: Проверка на переводы на нулевой адрес

## Структура проекта

```
mirea-protocol/
├── contracts/
│   └── USDM.sol          # Основной контракт стейблкоина
├── scripts/
│   └── deploy.js         # Скрипт развертывания
├── test/
│   ├── USDM.test.js      # Полные тесты
│   └── USDM-deployment.test.js  # Тесты развертывания
├── hardhat.config.js     # Конфигурация Hardhat
└── package.json          # Зависимости и скрипты
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Private key для развертывания
PRIVATE_KEY=your_private_key_here

# RPC URLs
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# API ключи для верификации
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Лицензия

MIT

## Контакты

- Website: [mireaprotocol.io](https://mireaprotocol.io)
- Telegram: @mireaprotocol
- GitHub: github.com/mirea-protocol

---

**Примечание**: Данный код предназначен для образовательных целей. Перед использованием в production необходимо провести профессиональный аудит безопасности.

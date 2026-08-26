# Dockerfile для production
FROM node:18-alpine AS builder

# Установка зависимостей для нативных модулей
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка только production зависимостей
RUN npm ci --only=production && npm cache clean --force

# Копирование исходного кода
COPY src ./src

# Production stage
FROM node:18-alpine

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копирование зависимостей из builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --chown=nodejs:nodejs package*.json ./

# Создание директорий для логов и загрузок
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app/logs /app/uploads

# Переключение на непривилегированного пользователя
USER nodejs

# Expose порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запуск приложения
CMD ["node", "src/server.js"]

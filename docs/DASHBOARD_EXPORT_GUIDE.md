# Руководство по экспорту дашборда

Подробные инструкции по экспорту дашборда в форматы PNG и PDF для отчетности и документооборота.

## 📋 Обзор возможностей экспорта

### Доступные форматы:

- **PNG** - для вставки в презентации и документы
- **PDF** - для формальных отчетов и архивирования
- **HTML** - для интерактивного просмотра
- **Excel** - для дальнейшего анализа данных

### Что можно экспортировать:

- Полный дашборд
- Отдельные виджеты
- Таблицы с данными
- Графики и диаграммы

## 🖥 Методы экспорта

### 1. Браузерные инструменты (Рекомендуемый)

#### Экспорт в PDF через браузер:

**Шаг 1**: Откройте дашборд в браузере

```
http://localhost:5173
```

**Шаг 2**: Настройте оптимальный вид

- Разверните дашборд на полный экран
- Убедитесь что все данные загружены
- При необходимости скройте боковую панель

**Шаг 3**: Откройте меню печати

- Windows/Linux: `Ctrl + P`
- macOS: `Cmd + P`

**Шаг 4**: Настройте параметры печати

```
Назначение: Сохранить как PDF
Размер бумаги: A4 или A3 (для больших дашбордов)
Ориентация: Альбомная (рекомендуется)
Поля: Минимальные
Параметры:
  ✅ Фоновая графика
  ✅ Верхние и нижние колонтитулы (по желанию)
```

**Шаг 5**: Сохраните файл

- Нажмите "Сохранить"
- Выберите папку и имя файла
- Формат имени: `dashboard_YYYYMMDD_HHMM.pdf`

#### Экспорт отдельных виджетов:

**Для виджетов с графиками:**

1. Щелкните правой кнопкой на график
2. Выберите "Сохранить изображение как..."
3. Выберите формат PNG или SVG

**Для таблиц данных:**

1. Выделите содержимое та��лицы
2. Скопируйте (`Ctrl+C`)
3. Вставьте в Excel или Google Sheets
4. Сохраните в нужном формате

---

### 2. Расширения браузера

#### FireShot (Chrome/Firefox)

```
1. Установите расширение FireShot
2. Откройте дашборд
3. Нажмите на иконку FireShot
4. Выберите "Capture entire page"
5. Выберите формат экспорта (PNG/PDF)
6. Сохраните файл
```

#### Full Page Screen Capture (Chrome)

```
1. Установите расширение
2. Откройте дашборд
3. Нажмите на иконку расширения
4. Дождитесь завершения скриншота
5. Скачайте PNG файл
```

---

### 3. Программные решения

#### Puppeteer (Node.js скрипт)

Создайте файл `export_dashboard.js`:

```javascript
const puppeteer = require('puppeteer')
const fs = require('fs')

async function exportDashboard() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Настройка размера страницы для дашборда
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  })

  try {
    // Переход на дашборд
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Ожидание загрузки данных
    await page.waitForSelector('[data-testid="dashboard-loaded"]', {
      timeout: 10000,
    })

    // Дополнительная задержка для анимаций
    await page.waitForTimeout(2000)

    // Экспорт в PNG
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

    await page.screenshot({
      path: `dashboard_${timestamp}.png`,
      fullPage: true,
      type: 'png',
    })

    // Экспорт в PDF
    await page.pdf({
      path: `dashboard_${timestamp}.pdf`,
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    })

    console.log('✅ Дашборд экспортирован успешно')
  } catch (error) {
    console.error('❌ Ошибка экспорта:', error)
  } finally {
    await browser.close()
  }
}

exportDashboard()
```

**Установка и запуск:**

```bash
npm install puppeteer
node export_dashboard.js
```

#### Python + Selenium

Создайте файл `export_dashboard.py`:

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from datetime import datetime

def export_dashboard():
    # Настройка Chrome
    options = Options()
    options.add_argument('--headless')  # Для работы без GUI
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')

    driver = webdriver.Chrome(options=options)

    try:
        # Переход на дашборд
        driver.get('http://localhost:5173')

        # Ожидание загрузки
        wait = WebDriverWait(driver, 30)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Дополнител��ное ожидание для загрузки данных
        time.sleep(5)

        # Скриншот
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        screenshot_path = f'dashboard_{timestamp}.png'

        # Установка размера окна для полного скриншота
        driver.set_window_size(1920, driver.execute_script("return document.body.scrollHeight"))

        # Сохранение скриншота
        driver.save_screenshot(screenshot_path)

        print(f'✅ Скриншот сохранен: {screenshot_path}')

    except Exception as e:
        print(f'❌ Ошибка: {e}')
    finally:
        driver.quit()

if __name__ == "__main__":
    export_dashboard()
```

**Установка зависимостей:**

```bash
pip install selenium
# + установка ChromeDriver
```

---

### 4. Онлайн инструменты

#### HTML/CSS to PDF API сервисы:

**PDFShift.io:**

```bash
curl -X POST \
  https://api.pdfshift.io/v3/convert/pdf \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "http://localhost:5173",
    "landscape": true,
    "format": "A3",
    "margin": "20px",
    "wait_for": 3000
  }' \
  --user 'your_api_key:' \
  --output dashboard.pdf
```

**HTML/CSS to Image API:**

```bash
curl -X POST \
  https://htmlcsstoimage.com/demo_run \
  -d url=http://localhost:5173 \
  -d viewport_width=1920 \
  -d viewport_height=1080
```

---

## 📐 Оптимизация для экспорта

### CSS стили для печати

Добавьте в `src/assets/main.css`:

```css
/* Стили для печати и экспорта */
@media print {
  /* Скрытие элементов навигации */
  .sidebar,
  .navigation,
  .header-menu {
    display: none !important;
  }

  /* Полная ширина для контента */
  .main-content {
    width: 100% !important;
    margin: 0 !important;
    padding: 10px !important;
  }

  /* Оптимизация размеров виджетов */
  .widget-card {
    break-inside: avoid;
    margin-bottom: 15px;
    box-shadow: none;
    border: 1px solid #ddd;
  }

  /* Цвета для печати */
  .bg-gradient-to-br {
    background: white !important;
    color: black !important;
  }

  /* Таблицы */
  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 4px 8px;
    border: 1px solid #ddd;
  }
}

/* Стили для экспорта (специальный класс) */
.export-mode {
  .sidebar {
    display: none;
  }

  .main-content {
    width: 100%;
    margin-left: 0;
  }

  .widget-card {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 20px;
  }
}
```

### JavaScript хелперы для экспорта

Добавьте в компонент дашборда:

```javascript
// Методы для экспорта
const exportHelpers = {
  // Переключение в режим экспорта
  enableExportMode() {
    document.body.classList.add('export-mode')
    // Скрытие интерактивных элементов
    document.querySelectorAll('.tooltip, .dropdown').forEach((el) => {
      el.style.display = 'none'
    })
  },

  // Возврат к обычному режиму
  disableExportMode() {
    document.body.classList.remove('export-mode')
    document.querySelectorAll('.tooltip, .dropdown').forEach((el) => {
      el.style.display = ''
    })
  },

  // Ожидание загрузки всех данных
  async waitForDataLoad() {
    const maxWait = 30000 // 30 секунд
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      const loadingElements = document.querySelectorAll('.loading, .skeleton')
      if (loadingElements.length === 0) {
        return true
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    return false
  },

  // Принудительная загрузка всех виджетов
  async loadAllWidgets() {
    const widgets = document.querySelectorAll('[data-widget-id]')
    for (const widget of widgets) {
      // Trigger update if needed
      const updateEvent = new CustomEvent('forceUpdate')
      widget.dispatchEvent(updateEvent)
    }

    // Wait for updates
    await new Promise((resolve) => setTimeout(resolve, 2000))
  },
}

// Глобальная функция для экспорта
window.prepareForExport = async function () {
  exportHelpers.enableExportMode()
  await exportHelpers.loadAllWidgets()
  await exportHelpers.waitForDataLoad()
  console.log('✅ Дашборд готов к экспорту')
}

window.finishExport = function () {
  exportHelpers.disableExportMode()
  console.log('✅ Режим экспорта отключен')
}
```

---

## 📊 Экспорт отдельных компонентов

### Виджеты статистики

Для экспорта `DatabaseStatsCards`:

```vue
<template>
  <div class="stats-export" ref="statsContainer">
    <DatabaseStatsCards :stats="databaseStats" />
    <button @click="exportStats" class="export-btn">📊 Экспорт статистики</button>
  </div>
</template>

<script setup>
import html2canvas from 'html2canvas'

const exportStats = async () => {
  const element = statsContainer.value
  const canvas = await html2canvas(element, {
    backgroundColor: 'white',
    scale: 2, // Высокое качество
    logging: false,
  })

  // Конвертация в PNG
  const link = document.createElement('a')
  link.download = `stats_${new Date().toISOString().slice(0, 10)}.png`
  link.href = canvas.toDataURL()
  link.click()
}
</script>
```

### Таблицы данных

```vue
<script setup>
import * as XLSX from 'xlsx'

const exportTableToExcel = (tableData, fileName) => {
  const ws = XLSX.utils.json_to_sheet(tableData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const exportTableToCSV = (tableData, fileName) => {
  const csvContent = convertToCSV(tableData)
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}
</script>
```

---

## 🎨 Шаблоны экспорта

### Стандартный отчет (PDF)

**Параметры:**

- Формат: A4 альбомная
- Поля: 20mm
- Шрифт: Arial 12pt
- Цвета: Черно-белые для печати

### Презентационный формат (PNG)

**Параметры:**

- Разрешение: 1920x1080
- DPI: 300 для печати
- Формат: PNG с прозрачностью

### Архивный формат (PDF/A)

**Параметры:**

- Стандарт: PDF/A-1b
- Встроенные шрифты
- Без интерактивных элементов

---

## 📅 Автоматизация экспорта

### Ежедневные отчеты

Создайте скрипт для автоматического экспорта:

```bash
#!/bin/bash
# daily_export.sh

DATE=$(date +%Y%m%d)
EXPORT_DIR="daily_reports/$DATE"

mkdir -p "$EXPORT_DIR"

# Запуск сервера в фоне
npm run dev &
SERVER_PID=$!

# Ожидание запуска сервера
sleep 10

# Экспорт дашборда
node export_dashboard.js

# Перемещение файлов
mv dashboard_*.png "$EXPORT_DIR/"
mv dashboard_*.pdf "$EXPORT_DIR/"

# Остановка сервера
kill $SERVER_PID

echo "✅ Ежедневный экспорт заверш��н: $EXPORT_DIR"
```

### Scheduled экспорт (cron)

```bash
# Добавить в crontab
# crontab -e

# Ежедневно в 8:00
0 8 * * * /path/to/daily_export.sh

# Еженедельно в понедельник в 9:00
0 9 * * 1 /path/to/weekly_export.sh
```

---

## 🔧 Устранение проблем

### Частые проблемы и решения:

**Проблема**: Пустой или неполный скриншот
**Решение**:

- Увеличьте время ожидания загрузки
- Проверьте размер viewport
- Убедитесь что данные загружены

**Проблема**: Плохое качество изображения
**Решение**:

- Увеличьте DPI/scale в настройках
- Используйте векторные форматы (SVG)
- Настройте правильное разрешение

**Проблема**: Обрезанный контент
**Решение**:

- Используйте fullPage: true
- Проверьте CSS overflow
- Настройте правильные размеры страницы

**Проблема**: Медленный экспорт
**Решение**:

- Отключите анимации на время экспорта
- Оптимизируйте запросы к БД
- Используйте headless режим

---

## 📋 Чек-лист экспорта

### Перед экспортом:

- [ ] Сервер запущен и доступен
- [ ] Все данные загружены
- [ ] Дашборд отображается корректно
- [ ] Выбран подходящий размер экрана
- [ ] Настроены параметры экспорта

### После экспорта:

- [ ] Проверено качество изображения/PDF
- [ ] Файл сохранен с правильным именем
- [ ] Добавлена дата в имя файла
- [ ] Файл помещен в нужную папку
- [ ] Создан архив при необходимости

---

## 📞 Поддержка

При возникновении проблем с экспортом:

1. Проверьте логи браузера (F12 → Console)
2. Убедитесь что сервер запущен
3. Проверьте настройки безопасности браузера
4. Попробуйте альтернативный метод экспорта

**Контакты**: DataBoard Team  
**Документация**: `docs/`  
**Обновлено**: 2024-08-22

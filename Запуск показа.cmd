@echo off
chcp 65001 >nul
rem ============================================================
rem  Запуск показа цифровой цепочки КМГ.
rem
rem  Зачем отдельный запуск, а не двойной щелчок по сцена.html.
rem
rem  1. Звук заставки. Браузер не даёт автозапуск со звуком, пока
rem     на странице не было действия человека. Ключ
rem     --autoplay-policy=no-user-gesture-required снимает запрет,
rem     и заставка идёт со звуком сама, без единого нажатия.
rem
rem  2. Показ ЦД пласта. Он грузит модели .glb запросом XHR, а из
rem     file:// такие запросы запрещены. Ключ
rem     --allow-file-access-from-files их разрешает. Без него
rem     провал в ЦД даёт пустой чёрный кадр вместо 3D.
rem
rem  3. Свой профиль в --user-data-dir обязателен: если Chrome уже
rem     запущен на обычном профиле, новые окна открываются в нём же,
rem     и ключи выше просто не применяются.
rem
rem  Выход из полноэкранного режима — Alt+F4.
rem ============================================================

set "ПОКАЗ=%~dp0сцена.html"
set "ПРОФИЛЬ=%TEMP%\показ_кмг_профиль"

if not exist "%ПОКАЗ%" (
  echo Не найден файл показа: "%ПОКАЗ%"
  pause
  exit /b 1
)

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chrome не найден. Показ откроется в браузере по умолчанию,
  echo но заставка пойдёт без звука до первого щелчка.
  start "" "%ПОКАЗ%"
  exit /b 0
)

start "" "%CHROME%" ^
  --autoplay-policy=no-user-gesture-required ^
  --allow-file-access-from-files ^
  --user-data-dir="%ПРОФИЛЬ%" ^
  --kiosk ^
  "%ПОКАЗ%"

# -*- coding: utf-8 -*-
"""Снимки сцены headless-хромом на разных экранах — для проверки вёрстки.

python инструменты/снимок_сцены.py <файл> <ШxВ> <состояние> <куда.png>
состояние: цепочка | передел:<код> | система:<код>:<начало имени проекта> |
           ролик:<код>:<начало имени> (нажата кнопка «Ролик» на экране процесса)

Делает временную копию рядом с файлом (нужны относительные пути к медиа),
в неё вшивается скрипт, который через отладочный крючок window.__показ
снимает заставку и открывает нужное; переходы и анимации глушатся, потому
что виртуальное время headless-хрома их не крутит (см. README AIAN).
Сервер «цепочка» (порт 8092) должен быть запущен."""
import sys, io, os, subprocess, urllib.parse
файл, размер, состояние, куда = sys.argv[1:5]
ш, в = размер.lower().split('x')
s = io.open(файл, encoding='utf-8').read()
части = состояние.split(':')
js = "var П=window.__показ; П.снятьЗаставку&&П.снятьЗаставку();"
if части[0] in ('передел', 'система', 'ролик'):
    js += "var б=П.БЛОКИ.find(function(x){return x.код==='%s'}); П.открыть(б);" % части[1]
if части[0] in ('система', 'ролик'):
    js += ("setTimeout(function(){var пр=б.проекты.find(function(p){return p.имя.indexOf('%s')===0});"
           "П.открытьСистему(б,{проект:пр});" % части[2])
    if части[0] == 'ролик':
        js += "setTimeout(function(){var к=document.querySelector('.бп_кнопки .главная');к&&к.click();},600);"
    js += "},900);"
вставка = ('<style>*,*::before,*::after{transition:none!important;animation:none!important}</style>'
           '<script>setTimeout(function(){%s},400);</script></body>' % js)
s = s.replace('</body>', вставка)
врем = os.path.join(os.path.dirname(os.path.abspath(файл)), '_снимок_' + os.path.basename(файл))
io.open(врем, 'w', encoding='utf-8').write(s)
адрес = 'http://localhost:8092/' + urllib.parse.quote(os.path.basename(врем))
subprocess.run(['C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless=new', '--disable-gpu',
                '--hide-scrollbars', '--window-size=%s,%s' % (ш, в), '--virtual-time-budget=9000',
                '--screenshot=' + куда, адрес], capture_output=True)
os.remove(врем)
print(куда)

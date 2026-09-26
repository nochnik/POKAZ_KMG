function openCalendar($el, opt) {
    opt = $.extend({
        startDate: '',
        endDate: '',
        minMK: 0,
        maxMK: 0,
        onselect: function () {}
    }, opt);
    console.log(opt);

    $('.p-calendar').remove();

    var startDate = new Date(),
        endDate = new Date(),
        aStartDate,
        aEndDate;

    if (opt.startDate != '') {
        var d = opt.startDate.split('.');
        startDate = new Date(d[2], d[1] - 1, d[0]);
    }

    if (opt.endDate != '') {
        d = opt.endDate.split('.');
        endDate = new Date(d[2], d[1] - 1, d[0]);
    }

    aStartDate = new Date(startDate.getTime());
    aEndDate = new Date(endDate.getTime());

    function getDaysHtml (date) {
        var html = '';
        var startDay = new Date(date.getTime());
        startDay.setDate(1);
        startDay = startDay.getDay();
        startDay = startDay == 0 ? 7 : startDay;
        startDay--;

        var dayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

        var count = 0;

        if (startDay == 0) {
            for (var i = 0; i < 7; i++) {
                html += '<a href="#" class="notactive"></a>';
                count++;
            }
        } else {
            for (i = 0; i < startDay; i++) {
                html += '<a href="#" class="notactive"></a>';
                count++;
            }
        }

        for (i = 0; i < dayInMonth; i++) {
            var dayDate = new Date(date.getTime());
            dayDate.setDate(i+1);
            dayDate = dayDate.getTime() / 1000;
            var cls = '';
            if (opt.minMK > 0 && (dayDate < opt.minMK || dayDate > opt.maxMK)) {
                cls = 'no-data';
            }
            html += '<a href="#" class="day-'+(i+1)+' '+cls+'">'+(i+1)+'<i></i></a>';
            count++;
        }

        for (i = count; i < 42; i++) {
            html += '<a href="#" class="notactive"></a>';
        }

        return html;
    }

    var html = [
        '<div class="calendar-overflow"></div>',
        '<div class="p-calendar">',

        '<div class="start">',
        '<div class="top">',
        '<a class="prev-year"><i></i><i></i></a>',
        '<a class="prev-month"><i></i></a>',
        '<span>'+date1ToString(startDate)+'</span>',
        '<a class="next-month"><i></i></a>',
        '<a class="next-year"><i></i><i></i></a>',
        '</div>',

        '<div class="day-names">',
        '<b>ПН</b>',
        '<b>ВТ</b>',
        '<b>СР</b>',
        '<b>ЧТ</b>',
        '<b>ПТ</b>',
        '<b>СБ</b>',
        '<b>ВС</b>',
        '</div>',

        '<div class="days">',
        getDaysHtml(startDate),
        '</div>',
        '</div>',

        '<div class="end">',
        '<div class="top">',
        '<a class="prev-year"><i></i><i></i></a>',
        '<a class="prev-month"><i></i></a>',
        '<span>'+date1ToString(endDate)+'</span>',
        '<a class="next-month"><i></i></a>',
        '<a class="next-year"><i></i><i></i></a>',
        '</div>',

        '<div class="day-names">',
        '<b>ПН</b>',
        '<b>ВТ</b>',
        '<b>СР</b>',
        '<b>ЧТ</b>',
        '<b>ПТ</b>',
        '<b>СБ</b>',
        '<b>ВС</b>',
        '</div>',

        '<div class="days">',
        getDaysHtml(endDate),
        '</div>',
        '</div>',

        '<div class="bottom">',
        '<div class="line"></div>',
        '<div class="buttons">',
        '<a href="#" class="p-default">По умолчанию</a>',
        '<a href="#" class="p-week">Неделя</a>',
        '<a href="#" class="p-month">Месяц</a>',
        '</div>',
        '<div class="buttons">',
        '<div class="info"></div>',
        '<a href="#" class="ok"><i class="icon-ok"></i></a>',
        '<a href="#" class="cancel"><i class="icon-cancel"></i></a>',
        '</div>',
        '<div class="buttons">',
        '<a href="#" class="p-6-months">6 месяца</a>',
        '<a href="#" class="p-3-months">3 месяца</a>',
        '<a href="#" class="p-year">Год</a>',
        '</div>',
        '</div>',

        '</div>'
    ];

    var $calendar = $(html.join(''));
    if ($el.hasClass('widget')) {
        $el.append($calendar);
        $el.removeClass('set faq');
        // toggleWidgetOverlay($el);
        $el.addClass('choose-date');
    } else {
        $('body').append($calendar);
    }

    var $overlay = $calendar.filter('.calendar-overflow');
    $overlay.click(function () {
        $('.calendar-overflow').remove();
        $overlay.remove();
        $calendar.remove();
    });
    $calendar = $calendar.filter('.p-calendar');

    setActiveDays();

    var clickCount = 0;

    function setActiveDays (flag, date, end) {
        $calendar.find('.days .active').removeClass('active');

        if (flag === true) {
            if (aStartDate != null && end === true)
                clickCount = 1;

            switch (clickCount) {
                case 0:
                    aStartDate = new Date(date.getTime());
                    aEndDate = null;
                    clickCount++;
                    break;
                case 1:
                    aEndDate = new Date(date.getTime());
                    if (aStartDate.getTime() > aEndDate.getTime()) {
                        var d = aStartDate;
                        aStartDate = aEndDate;
                        aEndDate = d;
                    }
                    clickCount = 0;
                    break;

                default:
                    clickCount = 0;
                    break;
            }
        }

        var info = '';

        if (aStartDate != null) {
            var day = aStartDate.getDate();

            info = 'с '+dateToString(aStartDate);

            if (aStartDate.getMonth() == startDate.getMonth() &&
                aStartDate.getFullYear() == startDate.getFullYear()) {
                $calendar.find('.start .days .day-'+day).addClass('active');
            }

            if (aStartDate.getMonth() == endDate.getMonth() &&
                aStartDate.getFullYear() == endDate.getFullYear()) {
                $calendar.find('.end .days .day-'+day).addClass('active');
            }
        }

        if (aEndDate != null) {

            info += ' по '+dateToString(aEndDate);

            var startTime = aStartDate.getTime();
            var endTime = aEndDate.getTime();
            var date;
            for (i = startTime; i <= endTime; i += 60 * 60 * 24 * 1000) {
                date = new Date(i);
                var day = date.getDate();

                if (date.getMonth() == startDate.getMonth() &&
                    date.getFullYear() == startDate.getFullYear()) {
                    $calendar.find('.start .days .day-'+day).addClass('active');
                }

                if (date.getMonth() == endDate.getMonth() &&
                    date.getFullYear() == endDate.getFullYear()) {
                    $calendar.find('.end .days .day-'+day).addClass('active');
                }
            }
        }

        $calendar.find('.bottom .info').html(info);

    }

    function setDate (date, $con) {
        $con.find('.days').html(getDaysHtml(date));
        $con.find('.top span').html(date1ToString(date));

        if ($con.hasClass('start')) {
            startDate = date;
        } else {
            endDate = date;
        }

        setActiveDays();
    }

    $calendar.find('.prev-month').click(function () {
        var $el = $(this);
        var $con = $el.closest('.start, .end').eq(0);
        var date;
        if ($con.hasClass('start')) {
            date = startDate;
        } else {
            date = endDate;
        }
        date.setMonth(date.getMonth() - 1);

        setDate(date, $con);

        return false;
    });

    $calendar.find('.next-month').click(function () {
        var $el = $(this);
        var $con = $el.closest('.start, .end').eq(0);
        var date;
        if ($con.hasClass('start')) {
            date = startDate;
        } else {
            date = endDate;
        }
        date.setMonth(date.getMonth() + 1);

        setDate(date, $con);

        return false;
    });

    $calendar.find('.prev-year').click(function () {
        var $el = $(this);
        var $con = $el.closest('.start, .end').eq(0);
        var date;
        if ($con.hasClass('start')) {
            date = startDate;
        } else {
            date = endDate;
        }
        date.setYear(date.getFullYear() - 1);

        setDate(date, $con);

        return false;
    });

    $calendar.find('.next-year').click(function () {
        var $el = $(this);
        var $con = $el.closest('.start, .end').eq(0);
        var date;
        if ($con.hasClass('start')) {
            date = startDate;
        } else {
            date = endDate;
        }
        date.setYear(date.getFullYear() + 1);

        setDate(date, $con);

        return false;
    });

    $calendar.find('.days').delegate('a', 'click', function () {
        var $el = $(this);
        if ($el.hasClass('notactive')) return false;

        var $con = $el.closest('.start, .end').eq(0);
        var date;

        var end = false;
        if ($con.hasClass('start')) {
            startDate.setDate($el.text());
            date = startDate;
        } else {
            endDate.setDate($el.text());
            date = endDate;
            end = true;
        }

        setActiveDays(true, date, end);

        $buttons.removeClass('active');

        return false;
    });

    var $buttons = $calendar.find('.buttons a');
    $buttons.click(function () {
        $buttons.removeClass('active');

        var cls = this.className;

        var startDate;
        var endDate;

        switch (cls) {
            case 'p-default':
                startDate = new Date();
                startDate.setDate(1);
                aStartDate = startDate;
                endDate = new Date();
                break;

            case 'p-week':
                startDate = new Date(aStartDate.getTime());
                endDate = new Date(startDate.getTime());
                endDate.setDate(endDate.getDate() + 6);
                break;

            case 'p-month':
                aStartDate.setDate(1);
                startDate = new Date(aStartDate.getTime());
                endDate = new Date(startDate.getTime());
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0);
                break;

            case 'p-6-months':
                endDate = new Date(aStartDate.getTime());
                startDate = new Date(endDate.getTime());
                startDate.setMonth(startDate.getMonth() - 6);
                aStartDate = startDate;
                // startDate.setDate(1);
                // aStartDate = startDate;
                // endDate = new Date(startDate.getTime());
                // endDate.setMonth(endDate.getMonth() + 6);
                // endDate.setDate(0);
                break;

            case 'p-3-months':
                // startDate = new Date(aStartDate.getTime());
                // startDate.setDate(1);
                // aStartDate = startDate;
                // endDate = new Date(startDate.getTime());
                // endDate.setMonth(endDate.getMonth() + 3);
                // endDate.setDate(0);
                endDate = new Date(aStartDate.getTime());
                startDate = new Date(endDate.getTime());
                startDate.setMonth(startDate.getMonth() - 3);
                aStartDate = startDate;
                break;

            case 'p-year':
                startDate = new Date(aStartDate.getTime());
                startDate.setMonth(0);
                startDate.setDate(1);
                aStartDate = startDate;
                endDate = new Date(startDate.getTime());
                endDate.setMonth(12);
                endDate.setDate(0);
                break;
        }

        $(this).addClass('active');

        var $con1 = $calendar.find('.start');
        var $con2 = $calendar.find('.end');

        setActiveDays(true, endDate, true);
        setDate(startDate, $con1);
        setDate(endDate, $con2);

        return false;
    });

    $calendar.find('.cancel').unbind().click(function () {
        $overlay.remove();
        $calendar.remove();
        $el.removeClass('choose-date');
        return false;
    });

    $calendar.find('.ok').unbind().click(function () {
        if (aEndDate == null) {
            aEndDate = aStartDate;
        }
        opt.onselect(aStartDate, aEndDate);
        $overlay.remove();
        $calendar.remove();
        $el.removeClass('choose-date');
        return false;
    });



    if ( ! $el.hasClass('widget')) {
        var pos = $el.offset();
        pos.top += $el.height();
        var w = $calendar.width();
        var h = $calendar.height();
        pos.left -= w;
        if (pos.left < 0)
            pos.left = 0;

        var maxW = $('body').width();
        var maxH = $('body').height();

        if (pos.left + w > maxW) {
            pos.left = maxW - w;
        }

        if (pos.top + h > maxH) {
            pos.top = maxH - h;
        }

        $calendar.css({
            'left': pos.left,
            'top': pos.top
        });
    }
}


function stringToDate (str) {
    var arr = (''+str).split('.');
    return new Date(arr[2], arr[1] - 1, arr[0]);
}

function dateToString (date) {
    return $.format.date(date, 'dd.MM.yyyy');
}

function date1ToString (date) {
    var months = [
        'январь',
        'февраль',
        'март',
        'апрель',
        'май',
        'июнь',
        'июль',
        'август',
        'сентябрь',
        'октябрь',
        'ноябрь',
        'декабрь'
    ];

    return months[date.getMonth()] + ' ' + date.getFullYear();
}

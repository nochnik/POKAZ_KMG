$(function () {
    $('#StockWells').click(function () {
		
        var $this = $(this);
        var file = $this.attr('data-popup-file');
		
		var params = $(this).attr('data-popup-size');
        if (params) {
            params = JSON.stringify(eval(params));
        }
        $('.popup').show();
        $.get('/stockWellsData', {fieldId: fieldId}, function (data) {

            // $('.popup').html(data).show()
            $('.popup').html(data);
                // .find('.excel-graph-1').excelGraph1();

            $('.popup').append('<a href="#" class="close">×</a>');

            $('.popup').find('.close').click(function () {
                $('.popup').hide().html('');
                return false;
            });

            $('.popup').find('iframe').each(function () {
                var $this = $(this);
                var scale = 2;
                $this.on('mousewheel', function (e) {
                    if (e.ctrlKey) {
                        scale += e.deltaY / 100;
                        $this.css('-moz-transform', 'scale('+scale+')');
                        $this.css('-webkit-transform', 'scale('+scale+')');
                        return false;
                    }
                    return true;
                });
            });

            var $iframes = $('.popup iframe');
            $iframes = $iframes.sort(function (a, b) {
                return $(a).attr('data-load-sort') > $(b).attr('data-load-sort') ? 1 : 0;
            });
            var index = 0;
            console.log($iframes);
            (function () {
                var $iframe = $iframes.eq(index);
                console.log($iframe.attr('data-load-sort'));
                index++;
                if (index >= $iframes.length) {
                    $iframe
                        .attr('src', $iframe.attr('data-src'));
                } else {
                    $iframe.load(arguments.callee)
                        .attr('src', $iframe.attr('data-src'));
                }
            })();

        });
        return false;
    });
});


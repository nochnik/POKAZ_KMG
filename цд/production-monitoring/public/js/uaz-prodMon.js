$('#last10GTM').click(function() {
    console.log(wells);
    $('.popup').show();
    $.post('/last10', {v: 1, fieldId: fieldId, wells: wells}, function(data) {
        $('.popup').empty();
        // $('<div class="absolute left-1 top-0">'+data+'</div>').appendTo('.popup');
        $(data).appendTo('.popup');
        // $.get('/last10_left_table', {v:1, fieldId: fieldId}, function(data) {
        //     $('<div class="full-hd absolute charter left-0 top-1">'+data+'</div>').appendTo('.popup');
        // });
    });
});

$('#last10PRS').click(function() {
    $('.popup').show();
    // $.get('/last10', {v: 2, fieldId: fieldId}, function(data) {
    $.post('/last10', {v: 2, fieldId: fieldId, wells: wells}, function(data) {
        $('.popup').empty();
        $(data).appendTo('.popup');
        // $('<div class="absolute left-1 top-0">'+data+'</div>').appendTo('.popup');
        // $.get('/last10_left_table', {v: 2, fieldId: fieldId}, function(data) {
        //     $('<div class="full-hd absolute charter left-0 top-1">'+data+'</div>').appendTo('.popup');
        // });
    });
});

$('#last10KRS').click(function() {
    $('.popup').show();
    $.post('/last10', {v: 3, fieldId: fieldId, wells: wells}, function(data) {
        $('.popup').empty();
        $(data).appendTo('.popup');
    // $.get('/last10', {v:3, fieldId: fieldId}, function(data) {
    //     $('.popup').empty();
    //     $('<div class="absolute left-1 top-0">'+data+'</div>').appendTo('.popup');
    //     $.get('/last10_left_table', {v:3, fieldId: fieldId}, function(data) {
    //         $('<div class="full-hd absolute charter left-0 top-1">'+data+'</div>').appendTo('.popup');
    //     });
    });
});

function startTimer() {
    console.log('start');
    $.ajax({
        url: '/widget/scheme/'+fieldId,
        success: function (result) {
            console.log('success');
            $('.dashboard')
                .find('.widget[widget-id=a3]').find('.widget-inner').empty();
            $('.dashboard')
                .find('.widget[widget-id=a3]')
                // .attr('id', e.widget)
                .find('.widget-inner')
                .html(result);
        }
    });
}
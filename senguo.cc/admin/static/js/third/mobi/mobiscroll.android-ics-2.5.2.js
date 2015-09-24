(function ($) {
    var theme = {
        defaults: {
            dateOrder: 'Mddyy',
            mode: 'mixed',
            rows: 3,
            cols:5,
            width: 60,
            height: 30,
            showLabel: false,
            useShortLabels: true
        }
    }

    $.mobiscroll.themes['android-ics'] = theme;
    $.mobiscroll.themes['android-ics light'] = theme;

})(jQuery);


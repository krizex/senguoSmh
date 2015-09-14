$(document).ready(function(){
    $('.video-img').click(function() {
    	$(this).find('img').css('display','none');
    	$(this).find('embed').css('display','block');
    })
});
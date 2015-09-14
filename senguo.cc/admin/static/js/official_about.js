$(document).ready(function(){
	//点击视频播放
    $('.video-img').click(function() {
    	$(this).find('img').css('display','none');
    	$(this).find('embed').css('display','block');
    })
});
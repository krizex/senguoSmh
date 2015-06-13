$(document).ready(function(){
	var w_width=$(window).width();
	var height = $('.bg').height();
	$('#slide li').width(w_width);
	var len = $(".num > li").length;
	var index = 0;
	var adTimer;
    $(".num li").mouseover(function() {
		$('.animate0').animate({"opacity": "0"}, 350);
		$('.animate1').animate({"right": "-9999px"}, 350);
		index = $(this).index(); 
		showImg(index);
	}).mouseout(function(){
		$("#slide").finish();
		$('.animate0').finish();
		$('.animate1').finish();
	});
	//滑入停止动画，滑出开始动画.
	$('#slideBox').mouseenter(function(){
		clearInterval(adTimer);
	}).mouseleave(function(){
		 initSlide();
	});
	function showImg(index) {
	              var w_width=$(window).width();	     
		$("#slide").animate({"left": -w_width * index + "px"}, 600);
		$('.animate0').animate({"opacity": "0"}, 350).eq(index).animate({"opacity": "1"}, 400);
		$('.animate1').animate({"right": "-9999px"}, 500).eq(index).animate({"right": "0px"}, 400);
		$(".num li").removeClass("on").eq(index).addClass("on");
	}
	function initSlide(){
		adTimer = setInterval(function() {
			showImg(index);
			index++;
			if (index == len) {index = 0;}
		}, 3000);
	}
	showImg(0);
	index++;
	//initSlide();
});

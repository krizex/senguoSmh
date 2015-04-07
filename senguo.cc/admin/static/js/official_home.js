$(document).ready(function(){
	var w_width=$(window).width();	
	var height = $('.bg').height();
	$('#slide li').width(w_width);
	$("#slideBox").height(height);
	var len = $(".num > li").length;
	var index = 0;
	var adTimer;
	$(window).resize(function(){
		w_width=$(window).width();
		height = $('.bg').height();
		$('#slide li').width(w_width);
		$("#slideBox").height(height);
		$("#slide").stop(true, false).animate({"left":"0px"}, 50);
	});
	$(".num li").mouseover(function() {
		$('.animate0').animate({"opacity": "0"}, 350);
		$('.animate1').animate({"right": "-9999px"}, 500);
		index = $(".num li").index(this); 
		showImg(index);
	}).eq(0).mouseover();
	//滑入停止动画，滑出开始动画.
	$('#slideBox').hover(
		function() {clearInterval(adTimer);},
		function() {
			adTimer = setInterval(function() {
			showImg(index)
			index++;
			if (index == len) {index = 0;}
		}, 3000);
	}).trigger("mouseleave");
	function showImg(index) {
	              var w_width=$(window).width();	     
		$("#slide").stop(true, false).animate({"left": -w_width * index + "px"}, 600);
		$('.animate0').animate({"opacity": "0"}, 350).eq(index).animate({"opacity": "1"}, 500);
		$('.animate1').animate({"right": "-9999px"}, 500).eq(index).animate({"right": "0px"}, 400);
		$(".num li").removeClass("on").eq(index).addClass("on");
	}
});
window.onload=function(){
	var w_width=$(window).width();	
	var height = $('.bg').height();
	$('#slide li').width(w_width);
	$("#slideBox").height(height);
	$(window).resize(function(){
		w_width=$(window).width();
		height = $('.bg').height();
		$('#slide li').width(w_width);
		$("#slideBox").height(height);		
	});
	
}
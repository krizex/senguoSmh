$(document).ready(function(){
	// $('.province_img').animate({
	// 	'opacity':1,
	// 	'width':'260px'
	// },600);
              var wait=786;
              var n4=0;
              var n3=0;
              var n2=0;
              var n1=0;
              var t=3;
	function time(target) {
	    if (wait == 0) {
	        wait = 786;
	    }
	    else {
	        wait--;
	        var num4=$('.num4').text();
	        var num3=$('.num3').text();
	        var num2=$('.num2').text();
	        var num1=$('.num1').text();
	        if(num4!=5) $('.num4').text(n4++);
	        else {$('.num4').text(5)}
	        if(num3!=8) $('.num3').text(n3++);
	        else {$('.num3').text(8)}
	        if(num2!=7) $('.num2').text(n2++);
	        else {$('.num2').text(7)}
	        setTimeout(function() {
	                time(target)
	            },
	            90)
	    }
	};
	function count(target) {
	    if (t == 0) {
	     $('.btn').animate({'opacity':'1'});
	     $('.box').animate({'top':'60px'});
	      time();
	    }
	    else {
	        t--;
	        setTimeout(function() {
	                count(target)
	            },
	            500)
	    }
	};
	count();
});
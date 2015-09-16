$(document).ready(function(){
    $(document).ready(function(){
    	//第一部分右侧图片滑动
    	$('.mall-two').animate({left:"-27px",opacity:"1"},800);
    	$('.mall-three').animate({right:"23px",opacity:"1"},800);
    	//第二部分右侧曲线图加载
    	$('.graph-line').animate({left:"487px"},1000,function(){
    		$('.graph-up').animate({height:"270px"},500,function() {
    			$('.graph-circle').animate({opacity:"1"},500);
    		});
    	});
    });	
});

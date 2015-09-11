$(document).ready(function(){
    $(document).ready(function(){
    	$('.mall-two').animate({left:"-27px",opacity:"1"},800);
    	$('.mall-three').animate({right:"23px",opacity:"1"},800);
    	$('.graph-line').animate({left:"487px"},1000,function(){
    		$('.graph-up').animate({height:"270px"},500,function() {
    			$('.graph-circle').animate({opacity:"1"},500);
    		});
    	});
    });	
});

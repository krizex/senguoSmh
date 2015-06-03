$(document).ready(function(){
	var link=window.location.href;
	if(link.match('all')){
		$('.aall').addClass('active');
        $("#add-goods").removeClass("hidden");
	}else if(link.match('classify')){
		$('.aclassify').addClass('active');
	}else if(link.match('group')){
		$('.agroup').addClass('active');
	}else if(link.match('delete')){
		$('.adelete').addClass('active');
	}
}).on("click",".furit-type li",function(){
    var index = $(this).index();
    $(".furit-type li").removeClass("active").eq(index).addClass("active");
    $(".fruit-content>ul").addClass("hidden").eq(index).removeClass("hidden");
});
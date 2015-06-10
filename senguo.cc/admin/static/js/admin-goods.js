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
});
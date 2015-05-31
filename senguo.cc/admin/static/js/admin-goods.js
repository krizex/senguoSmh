$(document).ready(function(){
	var link=window.location.href;
	if(link.match('all')){
		$('.all').addClass('active');
	}else if(link.match('classify')){
		$('.classify').addClass('active');
	}else if(link.match('group')){
		$('.group').addClass('active');
	}else if(link.match('delete')){
		$('.delete').addClass('active');
	}
});
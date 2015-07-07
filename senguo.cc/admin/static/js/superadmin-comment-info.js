var page = 0;
var page_sum = 1;
var value = 0;
$(document).ready(function(){
	initPagesum();
}).on('change','#select-item',function(){
	page = 0;
	showList(page);
}).on('click','.next-page',function(){
	page ++;
	if(page > page_sum-1){
		page = page_sum-1;
	}
	showList(page);
}).on('click','.pre-page',function(){
	page --;
	if(page < 0){
		page = 0;
	}
	showList(page);
}).on('click','.jump-to',function(){
	var page_to = $(".input-page").val()-1;
	if(page_to < 0 || page_to >= page_sum || isNaN(page_to)){
		alert("页码输入错误!");
		return false;
	}
	$(".page-now").text(page_to);
	showList($(".input-page").val()-1);
});

function initPagesum(){
	var url = '/super/comment_info?ajaxFlag=1';
	$.ajax({
		url:url,
		type:'get',
		success:function(res){
			if(res.success){
				page_sum = res.page_sum; 
			}
		}
	});
}

function showList(page){
	$(".input-page").val('');
	var select_item = new Array();
	select_item[0] = 'all';
	select_item[1] = 'full';
	select_item[2] = 'img';
	value = $('#select-item').val();
	var action = select_item[value];
	var url = "";
	var args = {
		action:action,
		page:page
	};
	$.postJson(url,args,
		function(res){
			if(res.success){
				var comment_list = res.output_data;
				page_sum = res.page_sum; 

				$(".page-total").text(page_sum);
				$(".page-now").text(page+1);
				$(".info-ul").empty();

				if(comment_list.length == 0){
					$(".info-ul").append('<p class="talc" style="font-size:16px">没有找到相关记录!</p>');
					return false;
				}
				for(var i = 0;i < comment_list.length;i++){
					var data = comment_list[i];
					var $item = $(".info-ul-tmp").children("li").clone();
					
					if(data["headimgurl"].length != 0){
                                            			$item.find(".headimgurl").attr("src",data["headimgurl"]);
                                       			}else{
                                            			$item.find(".headimgurl").attr("src","/static/images/TDSG.png");
                                        			}   

                                        			$item.find(".nickname").html(data["nickname"]);
                                        			$item.find(".comment-create-date").html(data["comment_create_date"]);
                                        			$item.find(".create-date").html(data["create_date"]);
                                        			$item.find(".comment").html(data["comment"]);

                                        			if(data["has_comment_img"] == 1){
                                        				var str = '';
                                        				$item.find(".comment-img-txt").removeClass("hidden");
                                        				$item.find(".comment-image-list").removeClass("hidden");
                                        				for(var j = 0;j < data["comment_image_list"].length;j++){
                                        					var imgi = data["comment_image_list"][j];
                                        					str = '<img src='+imgi+' class="comment-image pull-left w80">';
                                        					$item.find(".comment-image-list").append(str);
                                        				}
                                        				$item.find(".comment-image-list").append('<br><br><br><br>');
                                        			}
                                        			else{
                                        				$item.find(".comment-img-txt").addClass("hidden");
                                        				$item.find(".comment-image-list").addClass("hidden");
                                        			}

                                        			$item.find(".comment-reply").html(data["comment_reply"]);
                                        			$item.find(".shop-link").attr("href",data["shop_code"]);
                                        			$item.find(".shop-name").html(data["shop_name"]);
                                        			$item.find(".order-num").html(data["order_num"]);
                                        			$item.find(".commodity-quality").html(data["commodity_quality"]);
                                        			$item.find(".send-speed").html(data["send_speed"]);
                                        			$item.find(".shop-service").html(data["shop_service"]);


                                        			$(".info-ul").append($item);
				}
			}
			else{
				return alert(res.error_text)
			}
	});

}
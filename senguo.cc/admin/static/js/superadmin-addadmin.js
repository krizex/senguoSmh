$(document).ready(function(){
	var search = $("#search");
    var input = $("#inputinfo");
    search.on('click',function(){
        searchUser();
    });
    input.on('keyup',function(){
        searchUser();
    });
}).on("click","#add-sure",function(){
	var admin_id=$.trim($("#get-id").val());
	var province=$("#provinceAddress").attr("data-code");
	if(!admin_id){
		return alert("请输入管理员id");
	}
	if(!province){
		return alert("请选择省份");
	}
	var url="";
	var args={
		"action":"add_admin",
		"admin_id":admin_id,
		"province":province
	};
	$.postJson(url,args,function(res){
		if(res.success){
			window.location.href="/super/admin?action=check_admin"; 
        }else{
            alert(res.error_text);
        }
	});
}).on('click','.province_select',function(){
	var area=window.dataObj.area;
    $('.provinceList').empty();
    $('#cityAddress').attr({'data-code':''}).text('选择城市');
    for(var key in area){
        var $item=$('<li><span class="name"></span><span class="num"></span></li>');
        var city=area[key]['city'];
        var if_city;
        if(city) {
            if_city='true';
        }
        else if_city='false';
        $item.attr({'data-code':key,'data-city':if_city}).find('.name').text(area[key]['name']);
        $('.provinceList').append($item);
    }
}).on('click','.provinceList li',function(){
    var $this=$(this);
    var code=$this.attr('data-code');
    var text=$this.text();
    var if_city=$this.attr('data-city');
    $('#provinceAddress').attr({'data-code':code}).text(text);
    $('.modal').modal('hide');
});

function searchUser(){
	var url="";
	var admin_id=$.trim($("#inputinfo").val());
	if(!admin_id){
		return alert("请输入用户id");
	}
	var args={
		"action":"search_user",
		"admin_id":admin_id
	};
	$.postJson(url,args,function(res){
		if(res.success){
			$('.user-list').empty();
			var data=res.data;
			var item= '<li class="list-group-item clearfix" data-id="{{id}}">'
						+'<img src="{{headimgurl_small}}" class="img pull-left"/>'
						+'<div class="col-lg-3 col-md-3 col-sx-3 col-sm-3">'
						        +'<p class="clearfix mt5">'
						        	+'<span class="pull-left">真实姓名：<a href="/super/user" class="user-id">{{realname}}</a></span>'
						        +'</p>'
						        +'<div class="clearfix">'
						            +'<span class="pull-left">昵称：{{nickname}}</span>'
						        +'</div>'
						    +'</div>'
						 +'<div class="col-lg-3 col-md-3 col-sx-3 col-sm-3">'
						        +'<p class="clearfix mt5">'
						            +'<span class="pull-left">ID：{{id}}</span>'
						        +'</p>'
						        +'<div class="clearfix">'
						            +'<span class="pull-left">手机号：{{phone}}</span>'
						        +'</div>'
						+'</div>'
						'</li>';
			var render=template.compile(item);
	        var realname=data['realname'];
			var id=data['id'];
			var phone=data['phone'];
			var province=data['province'];
			var nickname=data['nickname'];
			var headimgurl_small=data['imgurl'];
	        var list_item =render({
	            realname:realname,
	            id:id,
	            phone:phone,
	            nickname:nickname,
	            headimgurl_small:headimgurl_small
	        });
	        $('.user-list').append(list_item);
        }else{
            alert(res.error_text);
        }
	});
}
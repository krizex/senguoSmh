$(document).ready(function(){
	check("all");
}).on("click",".concel-btn",function(){
	var $this=$(this);
	if(confirm("是否取消该管理员的管理资格")){
		var admin_id=$this.parents("li").attr("data-id");
		var url="";
		var args={
			"action":"cancel",
			"admin_id":admin_id
		};
		$.postJson(url,args,function(res){
			if(res.success){
				$this.parents("li").remove();
	        }else{
	            alert(res.error_text);
	        }
		});	
	}
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
    check("filter",code);
}).on("click","#check-all",function(){
	check("all");
});

function check(action,province){
	var url="";
	var args={
		"action":action
	};
	if(action=="filter"){
		args.province=province;
	}
	$.postJson(url,args,function(res){
		if(res.success){
			$('.admin-list').empty();
			var datalist=res.data;
			if(datalist.length==0){
				$('.admin-list').append('<h4 class="clearfix">无结果!</h4>');
			}
			var item= '<li class="list-group-item clearfix" data-id="{{id}}">'
						+'<img src="{{headimgurl_small}}" class="img pull-left"/>'
						+'<div class="col-lg-3 col-md-3 col-sx-3 col-sm-3">'
						        +'<p class="clearfix mt5">'
						        	+'<span class="pull-left">真实姓名：<a href="/super/user" class="user-id">{{realname}}</a></span>'
						        +'</p>'
						        +'<div class="clearfix">'
						            +'<span class="pull-left">分管区域：{{province}}</span>'
						        +'</div>'
						    +'</div>'
						 +'<div class="col-lg-3 col-md-3 col-sx-3 col-sm-3">'
						        +'<p class="clearfix mt5">'
						            +'<span class="pull-left">ID：{{id}}</span>'
						        +'</p>'
						+'</div>'
						 +'<div class="col-lg-3 col-md-3 col-sx-3 col-sm-3">'
					            +'<p class="clearfix mt5">'
					                +'<span class="pull-left">手机号：{{phone}}</span>'
					            +'</p>'
					            +'<div class="clearfix">'
					                +'<a href="javascript:;" class="btn concel-btn">取消管理员资格</a>'
					            +'</div>'
						+'</div>'
						'</li>';
			for(var key in datalist){
				var data=datalist[key];
				var render=template.compile(item);
		        var realname=data['realname'];
				var id=data['id'];
				var phone=data['phone'];
				var province=data['province'];
				var headimgurl_small=data['headimgurl_small'];
		        var list_item =render({
		            realname:realname,
		            id:id,
		            phone:phone,
		            province:province,
		            headimgurl_small:headimgurl_small
		        });
		        $('.admin-list').append(list_item);
			}
		$('.modal').modal('hide');
        }else{
            alert(res.error_text);
        }
	});
}
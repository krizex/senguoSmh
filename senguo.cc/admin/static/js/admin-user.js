$(document).ready(function(){
    toggle('.show-info','.hide-info');
    //用户性别
    $('.user-sex').each(function(){
        var $this=$(this);
        var sex=$this.data('id');
        if(sex==2) $this.addClass('women');
        else $this.addClass('men');
    });
    //翻页
    var user_number=$('.users-list-item').length;
    var if_reverse=$("#cur-sort-reverse").attr("data-id");
    var action = $(".user-type .active").attr("data-url");
    var order_by=$("#cur-sort-way").attr("data-id");
    $('.search-btn').on('click',function(){
        var search=$('.search-con').val().trim();
        if(!search){return Tip('搜索内容不能为空')};
        getItem(action,order_by,if_reverse,0,search);
    });
    $('.search-con').on('keydown',function(){
        var $this=$(this);
        if(window.event.keyCode == 13)
        {
            var con=$('.search-con').val().trim();
            if(!con){return Tip('搜索内容不能为空')};
            getItem(action,order_by,if_reverse,0,con);
        }
    });
    //导航active样式
    getItem("all","time",1,0);
}).on('click','.history-order',function(){
    // var $this=$(this);
    // window.open($this.attr('href'));
}).on('click','.remark-btn',function(){
    var $this=$(this);
    var id=$this.parents('li').attr('data-id');
    var index=$this.parents('li').index();
    $('.remark-box').modal('show').attr({'data-id':id,'data-index':index});
}).on('click','.remark-sure',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") {
        return false;
    }
    $this.attr("data-flag","off");
    var id=$('.remark-box').attr('data-id');
    var index=$('.remark-box').attr('data-index');
    var remark=$('.remark-content').val().trim();
    if(!remark){
        $this.attr("data-flag","on");
        return Tip('请输入备注');
    }
    var url='';
    var action="remark";
    var data={
        id:id,
        remark:remark
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                $('.users-list-item').eq(index).find('.remark').removeClass('hidden').text('备注：'+remark);
                $('.remark-box').modal('hide');
            }
            else{
                $this.attr("data-flag","on");
                Tip(res.error_text);
            }
        },
        function(){
            $this.attr("data-flag","on");
            Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click',"#if-reverse li",function(){
        var $this = $(this);
        var if_reverse= $this.attr("data-id");
        var action = $(".user-type .active").attr("data-url");
        var order_by=$("#cur-sort-way").attr("data-id");
        $("#cur-sort-reverse").text($this.children().text());
        getItem(action,order_by,if_reverse,0);
}).on('click',"#sort-way-list li",function(){
        var $this = $(this);
        var if_reverse=$("#cur-sort-reverse").attr("data-id");
        var action = $(".user-type .active").attr("data-url");
        var order_by=$this.attr("data-id");
        $("#cur-sort-way").text($this.children().text());
        getItem(action,order_by,if_reverse,0);
}).on("click",".user-type li",function(){
    var $this=$(this);
    $this.addClass("active").siblings("li").removeClass("active");
    var action=$this.attr("data-url");
    var order_by=$("#cur-sort-way").attr("data-id");
    var if_reverse=$("#cur-sort-reverse").attr("data-id");
    getItem(action,order_by,if_reverse,0);
}).on("click",".next-page",function(){
    var if_reverse=$("#cur-sort-reverse").attr("data-id");
    var action = $(".user-type .active").attr("data-url");
    var order_by=$("#cur-sort-way").attr("data-id");
    var page=parseInt($(".page-now").text())+1;
    var page_total=parseInt($(".page-total").text());
    if(page<=page_total){
        getItem(action,order_by,if_reverse,page);
        $(".page-now").text(page);
    }
}).on("click",".pre-page",function(){
    var if_reverse=$("#cur-sort-reverse").attr("data-id");
    var action = $(".user-type .active").attr("data-url");
    var order_by=$("#cur-sort-way").attr("data-id");
    var page=parseInt($(".page-now").text())-1;
    if(page>0){
        getItem(action,order_by,if_reverse,page);
        $(".page-now").text(page);
    }
    
}).on("click",".jump-to",function(){
    var if_reverse=$("#cur-sort-reverse").attr("data-id");
    var action = $(".user-type .active").attr("data-url");
    var order_by=$("#cur-sort-way").attr("data-id");
    var page_total=parseInt($(".page-total").text());
    var regNum=/^[0-9]*$/;
    if(!regNum.test($(".input-page").val().trim())){
        return Tip('页数只能为正整数！')
    }
    var page=parseInt($(".input-page").val().trim());
    if(1<page<page_total){
        getItem(action,order_by,if_reverse,page-1);
        $(".page-now").text(page);
    }
});
var item='<li class="users-list-item  clearfix" data-id="{{id}}">'+
        '<div class="show-info set-w100-fle">'+
            '<img class="user-img pull-left" src="{{headimgurl}}"/>'+
            '<div class="user-info pull-left">'+
                '<span class="user-name set-inl-blo">{{nickname}}<i class="user-sex pull-right set-inl-blo" data-id="{{sex}}"></i></span>'+
                '<div class="user-info-con">'+
                    '<span class="user-account text-grey2">{{shop_balance}} 元</span>'+
                    '<span class="ml10">用户积分：{{shop_point}}</span>'+
                    '<span class="ml10">用户ID：{{id}}</span>'+
                '</div>'+
                '<span class="remark text-pink mt10 {{if remark ==None }}hidden{{ /if }}">备注：{{remark}}</span>'+
            '</div>'+
            '<a href="javascript:;" class="remark-btn pull-right forbid_click ml10 history-order">添加备注</a>'+
            '<a href="/admin/searchorder?action=customer_order&&id={{id}}" class="history-order pull-right forbid_click ml10" target="_blank" >查看历史订单</a>'+
        '</div>'+
        '<div class="hide-info set-w100-fle bg-white" style="display:none;">'+
            '<div class="personal-info pull-left">'+
                '<p class="text-grey9">个人信息</p>'+
                '<p>姓名：{{realname}}</p>'+
                '<p>手机：{{phone}}</p>'+
                '<p>生日：{{birthday}}</p>'+
            '</div>'+
            '<div class="focus-shop pull-left">'+
                '<p class="text-grey9">关注的店铺</p>'+
                '<ul class="focus-shop-list">'+
                    '{{each shop_names as name  }}'+
                    '<li class="text-center bg-grey3 pull-left">{{name}}</li>'+
                    '{{/each}}'+
                '</ul>'+
                '<span class="send-address bg-grey2 text-grey2">送货地址</span>'+
                '<ul class="address-list">'+
                    '{{ each addresses as address }}'+
                    '<li class="set-w100-fle">'+
                        '<p class="address">{{address.address}}-{{address.receiver}}</p>'+
                        '<p class="phone">电话：{{address.phone}}</p>'+
                    '</li>'+
                   '{{/each}}'+
                '</ul>'+
            '</div>'+
        '</div>'+
    '</li>';


function getItem(action,order_by,if_reverse,page,wd){
    $('.wrap-loading-box').removeClass('hide');
    var link="/admin/follower?action="+action+"&&order_by="+order_by+"&&if_reverse="+if_reverse+"&&page="+page;
    if(wd){
        link=link+"&&wd="+wd;
    }
    $.ajax({
        url:link,
        type:"get",
        success:function(res){
            if(res.success){
                $(".users-list").empty();
                var datalist=res.customer_list;
                var nomore=res.nomore;
                var page_sum=Math.ceil(res.page_sum);
                if(page_sum==1){
                    $(".notice").addClass("hidden");
                    $(".users-pagination").addClass("hidden");
                }else{
                    $(".notice").removeClass("hidden");
                    $(".users-pagination").removeClass("hidden");
                }
                $(".user-count").text(res.count);
                $(".page-total").text(page_sum);
                if(nomore==true){
                    $('.wrap-loading-box').addClass('hide');
                    $('.loading').html("~ 没有更多了 ~").show();
                }
                for(var i in datalist){
                        var render = template.compile(item);
                        var id=datalist[i]['id'];
                        var headimgurl=datalist[i]['headimgurl_small'];
                        var nickname=datalist[i]['nickname'];
                        var phone=datalist[i]['phone'];
                        var nickname=datalist[i]['nickname'];
                        var sex=datalist[i]['sex'];
                        var birthday=datalist[i]['birthday'];
                        var shop_balance=datalist[i]['shop_balance'];
                        var shop_point=datalist[i]['shop_point'];
                        var shop_names=datalist[i]['shop_names'];
                        var addresses=datalist[i]['address'];
                        var remark=datalist[i]['remark'];
                        var list_item =render({
                            id:id,
                            headimgurl:headimgurl,
                            nickname:nickname,
                            phone:phone,
                            nickname:nickname,
                            sex:sex,
                            birthday:birthday,
                            shop_balance:shop_balance,
                            shop_point:shop_point,
                            shop_names:shop_names,
                            addresses:addresses,
                            remark:remark
                        });
                        $(".users-list").append(list_item);
                    }
                $('.wrap-loading-box').addClass('hide');
            }
            else {
                $('.wrap-loading-box').addClass('hide');
                return Tip(res.error_text);
            }
        }
    })
}
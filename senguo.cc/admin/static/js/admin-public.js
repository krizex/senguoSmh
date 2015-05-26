var notify = null,notice = false;
$(document).ready(function(){
if (window.screen.width=='600')
    document.write ('<body style="zoom: 55%">');
else if (window.screen.width=='800') 
    document.write ('<body style="zoom: 75%">');

otherShop();

$('.developing').on('click',function(){
    Tip('此功能暂未开放！');
});
//if weixin
if(isWeiXin()){
    $('.header-box').removeClass('w1200').addClass('w1200_m');
    $('.container').removeClass('mt80');
    $('.backstage-header').removeClass('header-fix');
}
    getRealData();
    setInterval(function(){
        getRealData();
    },30000);
    setInterval(function(){
        var title = document.title;
        if(notice){
            if(title.indexOf("】")==-1){
                document.title = "【新订单】"+title;
                setTimeout(function(){
                    document.title = "【　　　】"+title;
                },500);
            }else{
                switchTitle(title);
                setTimeout(function(){
                    switchTitle(title);
                },500);
            }
        }else{
            if(title.indexOf("【　　　】")!=-1){
                document.title = title.split("【　　　】")[1];
            }
            if(title.indexOf("【新订单】")!=-1){
                document.title = title.split("【新订单】")[1];
            }
        }
    },1000);
}).on("click",".has-red-tip",function(){
    var action = $(this).attr("data-action");

}).on('click','#currentShopChange li',function(){
    var shop_id=$(this).data('id');
    shopChnage(shop_id);
});

function switchTitle(title){
    if(title.indexOf("【　　　】")!=-1){
        document.title = "【新订单】"+title.split("【　　　】")[1];
    }
    if(title.indexOf("【新订单】")!=-1){
        document.title = "【　　　】"+title.split("【新订单】")[1];
    }
}

function getRealData(){
    $.ajax({
        url:"/admin/order?order_type=1&order_status=1&page=0&action=allreal",
        type:"get",
        success:function(res){
            if(res.success){
                var atonce = res.atonce;//立即送
                var msg_num = res.msg_num;//消息与评价
                var is_balance = res.is_balance;//余额变动
                var new_order_sum = res.new_order_sum;//订单变动
                var user_num = res.user_num;//新用户数量变动
                var staff_num = res.staff_num;//员工管理变动
                $("#on_sum").text(atonce);
                $("#comment_num").text(msg_num);
                $("#order_ordernum").text(new_order_sum);
                $("#user_usernum").text(user_num);
                $("#staff_staffnum").text(staff_num);
                if(is_balance>0){
                    $("#is_balance").removeClass("hidden");
                }else{
                    $("#is_balance").addClass("hidden");
                }
                if(msg_num>0){
                    $("#comment_num").removeClass("hidden");
                }else{
                    $("#comment_num").addClass("hidden");
                }
                if(new_order_sum>0){
                    notice = true;
                    $("#order_ordernum").removeClass("hidden");
                }else{
                    notice = false;
                    $("#order_ordernum").addClass("hidden");
                }
                if(user_num>0){
                    $("#user_usernum").removeClass("hidden");
                }else{
                    $("#user_usernum").addClass("hidden");
                }
                if(staff_num>0){
                    $("#staff_staffnum").removeClass("hidden");
                }else{
                    $("#staff_staffnum").addClass("hidden");
                }
                if(atonce>0){
                    $("#on_sum").addClass("bounce");
                }else{
                    $("#on_sum").removeClass("bounce");
                }
                //桌面提醒
                if (window.Notification && Notification.permission !== "granted") {
                    Notification.requestPermission(function (status) {
                        if (Notification.permission !== status) {
                            Notification.permission = status;
                        }
                    });
                }else if(window.Notification && Notification.permission == "granted" && notify == null){
                    if(new_order_sum>0){
                        notify = new Notification(new Date().toLocaleString(),{"body":"您收到了新的订单，请及时处理哦！","icon":"/static/images/sg.png","tag":new Date().getTime()});
                    }
                }
            }
        }
    })
}

var shop_id=$('#currentShop').data('id');
var shop_name=$('#currentShop').text();

function isWeiXin(){ 
    var ua = window.navigator.userAgent.toLowerCase(); 
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){ 
        return true; 
        }
        else{ 
    } 
} 

function worMode(target){
    target.hide().siblings().show();
}

function shopChnage(shop_id){
    var url='/admin';
    var data={shop_id:shop_id};
    var args={action:'shop_change',data:data};
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.reload();
        }
    });
}

function otherShop(){
    var url='/admin';
    var args={action:'other_shop'};
    $.postJson(url,args,function(res){
        if(res.success){
            if(res.data.length!=0){
                var data=res.data;
                for (var i in data){
                    console.log();
                     var item='<li role="presentation" data-id="{{id}}">'+
                                        '<a role="menuitem" tabindex="-1" href="javascript:;">{{shop_name}}</a>'+
                                    '</li>';
                    var render=template.compile(item);
                    var id =data[i]['id'];
                    var shop_name =data[i]['shop_name'];
                    var content=render({
                        id:id,
                        shop_name:shop_name
                    });
                    $('#currentShopChange').append(content);
                } 
            }
        }
    });
}

function toggle(trigger,target){
    $(document).on('click',trigger,function(e){
        var $this=$(this);
        var forbid_click=$this.find('.forbid_click');
        if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
            $this.siblings(target).toggle();
        }
        //return false;
    })
}

function hide(trigger,target){
    $(trigger).on('click',function(){
        target.hide();
    })
}

function getPage(page,url,total){
    if(total == 1 || total == 0){
        $('.list-pagination').hide();
    }
    else {
        if(page===0) {
            $('.pre-page').hide();
        }
        else{
            $('.pre-page').on('click',function(){
                var $this=$(this);
                $this.attr({'href':url+(page-1)});
            });
        }
        if((total-1== page)){
            $('.next-page').hide();
        }
        else{
            $('.next-page').on('click',function(){
                var $this=$(this);
                $this.attr({'href':url+(page+1)});
            });
        }
        $('.jump-to').on('click',function(){
            var $this=$(this);
            var num=Int($('.input-page').val());
            if(!num){
                return Tip('请输入页码');
            }
            if(0<num&&num<=total)
            {
                $this.attr({'href':url+(num-1)});
            }
            else {
                return Tip('没有该页的数据');
            }
        });
        $(document).on('keydown','.input-page',function(){
            var $this=$(this);
            if(window.event.keyCode == 13)
            {
                    var num=$this.val();
                    if(!num){
                        return Tip('请输入页码');
                    }
                    if(0<num&&num<=total)
                    {
                        window.location.href=url+(num-1);
                    }
                    else {
                        return Tip('没有该页的数据');
                    }
            }
        });
    }
}

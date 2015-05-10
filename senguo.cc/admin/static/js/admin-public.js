var notify = null;
$(document).ready(function(){
if (window.screen.width=='600')
    document.write ('<body style="zoom: 55%">');
else if (window.screen.width=='800') 
    document.write ('<body style="zoom: 75%">');

$('#currentShopChange li').on('click',function(){
    var shop_id=$(this).data('id');
    shopChnage(shop_id);
});
$('.developing').on('click',function(){
    alert('此功能暂未开放！');
});
//if weixin
if(isWeiXin()){
    $('.header-box').removeClass('w1200').addClass('w1200_m');
    $('.container').removeClass('mt80');
    $('.backstage-header').removeClass('header-fix');
}

    setInterval(function(){
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
                        $("#order_ordersum").removeClass("hidden");
                    }else{
                        $("#order_ordersum").addClass("hidden");
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
                        if(msg_num>0){
                            notify = new Notification(new Date().toLocaleString(),{"body":"您有新订单未处理，请及时处理哦！","icon":"/static/images/sg.gif"});
                        }
                    }
                }
            }
        })
    },10000);
}).on("click",".has-red-tip",function(){
    var action = $(this).attr("data-action");

});

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
    var args={shop_id:shop_id};
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.reload();
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
                return alert('请输入页码');
            }
            if(0<num&&num<=total)
            {
                $this.attr({'href':url+(num-1)});
            }
            else {
                return alert('没有该页的数据');
            }
        });
        $(document).on('keydown','.input-page',function(){
            var $this=$(this);
            if(window.event.keyCode == 13)
            {
                    var num=$this.val();
                    if(!num){
                        return alert('请输入页码');
                    }
                    if(0<num&&num<=total)
                    {
                        window.location.href=url+(num-1);
                    }
                    else {
                        return alert('没有该页的数据');
                    }
            }
        });
    }
}

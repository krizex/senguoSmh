var notify = null,notice = false;
$(document).ready(function(){
   if(!isWebkit()){
        document.write ('<div class="no-webkit-notice" style="width:350;height:150px;margin:0 auto;font-size:14px;border:1px solid #ddd;background:#f7f7f7;padding:30px;line-height:20px;">'+
                '<img src="/static/images/apply_pear3.png" style="width:80px;float:left"/>'+
                    '<div style="float:right">'+
                        '<p style="padding:0;margin:5px">矮油，您的浏览器与森果后台不兼容，</p>'+
                        '<p style="padding:0;margin:5px">推荐使用谷歌浏览器访问本网站，</p>'+
                        '<p style="padding:0;margin:5px">使用国产浏览器的请使用高速模式。</p>'+
                        '<a href="http://rj.baidu.com/soft/detail/14744.html?ald" target="_blank" style="display:inline-block;border:none;background:#44b549;color:#fff;padding:5px 10px;margin-top:10px;font-size:12px;width:100px;text-align:center;text-decoration:none;">谷歌浏览器下载</a>'+
                        '<a href="http://senguo.cc" target="_blank" style="display:inline-block;border:none;background:#44b549;color:#fff;padding:5px 10px;margin-top:10px;font-size:12px;margin-left:10px;width:100px;text-align:center;text-decoration:none;">森果官网</a>'+
                    '</div>'+
            '</div>');
   }
    if (window.screen.width=='600')
        document.write ('<body style="zoom: 55%">');
    else if (window.screen.width=='800')
        document.write ('<body style="zoom: 75%">');
    var height = $(window).height();
    $(".container").css("minHeight",height-245+"px");
    $(".container-right").css("minHeight",$(".container").height()+"px");
    $('.developing').on('click',function(){
        Tip('此功能暂未开放！');
    });
    //if weixin
    if(isWeiXin()){
        $('.header-box').removeClass('w1200').addClass('w1200_m');
        $('.container').removeClass('mt80');
        $('.backstage-header').removeClass('header-fix');
    }
    var current_link=window.location.href;
    if(current_link.substr(current_link.length-6)!="/admin"){
        getRealData();
        setInterval(function(){
            getRealData();
        },30000);
    }
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
    $(".dropdown-toggle").on("click",function(e){
        var _this = $(this);
        _this.children(".caret").toggleClass("rotate180");
        $(document).on("click",function(e){
            if($(e.target).closest("dropdown-toggle").size()==0){
                _this.children(".caret").removeClass("rotate180");
            }
        });
    });
    // document.cookie="shop_id="+getCookie("shop_id");
}).on("click",".has-red-tip",function(){
    var action = $(this).attr("data-action");

}).on("click",".no_auth",function(e){
    stopDefault(e);
    return Tip("您的店铺还未进行认证，此功能暂不可用");
}).on("click",".picture-pre-page",function(){
    var page_now=parseInt($(".picture-now").text());
    if(page_now>1){
        getPicture(pictureType,page_now-1);
        $(".picture-now").text(parseInt(page_now-1));
    }
    $(".picture-next-page").show();
}).on("click",".picture-next-page",function(){
    var page_now=parseInt($(".picture-now").text());
    var page_toatal=parseInt($(".picture-total").text());
    if(page_toatal==page_now+1){
        $(".picture-next-page").hide();
    }
    if(page_now<=page_toatal){
        getPicture(pictureType,page_now+1);
        $(".picture-now").text(parseInt(page_now+1));
    }
    console.log(page_toatal);
     console.log(page_now);
   
}).on("click",".picture-jump-to",function(){
    var page_now=parseInt($(".picture-now").text());
    var page_toatal=parseInt($(".picture-total").text());
    var page=parseInt($(".picture-page").val().trim());
    console.log(page_toatal);
    console.log(page);
    console.log(page_toatal==page);
    if(page_toatal==page){
        $(".picture-next-page").hide();
    }else{
        $(".picture-next-page").show();
    }
    if(1<=page<=page_toatal){
        getPicture(pictureType,page);
        $(".picture-now").text(parseInt(page));
    }
   
}).on("click",".pop-picture-library .cancel-btn",function(){
    $(this).closest(".pop-win").hide();
}).on("click",".del-pic-img",function(){
    if(confirm("是否将该图片从图片库删除？")){
        var $this=$(this);
        var id=$this.parents(".picture-list-item").attr("data-id");
        var url = "/admin/picture";
        var args={
            action:"del",
            data:{
                id:id
            }
        }
         $.postJson(url,args,function(res) {
            if (res.success) {
               $this.parents(".picture-list-item").remove();
            }else{
                Tip(res.error_text);
            }
        },function(){
            return Tip('您的网络暂时不通畅，请稍候再试');
        });
    }
   
});

var pictureType="goods";
function getPicture(action,page){
    if(page>=1){
        page=page-1;
    }
     $.ajax({
        url:'/admin/picture?action='+action+'&page='+page,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.datalist;
                var total = res.total_page+1;
                if(parseInt(page)==0){
                    $(".picture-total").text(total);
                    $(".picture-pre-page").hide();
                }else{
                    $(".picture-pre-page").show();
                }
                if(total==1){
                    $(".picture-pagination").hide();
                }
                $('.picture-list').empty();
                var item='<li class="img-bo picture-list-item" data-id="{{id}}">'+
                        '<a href="javascript:;" class="del-pic-img">x</a>'+
                        '<div class="img-selected">已选</div>'+
                        '<img src="{{imgurl}}?imageView2/1/w/80/h/80" url="{{imgurl}}" alt="商品图片"/>'+
                    '</li>';
                for(var key in data){
                    var render = template.compile(item);
                    var html = render({
                        imgurl:data[key]['imgurl'],
                        id:data[key]['id']
                    });
                    $('.picture-list').append(html);
                }
            }
        }
    });
}

function stopDefault(e){
    if(e&&e.preventDefault){
        e.preventDefault();
    }else{
        window.event.returnValue = false;
    }
    return false;
}

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
                    $('#chatAudio')[0].play();
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
            return false;
        }
}
function isWebkit(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/webkit/i) == 'webkit'){
        return true;
    }
    else{
        return false;
    }
}

function worMode(target){
    target.hide().siblings().show();
}

function shopChnage(shop_id){
    var url='/admin/home';
    var data={shop_id:shop_id};
    var args={action:'shop_change',data:data};
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.reload();
        }
    });
}

function otherShop(){
    var url='/admin/home';
    var args={action:'other_shop'};
    $.postJson(url,args,function(res){
        if(res.success){
            if(res.data.length!=0){
                var data=res.data;
                for (var i in data){
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
            $this.siblings(target).slideToggle(100);
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
function getCookie(key){
    var aCookie = document.cookie.split(";");
    for (var i=0; i < aCookie.length; i++){
        var aCrumb = aCookie[i].split("=");
        if (key === aCrumb[0].replace(/^\s*|\s*$/,"")){
            return unescape(aCrumb[1]);
        }
    }
    return '';
}

function SetCookie(name,value,days){
    var days=arguments[2]?arguments[2]:30; //此 cookie 将被保存 30 天
    var exp=new Date();    //new Date("December 31, 9998");
    exp.setTime(exp.getTime() + days*86400000);
    document.cookie=name+"="+escape(value)+";path=/;expires="+exp.toGMTString();
}

function delCookie(name){
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval=getCookie(name);
    if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();
}
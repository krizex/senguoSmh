var isFull = false,oMove = null,drag = false;
$(document).ready(function(){
    $("body").height($(window).height()-50);
    var startX = 0,startY = 0,width = $(".wrap-point-box").width()-40,left = 0,iLeft = $("#wrap-point-box").offset().left;
    var oBox = $(".wrap-point-box");
    for(var i=0; i<oBox.length; i++){
        initEvent(oBox[i]);
    }
    function initEvent(obj){
        obj.addEventListener('touchstart', function (ev) {
            ev.preventDefault();
            startX = ev.touches[0].pageX;
            startY = ev.touches[0].pageY;
            oMove = $(this).find("img");
            left =  oMove.position().left;
        }, false);
        obj.addEventListener('touchmove', function (ev) {
            ev.preventDefault();
            var moveX,moveY,grade,percent;
            moveX = ev.touches[0].pageX;
            moveY = ev.touches[0].pageY;
            var direction = GetSlideDirection(startX, startY, moveX, moveY);
            left = moveX-40-iLeft;
            if(left<0){
                left = 0;
            }
            if(left>width){
                left = width;
            }
            percent = (left/width).toFixed(2);
            oMove.css("left",left+"px");
            oMove.closest(".point-box").width(17+left);
            oMove.closest("li").find(".point").html(parseInt(percent*100));
            if(left==0){
                grade=0;
            }else if(left>0 && percent<0.33){
                grade=1;
            }else if(percent>=0.33 && percent<=0.66){
                grade=2;
            }else{
                grade=3;
            }
            if(parseInt(percent*100)==100){
                isFull = true;
            }else{
                isFull = false;
            }
            changeColor(oMove,grade);
            switch (direction) {
                case 3:   //左

                    break;
                case 4:   //右
                    break;
            }
        }, false);
        obj.addEventListener('touchend', function (ev) {
            ev.preventDefault();
            if(isFull){
                showAnimate($(this).closest("li").index());
            }
        }, false);
    }
    $(".point-img").on("mousedown",function(ev){
        var percent = 0,grade=0;
        oMove = $(this);
        left =  oMove.position().left;
        var disX = ev.clientX-oMove.position().left;
        var _this = oMove.closest(".wrap-point-box");
        _this.on("mousemove",function(ev){
            drag = true;
            var left = ev.clientX-disX;
            if(left<0){left=0;}
            if(left>width){left=width;}
            oMove.css({left:left});
            oMove.closest(".point-box").width(17+left);
            percent = (left/width).toFixed(2);
            oMove.closest("li").find(".point").html(parseInt(percent*100));
            if(left==0){
                grade=0;
            }else if(left>0 && percent<0.33){
                grade=1;
            }else if(percent>=0.33 && percent<=0.66){
                grade=2;
            }else{
                grade=3;
            }
            if(parseInt(percent*100)==100){
                isFull = true;
            }else{
                isFull = false;
            }
            changeColor(oMove,grade);
        });
        if(oMove[0].setCapture){
            oMove[0].setCapture();
        }
        _this.on("mouseup",function(ev){
            if(oMove[0].releaseCapture){
                oMove[0].releaseCapture();
            }
            if(isFull){
                showAnimate(oMove.closest("li").index());
            }
            _this.unbind("mousemove");
            _this.unbind("mouseup");
        });
        return false;
    });
    /**/
}).on("click","#commit-shop-point",function(){  //提交店铺评论

    var commodity_quality = parseInt($("#zl-point").html(),10);
    var send_speed =  parseInt($("#sd-point").html(),10);
    var shop_service =  parseInt($("#fw-point").html(),10);
    if(commodity_quality==0 || send_speed==0 || shop_service==0){
        noticeBox("每一项多要给你评分哦，给店家点鼓励啊！");
        return false;
    }
    var order_id = $("#commit-shop-point").attr("data-order");
    if($(this).hasClass("grey-bg")){
        noticeBox("别点我啦，马上就好！")
        return false;
    }
    $(this).addClass("grey-bg");
    var data = {
        "commodity_quality":commodity_quality,
        "send_speed":send_speed,
        "shop_service":shop_service,
        "order_id":order_id
    };
    $.ajax({
        url:"/customer/orders?action=comment_point",
        contentType:"application/json; charset=UTF-8",
        data:JSON.stringify({"data":data,"action":"comment_point",_xsrf:window.dataObj._xsrf}),
        type:"post",
        success:function(res){
            if(res.success){
                window.location.href="/customer/ordercomment?orderid="+order_id;
            }else{
                noticeBox(res.error_txt);
                $(this).removeClass("grey-bg");
            }
        }
    })
}).on("mouseup",document,function(){
    $(".wrap-point-box").unbind("mousemove");
    $(".wrap-point-box").unbind("mouseup");
    if(isFull && drag){
        drag = false;
        showAnimate(oMove.closest("li").index());
    }
});
function changeColor($obj,grade){
    if(grade==0){
        $obj.attr("src","/static/images/goods_normal.png");
        $obj.closest(".wrap-point-box").removeClass("shadow-zl shadow-sd shadow-fw");
        $obj.closest(".point-box").removeClass("bg-zl bg-sd bg-fw");
        return false;
    }else if(grade==1){
        $obj.attr("src","/static/images/goods_bad.png");
    }else if(grade==2){
        $obj.attr("src","/static/images/goods_good.png");
    }else if(grade==3){
        $obj.attr("src","/static/images/goods_best.png");
    }
    var index = parseInt($obj.attr("data-id"));
    switch(index){
        case 1:
            $obj.closest(".wrap-point-box").addClass("shadow-zl");
            $obj.closest(".point-box").addClass("bg-zl");
            $obj.addClass("zl-bg");
            break;
        case 2:
            $obj.closest(".wrap-point-box").addClass("shadow-sd");
            $obj.closest(".point-box").addClass("bg-sd");
            $obj.addClass("sd-bg");
            break;
        case 3:
            $obj.closest(".wrap-point-box").addClass("shadow-fw");
            $obj.closest(".point-box").addClass("bg-fw");
            $obj.addClass("fw-bg");
            break;
    }
}
//显示动画
function showAnimate(index){
    switch (index){
        case 0:
            $("#goods-list0").css("display","block").addClass("zl");
            setTimeout(function(){
                $("#goods-list0").css("display","none").removeClass("zl");
            },1700);
            break;
        case 1:
            $("#goods-list1").children().addClass("up-down");
            $("#goods-list1").css("display","block").addClass("zl");
            setTimeout(function(){
                $("#goods-list1").css("display","none").removeClass("zl");
                $("#goods-list1").children().removeClass("up-down");
            },1700);
            break;
        case 2:
            $("#goods-list2").css("display","block").addClass("up");
            setTimeout(function(){
                $("#goods-list2").css("display","none").removeClass("up");
            },1700);
            break;
    }
}

//返回角度
function GetSlideAngle(dx, dy) {
    return Math.atan2(dy, dx) * 180 / Math.PI;
}
//根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右,0：未滑动
function GetSlideDirection(startX, startY, endX, endY) {
    var dy = startY - endY;
    var dx = endX - startX;
    var result = 0;
    //如果滑动距离太短
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        return result;
    }
    var angle = GetSlideAngle(dx, dy);
    if (angle >= -45 && angle < 45) {
        result = 4;
    } else if (angle >= 45 && angle < 135) {
        result = 1;
    } else if (angle >= -135 && angle < -45) {
        result = 2;
    }
    else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        result = 3;
    }
    return result;
}
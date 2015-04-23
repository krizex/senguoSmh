$(document).ready(function(){
    var startX = 0,startY = 0,width = $(".wrap-point-box").width()-34,left = 0;
    var oBox = $(".wrap-point-box");
    var oMove = null;
    for(var i=0; i<oBox.length; i++){
        initEvent(oBox[i]);
    }
    function initEvent(obj){
        obj.addEventListener('touchstart', function (ev) {
            startX = ev.touches[0].pageX;
            startY = ev.touches[0].pageY;
            oMove = $(this).find("img");
            left =  oMove.position().left;
        }, false);
        obj.addEventListener('touchmove', function (ev) {
            var moveX,moveY,grade,percent;
            moveX = ev.touches[0].pageX;
            moveY = ev.touches[0].pageY;
            var direction = GetSlideDirection(startX, startY, moveX, moveY);
            left = moveX-34;
            switch (direction) {
                case 3:   //左
                    if(left<0){
                        left = 0;
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
                    changeColor(oMove,grade);
                    break;
                case 4:   //右
                    if(left>width){
                        left = width;
                    }
                    percent = (left/width).toFixed(2);
                    oMove.css("left",left+"px");
                    oMove.closest(".point-box").width(17+left);
                    oMove.closest("li").find(".point").html(parseInt(percent*100));
                    if(left>0 && percent<0.33){
                        grade=1;
                    }else if(percent>=0.33 && percent<=0.66){
                        grade=2;
                    }else{
                        grade=3;
                    }
                    changeColor(oMove,grade);
                    break;
            }
        }, false);
        obj.addEventListener('touchend', function (ev) {
            var endX, endY;
            endX = ev.changedTouches[0].pageX;
            endY = ev.changedTouches[0].pageY;
            var direction = GetSlideDirection(startX, startY, endX, endY);
            switch (direction) {
                case 3:   //左

                    break;
                case 4:   //右

                    break;
            }
        }, false);
    }
}).on("click","#commit-shop-point",function(){
    var shop_id = 1;
    var zl_point = $("#zl-point").html();
    var sd_point = $("#sd-point").html();
    var fw_point = $("#fw-point").html();
});
function changeColor($obj,grade){
    switch(grade){
        case 0:
            $obj.attr("src","/static/images/goods_normal.png");
            $obj.closest(".wrap-point-box").removeClass("shadow-zl shadow-sd shadow-fw");
            $obj.closest(".point-box").removeClass("bg-zl bg-sd bg-fw");
            break;
        case 1:
            $obj.attr("src","/static/images/goods_bad.png");
            $obj.closest(".wrap-point-box").removeClass("shadow-zl shadow-sd shadow-fw").addClass("shadow-zl");
            $obj.closest(".point-box").removeClass("bg-zl bg-sd bg-fw").addClass("bg-zl");
            break;
        case 2:
            $obj.attr("src","/static/images/goods_good.png");
            $obj.closest(".wrap-point-box").removeClass("shadow-zl shadow-sd shadow-fw").addClass("shadow-sd");
            $obj.closest(".point-box").removeClass("bg-zl bg-sd bg-fw").addClass("bg-sd");
            break;
        case 3:
            $obj.attr("src","/static/images/goods_best.png");
            $obj.closest(".wrap-point-box").removeClass("shadow-zl shadow-sd shadow-fw").addClass("shadow-fw");
            $obj.closest(".point-box").removeClass("bg-zl bg-sd bg-fw").addClass("bg-fw");
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
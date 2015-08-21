$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height+"px");
    $(document).on("click",".goback",function(){
        history.back();
    });
    setTimeout(function(){
        countTime();
    },1000);

   var url = "";
   var args = {
        action:"show_activity",
        activity_id:6
   };

}).on("click",".add-btn",function(){
    var $parent = $(this).closest(".wrap-operate");
    var num = parseInt($parent.attr("data-num"));
    if(num==0){
        $parent.children(".num-txt").removeClass("hide").html(1);
        $parent.children(".minus-btn").removeClass("hide");
    }
    num++;
    $parent.children(".num-txt").html(num);
    $parent.attr("data-num",num);
}).on("click",".minus-btn",function(){
    var $parent = $(this).closest(".wrap-operate");
    var num = parseInt($parent.attr("data-num"));
    if(num==1){
        num=0;
        $parent.children(".num-txt").addClass("hide");
        $(this).addClass("hide");
    }else{
        num--;
        $parent.children(".num-txt").html(num);
    }
    $parent.attr("data-num",num);
}).on("click",".stime-list li",function(){//选择时间段
    $(".stime-list li").removeClass("active");
    $(this).addClass("active");
}).on("click",".seckill-btn",function(){//抢
    $(this).addClass("hide");
    $(".seckill-btn-more").removeClass("hide");
}).on("click",".seckill-btn-more,.seckill-btn-first",function(){//抢先看&更多惊喜
    var shop_code = $("#shop_code").val();
    window.location.href="/"+shop_code;
});

function getList(id){
    var args = {
        time_id:id
    };
    var url = "";
    $.getJSON(url,args,function(res){
        if(res.success){
            var data = res.data;
            insertGoods(data);
        }
    });
}
function insertGoods(data){
    for(var i=0; i<data.length; i++){
        var $item = $("#seckill-item").children("li").clone();
        $item.attr("seckill-id",data.goods_seckill_id).attr("fruit-id",data.fruit_id).attr("charge_type_id",data.charge_type_id);
        $item.find(".image").attr("src",data.img_url);
        $item.find(".store-num").html(data.activity_piece);
        $item.find(".nm-name").html(data.goods_name);
        $item.find(".price-bo").html(data.charge_type_text);
        $item.find(".price-dif").html(data.price_dif);
        $("#seckill_list").append($item);
    }
}

function countTime(time){
    var time_end = new Date("2015-08-21 11:21:00").getTime();
    var time_now = new Date().getTime();
    var time_distance = time_end - time_now;  // 结束时间减去当前时间
    var int_day, int_hour, int_minute, int_second;
    if(time_distance >= 0){
        // 天时分秒换算
        int_day = Math.floor(time_distance/86400000);
        time_distance -= int_day * 86400000;
        int_hour = Math.floor(time_distance/3600000);
        time_distance -= int_hour * 3600000;
        int_minute = Math.floor(time_distance/60000);
        time_distance -= int_minute * 60000;
        int_second = Math.floor(time_distance/1000);
        // 时分秒为单数时、前面加零站位
        if(int_hour < 10)
            int_hour = "0" + int_hour;
        if(int_minute < 10)
            int_minute = "0" + int_minute;
        if(int_second < 10)
            int_second = "0" + int_second;
        // 显示时间
        if(int_day>0){
            $("#day").html(int_day+"天");
        }
        $("#hour").html(int_hour+"时");
        $("#minute").html(int_minute+"分");
        $("#second").html(int_second+"秒");
        setTimeout("countTime()",1000);
    }else{
        Tip("结束了");
        setTimeout(function(){
            //window.location.reload(true);
        },1000);
    }
}
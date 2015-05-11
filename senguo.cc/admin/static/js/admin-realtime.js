/**
 * Created by Administrator on 2015/5/8.
 */
$(document).ready(function(){
    /*if ("WebSocket" in window){
     var socket;
     var host = "ws://zone.senguo.cc/admin/realtime";
     try{
     socket = new WebSocket(host);//新创建一个socket对象
     socket.onopen    = function(msg){ console.log("Welcome - status "+this.readyState); };//监听打开连接
     socket.onmessage = function(msg){ console.log(msg); };//监听当接收信息时触发匿名函数
     socket.onclose   = function(msg){ console.log("Disconnected - status "+this.readyState); };//关闭连接
     }
     catch(ex){ console.log(ex); }
     }else{
     console.log("当前浏览器不支持websocket");
     }*/
    setInterval(function(){
        $.ajax({
            url:"/admin/realtime",
            type:"get",
            success:function(res){
                if(res.success){
                    $("#new_order_sum").text(res.new_order_sum);
                    $("#order_sum").text(res.order_sum);
                    $("#new_follower_sum").text(res.new_follower_sum);
                    $("#follower_sum").text(res.follower_sum);
                }
            }
        })
    },10000);
});
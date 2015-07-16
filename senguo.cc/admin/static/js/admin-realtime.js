/**
 * Created by Administrator on 2015/5/8.
 */
$(document).ready(function(){
    // if ("WebSocket" in window){
    //     var ws = new WebSocket("ws:zone.senguo.cc/admin/realtime");
    // }else{
    //     var ws = new MozWebSocket("ws:zone.senguo.cc/admin/realtime");
    // }
    //  ws.onopen = function(res){
    //     var myDate = new Date(); 
    //     ws.send(myDate.getTime());   
    // }
    //  ws.onmessage = function(res){
    //     $("#new_order_sum").text(res.new_order_sum);
    //     $("#order_sum").text(res.order_sum);
    //     $("#new_follower_sum").text(res.new_follower_sum);
    //     $("#follower_sum").text(res.follower_sum);
    // }
    
    // ws.onclose = function(){
    //     console.log("close");
    // }
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
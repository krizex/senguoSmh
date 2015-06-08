/**
 * Created by Administrator on 2015/5/27.
 */
var order_now_num = 0;//商品数
$(document).ready(function(){
    var mWidth = $(window).width();
    var width = $("#swiper-container").width();
    if(mWidth>800){
        $("#shop-area").css("left",(mWidth-width)/2+"px");
        $("#cart-bg").css("left",((mWidth-width)/2+width-54)+"px");
    }
    $("body").css("backgroundColor","#fff");
    $(".phone-box").css("paddingBottom","20px").css("backgroundColor","#fff");
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        autoplayDisableOnInteraction:false
    });
    $(".goods-choose-lst li").on("click",function(){
        var index = $(this).index();
        $(".goods-choose-lst li").removeClass("active").eq(index).addClass("active");
        $(".goods-info-lst li").removeClass("active").eq(index).addClass("active");
    });
    $(".now-buy").on("click",function(){
        if($(this).attr("data-storage")==0){
            return noticeBox("当前商品已经卖完了~~");
        }
        var _this = $(this);
        if(_this.hasClass("r70")) return false;
        $(this).addClass("r70");
        $(this).prev(".want-num").show().addClass("w90");
        order_now_num++;
        $("#cart-now-num").html(order_now_num);
        $("#cart-now-num").removeClass("move-cart");
    });
    $(".add-num").on("click",function(){
        var num = parseInt($(this).prev("input").val());
        if(isNaN(num)){
            noticeBox("别调戏我哦，请输入数字类型");
        }else{
            num++;
            order_now_num++;
            $(this).prev("input").val(num);
            $("#cart-now-num").html(order_now_num);
        }
    });
    $(".minus-num").on("click",function(){
        var num = parseInt($(this).next("input").val());
        if(isNaN(num)){
            noticeBox("别调戏我哦，请输入数字类型");
        }else{
            if(order_now_num>0){
                order_now_num--;
                $("#cart-now-num").html(order_now_num);
            }
            if(num==1){
                var _this = $(this);
                _this.closest(".want-num").removeClass("w90");
                _this.closest(".want-num").next(".now-buy").removeClass("r70");
                setTimeout(function(){
                    _this.closest(".want-num").hide();
                },600);
                if(order_now_num==0){
                    $("#cart-now-num").addClass("move-cart");
                }
                return false;
            }
            num--;
            $(this).next("input").val(num);
        }
    });
}).on("click","#dianzan",function(){
    var $this = $(this);
    if($this.attr("data-flag")=="ture"){
        return noticeBox("您今天已经点过赞了，明天再来吧");
    }else{
        var id = $this.attr("data-id");
        //great(id,$this);
    }
});
//点赞
function great(id,$this){
    var url='';
    var action=3;
    var args={
        action:action,
        charge_type_id:id
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $this.attr("data-flag","true").addClass("zaned").html(parseInt($this.html())+1);
            }
            else noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

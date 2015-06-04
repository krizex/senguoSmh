/**
 * Created by Administrator on 2015/6/2.
 */
var curGroup = null,aLis=[],aPos=[],zIndex=1;
$(document).ready(function(){
    $(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("input").val();
        },
        afterCopy:function(){/* 复制成功后的操作 */
            Tip("链接已经复制到剪切板");
        }
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
    $(document).on("click",function(e){
        if($(e.target).closest(".sw-er-tip").size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    });
    //初始化组
    var groupList = $(".group-lst").children("li");
    for(var i=0; i<groupList.size(); i++){
        var obj = groupList[i];
        obj.zIndex = 1;
        obj.index = i;
        var pos = getPos($(obj));
        $(obj).css({left:pos.left+"px",top:pos.top+"px",zIndex:"1"});
        aPos.push(pos);
        aLis.push(obj);
        drag(obj);
    }
    $(".group-lst").children("li").each(function(){
         $(this).css("position","absolute");
    });
}).on("click",".spread-group",function(e){
    e.stopPropagation();
    $(this).closest(".right-link").children(".sw-er-tip").toggleClass("invisible");
}).on("click",".del-group",function(){
    curGroup = $(this).closest("li");
    $("#del-win").modal('show');
}).on("click",".ok-del-group",function(){
    $("#del-win").modal('hide');
    curGroup.remove();
}).on("click",".add-groups",function(e){
    e.stopPropagation();
    $("#group-name").val("");
    $("#group-info").val("");
    $("#new-win").modal('show');
}).on("click",".ok-add-group",function(){
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var group_name = $("#group-name").val();
    var group_info = $("#group-info").val();
    if($('.gropu-list li').length==7){
          $this.attr("data-flag", "on");
        Tip("至多可添加五中自定义分组！");
        return false;
    }
    if($.trim(group_name)==""){
         $this.attr("data-flag", "on");
        Tip("分组名字不能为空！");
        return false;
    }
    if($.trim(group_info)==""){
         $this.attr("data-flag", "on");
        Tip("分组介绍不能为空！");
        return false;
    }
    if(group_name.length>10){
         $this.attr("data-flag", "on");
        Tip("分组名称请不要超过十个字！");
        return false;
    }
     if(group_info.length>100){
         $this.attr("data-flag", "on");
        Tip("分组介绍请不要超过100个字！");
        return false;
    }
    var url = '';
    var action = "add_group";
    var data={
        name:group_name,
        intro:group_info
    };
    var args = {
        action:action,
        data:data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
               window.location.reload();
            }
            else {
                 $this.attr("data-flag", "on");
                Tip(res.error_text);
            }
        },
        function () {
             $this.attr("data-flag", "on");
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
  
}).on("click",".edit-group",function(e){//编辑
    e.stopPropagation();
    $("#group-name").val($(this).closest("li").find(".edit-group-name").html());
    $("#group-info").val($(this).closest("li").find(".edit-group-info").html());
    $("#new-win").modal('show');
});
//drag
function drag(obj){
    obj.onmousedown=function(ev){
        var $this = $(obj);
        var oEvent = ev || event;
        var disX = oEvent.clientX-$this.position().left;
        var disY = oEvent.clientY-$this.position().top;
        var oNear = null;
        $this.css("zIndex",++zIndex);
        document.onmousemove=function(ev){
            var oEvent = ev || event;
            var left = oEvent.clientX-disX;
            var top = oEvent.clientY-disY;
            var cWidth = $(window).width();
            var cHeight = $(window).height();
            if(left<0){left=0;}
            if(left>cWidth-$this.width()){left=cWidth-$this.width();}
            if(top<0){top=0;}
            if(top>cHeight-$this.height()){top=cHeight-$this.height();}
            $this.css({left:left,top:top});
            oNear = getNearst($this);
            $(".group-lst>li").removeClass("hig");
            oNear && oNear.addClass("hig");
            return false;
        };
        document.onmouseup=function(){
            document.onmousemove = null;
            document.onmouseup = null;
            if(oNear){
                var tIndex = oNear[0].index;
                oNear[0].index = $this[0].index;
                $this[0].index = tIndex;
                oNear.css("zIndex",++zIndex);
                var iIndex = $this.attr("data-index");
                $this.attr("data-index",oNear.attr("data-index"));
                oNear.attr("data-index",iIndex);
                move($this, aPos[$this[0].index]);
                move(oNear, aPos[oNear[0].index]);
                oNear.removeClass("hig");
            }else{
                move($this, aPos[$this[0].index]);
            }
            $this[0].releaseCapture && $this[0].releaseCapture();
            return false;
        };
        $this[0].setCapture && $this[0].setCapture();
        return false;
    }
}
//获取元素位置
function getPos($obj){
    return $obj.position();
}
//获取两个元素的距离
function getDis($a,$b){
    var a = (getPos($a).left+$a.width()/2)-(getPos($b).left+$b.width()/2);
    var b = (getPos($a).top+$a.height()/2)-(getPos($b).top+$b.height()/2);
    return Math.sqrt(a*a+b*b);
}
//判断两个元素是否碰撞
function isButt($a,$b){
    var l1 = getPos($a).left;
    var t1 = getPos($a).top;
    var r1 = l1 + $a.width();
    var b1 = t1 + $a.height();
    var l2 = getPos($b).left;
    var t2 = getPos($b).top;
    var r2 = l2 + $b.width();
    var b2 = t2 + $b.height();
    if(r1 < l2 || b1 < t2 || r2 < l1 || b2 < t1){
        return false;
    }else{
        return true;
    }
}
//得到距离最近的元素
function getNearst($obj){
    var aDistance = [];
    var i = 0;
    for (i = 0; i < aLis.length; i++){
        aDistance[i] = $(aLis[i]).attr("data-rel") == $obj.index() ? Number.MAX_VALUE : getDis($obj, $(aLis[i]));
    }
    var minNum = Number.MAX_VALUE;
    var minIndex = -1;
    for (i = 0; i < aDistance.length; i++){
        aDistance[i] < minNum && (minNum = aDistance[i], minIndex = i);
    }
    return isButt($obj, $(aLis[minIndex])) ? $(aLis[minIndex]) : null;
}
//元素移动
function move($obj, iTarget){
    clearInterval($obj[0].timer);
    $obj[0].timer = setInterval(function(){
        var iCurL = getPos($obj).left;
        var iCurT = getPos($obj).top;
        var iSpeedL = (iTarget.left - iCurL) / 5;
        var iSpeedT = (iTarget.top - iCurT) / 5;
        iSpeedL = iSpeedL > 0 ? Math.ceil(iSpeedL) : Math.floor(iSpeedL);
        iSpeedT = iSpeedT > 0 ? Math.ceil(iSpeedT) : Math.floor(iSpeedT);
        if (iCurL == iTarget.left && iCurT == iTarget.top){
            clearInterval($obj[0].timer);
        }else{
            $obj.css("left",iCurL + iSpeedL + "px");
            $obj.css("top",iCurT + iSpeedT + "px");
        }
    }, 30);
}
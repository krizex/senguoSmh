var curGroup = null,aLis=[],aPos=[],zIndex=1;
$(document).ready(function(){
    $(document).on("click",function(e){
        if($(e.target).closest(".sw-er-tip").size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    });
    //初始化组
    var groupList = $(".group-lst").children(".self-group");
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
    //group index
    $('.self-group').each(function(){
        var $this=$(this);
        var index=$this.index();
        $this.attr({"data-index":index,"data-rel":index});
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        new QRCode(this, {
            width : 80,
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
    $(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("input").val();
        },
        afterCopy:function(){
            Tip("链接已经复制到剪切板");
        }
    });
}).on("click",".spread-group",function(e){
    e.stopPropagation();
    var $parent = $(this).closest(".self-group");
    $parent.css("zIndex",parseInt($parent.css("zIndex"))+5);
    $(this).closest(".right-link").children(".sw-er-tip").toggleClass("invisible");
}).on("mousedown mousemove",".sw-er-tip",function(e){
    e.stopPropagation();
}).on("click",".del-group",function(){
    curGroup = $(this).closest("li");
    $("#del-win").modal('show');
}).on("click",".ok-del-group",function(){
        var $this = $(this);
        if ($this.attr("data-flag") == "off") return false;
        $this.attr("data-flag", "off");
        var id = curGroup.attr('data-id');
        var url = '';
        var action = "delete_group";
        var data={
            id:id
        };
        var args = {
            action:action,
            data:data
        };
        $.postJson(url, args,
            function (res) {
                if (res.success) {
                    $this.attr("data-flag", "on");
                     $("#del-win").modal('hide');
                     curGroup.remove();
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
}).on("click",".add-groups",function(e){
    e.stopPropagation();
    $("#group-name").val("");
    $("#group-info").val("");
    $("#new-win").modal('show').find('title').text('新建分组');
     $('.ok-add-group').attr('data-action','add');
}).on("click",".ok-add-group",function(){  
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var group_name = $("#group-name").val();
    var group_info = $("#group-info").val();
    var _action =$this.attr('data-action');
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
        Tip("分组名称请不要超过10个字！");
        return false;
    }
     if(group_info.length>50){
        $this.attr("data-flag", "on");
        Tip("分组介绍请不要超过50个字！");
        return false;
    }
    var url = '';
    var action;
    var data={
        name:group_name,
        intro:group_info
    };
    if(_action=='edit'){
        action="edit_group";
        data.id=curGroup.attr('data-id');
    }
    else if(_action=="add"){
        action="add_group";
    }
   
    var args = {
        action:action,
        data:data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                  if(_action=='edit'){
                        curGroup.find('.group-name').text(group_name);
                        curGroup.find('.group-intro').text(group_info);
                        $("#new-win").modal('hide');
                    }
                    else if(_action=="add"){
                        priority("add",res.id);
                    }        
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
    curGroup = $(this).closest("li");
    $("#group-name").val($(this).closest("li").find(".group-name").html());
    $("#group-info").val($(this).closest("li").find(".group-intro").html());
    $("#new-win").modal('show').find('.title').text('编辑分组');
    $('.ok-add-group').attr('data-action','edit');
}).on("click","#goods-all-search",function(){//商品搜索
    var value = $("#goods-all-ipt").val();
    if($.trim(value)==""){
        return Tip("搜索条件不能为空！");
    }
    var key = encodeURIComponent(encodeURIComponent(value));
    window.location.href="/admin/goods/all?type=goodsearch&content="+key+"&page=0";
}).on("keyup","#goods-all-ipt",function(e){//商品搜索框
    var value = $(this).val();
    if(e.keyCode==13){
        if($.trim(value)!=""){
            var key = encodeURIComponent(encodeURIComponent(value));
            window.location.href="/admin/goods/all?type=goodsearch&content="+key+"&page=0";
        }
    }
}).on("click","#add-goods",function(){//添加商品
    window.location.href="/admin/goods/all?do=addgoods";
});
//drag
function drag(obj){
    obj.onmousedown=function(ev){
        if($(ev.target).closest(".right-link").length>0){
        }else{
            $(".sw-er-tip").addClass("invisible");
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
                    priority();
                }else{
                    move($this, aPos[$this[0].index]);
                }
                $this[0].releaseCapture && $this[0].releaseCapture();
                return false;
            };
            $this[0].setCapture && $this[0].setCapture();
        }
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

function priority(type,item_id){
    var data={};
    var _id=[];
    var _index=[];
    for(var i=0;i<$('.item').length;i++){
        var item=$('.item').eq(i);
        var id=item.attr("data-id");
        var index=item.attr("data-index");
        _id.push(id);
        _index.push(index);
    }
    if(type=="add"){
         _id.push(item_id);
        _index.push($('.item').length);
    }
    data.id=_id;
    data.index=_index;
    var url="";
    var args = {
        action:'group_priority',
        data:data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                 if(type=="add"){
                     window.location.reload(true);
                 }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}
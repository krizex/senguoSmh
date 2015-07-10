$(document).ready(function(){
    initBmap();
    var code=$('#shop_code').val();
    if(code=='not set'||code=='') {
        $('.notice_word').show();
        $('.code_set').show();
    }
    else {
        $('.link_notice').show();
        //店铺二维码
        var shop_link=$('.shop_link').text();
        var shop_code=$('.shop_link').find('.code').text();
        $('#shop_link_img').qrcode({render: "canvas",width: 100,height:100,text: shop_link ,typeNumber  : -1});
	//从canvas导出图片
	var type = 'png';
	var canvas=$('#shop_link_img canvas')[0];
              $('#shop_link_img').append(convertCanvasToImage(canvas));
              $('#shop_link_img canvas').remove();
              window.dataObj.imgData= $('#shop_link_img img').attr('src');
    }
    //二维码下载
    $(document).on('click','.download_img',function(){
             var type = 'png';
             var code=$('#shop_code').val();
             var shop_name=$('#shop_name').text();
             var filename = shop_name+'_' +code+ '.' + type;
             saveFile(window.dataObj.imgData,filename);
    });
   //信息转换显示
    $('.area-choose-list li').each(function(){
        $(this).on('click',function(){
            if($(this).hasClass('active'))
            {$(this).removeClass('active');}
            else $(this).addClass('active');
        });
    });
    $('.offline_entity').each(function(){
        var $this=$(this);
        var text=Int($this.attr('data-id'));
        if(text==1) $this.text('有');
        else $this.text('没有');
    });
     $('.shop-status').each(function(){
        var $this=$(this);
        var status=Int($this.attr('data-id'));
        if(status==0) {
            $this.text('店铺关闭');
        }
        else if(status==1) {
            $this.text('营业中');
        }
        else if(status==2) {
            $this.text('筹备中');
        }
        else if(status==3) {
            $this.text('休息中');
        }
    });
    $('.offline_entity-list li').on('click',function(){
        var $this=$(this);
        var val=$this.data('id');
        var text=$this.text();
        $('#offline_entity').text(text).attr({'data-id':val});

    });
    //店铺logo上传
    var key='';
    var token='';
    $('#file_upload').uploadifive(
        {
            buttonText    : '',
            width: '150px',
            uploadScript  : 'http://upload.qiniu.com/',
            uploadLimit     : 10,
            multi    :     false,
            fileSizeLimit   : '10MB',
            'fileObjName' : 'file',
            'removeCompleted' : true,
            'fileType':'*.gif;*.png;*.jpg;*,jpeg',
            'formData':{
                'key':'',
                'token':''
            },
            'onFallback':function(){
                            return Tip('您的浏览器不支持此插件！建议使用谷歌浏览器！');
                        },
            'onUpload' :function(){
                $.ajaxSetup({
                    async : false
                });
                var action="edit_shop_img";
                var url="";
                var args={action: action};
                $.postJson(url,args,
                    function (res) {
                        key=res.key;
                        token=res.token;
                    },
                    function(){
                        Tip('网络好像不给力呢~ ( >O< ) ~！');}
                );
                $('#file_upload').data('uploadifive').settings.formData = {
                    'key':key,
                    'token':token
                };
            },
            'onUploadComplete':function(){
                $('#logoImg').show().attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView2/1/w/100/h/100','data-key':key});
                $('.logo-box').find('.filename').hide();
                $('.logo-box').find('.fileinfo').hide();
                $('.logo-box').find('.close').hide();
            }
        });
    var area=window.dataObj.area;
    $(document).on('click','.province_select',function(){
        $('.provinceList').empty();
        $('#cityAddress').attr({'data-code':''}).text('选择城市');
        for(var key in area){
            var $item=$('<li><span class="name"></span><span class="num"></span></li>');
            var city=area[key]['city'];
            var if_city;
            if(city) {
                if_city='true';
            }
            else if_city='false';
            $item.attr({'data-code':key,'data-city':if_city}).find('.name').text(area[key]['name']);
            $('.provinceList').append($item);
        }
    });
    $(document).on('click','.provinceList li',function(){
        var $this=$(this);
        var code=$this.attr('data-code');
        var text=$this.text();
        var if_city=$this.attr('data-city');
        $('#provinceAddress').attr({'data-code':code}).text(text);
        if(if_city=='false') {
            $('.city_select').hide(); 
            $('#cityAddress').attr('data-code',code).text('');
        }
        else {
             $('.cityList').empty();
              for(var key in area){
                var city=area[key]['city'];
                if(code==key){
                    for(var k in city){
                        var $item=$('<li><span class="name"></span><span class="num"></span></li>');
                        $item.attr({'data-code':k}).find('.name').text(city[k]['name']);
                        $('.cityList').append($item);
                    }
                }
            }
            $('.city_select').show();
        }
        $('.modal').modal('hide');
    });
    $(document).on('click','.cityList li',function(){
        var $this=$(this);
        var code=$this.attr('data-code');
        var text=$this.text();
        $('#cityAddress').attr({'data-code':code}).text(text);
        $('.modal').modal('hide');
    });
    //店铺信息编辑
    $('.info_edit').each(function(){
     var $this=$(this);
     $this.on('click',function(){
     $this.hide().siblings('.info_sure').show().parents('li').find('.info_show').hide().siblings('.info_hide').show();
     });
     });
    $('.info_sure').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            if($this.hasClass('code_sure')&&confirm('店铺号用于您的商城链接，设置后将不可更改，是否确定使用该店铺号？'))
            {
                infoEdit($this);
            }
            else infoEdit($this);
        });
    });
    //修改地理位置
    $("#edit-address").on("click",function(){
        $(".address-start").addClass("hidden");
        $(".wrap-shop-address").removeClass("hidden");
        $(".hand-search").removeClass("hidden");
        $("#hand-search").html("手动标注位置");
    });
}).on('click','.shop_status-list li',function(){
    var $this=$(this);
    var status=$this.attr('data-id');
    var text =$this.text();
    var url="";
    var action='shop_status';
    var data={shop_status:status};
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                    $('#shop_status').text(text).attr({'data-id':status});
            }
            else  Tip(res.error_text);
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~！');}
    );

}).on("click","#edit-area",function(){
    $(".pop-bmap").removeClass("invisible");
}).on("click",".cancel-btn",function(){
    $(".pop-bmap").addClass("invisible");
}).on("click",".pop-bmap",function(e){
    if($(e.target).closest(".pop-content").size()==0){
        $(".pop-bmap").addClass("invisible");
    }
});
var pPoint = null;
var area_data=null;
//初始化百度地图
function initBmap(){
    var address = $("#info_address").html();
    var map = new BMap.Map("bmap");          // 创建地图实例
    var lat = parseFloat($("#lat").val());
    var lon = parseFloat($("#lon").val());
    var marker = null;
    var marker1 = null;
    var map1 = null;
    var isHand = false;
    map.enableScrollWheelZoom();
    var myGeo = new BMap.Geocoder();
    if(lat == 0){
        // 将地址解析结果显示在地图上,并调整地图视野
        getPointByName(map, myGeo, address);
    }else{
        var point = new BMap.Point(lat, lon);  // 创建点坐标\
        pPoint = point;
        map.centerAndZoom(point, 17);
        initPoint(map,point,myGeo);
    }
    var circle,polygon;
    $(".map-sharp-list li").on("click",function(){
        var lngs = pPoint.lng;
        var lats = pPoint.lat;
        map1.removeOverlay(circle);
        map1.removeOverlay(polygon);
        var index = $(this).index();
        $(".map-sharp-list li").removeClass("active").eq(index).addClass("active");
        if(index == 0){//圆形
            circle = new BMap.Circle(pPoint,200, {strokeColor:"blue", strokeWeight:1, strokeOpacity:0.5});
            map1.addOverlay(circle);
            circle.enableEditing();
        }else if(index==1){//方形
            polygon = new BMap.Polygon([
                new BMap.Point(lngs-0.002,lats),
                new BMap.Point(lngs,lats-0.002),
                new BMap.Point(lngs+0.002,lats),
                new BMap.Point(lngs,lats+0.002)
            ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
            map1.addOverlay(polygon);
            polygon.enableEditing();
        }
    });
    $("#ok-area").on("click",function(){//保存区域信息
        area_data={
            deliver_area:$("#shop-area-text").val().trim(),
            area_type:parseInt($(".map-sharp-list").children(".active").index())+1,
            roundness:circle?JSON.stringify(circle.getCenter()):"",
            area_radius:circle?circle.getRadius():"",
            area_list:polygon?JSON.stringify(polygon.getPath()):""
        }
        infoEdit($(this));
    })
    $(document).on("keydown",function(ev){
        if(ev.keyCode==13){
            var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
            getPointByName(map, myGeo, address,true);
        }
    });
    $("#search-lbs").on("click",function(){
        var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
        getPointByName(map, myGeo, address,true);
    });
    $("#hand-search").on("click",function(){
        marker.setAnimation(BMAP_ANIMATION_BOUNCE);
        marker.enableDragging();
        $("#hand-search").html("位置标注中...");
    });
    $("#save-lbs").on("click",function(){
        if(!isHand){
            var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
            getPointByName(map, myGeo, address,true);
        }
    });

    function getPointByName(map, myGeo, address,flag){
        myGeo.getPoint(address, function(point){
            if (point) {
                pPoint = point;
                map.removeOverlay(marker);
                map.centerAndZoom(point, 17);
                initPoint(map,point,myGeo);
            }else{
                if(flag){
                    Tip("根据您填写的地址未能找到正确位置，请重新填写哦！");
                }
            }
        });
    }
    function initPoint(map,point,myGeo){
        marker = new BMap.Marker(point);
        marker.addEventListener("dragend",attribute);
        map.addOverlay(marker);
        function attribute(){
            isHand = true;
            var p = marker.getPosition();  //获取marker的位置
            myGeo.getLocation(p, function(rs){
                marker.setAnimation();
                var addComp = rs.addressComponents;
                $("#provinceAddress").text(addComp.province);
                $("#cityAddress").text(addComp.city);
                $("#addressDetail").val(addComp.district+addComp.street+addComp.streetNumber);
                $("#info_address").html(addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber);
                initProviceAndCityCode(addComp.province,addComp.city);
                $("#hand-search").html("手动标注位置");
                infoEdit($("#save-lbs"),true);//保存坐标
            });
            $("#info_address").attr("data-lng",p.lng).attr("data-lat", p.lat);
            pPoint = p;
            map1.centerAndZoom(pPoint, 17);
            map1.removeOverlay(marker1);
            marker1 = new BMap.Marker(pPoint);
            map1.addOverlay(marker1);
        }
        /*配送区域地图*/
        map1 = new BMap.Map("maparea");
        map1.centerAndZoom(pPoint, 17);
        map1.enableScrollWheelZoom();
        marker1 = new BMap.Marker(pPoint);
        map1.addOverlay(marker1);
        //选择配送范围形状
        var areatype = parseInt($(".pop-bmap").attr("data-type"));
        if(areatype>0){
            $(".map-sharp-list li").removeClass("active").eq(areatype-1).addClass("active");
        }
        if(areatype == 1){
            var spoint =  JSON.parse($(".pop-bmap").attr("data-roundness"));
            var radius = parseInt($(".pop-bmap").attr("data-radius"));
            circle = new BMap.Circle(spoint,radius, {strokeColor:"blue", strokeWeight:1, strokeOpacity:0.5});
            map1.addOverlay(circle);
            circle.enableEditing();
        }else if(areatype == 2){
            polygon = new BMap.Polygon(JSON.parse($(".pop-bmap").attr("data-arealist")), {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
            map1.addOverlay(polygon);
            polygon.enableEditing();
        }
    }
}
//根据省市名称获取code
function initProviceAndCityCode(p, c){
    $.each(window.dataObj.area,function(name,value){
        if(value.name==p){
            $("#provinceAddress").attr("data-code",name);
            if(value['city']){
                $.each(value.city,function(i,n){
                    if(n.name==c){
                        $("#provinceAddress").attr("data-code",i);
                        return false;
                    }
                })
            }
            return false;
        }
    })
}
//获取mimeType
var _fixType = function(type) {
    type = type.toLowerCase().replace(/jpg/i, 'jpeg');
    var r = type.match(/png|jpeg|bmp|gif/)[0];
    return 'image/' + r;
};
 function convertCanvasToImage(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        return image;
    }
//在本地进行文件保存
var saveFile = function(data, filename){
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};

function infoEdit(target,is_address){
    var url="";
    var action_name=target.data('id');
    var data={};
    var action,shop_name,shop_intro,shop_city,shop_address_detail,have_offline_entity,address,entity_text,shop_code,shop_phone;
    var regNum=/^[1-9]*[1-9][0-9]*$/;
    var regPhone=/\d{3}-\d{8}|\d{4}-\d{7}/;
    var regPhone2=/^(1)\d{10}$/;
    if(action_name=='name')
        {
            action='edit_shop_name';
            shop_name=$('.shop_name').val().trim();
            if(shop_name.length>15){return Tip('店铺名称请不要超过15个字符！')}
            data={shop_name:shop_name};
        }
    else if(action_name=='code')
    {
        var reg=/^\w+$/;
        action='edit_shop_code';
        shop_code=$('.shop_code').val().trim();
        if(!reg.test(shop_code)){return Tip('店铺号只能为字母、数字以及下划线组成！')}
        if(shop_code.length<6){return Tip('店铺号至少为6位数！')}
        data={shop_code:shop_code};
    }
    else if(action_name=='intro')
    {
        action='edit_shop_intro';
        shop_intro=$('.shop_intro').val().trim();
        if(shop_intro.length>300){return Tip('店铺简介请不要超过300个字符！')}
        data={shop_intro:shop_intro};
    }
    else if(action_name=='address')
    {
        action='edit_address';
        shop_city=$('#cityAddress').attr('data-code');
        var province=$('#provinceAddress').text();
        var city=$('#cityAddress').text();
        if(!shop_city) {
            return Tip('请选择城市！');
        }
        address=province+city+$('#addressDetail').val();
        shop_address_detail=$('#addressDetail').val().trim();
        if(shop_address_detail.length>50){
            return Tip('详细地址请不要超过50个字符！');
        }
        data={
            lon:$("#info_address").attr("data-lng"),//经度
            lat:$("#info_address").attr("data-lat"),//纬度
            shop_city:shop_city,
            shop_address_detail:shop_address_detail
        };
    }
   else if(action_name=='phone')
    {
        action='edit_phone';
        shop_phone=$('.shop_phone').val().trim();
        if(shop_phone.length=0){return Tip('"电话不能为空o(╯□╰)o"')}
        data={shop_phone:shop_phone};
    }
    else if(action_name=='area')
    {
        action='edit_deliver_area';
        data=area_data;
    }
    else if(action_name=='entity')
    {
        action='edit_have_offline_entity';
        var entity=$('#offline_entity').attr('data-id');
        if(entity==1) have_offline_entity=1;
        else have_offline_entity=0;
        entity_text=$('#offline_entity').text();
        data={have_offline_entity:have_offline_entity};
    }
    else if(action_name=='status'){
        action='shop_status';
        var shop_status=$('#shop_status').attr('data-id');
        var status_text=$('#shop_status').text();
        data={shop_status:shop_status};
    }
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                if(action_name=='name')
                {
                   $('.name').text(shop_name);
                   $('#shop_name').text(shop_name).attr({'title':shop_name});
                }
                else if(action_name=='code')
                {
                    $('.code').text(shop_code);
                    $('.shop_link').attr({'href':'http://senguo.cc/'+shop_code});
                    $('#shop_link_img').qrcode({render: "canvas",width: 100,height:100,text: 'http://senguo.cc/'+shop_code ,typeNumber  : -1});
                    $('.link_notice').show();
                    $('.notice_word').hide();
                    $('.code_set').hide();
		    //从canvas导出图片
		    var type = 'png';
		    var canvas=$('#shop_link_img canvas')[0];
		    window.dataObj.imgData=canvas.toDataURL(type);
		    window.dataObj.imgData = window.dataObj.imgData.replace(_fixType(type),'image/octet-stream');
                }
                else if(action_name=='intro')
                {
                    $('.intro').text(shop_intro);
                }
                else if(action_name=='phone')
                {
                    $('.phone').text(shop_phone);
                }
                else if(action_name=='address'){
                    if(is_address){
                        Tip("店铺地图设置成功");
                    }else{
                        $("#info_address").html($("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val());
                        $(".address-start").removeClass("hidden");
                        $(".wrap-shop-address").addClass("hidden");
                        $(".hand-search").addClass("hidden");
                        Tip("店铺地址设置成功");
                    }
                }
                else if(action_name=='area')
                {
                    $('.deliver_area').text(area_data.deliver_area);
                    $(".pop-bmap").addClass("invisible");
                    Tip("店铺配送区域设置成功");
                }
                else if(action_name=='entity')
                {
                    $('.offline_entity').text(entity_text);
                }
                 else if(action_name=='status'){
                    $('.shop-status').text(status_text);
                 }
                if(action_name!='address' && action_name!='area'){
                    target.hide().siblings('.info_edit').show().parents('li').find('.info_show').show().siblings('.info_hide').hide();
                }
            }
            else  Tip(res.error_text);
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~！');}
    );
}

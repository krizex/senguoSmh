$(document).ready(function(){
    //if is ios
    var u = navigator.userAgent, app = navigator.appVersion;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //android终端或者uc浏览器
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    if(isiOS){
        $('.focus_senguo').each(function(){
            var $this=$(this);
             var link=$this.attr('data-src');
            $this.attr({'href':link});
        });
    }
    $('.foucus_bg').height($(window).height());
    //$('.count-box').css({'height':$(window).height()});
    //if the user is using weixin brower
    //type choose
    $('.count-list li').on('click',function(){
        var $this=$(this);
        $this.addClass('active')
        $this.find('.check').removeClass('hidden');
        $this.siblings('li').removeClass('active').find('.check').addClass('hidden');
    });
    $('#back').on('click',function(){
        $('.apply-info').addClass('hidden');
        $('.count-box').removeClass('hidden');
    });
    //province and city
    var area=window.dataObj.area;
    $(document).on('click','.province_select',function(){
        $('.provinceList').empty();
        $('#cityAddress').attr({'data-code':''}).text('选择城市');
        var pro_box=new Modal('provinceList');
        pro_box.modal('show');
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
        if(if_city=='false') {$('.city_select').hide();$('#cityAddress').attr({'data-code':code})}
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
        var pro_box=new Modal('provinceList');
        pro_box.modal('hide');
    });
    $(document).on('click','.city_select',function(){
        var pro_box=new Modal('cityList');
        pro_box.modal('show');
    });
    $(document).on('click','.cityList li',function(){
        var $this=$(this);
        var code=$this.attr('data-code');
        var text=$this.text();
        $('#cityAddress').attr({'data-code':code}).text(text);
        var pro_box=new Modal('cityList');
        pro_box.modal('hide');
    });
    //下一步
    $(document).on('click','.to_next',function(){
	$('.count-box').addClass('hidden').siblings('.apply-info').removeClass('hidden');
    });
    //服务区域选择
    $('.area-choose-list li').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            if($this.hasClass('active'))
                {$this.removeClass('active');}
            else $this.addClass('active');
        });
    });
    //手机验证
    $(document).on('click','#getVrify',function(){
        $('#getVrify').removeClass('bg-green').attr({'disabled':true});
        var $this=$(this);
        Vrify($this);
    });
    //提交
    $(document).on('click','#submitApply',function(){
        $('#submitApply').removeClass('bg-green').attr({'disabled':true});
        var $this=$(this);
        Apply($this);
    });
    $(document).on('click','#submitReapply',function(){
        reApply();
    });
});
var wait=60;
function time(target) {
    if (wait == 0) {
        target.text("获取验证码").removeAttr('disabled').addClass('bg-green');
        wait = 60;
        $('.able_get').attr({'id':'getVrify'}).text("获取验证码").removeAttr('disabled').addClass('bg-green');
    }
    else {
        target.text("重新发送(" + wait + ")").removeAttr('disabled').removeClass('bg-green');
        wait--;
        $('.able_get').attr({'id':''}).text("重新发送(" + wait + ")").removeAttr('disabled').removeClass('bg-green');
        setTimeout(function() {
                time(target)
            },
            1000)
    }
}

function Apply(target){
    var i=0;
    if($('#serverArea li').eq(0).hasClass('active'))
        i+=1;
    if($('#serverArea li').eq(1).hasClass('active'))
        i+=2;
    if($('#serverArea li').eq(2).hasClass('active'))
        i+=4;
    if($('#serverArea li').eq(3).hasClass('active'))
        i+=8;
    var shop_name=$('#shopName').val().trim();
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').data('id');
    var shop_service_area=i;
    var img_key=$('#logoImg').attr('data-key');
    var shop_intro=$('#shopIntro').val().trim();
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    var code=$('#verify_code').val().trim();
    var phone=$('#phone').val().trim();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/^(1)\d{10}$/;
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(phone.length > 11 || phone.length<11 || !regPhone.test(phone)){
         $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("电话貌似有错o(╯□╰)o",target);
    }
    if(shop_name.length>15){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('店铺名称请不要超过15个字符！',target);
    }
    if(shop_address_detail.length>50){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('详细地址请不要超过50个字符！',target);
    }
    if(shop_intro.length>300){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('店铺简介请不要超过300个字符！',target);
    }
    if (!shop_name){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("请输入店铺名称！",target);
    }
    if (!shop_service_area){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("请选择服务区域！",target);
    }
    if (!shop_city||!shop_province){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("请选择省份城市！",target);
    }
    if (!shop_address_detail){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("请输入您的详细地址！",target);
    }
    if (!shop_intro){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox("请输入您的店铺简介",target);
    }
    if(typeof(img_key)=='undefined') img_key='';
    
    if(!realName){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('请输入您的真实姓名！',target);
    }
    if(!regChinese.test(realName)){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('请输入您的真实姓名！',target);
    }
    if(!wx_Name){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('请输入您的微信号！',target);
    }
    if(!code){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('请输入验证码！',target);
    }
    if(!regNumber.test(code)){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('验证码只能为数字！',target);
    }
    if(code.length>4||code.length<4){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('验证码为4位数字！',target);
    }
    if(!phone){
        $('#submitApply').removeAttr('disabled').addClass('bg-green');
        return noticeBox('请输入您的手机号！',target);
    }
    var address = $("#provinceAddress").html()+$("#cityAddress").html()+shop_address_detail;
    var myGeo = new BMap.Geocoder();
    var shop_point = null;
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        realname:realName,
        wx_username:wx_Name,
        code:code,
        shop_phone:phone
    };
    console.log(address);
    myGeo.getPoint(address, function (point) {
        console.log(point);
        if (point) {
            shop_point = point;
            args.lat=shop_point.lat;
            args.lon=shop_point.lng;
            var url="";
            $.postJson(url,args,
                function(res){
                    if(res.success)
                    {
                        window.location.href="/apply/success";
                        $('#submitApply').removeAttr('disabled').addClass('bg-green');
                    }
                    else {
                        $('#submitApply').removeAttr('disabled').addClass('bg-green');
                        return noticeBox(res.error_text);
                    }
                });
        }else{
            return noticeBox("您的地址填写有误，请重新填写");
        }
    },$("#cityAddress").html());
}

function reApply(evt){
    var i=0;
    if($('#serverArea li').eq(0).hasClass('active'))
        i+=1;
    if($('#serverArea li').eq(1).hasClass('active'))
        i+=2;
    if($('#serverArea li').eq(2).hasClass('active'))
        i+=4;
    if($('#serverArea li').eq(3).hasClass('active'))
        i+=8;
    var shop_name=$('#shopName').val().trim();
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').data('id');
    var shop_service_area=i;
    var shop_intro=$('#shopIntro').val().trim();
    var shop_id=$('#headerId').data('id');
    var img_key=$('#logoImg').attr('data-key');
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    var code=$('#verify_code').val().trim();
    var phone=$('#phone').val().trim();
    var regPhone=/^(1)\d{10}$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return noticeBox("电话貌似有错o(╯□╰)o");}
    if(shop_name.length>15){return noticeBox('店铺名称请不要超过15个字符！')}
    if(shop_address_detail.length>50){return noticeBox('详细地址请不要超过50个字符！')}
    if(shop_intro.length>300){return noticeBox('店铺简介请不要超过300个字符！')}
    if (!shop_name){return noticeBox("请输入店铺名称！");}
    if (!shop_service_area){return noticeBox("请选择服务区域！");}
    if (!shop_city||!shop_province){return noticeBox("请选择省份城市！");}
    if (!shop_address_detail){return noticeBox("请输入您的详细地址！");}
    if (!shop_intro){return noticeBox("请输入您的店铺简介");}
    if(typeof(img_key)=='undefined') img_key='';
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(!realName){return noticeBox('请输入您的真实姓名！')}
    if(!regChinese.test(realName)){return noticeBox('请输入您的真实姓名！')}
    if(!wx_Name){return noticeBox('请输入您的微信号！')}
    if(!code){return noticeBox('请输入验证码！')}
    if(!phone){return noticeBox('请输入您的手机号！')}
    $('#submitReapply').addClass('text-grey6').val('提交中...').attr({'disabled':'true'});
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        shop_id:shop_id,
        realname:realName,
        wx_username:wx_Name,
        code:code,
        shop_phone:phone
    };
    var url="";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                window.location.href="/apply/success";
            }
            else  {
                noticeBox(res.error_text);
                $('#submitApply').removeClass('text-grey6').val('提交申请').removeAttr('disabled');
            }
        },
       function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')}
    );
}

function Vrify(target){
    var action='gencode_shop_apply';
    var url="/fruitzone/phoneVerify?action=admin";
    var phone=$('#phone').val();
    var regPhone=/^(1)\d{10}$/;
    if(phone.length > 11 || phone.length<11 || !regPhone.test(phone)){
        $('#getVrify').removeAttr('disabled').addClass('bg-green');
        return noticeBox("电话貌似有错o(╯□╰)o",target);
    }
    if(!phone){
        $('#getVrify').removeAttr('disabled').addClass('bg-green');
        return noticeBox('手机号不能为空',target);
    }
    var args={action:action,phone:phone};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
                noticeBox('验证码已发送至您的手机,请注意查收');
                $('#getVrify').removeAttr('disabled').addClass('bg-green');
            }
            else {
                noticeBox(res.error_text);
                $('#getVrify').removeAttr('disabled').addClass('bg-green');
            }
        },
       function(){
        noticeBox('网络好像不给力呢~ ( >O< ) ~');
         $('#getVrify').removeAttr('disabled').addClass('bg-green');
    }
    );
}

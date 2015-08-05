$(document).ready(function(){
    $('.modal .fruit-list li').each(function(){$(this).on('click',function(){$(this).toggleClass('active');});});

    var s1=$('.sell-fruit-list').find('li');
    var s2=$('#sellFruit').find('li');
    var b1=$('.buy-fruit-list').find('li');
    var b2=$('#buyFruit').find('li');
    Remember(s1,s2);
    Remember(b1,b2);

    $('.shop-edit-btn').each(function(){shopEdit($(this));});
    $('#liveTimeEdit').on('click',function(){TimeEdit($(this))});
    $('#collectBox').on('click',function(){Collect();})

    var focusLink=$('#focusLink').attr('href');
    $('#focusLink').on('click',function(){
       if(focusLink==''||focusLink=='None')
           $('#focusLink').attr({'href':"javascript:;"})
    });

    $('#shareTo').on('click',function(){
        alert('点击右上角分享按钮分享到朋友圈！');
    });
    var key='';
    var token='';
    $('#file_upload').uploadifive(
        {
            buttonText    : '',
            width: '150px',
            uploadScript  : 'http://upload.qiniu.com/',
            uploadLimit     : 50,
            multi    :     false,
            fileSizeLimit   : '10MB',
            'fileObjName' : 'file',
            'removeCompleted' : true,
            'formData':{
                'key':'',
                'token':''
            },
            'onUpload' :function(){
                $.ajaxSetup({
                    async : false
                });
                var action="edit_shop_img";
                var id=$('#headerId').data('shop');
                var url="/fruitzone/admin/shop/"+id;
                var args={action: action};
                $.postJson(url,args,
                    function (res) {
                        key=res.key;
                        token=res.token;
                    },
                    function(){
                        alert('网络错误！');}
                );
                $('#file_upload').data('uploadifive').settings.formData = {
                    'key':key,
                    'token':token
                };
            },
            'onUploadComplete':function(){
                alert('图像上传成功，如遇网络问题图像无法加载的情况，请刷新页面！');
                var filename=$('#shopLogoUpload').find('.filename').text();
                $('#logoImg').attr({'src':'http://7rf3aw.com2.z0.glb.qiniucdn.com/'+key+'?imageView2/1/w/200/h/200'});
                $('#shopLogoUpload').find('.filename').hide();
                $('#shopLogoUpload').find('.fileinfo').hide();
                $('#shopLogoUpload').find('.close').hide();
            }

        });

});

function Remember(sell1,sell2){
    for(var i= 0;i<sell1.length;i++)
    {
        var t=sell1.eq(i).data('code');
        for(var j=0;j<sell2.length;j++)
        {
            var g=sell2.eq(j).data('code');
            if(g==t)
            {
                sell2.eq(j).addClass('active');
            }
        }

    }
}

function Collect(){
    var shop_id=$('#headerId').data('shop');
    var url="/fruitzone/shop/"+shop_id;
    var args={shop_id:shop_id};
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                alert('收藏成功！');
                $('#collectBox').addClass('hidden').siblings('.action-mode').addClass('show');
            }
        },
        function(){
            alert('网络错误！');}
    );
}


function TimeEdit(evt){
        var action=evt.data('action');
        var data= {
            year: $('#startYear').val().trim(),
            month: $('#startMonth').val().trim()
        };
        var id=$('#headerId').data('shop');
        if(!data['year']||!data['month']){return alert('请输入运营起始年月！')}

        var url="/fruitzone/admin/shop/"+id;
        var args={action: action, data: data};
        $.postJson(url,args,
            function (res) {
                if (res.success) {
                    evt.parents('.editBox').find('.shopShow').text(data);
                    if(res.shop_start_timestamp!=0)
                    {
                        var time=parseInt((res.now-res.shop_start_timestamp)/(30*24*60*60));
                        $('#liveTime').text(time);
                        alert('修改成功！');
                        evt.parents('.modal').modal('hide');
                    }

                }
                else alert('您填写的信息格式不正确！');
            },
            function(){
                alert('网络错误！');}
        );
}


function shopEdit(evt){
    evt.on('click',function(){
        var link=$('#shopLink').val();
        var users=$('#shopUser').val();
        var sell=$('#shopSell').val();
        var buy=$('#shopBuy').val();
        var intro=$('#shopIntro').val();
        var regNumber=/^[0-9]*[1-9][0-9]*$/;
        var id=$('#headerId').data('shop');

        var action=evt.data('action');
        var data=evt.parents('.modal').find('.shop-edit-info').find('.editBox').val();


        if(action=='edit_total_users' && !regNumber.test(users))
            {return alert('用户数只能为数字！');}
        else if(action=='edit_daily_sales' && !regNumber.test(sell))
            {return alert("日销量只能为数字!");}
        else if(action=='edit_single_stock_size' && !regNumber.test(buy))
            {return alert("采购量只能为数字!");}
        else if(action=='edit_onsale_fruits')
            {
                var data=[];
                var f=$('#sellFruit').find('.active');
                for(var i=0;i<f.length;i++)
                {
                    var b=$('#sellFruit').find('.active').eq(i).data('code');
                    data.push(b);

                }
            }
        else if(action=='edit_demand_fruits')
            {
                var data=[];
                var f=$('#buyFruit').find('.active');
                for(var i=0;i<f.length;i++)
                {
                    var b=$('#buyFruit').find('.active').eq(i).data('code');
                    data.push(b);
                }
            }
        var url="/fruitzone/admin/shop/"+id;
        var args={action: action, data: data};
        $.postJson(url,args,
            function (res) {
                if (res.success) {
                    evt.parents('.modal').modal('hide');
                    evt.parents('.editBox').find('.shopShow').text(data);
                    var fruit=window.dataObj.fruit_types;
                    evt.parents('.modal').prev('.edit-fruit-list').find('li').remove();
                    for(var i=0;i<data.length;i++)
                    {
                        var h=data[i]-1;
                        var fruitlist=$('<li class="fruitsty" data-code="'+fruit[h]['id']+'"></li>').text(fruit[h]['name']);
                        evt.parents('.fruitBox').prev('.edit-fruit-list').prepend(fruitlist);
                    }

                }
                else alert('您填写的信息格式不正确！');
            },
            function(){
                alert('网络错误！');}
        );
    });
}

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
    document.getElementById('uploadImg').addEventListener('change', handleFileSelect, false);
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

function imgUpload(){
    var action="edit_shop_img";
    var data=$('#uploadImg').val();
    var id=$('#headerId').data('shop');
    var url="/fruitzone/admin/shop/"+id;
    var args={action: action, data: data};
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                $('#imgKey').val(res.key);
                $('#imgToken').val(res.token);
                var form = document.getElementById('imgForm');
                form.submit();
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
                    alert('修改成功！');
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

function handleFileSelect (evt) {
console.log('2222');
    var files = evt.target.files;
    for (var i = 0, f; f = files[i]; i++) {
        if (!f.type.match('image.*')) {
            continue;
        }
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                console.log(e.target.result);
                var i = document.getElementById("logoImg");
                i.src = event.target.result;
                console.log($(i).width());
                console.log($(i).height());
                $(i).css('width','100%');
//$(i).css('height',$(i).height()/10+'px');
                console.log($(i).width());
                console.log($(i).height());
                var quality = 50;
                i.src = jic.compress(i,quality).src;
                console.log(i.src);
                i.style.display = "block";
            };
        })(f);
        reader.readAsDataURL(f);
        imgUpload();
    }
}
var jic = {
    /**
     * Receives an Image Object (can be JPG OR PNG) and returns a new Image Object compressed
     * @param {Image} source_img_obj The source Image Object
     * @param {Integer} quality The output quality of Image Object
     * @return {Image} result_image_obj The compressed Image Object
     */

    compress: function(source_img_obj, quality, output_format){
        var mime_type = "image/jpeg";
        if(output_format!=undefined && output_format=="png"){
            mime_type = "image/png";
        }

        var cvs = document.createElement('canvas');
        //naturalWidth真实图片的宽度
        cvs.width = source_img_obj.naturalWidth;
        cvs.height = source_img_obj.naturalHeight;
        var ctx = cvs.getContext("2d").drawImage(source_img_obj, 0, 0);
        var newImageData = cvs.toDataURL(mime_type, quality/100);
        var result_image_obj = new Image();
        result_image_obj.src = newImageData;
        return result_image_obj;
    }

}

$(document).ready(function(){
    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
    }
    $('.fruit-list').find('li').each(function(){
        $(this).on('click',function(){$(this).toggleClass('active')});
    });
    $('#fruitChoose').on('click',function(){
        var fruittype=$('.fruit-list').find('.active');
        $('#fruitChooseList').find('li').remove();
       for(var i=0;i<fruittype.length;i++)
           {
               var code=fruittype.eq(i).data('code');
               var name=fruittype.eq(i).text();
               var fruit=$('<li data-code="'+code+'"></li>').text(name);
               $('#fruitChooseList').prepend(fruit);
           }
    });


    var fruitChosen=$('#fruitChooseList').find('li');
    for(var i=0;i<fruitChosen.length;i++)
    {
        var code=fruitChosen.eq(i).data('code');
        var fruit=$('.fruit-list').find('li');
        for(var j= 0;j<fruit.length;j++)
            {
                fruit.eq(i).addClass('active');
            }
    }

    $('.typeItem').on('click',function(){$('#addressEdit').show();$('.fruit-choose').show();});
    $('.otherType').on('click',function(){$('#addressEdit').hide();$('.fruit-choose').hide();});
    $('#infoPublic').on('click',function(){infoPublic()});

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
            'onUpload' :function(){
                var key='';
                var token='';
                $.ajaxSetup({
                    async : false
                });
                var action="issue_img";
                var url="/infowall/infoIssue";
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
                var number=$('#imgPreview').find('img').length;
                console.log(number);
                if(number<5) {
                    var img = $('<img data-key=' + key + '>').attr({'src': 'http://infoimg.qiniudn.com/' + key});
                    $('#imgPreview').append(img);
                }
                else{alert('最多可上传5张图片！')}

            },
            'onUploadComplete':function(){
                alert('上传成功！');
                $('#imgPreview').find('img').each(function(){$(this).on('click',function(){$(this).remove()});});
            }

        });
});


function infoPublic() {
    //var info_type = $('.type-choose').find('.active').data('type');
    var text = $('#infoEdit').val().trim();
    var address = $('#addressEdit').val().trim();
    var fruit_type=[];
    var fruit_list=$('#fruitChooseList').find('li');
    for (var i=0;i<fruit_list.length;i++)
     {fruit_type.push(fruit_list.eq(i).data('code'))}
    var num=$('#imgPreview').find('img');
    var img_key=[];
    for(var i=0;i<num.length;i++)
    {
        var key=num.eq(i).attr('data-key');
        img_key.push(key);
    }

    if(!text){return alert('请填写发布信息！')}
    var url = "/infowall/infoIssue";
    var action="issue_info";
    var args = {
        //info_type: info_type,
        text: text,
        address:address,
        fruit_type: fruit_type,
        action:action,
        img_key: img_key
    };
    $.postJson(url,args,function(res){
        if(res.success)
            {
                alert('发布成功！');
                window.location.href="/infowall/supply";
            }
        else alert('网络错误');
    })

}

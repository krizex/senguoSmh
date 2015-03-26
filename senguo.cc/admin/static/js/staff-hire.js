$(document).ready(function(){
    /*var key;
    var token;
    $('#edit_file_upload').uploadifive(
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
                $.ajaxSetup({
                    async : false
                });
                var action="add_img";
                var url="";
                var args={action: action};
                $.postJson(url,args,
                    function (res) {
                        key=res.key;
                        token=res.token;
                    },
                    function(){
                        alert('网络错误！');}
                );
                $('#edit_file_upload').data('uploadifive').settings.formData = {
                    'key':key,
                    'token':token
                };
            },
            'onUploadComplete':function(){
                $('.hire-img').attr({'src':'http://7tszl5.com2.z0.glb.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-id':key});
            }

        });*/
        $(document).on('click','#submit',function(){hireApply()});
});

function hireApply(){
    var url='';
    var action='add_hire_form';
    var name=$('.hire-name').val();
    var phone=$('.hire-phone').val();
    var email=$('.hire-email').val();
    var address=$('.hire-address').val();
    var intro=$('.hire-introduce').val();
    var advantage=$('.hire-advantage').val();
    var headimgurl=$('.hire-img').data('id');
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    var regEmail=/^([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
    if(!headimgurl) headimgurl='';
    if(!intro) intro='';
    if(!advantage) advantage='';
    if(!regPhone.test(phone)){return $.noticeBox('该手机号不存在！');}
    if(!regEmail.test(email)){return $.noticeBox('该邮箱不存在！');}
    if(name.length>10) {return $.noticeBox('姓名请不要超过10个字！');}
    if(address.length>20) {return $.noticeBox('地址请不要超过20个字！');}
    if(intro.length>100) {return $.noticeBox('自我介绍请不要超过100个字！');}
    if(advantage.length>100) {return $.noticeBox('竞争呢个优势请不要超过100个字！');}
    if(!address) return $.noticeBox('请填写您的住址！');
    var data={
        name:name,
        phone:phone,
        email:email,
        address:address,
        intro:intro,
        advantage:advantage,
        headimgurl:headimgurl
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
           $.noticeBox('申请成功');
           $('#submit').addClass('bg-grey3').css({'border-color':'#ccc'}).text('提交成功').attr({'id':''});
            window.history.back(-1);
        }
        else return $.noticeBox(res.error_text);
    },
    function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );

}

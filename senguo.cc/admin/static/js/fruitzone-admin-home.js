function FeedBack(){
    var feedback=$('#feedbackInfo').val().trim();
    var action="feedback";
    var args={
        action:action,
        feedback_text:feedback,
        _xsrf: window.dataObj._xsrf
    };
    var url="/fruitzone/admin/home";
    $.postJson(url,args,
        function(res){
            if(res.success)
                alert('感谢您的宝贵意见！');
                $('#feedBox').modal('hide');
        },
        function(){
            alert('网络错误！');
        }
    );
}
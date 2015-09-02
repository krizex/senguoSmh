
$(document).ready(function(){
    

}).on('click','.newuser',function(){
        var $this=$(this);
        var url = '';
        var user_id = parseInt($this.attr('data-id'));
        var action  = $this.attr('action');
        var data = {
            user_id:user_id,
            action:action,
        };
        $.postJson(url,data,
            function(res){
                if(res.success){
                    alert('修改成功！')
                }
                else return Tip(res.error_text);
            }
            );
    });
    

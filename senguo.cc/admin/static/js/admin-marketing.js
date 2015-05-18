$(document).ready(function(){
$('.mode').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        if(status==1)
            {
            	$this.addClass('work-mode');}
        else {
        	$this.addClass('stop-mode');}

});
$('.action-btn').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        if(status==1)
            {
            	$this.addClass('bg-pink').text('停用');}
        else {
        	$this.addClass('bg-green').text('启用');}

});
}).on('click','.confess-active',function(){
	var $this=$(this);
	if($this.attr("data-flag")=="off") return false;
	$this.attr("data-flag","off");
	var status=Int($this.attr('data-status'));
	var url='';
	var action="confess_active";
	var args={
	    action:action,
	};
	$.postJson(url,args,
	    function(res){
	        if(res.success){
	            $this.attr("data-flag","on");
	            if(status==1){
	                $this.attr({'data-status':0}).addClass('bg-green').removeClass('bg-pink').text('启用');
	            }
	            else if(status == 0){
	                $this.attr({'data-status':1}).removeClass('bg-green').addClass('bg-pink').text('停用');
	            }
	        }
	        else{
	                alert(res.error_text);
	        }
	    },
	    function(){alert('网络好像不给力呢~ ( >O< ) ~');}
	    );
}).on('click','.confess-type',function(){
	var $this=$(this);
	if($this.attr("data-flag")=="off") return false;
	$this.attr("data-flag","off");
	var status=Int($this.attr('data-status'));
	var url='';
	var action="confess_type";
	var args={
	    action:action,
	};
	$.postJson(url,args,
	    function(res){
	        if(res.success){
	            $this.attr("data-flag","on");
	            if(status==1){
	                $this.attr({'data-status':0}).addClass('stop-mode').removeClass('work-mode');
	            }
	            else if(status == 0){
	                $this.attr({'data-status':1}).removeClass('stop-mode').addClass('work-mode');
	            }
	        }
	        else{
	                alert(res.error_text);
	        }
	    },
	    function(){alert('网络好像不给力呢~ ( >O< ) ~');}
	    );
}).on('click','.confess-only',function(){
	var $this=$(this);
	if($this.attr("data-flag")=="off") return false;
	$this.attr("data-flag","off");
	var status=Int($this.attr('data-status'));
	var url='';
	var action="confess_only";
	var args={
	    action:action,
	};
	$.postJson(url,args,
	    function(res){
	        if(res.success){
	            $this.attr("data-flag","on");
	            if(status==1){
	                $this.attr({'data-status':0}).addClass('stop-mode').removeClass('work-mode');
	            }
	            else if(status == 0){
	                $this.attr({'data-status':1}).removeClass('stop-mode').addClass('work-mode');
	            }
	        }
	        else{
	                alert(res.error_text);
	        }
	    },
	    function(){alert('网络好像不给力呢~ ( >O< ) ~');}
	    );
}).on('click','.notice-sure',function(){
	var $this=$(this);
	var url='';
	var action="confess_notice";
	var data=$('.wall-notice').val().trim();
	if(!data){
		return alert('请填写公告内容')
	}
	if(data.length>140){
		return alert('公告内容不要超过140字')
	}
	var args={
	    action:action,
	    data:data
	};
	$.postJson(url,args,
	    function(res){
	        if(res.success){
	           $('.wall-content').text(data).show().siblings('.wall-notice').hide();
	           $this.hide().siblings('.notice-edit').show();
	        }
	        else{
	                alert(res.error_text);
	        }
	    },
	    function(){alert('网络好像不给力呢~ ( >O< ) ~');}
	    );
}).on('click','.notice-edit',function(){
	var $this=$(this);
	console.log(2333);
	$this.hide().siblings('.notice-sure').show();
	$('.wall-content').hide().siblings('.wall-notice').show();
});
$(document).ready(function(){

}).on('click','.container',function(e){
	if($(e.target).closest('.comment-box').length == 0){
		$('.comment-box').addClass('hidden');	
	}
	
}).on('click','.comment-btn',function(){
	var $this=$(this);
	$('.comment-box').removeClass('hidden');
	$('.comment-text ').val('').attr('placeholder','我也评论一句...');
	$('.sub-comment').attr('id','sub-comment');
}).on('click','.great',function(){
    var $this=$(this);
    var url='/lovewall/'+$('.confess-info').attr('data-code');
    var action='great';
    var id=$('.confess-info').attr('data-id');
    var num=parseInt($this.find('.num').text());
    var data={
        id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                num++;
                $this.find('.num').text(num);
            }
            else {
                return noticeBox(res.error_text);
            }
        },function(){
            return noticeBox('网络好像不给力呢~ ( >O< ) ~');
        },
        function(){
            return noticeBox('服务器貌似出错了~ ( >O< ) ~');
        }    
    );
}).on('click','#sub-comment',function(){
        var $this=$(this);
        $this.addClass('bg-greyc').attr({'disabled':true});
        var url='';
        var action='comment';
        var id=$('.confess-info').attr('data-id');
        var num =parseInt($('.comment-btn .num').text());
        var comment =$('.comment-text ').val().trim();
        if(!comment){
            $this.removeClass('bg-greyc').removeAttr('disabled');
            return noticeBox('请输入评论的内容╮（╯◇╰）╭');
        }
        if(comment.length>500){
            $this.removeClass('bg-greyc').removeAttr('disabled');
            return noticeBox('评论内容请不要超过500字╮（╯◇╰）╭');
        }
        var data={
            id:id,
            comment:comment
        };
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,
            function(res){
                if(res.success)
                {
             	       var data=res.data;
             	        num++;
             	       $('.comment-text ').val('');
                    $this.removeClass('bg-greyc').removeAttr('disabled');
                    var item='<li data-id="{{id}}">'+
                    		'<span class="text-pink"><span class="name">{{nickname}}</span>：</span>'+
                    		'<span class="mr10">{{comment}}</span>'+
                    		'<span class="text-grey9 time">{{time}}</span>'+
                    '</li>';
                     var render = template.compile(item);
                     var list=render({
                     	id:data['id'],
                     	nickname:data['nickname'],
                     	comment:data['comment'],
                     	time:data['time']
                     });
                    $('.comment-list').removeClass('hidden').find('ul').append(list);
                    $('.comment-btn .num').text(num);
                    $('.comment-box').addClass('hidden');
                    $('html,body').scrollTop($('.comment-list li').last().offset().top);
                }
                else {
                    return noticeBox(res.error_text);
                }
            },function(){
                $this.removeClass('bg-greyc').removeAttr('disabled');
                return noticeBox('网络好像不给力呢~ ( >O< ) ~');
            },
            function(){
                $this.removeClass('bg-greyc').removeAttr('disabled');
                return noticeBox('服务器貌似出错了~ ( >O< ) ~');
            }    
        );
}).on('click','.comment-list li',function(){
	var $this=$(this);
	var name = $this.find('.name').text();
	var id =$this.attr('data-id');
	$('.comment-box').removeClass('hidden');
	$('.comment-text ').val('');
	$('.sub-comment').attr('id','sub-replay');
	$('.comment-box').attr({'data-id':id}).find('.comment-text').attr('placeholder','@'+name);
}).on('click','#sub-replay',function(){
        var $this=$(this);
        $this.addClass('bg-greyc').attr({'disabled':true});
        var url='';
        var action='replay';
        var id=$('.comment-box').attr('data-id');
        var replay =$('.comment-text ').val().trim();
        var num =parseInt($('.comment-btn .num').text());
        if(!replay){
            $this.removeClass('bg-greyc').removeAttr('disabled');
            return warnNotice('请输入评论的内容╮（╯◇╰）╭');
        }
        if(replay.length>500){
            $this.removeClass('bg-greyc').removeAttr('disabled');
            return warnNotice('评论内容请不要超过500字╮（╯◇╰）╭');
        }
        var data={
            id:id,
            wall_id:$('.confess-info').attr('data-id'),
            comment:replay
        };
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,
            function(res){
                if(res.success)
                {
             	       var data=res.data;
             	       $('.comment-text ').val('');
             	        num++;
                    $this.removeClass('bg-greyc').removeAttr('disabled');
                     var item='<li data-id="{{id}}">'+
                    		'<span class="text-pink"><span class="name">{{nickname}}：</span>@{{comment_author}}</span>'+
                    		'<span class="mr10">{{comment}}</span>'+
                    		'<span class="text-grey9 time">{{time}}</span>'+
                    '</li>';
                     var render = template.compile(item);
                     var list=render({
                     	id:data['id'],
                     	nickname:data['nickname'],
                     	comment:data['comment'],
                     	time:data['time'],
                     	comment_author:data['comment_author']
                     });
                    $('.comment-list ul').append(list);
                    $('.comment-btn .num').text(num);
                    $('.comment-box').addClass('hidden');
                    $('html,body').scrollTop($('.comment-list li').last().offset().top);
                }
                else {
                    return noticeBox(res.error_text);
                }
            },function(){
                $this.removeClass('bg-greyc').removeAttr('disabled');
                return noticeBox('网络好像不给力呢~ ( >O< ) ~');
            },
            function(){
                $this.removeClass('bg-greyc').removeAttr('disabled');
                return noticeBox('服务器貌似出错了~ ( >O< ) ~');
            }    
        );
});
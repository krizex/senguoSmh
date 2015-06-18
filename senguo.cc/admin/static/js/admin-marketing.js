$(document).ready(function () {
    $('.mode').each(function () {
        var $this = $(this);
        var status = $this.data('status');
        if (status == 1) {
            $this.addClass('work-mode').find('.tit').text('已启用');
        }
        else {
            $this.addClass('stop-mode').find('.tit').text('未启用');
        }

    });
    /*$('.action-btn').each(function () {
        var $this = $(this);
        var status = $this.data('status');
        if (status == 1) {
            $this.addClass('bg-pink').text('停用');
        }
        else {
            $this.addClass('bg-green').text('启用');
        }

    });*/
}).on('click', '.confess-active', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_active";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-statusaction-btn': 0}).addClass('bg-green').removeClass('bg-pink').text('启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('bg-green').addClass('bg-pink').text('停用');
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.confess-type', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_type";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
                    ;
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.confess-only', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_only";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
                    ;
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.notice-sure', function () {
    var $this = $(this);
    var url = '';
    var action = "confess_notice";
    var data = $('.wall-notice').val().trim();
    if (!data) {
        return Tip('请填写公告内容')
    }
    if (data.length > 140) {
        return Tip('公告内容不要超过140字')
    }
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $('.wall-content').text(data).show().siblings('.wall-notice').hide();
                $this.hide().siblings('.notice-edit').show();
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.notice-edit', function () {
    var $this = $(this);
    $this.hide().siblings('.notice-sure').show();
    $('.wall-content').hide().siblings('.wall-notice').show();
}).on('click','.configbtn',function(){
    getinput("newcoupon",0);
}).on('click','.editconfigbtn',function(){
    var coupon_id=int($.getUrlParam("coupon_id"))
    getinput("edit",coupon_id);
}).on('click','.details',function(){
    var data={
"coupon_id":1,"select_rule":1};
    var args={action:"details",data:data};
    var url='';
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                console.log(res.success);
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        })
});

function getinput( action,coupon_id){

    var in1=$('#in1').val();
    var in2=$('#in2').val();
    var in3=$('#in3').val();
    var in4=$('#in4').val();
    var valid_way;
    var uneffictive_time;
    var day_start;
    var last_day;
    var temp=document.getElementsByName("valid_way"); 
    if(temp[0].checked){
        valid_way=0;
        uneffictive_time=$('#in7').val();
        console.log(uneffictive_time);
    }
    else {
        valid_way=1;
        day_start=$('#in5').val();
        last_day=$('#in6').val();
    }
    if (in1=='') {
        Tip("请输入优惠金额！");
    }
    else if (in3==''){
        Tip("请输入库存量！");
    }
    else if (in7==''){
        Tip("请输入固定有效日期！");
    }
    else {
    var data={
    "coupon_money":in1,"use_rule":in2,"total_num":in3,"get_limitnum":in4,"used_for":1,
    "valid_way":valid_way,"uneffictive_time":in7,"day_start":day_start,"last_day":last_day
    ,"coupon_id":coupon_id};
    console.log(data);
    var args={action:action,data:data};
    var url='';
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                console.log(res.success);
            }
            else {
                Tip(res.error_text);
                console.log('error');
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        })
    }
    
}
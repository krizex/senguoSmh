
var switch_status = 
$(document).ready(function(){

}).on('click', '.open-switch', function () {
    	var $this = $(this);
    	var status = parseInt($this.attr("data-status"));
    	if (status == 1){
    		$this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
    	}
    	else if (status ==0) {
    		$this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
    	}

   //  	if ($this.attr("data-flag") == "off") return false;
   //  	$this.attr("data-flag", "off");
   //  	 var status = Int($this.attr('data-status'));
   //  	 if (status == 1) {
	  //                   $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
	  // }
   //            else if (status == 0) {
   //                $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
   //            }
	    // var status = Int($this.attr('data-status'));
	    // var url = '';
	    // var action = "confess_only";
	    // var args = {
	    //     action: action
	    // };
	    // $.postJson(url, args,
	    //     function (res) {
	    //         if (res.success) {
	    //             $this.attr("data-flag", "on");
	    //             if (status == 1) {
	    //                 $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
	    //             }
	    //             else if (status == 0) {
	    //                 $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
	    //             }
	    //         }
	    //         else {
	    //             Tip(res.error_text);
	    //         }
	    //     },
	    //     function () {
	    //         Tip('网络好像不给力呢~ ( >O< ) ~');
	    //     }
	    // );
});
$(document).ready(function(){
    $('.info-edit').on('click',function(){
        var $this=$(this);
        $this.parents('.set-list-item').find('.address-show').hide();
        $this.parents('.set-list-item').find('.address-edit').show();
    });
    $('.set-list-item .action-mode').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        if(status==1)
            $this.find('.work-mode').show();
        else $this.find('.stop-mode').show();

    });
});
var link='/admin/config';
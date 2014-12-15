$(document).ready(function(){
    $('.fruit-class').each(function(){
        var $this=$(this);
        var height=$this.parents('.goods-list-item').height();
        var num=$this.text().length;
        $(this).css({'height':height+'px','line-height':height/num+'px'});
    });

    $('.goods-list-item').each(function(){
        var $this=$(this);
        var canvas=document.createElement('canvas');
        var context=canvas.getContext('2d');
        var img=$this.find('.img');
        var imageUrl=img.attr('src');
        var image=new Image();
        image.src=imageUrl;
        context.drawImage(image, 0, 0);
        var imgData=context.getImageData(1,1,1,1);
        var red=imgData.data[0];
        var green=imgData.data[1];
        var blue=imgData.data[2];
        var alpha=imgData.data[3];
        var deep_red,deep_green,deep_blue;
        var num=50;
        if(red>num) deep_red=red-num;else deep_red=red;
        if(red>num) deep_green=green-num;else deep_green=green;
        if(red>num) deep_blue=blue-num;else deep_blue=blue;
        var deep_color=rgbToHex(deep_red,deep_green,deep_blue);
        $this.find('.text-bgcolor').css({'color':'#'+deep_color});
        $this.find('.fruit-class').css({'background':'rgba('+red+','+green+','+blue+','+alpha+')'});
        $this.css({'background':'rgba('+red+','+green+','+blue+',0.1)'});
    });

    $('.charge-first').each(function(){
        var $this=$(this);
        var charge_list=$this.siblings('.charge-list');
        $this.find('.toggle').on('click',function(){
            $(this).toggleClass('up');
            charge_list.toggle();

        })
    });

    $('.check-lg-img').each(function(){
        var $this=$(this);
        var img_url=$this.find('.img').attr('src');
        var bg_color=$this.parents('.goods-list-item').find('.fruit-class').css('background');
        console.log(bg_color);
        $this.on('click',function(){
            var large_box=$('.large-img-box');
            large_box.modal('show');
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-header').css({'background':bg_color});
        })
    });

    $('#backTop').on('click',function(){$(document).scrollTop(0)});
});
function rgbToHex(r, g, b) { return ((r << 16) | (g << 8) | b).toString(16); }
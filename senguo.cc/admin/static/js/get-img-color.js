function getImgColor(target,text_item,bg_item,url){
    var canvas=document.createElement('canvas');
    var context=canvas.getContext('2d');
    var new_image=new Image();
    new_image.src=url;
    context.drawImage(new_image, 0, 0);
    var imgData=context.getImageData(10,10,10,10);
    var red=imgData.data[0];
    var green=imgData.data[1];
    var blue=imgData.data[2];
    var alpha=imgData.data[3];
    var deep_red,deep_green,deep_blue;
    var num=50;
    if(red>num) deep_red=red-num;else deep_red=red;
    if(red>num) deep_green=green-num;else deep_green=green;
    if(red>num) deep_blue=blue-num;else deep_blue=blue;
    var color=rgbToHex(red,green,blue);
    var deep_color=rgbToHex(deep_red,deep_green,deep_blue);
    text_item.css({'color':'#'+deep_color});
    bg_item.css({'background':'#'+color});
    target.css({'background':'rgba('+red+','+green+','+blue+',0.1)'});
}
function rgbToHex(r, g, b) { return ((r << 16) | (g << 8) | b).toString(16); }

function demo(target){
    var url='';
    var action='';
    var data={

    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){

            }
            else return alert(res.error_text)
        },function(){return alert('网络错误！')}
    );

}

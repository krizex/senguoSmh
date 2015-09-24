$(document).ready(function(){
    $('.nav_item').on('click',function(){
        var $this=$(this);
        // $this.addClass('active').siblings('.nav_item').removeClass('active');
    });
    $('.have-entity').each(function(){
        var entity=$(this).data('real');
        $(this).text(Have(entity));

    });
    $('.admin-sex').each(function(){
        var sex=$(this).data('sex');
        $(this).text(Sex(sex));

    });
    var whether=$('#ifHave').data('if');
    $('#ifHave').text(hasSystem(whether));

});
var item_link='/static/items/superAdmin';

function Have(evt){
    if(evt=='True')
      return '有';
    else if(evt=='False')
      return '无';
}

function Sex(evt){
    if(evt=='0')
        return '其他';
    else if(evt=='1')
        return '男';
    else if(evt=='2')
        return '女';
}

function hasSystem(evt){
    if(evt=='-1')
        return '否';
    else return '是';
}

function page(){

}

/**  
 * 数字格式转换成千分位  
 *@param{Object}num  
 */  
function commafy(num) {   
//1.先去除空格,判断是否空值和非数   
num = num + "";   
num = num.replace(/[ ]/g, ""); //去除空格  
    if (num == "") {   
    return;   
    }   
    if (isNaN(num)){  
    return;   
    }   
    //2.针对是否有小数点，分情况处理   
    var index = num.indexOf(".");   
    if (index==-1) {//无小数点   
      var reg = /(-?\d+)(\d{3})/;   
        while (reg.test(num)) {   
        num = num.replace(reg, "$1,$2");   
        }   
    } else {   
        var intPart = num.substring(0, index);   
        var pointPart = num.substring(index + 1, num.length);   
        var reg = /(-?\d+)(\d{3})/;   
        while (reg.test(intPart)) {   
        intPart = intPart.replace(reg, "$1,$2");   
        }   
       num = intPart +"."+ pointPart;   
    }   
return num;   
}   
  
/**  
 * 去除千分位  
 *@param{Object}num  
 */  
function delcommafy(num){  
   num = num.replace(/[ ]/g, "");//去除空格  
   num=num.replace(/,/gi,'');  
   return num;  
}  

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
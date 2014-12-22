$(document).ready(function(){
    var sex_id=$('.user-sex').data('id');
    sex($('.user-sex'),sex_id);
});
function sex(target,id){
    switch(id) {
        case 1:target.addClass('male');break;
        case 2:target.addClass('female');break;
        case 3:target.addClass('male');break;
        default :break;
    }
}
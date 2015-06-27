$(document).ready(function(){

    $(".board-list li").on("click",function(){
        var index = $(this).index();
        $(".board-list li").removeClass("active").eq(index).addClass("active");
        $("#publish").attr("data-id",$(this).attr("data-id"));
    });
    $("#publish").on("click",function(){
        var id = $(this).attr("data-id")
        publishAtical(id);
    });
    initEditor();
});
function publishAtical(id){
    var url = "";
    var args = {
        action:"",

    };

    $.postJson(url,args,function(res){
        if(res.success){
            Tip("发布成功");
            setTimeout(function(){

            },2000);
        }else{
            Tip(res.error_text);
        }
    });
}

function initEditor(){
    $.ajax({url: '/admin/editorTest?action=editor', async: false, success: function(data){
        var token1 = data.token;
        var token = data.res;
        var editor = KindEditor.create('#kindEditor', {
            uploadJson : 'http://upload.qiniu.com/',
            filePostName : 'file',
            allowFileManager : true,
            fileManagerJson : '/admin/editorFileManage',
            extraFileUploadParams : {'token':token1},
            token : token,
            resizeType : 0,
            items:[
                'source', '|', 'undo', 'redo', '|', 'preview', 'print', 'template', 'code', 'cut', 'copy', 'paste',
                'plainpaste', 'wordpaste', '|', 'justifyleft', 'justifycenter', 'justifyright',
                'justifyfull', 'insertorderedlist', 'insertunorderedlist', 'indent', 'outdent', 'subscript',
                'superscript', 'clearhtml', 'quickformat', 'selectall', '|', 'fullscreen', '/',
                'formatblock', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold',
                'italic', 'underline', 'strikethrough', 'lineheight', 'removeformat', '|', 'image', 'multiimage',
                'flash', 'media', 'insertfile', 'table', 'hr', 'emoticons', 'baidumap', 'pagebreak',
                'anchor', 'link', 'unlink', '|', 'about'
            ],
            afterCreate: function(){
                this.sync();
            },
            afterBlur: function(){this.sync();},
            afterUpload : function(url) {
            },
            uploadError:function(file, errorCode, message){
                Tip(message);
            }
        });
    }});
}
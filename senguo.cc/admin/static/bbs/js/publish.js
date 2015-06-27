$(document).ready(function(){
    $(".board-list li").on("click",function(){
        var index = $(this).index();
        $(".board-list li").removeClass("active").eq(index).addClass("active");
        $("#publish").attr("data-id",$(this).attr("data-id"));
    });
    initEditor();
}).on("click",".select-box",function(){
    $(".pop-reply").removeClass("hide");
}).on("click",".type-sure",function(){
    var type=$(".board-list .active .tit").text();
    var type_id=$(".board-list .active").attr("data-id");
    $(".type").text(type).attr("data-id",type_id);
    $(".pop-reply").addClass("hide");
}).on("click",".publish-tie",function(){
    publishAtical();
});
function publishAtical(){
    var url = "";
    var classify =$(".type").attr("data-id");
    var title=$(".title-ipt").val();
    var article=$(".sumary-text").val();
    if(!classify){
        return Tip("请选择板块");
    }
    var args = {
        action:"",
        data:{
            classify:classify,
            title:title,
            article:article
        }
    };

    $.postJson(url,args,function(res){
        if(res.success){
            Tip("发布成功");
            setTimeout(function(){
                window.location.href="/bbs"
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
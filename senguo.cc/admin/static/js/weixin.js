/**
 * Created by Administrator on 2015/4/28.
 */
function wexin(link,imgurl){
    //微信Api
    var url='/wexin';
    var args={url: window.location.href};
    if(!link){
        link='';
    }
    if(!imgurl){
        imgurl='/static/design_img/TDSG.png';
    }
    $.postJson(url,args,function(res){
        if(res.success){
            var noncestr_val=res.noncestr;
            var timestamp_val=res.timestamp;
            var signature_val=res.signature;
            var logo_Item=$('#shop_imgurl');
            wx.config({
                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: 'wx0ed17cdc9020a96e', // 必填，公众号的唯一标识
                timestamp:timestamp_val, // 必填，生成签名的时间戳
                nonceStr:noncestr_val, // 必填，生成签名的随机串
                signature:signature_val,// 必填，签名，见附录1
                jsApiList: ['onMenuShareTimeline','onMenuShareAppMessage','hideMenuItems','hideOptionMenu','showOptionMenu']// 必填，需要使用的JS接口列表，所有JS接口列表见附录2
            });
            wx.ready(function(){
                if(logo_Item.length==0){
                    wx.hideMenuItems({
                        menuList: ['menuItem:share:appMessage','menuItem:share:timeline']
                    });
                }
                wx.onMenuShareTimeline({
                    title: '', // 分享标题
                    link:link, // 分享链接
                    imgUrl:imgurl, // 分享图标
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });
                wx.onMenuShareAppMessage({
                    title: '', // 分享标题
                    desc: "一家不错的店铺，快来关注吧~ ", // 分享描述
                    link:link,
                    imgUrl:imgurl, // 分享图标
                    type: '' // 分享类型,music、video或link，不填默认为link
                });
            });
        }
        else return alert(res.error_text);
    })
}
function isWeiXin(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        return true;
    }
    else{
        return false;
    }
}
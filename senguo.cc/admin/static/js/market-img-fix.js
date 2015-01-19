var s_height;
var w_height=window.screen.height;
var s_width=window.screen.width;
if(s_width<=800)
    s_height=w_height/9;
else  s_height=800/9;

function fiximg(a,b,c,d) {
    var item=document.getElementsByClassName(a);
    var c1=document.getElementsByClassName(b);
    var c2=document.getElementsByClassName(c);
    for (var i = 0; i < item.length; i++) {
        item[i].style.width = s_height + 'px';
        item[i].style.height = s_height + 'px';
        c1[i].style.width = s_height + 'px';
        c1[i].style.height = s_height + 'px';
        c2[i].style.height = s_height + 'px';
    }
}

function fixclass(d){
    var c3=document.getElementsByClassName(d);
    for (var i = 0; i < c3.length; i++) {
        var num=c3[i].innerHTML.length;
        c3[i].style.height = s_height + 'px';
        c3[i].style.lineHeight = s_height/num + 'px';
    }
}


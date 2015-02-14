var Zepto=(function(){var N,x,J,X,n=[],v=n.slice,t=n.filter,i=window.document,Q={},m={},W={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},H=/^\s*<(\w+|!)[^>]*>/,p=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,o=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,s=/^(?:body|html)$/i,K=/([A-Z])/g,y=["val","css","html","text","data","width","height","offset"],D=["after","prepend","before","append"],B=i.createElement("table"),k=i.createElement("tr"),j={tr:i.createElement("tbody"),tbody:B,thead:B,tfoot:B,td:k,th:k,"*":i.createElement("div")},A=/complete|loaded|interactive/,P=/^[\w-]*$/,U={},T=U.toString,f={},d,R,L=i.createElement("div"),a={tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},G=Array.isArray||function(aa){return aa instanceof Array};f.matches=function(ae,aa){if(!aa||!ae||ae.nodeType!==1){return false}var af=ae.webkitMatchesSelector||ae.mozMatchesSelector||ae.oMatchesSelector||ae.matchesSelector;if(af){return af.call(ae,aa)}var ad,ac=ae.parentNode,ab=!ac;if(ab){(ac=L).appendChild(ae)}ad=~f.qsa(ac,aa).indexOf(ae);ab&&L.removeChild(ae);return ad};function Z(aa){return aa==null?String(aa):U[T.call(aa)]||"object"}function u(aa){return Z(aa)=="function"}function q(aa){return aa!=null&&aa==aa.window}function z(aa){return aa!=null&&aa.nodeType==aa.DOCUMENT_NODE}function r(aa){return Z(aa)=="object"}function Y(aa){return r(aa)&&!q(aa)&&Object.getPrototypeOf(aa)==Object.prototype}function E(aa){return typeof aa.length=="number"}function V(aa){return t.call(aa,function(ab){return ab!=null})}function C(aa){return aa.length>0?J.fn.concat.apply([],aa):aa}d=function(aa){return aa.replace(/-+(.)?/g,function(ab,ac){return ac?ac.toUpperCase():""})};function M(aa){return aa.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}R=function(aa){return t.call(aa,function(ac,ab){return aa.indexOf(ac)==ab})};function S(aa){return aa in m?m[aa]:(m[aa]=new RegExp("(^|\\s)"+aa+"(\\s|$)"))}function h(aa,ab){return(typeof ab=="number"&&!W[M(aa)])?ab+"px":ab}function g(ac){var aa,ab;if(!Q[ac]){aa=i.createElement(ac);i.body.appendChild(aa);ab=getComputedStyle(aa,"").getPropertyValue("display");aa.parentNode.removeChild(aa);ab=="none"&&(ab="block");Q[ac]=ab}return Q[ac]}function w(aa){return"children" in aa?v.call(aa.children):J.map(aa.childNodes,function(ab){if(ab.nodeType==1){return ab}})}f.fragment=function(ad,ac,ab){var af,aa,ae;if(p.test(ad)){af=J(i.createElement(RegExp.$1))}if(!af){if(ad.replace){ad=ad.replace(o,"<$1></$2>")}if(ac===N){ac=H.test(ad)&&RegExp.$1}if(!(ac in j)){ac="*"}ae=j[ac];ae.innerHTML=""+ad;af=J.each(v.call(ae.childNodes),function(){ae.removeChild(this)})}if(Y(ab)){aa=J(af);J.each(ab,function(ag,ah){if(y.indexOf(ag)>-1){aa[ag](ah)}else{aa.attr(ag,ah)}})}return af};f.Z=function(ab,aa){ab=ab||[];ab.__proto__=J.fn;ab.selector=aa||"";return ab};f.isZ=function(aa){return aa instanceof f.Z};f.init=function(aa,ab){var ac;if(!aa){return f.Z()}else{if(typeof aa=="string"){aa=aa.trim();if(aa[0]=="<"&&H.test(aa)){ac=f.fragment(aa,RegExp.$1,ab),aa=null}else{if(ab!==N){return J(ab).find(aa)}else{ac=f.qsa(i,aa)}}}else{if(u(aa)){return J(i).ready(aa)}else{if(f.isZ(aa)){return aa}else{if(G(aa)){ac=V(aa)}else{if(r(aa)){ac=[aa],aa=null}else{if(H.test(aa)){ac=f.fragment(aa.trim(),RegExp.$1,ab),aa=null}else{if(ab!==N){return J(ab).find(aa)}else{ac=f.qsa(i,aa)}}}}}}}}return f.Z(ac,aa)};J=function(aa,ab){return f.init(aa,ab)};function O(ac,aa,ab){for(x in aa){if(ab&&(Y(aa[x])||G(aa[x]))){if(Y(aa[x])&&!Y(ac[x])){ac[x]={}}if(G(aa[x])&&!G(ac[x])){ac[x]=[]}O(ac[x],aa[x],ab)}else{if(aa[x]!==N){ac[x]=aa[x]}}}}J.extend=function(ac){var aa,ab=v.call(arguments,1);if(typeof ac=="boolean"){aa=ac;ac=ab.shift()}ab.forEach(function(ad){O(ac,ad,aa)});return ac};f.qsa=function(ad,ab){var af,ag=ab[0]=="#",ac=!ag&&ab[0]==".",ae=ag||ac?ab.slice(1):ab,aa=P.test(ae);return(z(ad)&&aa&&ag)?((af=ad.getElementById(ae))?[af]:[]):(ad.nodeType!==1&&ad.nodeType!==9)?[]:v.call(aa&&!ag?ac?ad.getElementsByClassName(ae):ad.getElementsByTagName(ab):ad.querySelectorAll(ab))};function F(ab,aa){return aa==null?J(ab):J(ab).filter(aa)}J.contains=i.documentElement.contains?function(aa,ab){return aa!==ab&&aa.contains(ab)}:function(aa,ab){while(ab&&(ab=ab.parentNode)){if(ab===aa){return true}}return false};function I(ac,ab,aa,ad){return u(ab)?ab.call(ac,aa,ad):ab}function c(ab,aa,ac){ac==null?ab.removeAttribute(aa):ab.setAttribute(aa,ac)}function b(ac,ad){var aa=ac.className||"",ab=aa&&aa.baseVal!==N;if(ad===N){return ab?aa.baseVal:aa}ab?(aa.baseVal=ad):(ac.className=ad)}function l(aa){try{return aa?aa=="true"||(aa=="false"?false:aa=="null"?null:+aa+""==aa?+aa:/^[\[\{]/.test(aa)?J.parseJSON(aa):aa):aa}catch(ab){return aa}}J.type=Z;J.isFunction=u;J.isWindow=q;J.isArray=G;J.isPlainObject=Y;J.isEmptyObject=function(ab){var aa;for(aa in ab){return false}return true};J.inArray=function(ab,ac,aa){return n.indexOf.call(ac,ab,aa)};J.camelCase=d;J.trim=function(aa){return aa==null?"":String.prototype.trim.call(aa)};J.uuid=0;J.support={};J.expr={};J.map=function(aa,af){var ae,ad=[],ac,ab;if(E(aa)){for(ac=0;ac<aa.length;ac++){ae=af(aa[ac],ac);if(ae!=null){ad.push(ae)}}}else{for(ab in aa){ae=af(aa[ab],ab);if(ae!=null){ad.push(ae)}}}return C(ad)};J.each=function(aa,ad){var ac,ab;if(E(aa)){for(ac=0;ac<aa.length;ac++){if(ad.call(aa[ac],ac,aa[ac])===false){return aa}}}else{for(ab in aa){if(ad.call(aa[ab],ab,aa[ab])===false){return aa}}}return aa};J.grep=function(aa,ab){return t.call(aa,ab)};if(window.JSON){J.parseJSON=JSON.parse}J.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(ab,aa){U["[object "+aa+"]"]=aa.toLowerCase()});J.fn={forEach:n.forEach,reduce:n.reduce,push:n.push,sort:n.sort,indexOf:n.indexOf,concat:n.concat,map:function(aa){return J(J.map(this,function(ac,ab){return aa.call(ac,ab,ac)}))},slice:function(){return J(v.apply(this,arguments))},ready:function(aa){if(A.test(i.readyState)&&i.body){aa(J)}else{i.addEventListener("DOMContentLoaded",function(){aa(J)},false)}return this},get:function(aa){return aa===N?v.call(this):this[aa>=0?aa:aa+this.length]},toArray:function(){return this.get()},size:function(){return this.length},remove:function(){return this.each(function(){if(this.parentNode!=null){this.parentNode.removeChild(this)}})},each:function(aa){n.every.call(this,function(ac,ab){return aa.call(ac,ab,ac)!==false});return this},filter:function(aa){if(u(aa)){return this.not(this.not(aa))}return J(t.call(this,function(ab){return f.matches(ab,aa)}))},add:function(aa,ab){return J(R(this.concat(J(aa,ab))))},is:function(aa){return this.length>0&&f.matches(this[0],aa)},not:function(aa){var ab=[];if(u(aa)&&aa.call!==N){this.each(function(ad){if(!aa.call(this,ad)){ab.push(this)}})}else{var ac=typeof aa=="string"?this.filter(aa):(E(aa)&&u(aa.item))?v.call(aa):J(aa);this.forEach(function(ad){if(ac.indexOf(ad)<0){ab.push(ad)}})}return J(ab)},has:function(aa){return this.filter(function(){return r(aa)?J.contains(this,aa):J(this).find(aa).size()})},eq:function(aa){return aa===-1?this.slice(aa):this.slice(aa,+aa+1)},first:function(){var aa=this[0];return aa&&!r(aa)?aa:J(aa)},last:function(){var aa=this[this.length-1];return aa&&!r(aa)?aa:J(aa)},find:function(aa){var ab,ac=this;if(!aa){ab=J()}else{if(typeof aa=="object"){ab=J(aa).filter(function(){var ad=this;return n.some.call(ac,function(ae){return J.contains(ae,ad)})})}else{if(this.length==1){ab=J(f.qsa(this[0],aa))}else{ab=this.map(function(){return f.qsa(this,aa)})}}}return ab},closest:function(aa,ab){var ac=this[0],ad=false;if(typeof aa=="object"){ad=J(aa)}while(ac&&!(ad?ad.indexOf(ac)>=0:f.matches(ac,aa))){ac=ac!==ab&&!z(ac)&&ac.parentNode}return J(ac)},parents:function(aa){var ac=[],ab=this;while(ab.length>0){ab=J.map(ab,function(ad){if((ad=ad.parentNode)&&!z(ad)&&ac.indexOf(ad)<0){ac.push(ad);return ad}})}return F(ac,aa)},parent:function(aa){return F(R(this.pluck("parentNode")),aa)},children:function(aa){return F(this.map(function(){return w(this)}),aa)},contents:function(){return this.map(function(){return v.call(this.childNodes)})},siblings:function(aa){return F(this.map(function(ab,ac){return t.call(w(ac.parentNode),function(ad){return ad!==ac})}),aa)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(aa){return J.map(this,function(ab){return ab[aa]})},show:function(){return this.each(function(){this.style.display=="none"&&(this.style.display="");if(getComputedStyle(this,"").getPropertyValue("display")=="none"){this.style.display=g(this.nodeName)}})},replaceWith:function(aa){return this.before(aa).remove()},wrap:function(aa){var ab=u(aa);if(this[0]&&!ab){var ac=J(aa).get(0),ad=ac.parentNode||this.length>1}return this.each(function(ae){J(this).wrapAll(ab?aa.call(this,ae):ad?ac.cloneNode(true):ac)})},wrapAll:function(aa){if(this[0]){J(this[0]).before(aa=J(aa));var ab;while((ab=aa.children()).length){aa=ab.first()}J(aa).append(this)}return this},wrapInner:function(aa){var ab=u(aa);return this.each(function(ae){var ad=J(this),ac=ad.contents(),af=ab?aa.call(this,ae):aa;ac.length?ac.wrapAll(af):ad.append(af)})},unwrap:function(){this.parent().each(function(){J(this).replaceWith(J(this).children())});return this},clone:function(){return this.map(function(){return this.cloneNode(true)})},hide:function(){return this.css("display","none")},toggle:function(aa){return this.each(function(){var ab=J(this);(aa===N?ab.css("display")=="none":aa)?ab.show():ab.hide()})},prev:function(aa){return J(this.pluck("previousElementSibling")).filter(aa||"*")},next:function(aa){return J(this.pluck("nextElementSibling")).filter(aa||"*")},html:function(aa){return 0 in arguments?this.each(function(ab){var ac=this.innerHTML;J(this).empty().append(I(this,aa,ab,ac))}):(0 in this?this[0].innerHTML:null)},text:function(aa){return 0 in arguments?this.each(function(ab){var ac=I(this,aa,ab,this.textContent);this.textContent=ac==null?"":""+ac}):(0 in this?this[0].textContent:null)},attr:function(aa,ac){var ab;return(typeof aa=="string"&&!(1 in arguments))?(!this.length||this[0].nodeType!==1?N:(!(ab=this[0].getAttribute(aa))&&aa in this[0])?this[0][aa]:ab):this.each(function(ad){if(this.nodeType!==1){return}if(r(aa)){for(x in aa){c(this,x,aa[x])}}else{c(this,aa,I(this,ac,ad,this.getAttribute(aa)))}})},removeAttr:function(aa){return this.each(function(){this.nodeType===1&&aa.split(" ").forEach(function(ab){c(this,ab)},this)})},prop:function(aa,ab){aa=a[aa]||aa;return(1 in arguments)?this.each(function(ac){this[aa]=I(this,ab,ac,this[aa])}):(this[0]&&this[0][aa])},data:function(aa,ad){var ab="data-"+aa.replace(K,"-$1").toLowerCase();var ac=(1 in arguments)?this.attr(ab,ad):this.attr(ab);return ac!==null?l(ac):N},val:function(aa){return 0 in arguments?this.each(function(ab){this.value=I(this,aa,ab,this.value)}):(this[0]&&(this[0].multiple?J(this[0]).find("option").filter(function(){return this.selected}).pluck("value"):this[0].value))},offset:function(ab){if(ab){return this.each(function(ae){var ag=J(this),ac=I(this,ab,ae,ag.offset()),ad=ag.offsetParent().offset(),af={top:ac.top-ad.top,left:ac.left-ad.left};if(ag.css("position")=="static"){af.position="relative"}ag.css(af)})}if(!this.length){return null}var aa=this[0].getBoundingClientRect();return{left:aa.left+window.pageXOffset,top:aa.top+window.pageYOffset,width:Math.round(aa.width),height:Math.round(aa.height)}},css:function(aa,af){if(arguments.length<2){var ab,ac=this[0];if(!ac){return}ab=getComputedStyle(ac,"");if(typeof aa=="string"){return ac.style[d(aa)]||ab.getPropertyValue(aa)}else{if(G(aa)){var ae={};J.each(aa,function(ag,ah){ae[ah]=(ac.style[d(ah)]||ab.getPropertyValue(ah))});return ae}}}var ad="";if(Z(aa)=="string"){if(!af&&af!==0){this.each(function(){this.style.removeProperty(M(aa))})}else{ad=M(aa)+":"+h(aa,af)}}else{for(x in aa){if(!aa[x]&&aa[x]!==0){this.each(function(){this.style.removeProperty(M(x))})}else{ad+=M(x)+":"+h(x,aa[x])+";"}}}return this.each(function(){this.style.cssText+=";"+ad})},index:function(aa){return aa?this.indexOf(J(aa)[0]):this.parent().children().indexOf(this[0])},hasClass:function(aa){if(!aa){return false}return n.some.call(this,function(ab){return this.test(b(ab))},S(aa))},addClass:function(aa){if(!aa){return this}return this.each(function(ab){if(!("className" in this)){return}X=[];var ad=b(this),ac=I(this,aa,ab,ad);ac.split(/\s+/g).forEach(function(ae){if(!J(this).hasClass(ae)){X.push(ae)}},this);X.length&&b(this,ad+(ad?" ":"")+X.join(" "))})},removeClass:function(aa){return this.each(function(ab){if(!("className" in this)){return}if(aa===N){return b(this,"")}X=b(this);I(this,aa,ab,X).split(/\s+/g).forEach(function(ac){X=X.replace(S(ac)," ")});b(this,X.trim())})},toggleClass:function(ab,aa){if(!ab){return this}return this.each(function(ac){var ae=J(this),ad=I(this,ab,ac,b(this));ad.split(/\s+/g).forEach(function(af){(aa===N?!ae.hasClass(af):aa)?ae.addClass(af):ae.removeClass(af)})})},scrollTop:function(ab){if(!this.length){return}var aa="scrollTop" in this[0];if(ab===N){return aa?this[0].scrollTop:this[0].pageYOffset}return this.each(aa?function(){this.scrollTop=ab}:function(){this.scrollTo(this.scrollX,ab)})},scrollLeft:function(ab){if(!this.length){return}var aa="scrollLeft" in this[0];if(ab===N){return aa?this[0].scrollLeft:this[0].pageXOffset}return this.each(aa?function(){this.scrollLeft=ab}:function(){this.scrollTo(ab,this.scrollY)})},position:function(){if(!this.length){return}var ac=this[0],ab=this.offsetParent(),ad=this.offset(),aa=s.test(ab[0].nodeName)?{top:0,left:0}:ab.offset();ad.top-=parseFloat(J(ac).css("margin-top"))||0;ad.left-=parseFloat(J(ac).css("margin-left"))||0;aa.top+=parseFloat(J(ab[0]).css("border-top-width"))||0;aa.left+=parseFloat(J(ab[0]).css("border-left-width"))||0;return{top:ad.top-aa.top,left:ad.left-aa.left}},offsetParent:function(){return this.map(function(){var aa=this.offsetParent||i.body;while(aa&&!s.test(aa.nodeName)&&J(aa).css("position")=="static"){aa=aa.offsetParent}return aa})}};J.fn.detach=J.fn.remove;["width","height"].forEach(function(ab){var aa=ab.replace(/./,function(ac){return ac[0].toUpperCase()});J.fn[ab]=function(ad){var ae,ac=this[0];if(ad===N){return q(ac)?ac["inner"+aa]:z(ac)?ac.documentElement["scroll"+aa]:(ae=this.offset())&&ae[ab]}else{return this.each(function(af){ac=J(this);ac.css(ab,I(this,ad,af,ac[ab]()))})}}});function e(ad,ab){ab(ad);for(var ac=0,aa=ad.childNodes.length;ac<aa;ac++){e(ad.childNodes[ac],ab)}}D.forEach(function(ab,aa){var ac=aa%2;J.fn[ab]=function(){var ag,af=J.map(arguments,function(ah){ag=Z(ah);return ag=="object"||ag=="array"||ah==null?ah:f.fragment(ah)}),ae,ad=this.length>1;if(af.length<1){return this}return this.each(function(ah,aj){ae=ac?aj:aj.parentNode;aj=aa==0?aj.nextSibling:aa==1?aj.firstChild:aa==2?aj:null;var ai=J.contains(i.documentElement,ae);af.forEach(function(ak){if(ad){ak=ak.cloneNode(true)}else{if(!ae){return J(ak).remove()}}ae.insertBefore(ak,aj);if(ai){e(ak,function(al){if(al.nodeName!=null&&al.nodeName.toUpperCase()==="SCRIPT"&&(!al.type||al.type==="text/javascript")&&!al.src){window["eval"].call(window,al.innerHTML)}})}})})};J.fn[ac?ab+"To":"insert"+(aa?"Before":"After")]=function(ad){J(ad)[ab](this);return this}});f.Z.prototype=J.fn;f.uniq=R;f.deserializeValue=l;J.zepto=f;return J})();window.Zepto=Zepto;window.$===undefined&&(window.$=Zepto);(function(e){var g=1,h,t=Array.prototype.slice,a=e.isFunction,b=function(z){return typeof z=="string"},s={},y={},f="onfocusin" in window,r={focus:"focusin",blur:"focusout"},x={mouseenter:"mouseover",mouseleave:"mouseout"};y.click=y.mousedown=y.mouseup=y.mousemove="MouseEvents";function c(z){return z._zid||(z._zid=g++)}function l(A,C,B,z){C=q(C);if(C.ns){var D=w(C.ns)}return(s[c(A)]||[]).filter(function(E){return E&&(!C.e||E.e==C.e)&&(!C.ns||D.test(E.ns))&&(!B||c(E.fn)===c(B))&&(!z||E.sel==z)})}function q(z){var A=(""+z).split(".");return{e:A[0],ns:A.slice(1).sort().join(" ")}}function w(z){return new RegExp("(?:^| )"+z.replace(" "," .* ?")+"(?: |$)")}function j(z,A){return z.del&&(!f&&(z.e in r))||!!A}function v(z){return x[z]||(f&&r[z])||z}function p(B,F,E,C,A,D,H){var z=c(B),G=(s[z]||(s[z]=[]));F.split(/\s/).forEach(function(J){if(J=="ready"){return e(document).ready(E)}var I=q(J);I.fn=E;I.sel=A;if(I.e in x){E=function(M){var L=M.relatedTarget;if(!L||(L!==this&&!e.contains(this,L))){return I.fn.apply(this,arguments)}}}I.del=D;var K=D||E;I.proxy=function(M){M=n(M);if(M.isImmediatePropagationStopped()){return}M.data=C;var L=K.apply(B,M._args==h?[M]:[M].concat(M._args));if(L===false){M.preventDefault(),M.stopPropagation()}return L};I.i=G.length;G.push(I);if("addEventListener" in B){B.addEventListener(v(I.e),I.proxy,j(I,H))}})}function o(C,B,D,z,A){var E=c(C);(B||"").split(/\s/).forEach(function(F){l(C,F,D,z).forEach(function(G){delete s[E][G.i];if("removeEventListener" in C){C.removeEventListener(v(G.e),G.proxy,j(G,A))}})})}e.event={add:p,remove:o};e.proxy=function(B,A){var z=(2 in arguments)&&t.call(arguments,2);if(a(B)){var C=function(){return B.apply(A,z?z.concat(t.call(arguments)):arguments)};C._zid=c(B);return C}else{if(b(A)){if(z){z.unshift(B[A],B);return e.proxy.apply(null,z)}else{return e.proxy(B[A],B)}}else{throw new TypeError("expected function")}}};e.fn.bind=function(z,A,B){return this.on(z,A,B)};e.fn.unbind=function(z,A){return this.off(z,A)};e.fn.one=function(A,z,B,C){return this.on(A,z,B,C,1)};var u=function(){return true},d=function(){return false},i=/^([A-Z]|returnValue$|layer[XY]$)/,m={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};function n(A,z){if(z||!A.isDefaultPrevented){z||(z=A);e.each(m,function(B,D){var C=z[B];A[B]=function(){this[D]=u;return C&&C.apply(z,arguments)};A[D]=d});if(z.defaultPrevented!==h?z.defaultPrevented:"returnValue" in z?z.returnValue===false:z.getPreventDefault&&z.getPreventDefault()){A.isDefaultPrevented=u}}return A}function k(B){var A,z={originalEvent:B};for(A in B){if(!i.test(A)&&B[A]!==h){z[A]=B[A]}}return n(z,B)}e.fn.delegate=function(z,A,B){return this.on(A,z,B)};e.fn.undelegate=function(z,A,B){return this.off(A,z,B)};e.fn.live=function(z,A){e(document.body).delegate(this.selector,z,A);return this};e.fn.die=function(z,A){e(document.body).undelegate(this.selector,z,A);return this};e.fn.on=function(D,z,E,G,C){var B,A,F=this;if(D&&!b(D)){e.each(D,function(I,H){F.on(I,z,E,H,C)});return F}if(!b(z)&&!a(G)&&G!==false){G=E,E=z,z=h}if(a(E)||E===false){G=E,E=h}if(G===false){G=d}return F.each(function(I,H){if(C){B=function(J){o(H,J.type,G);return G.apply(this,arguments)}}if(z){A=function(L){var J,K=e(L.target).closest(z,H).get(0);if(K&&K!==H){J=e.extend(k(L),{currentTarget:K,liveFired:H});return(B||G).apply(K,[J].concat(t.call(arguments,1)))}}}p(H,D,G,E,z,A||B)})};e.fn.off=function(A,z,C){var B=this;if(A&&!b(A)){e.each(A,function(E,D){B.off(E,z,D)});return B}if(!b(z)&&!a(C)&&C!==false){C=z,z=h}if(C===false){C=d}return B.each(function(){o(this,A,C,z)})};e.fn.trigger=function(A,z){A=(b(A)||e.isPlainObject(A))?e.Event(A):n(A);A._args=z;return this.each(function(){if(A.type in r&&typeof this[A.type]=="function"){this[A.type]()}else{if("dispatchEvent" in this){this.dispatchEvent(A)}else{e(this).triggerHandler(A,z)}}})};e.fn.triggerHandler=function(A,z){var C,B;this.each(function(E,D){C=k(b(A)?e.Event(A):A);C._args=z;C.target=D;e.each(l(D,A.type||A),function(F,G){B=G.proxy(C);if(C.isImmediatePropagationStopped()){return false}})});return B};("focusin focusout focus blur load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error").split(" ").forEach(function(z){e.fn[z]=function(A){return(0 in arguments)?this.bind(z,A):this.trigger(z)}});e.Event=function(C,B){if(!b(C)){B=C,C=B.type}var D=document.createEvent(y[C]||"Events"),z=true;if(B){for(var A in B){(A=="bubbles")?(z=!!B[A]):(D[A]=B[A])}}D.initEvent(C,z,true);return n(D)}})(Zepto);(function($){var jsonpID=0,document=window.document,key,name,rscript=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,scriptTypeRE=/^(?:text|application)\/javascript/i,xmlTypeRE=/^(?:text|application)\/xml/i,jsonType="application/json",htmlType="text/html",blankRE=/^\s*$/,originAnchor=document.createElement("a");originAnchor.href=window.location.href;function triggerAndReturn(context,eventName,data){var event=$.Event(eventName);$(context).trigger(event,data);return !event.isDefaultPrevented()}function triggerGlobal(settings,context,eventName,data){if(settings.global){return triggerAndReturn(context||document,eventName,data)}}$.active=0;function ajaxStart(settings){if(settings.global&&$.active++===0){triggerGlobal(settings,null,"ajaxStart")}}function ajaxStop(settings){if(settings.global&&!(--$.active)){triggerGlobal(settings,null,"ajaxStop")}}function ajaxBeforeSend(xhr,settings){var context=settings.context;if(settings.beforeSend.call(context,xhr,settings)===false||triggerGlobal(settings,context,"ajaxBeforeSend",[xhr,settings])===false){return false}triggerGlobal(settings,context,"ajaxSend",[xhr,settings])}function ajaxSuccess(data,xhr,settings,deferred){var context=settings.context,status="success";settings.success.call(context,data,status,xhr);if(deferred){deferred.resolveWith(context,[data,status,xhr])}triggerGlobal(settings,context,"ajaxSuccess",[xhr,settings,data]);ajaxComplete(status,xhr,settings)}function ajaxError(error,type,xhr,settings,deferred){var context=settings.context;settings.error.call(context,xhr,type,error);if(deferred){deferred.rejectWith(context,[xhr,type,error])}triggerGlobal(settings,context,"ajaxError",[xhr,settings,error||type]);ajaxComplete(type,xhr,settings)}function ajaxComplete(status,xhr,settings){var context=settings.context;settings.complete.call(context,xhr,status);triggerGlobal(settings,context,"ajaxComplete",[xhr,settings]);ajaxStop(settings)}function empty(){}$.ajaxJSONP=function(options,deferred){if(!("type" in options)){return $.ajax(options)}var _callbackName=options.jsonpCallback,callbackName=($.isFunction(_callbackName)?_callbackName():_callbackName)||("jsonp"+(++jsonpID)),script=document.createElement("script"),originalCallback=window[callbackName],responseData,abort=function(errorType){$(script).triggerHandler("error",errorType||"abort")},xhr={abort:abort},abortTimeout;if(deferred){deferred.promise(xhr)}$(script).on("load error",function(e,errorType){clearTimeout(abortTimeout);$(script).off().remove();if(e.type=="error"||!responseData){ajaxError(null,errorType||"error",xhr,options,deferred)}else{ajaxSuccess(responseData[0],xhr,options,deferred)}window[callbackName]=originalCallback;if(responseData&&$.isFunction(originalCallback)){originalCallback(responseData[0])}originalCallback=responseData=undefined});if(ajaxBeforeSend(xhr,options)===false){abort("abort");return xhr}window[callbackName]=function(){responseData=arguments};script.src=options.url.replace(/\?(.+)=\?/,"?$1="+callbackName);document.head.appendChild(script);if(options.timeout>0){abortTimeout=setTimeout(function(){abort("timeout")},options.timeout)}return xhr};$.ajaxSettings={type:"GET",beforeSend:empty,success:empty,error:empty,complete:empty,context:null,global:true,xhr:function(){return new window.XMLHttpRequest()},accepts:{script:"text/javascript, application/javascript, application/x-javascript",json:jsonType,xml:"application/xml, text/xml",html:htmlType,text:"text/plain"},crossDomain:false,timeout:0,processData:true,cache:true};function mimeToDataType(mime){if(mime){mime=mime.split(";",2)[0]}return mime&&(mime==htmlType?"html":mime==jsonType?"json":scriptTypeRE.test(mime)?"script":xmlTypeRE.test(mime)&&"xml")||"text"}function appendQuery(url,query){if(query==""){return url}return(url+"&"+query).replace(/[&?]{1,2}/,"?")}function serializeData(options){if(options.processData&&options.data&&$.type(options.data)!="string"){options.data=$.param(options.data,options.traditional)}if(options.data&&(!options.type||options.type.toUpperCase()=="GET")){options.url=appendQuery(options.url,options.data),options.data=undefined}}$.ajax=function(options){var settings=$.extend({},options||{}),deferred=$.Deferred&&$.Deferred(),urlAnchor;for(key in $.ajaxSettings){if(settings[key]===undefined){settings[key]=$.ajaxSettings[key]}}ajaxStart(settings);if(!settings.crossDomain){urlAnchor=document.createElement("a");urlAnchor.href=settings.url;urlAnchor.href=urlAnchor.href;settings.crossDomain=(originAnchor.protocol+"//"+originAnchor.host)!==(urlAnchor.protocol+"//"+urlAnchor.host)}if(!settings.url){settings.url=window.location.toString()}serializeData(settings);var dataType=settings.dataType,hasPlaceholder=/\?.+=\?/.test(settings.url);if(hasPlaceholder){dataType="jsonp"}if(settings.cache===false||((!options||options.cache!==true)&&("script"==dataType||"jsonp"==dataType))){settings.url=appendQuery(settings.url,"_="+Date.now())}if("jsonp"==dataType){if(!hasPlaceholder){settings.url=appendQuery(settings.url,settings.jsonp?(settings.jsonp+"=?"):settings.jsonp===false?"":"callback=?")}return $.ajaxJSONP(settings,deferred)}var mime=settings.accepts[dataType],headers={},setHeader=function(name,value){headers[name.toLowerCase()]=[name,value]},protocol=/^([\w-]+:)\/\//.test(settings.url)?RegExp.$1:window.location.protocol,xhr=settings.xhr(),nativeSetHeader=xhr.setRequestHeader,abortTimeout;if(deferred){deferred.promise(xhr)}if(!settings.crossDomain){setHeader("X-Requested-With","XMLHttpRequest")}setHeader("Accept",mime||"*/*");if(mime=settings.mimeType||mime){if(mime.indexOf(",")>-1){mime=mime.split(",",2)[0]}xhr.overrideMimeType&&xhr.overrideMimeType(mime)}if(settings.contentType||(settings.contentType!==false&&settings.data&&settings.type.toUpperCase()!="GET")){setHeader("Content-Type",settings.contentType||"application/x-www-form-urlencoded")}if(settings.headers){for(name in settings.headers){setHeader(name,settings.headers[name])}}xhr.setRequestHeader=setHeader;xhr.onreadystatechange=function(){if(xhr.readyState==4){xhr.onreadystatechange=empty;clearTimeout(abortTimeout);var result,error=false;if((xhr.status>=200&&xhr.status<300)||xhr.status==304||(xhr.status==0&&protocol=="file:")){dataType=dataType||mimeToDataType(settings.mimeType||xhr.getResponseHeader("content-type"));result=xhr.responseText;try{if(dataType=="script"){(1,eval)(result)}else{if(dataType=="xml"){result=xhr.responseXML}else{if(dataType=="json"){result=blankRE.test(result)?null:$.parseJSON(result)}}}}catch(e){error=e}if(error){ajaxError(error,"parsererror",xhr,settings,deferred)}else{ajaxSuccess(result,xhr,settings,deferred)}}else{ajaxError(xhr.statusText||null,xhr.status?"error":"abort",xhr,settings,deferred)}}};if(ajaxBeforeSend(xhr,settings)===false){xhr.abort();ajaxError(null,"abort",xhr,settings,deferred);return xhr}if(settings.xhrFields){for(name in settings.xhrFields){xhr[name]=settings.xhrFields[name]}}var async="async" in settings?settings.async:true;xhr.open(settings.type,settings.url,async,settings.username,settings.password);for(name in headers){nativeSetHeader.apply(xhr,headers[name])}if(settings.timeout>0){abortTimeout=setTimeout(function(){xhr.onreadystatechange=empty;xhr.abort();ajaxError(null,"timeout",xhr,settings,deferred)},settings.timeout)}xhr.send(settings.data?settings.data:null);return xhr};function parseArguments(url,data,success,dataType){if($.isFunction(data)){dataType=success,success=data,data=undefined}if(!$.isFunction(success)){dataType=success,success=undefined}return{url:url,data:data,success:success,dataType:dataType}}$.get=function(){return $.ajax(parseArguments.apply(null,arguments))};$.post=function(){var options=parseArguments.apply(null,arguments);options.type="POST";return $.ajax(options)};$.getJSON=function(){var options=parseArguments.apply(null,arguments);options.dataType="json";return $.ajax(options)};$.fn.load=function(url,data,success){if(!this.length){return this}var self=this,parts=url.split(/\s/),selector,options=parseArguments(url,data,success),callback=options.success;if(parts.length>1){options.url=parts[0],selector=parts[1]}options.success=function(response){self.html(selector?$("<div>").html(response.replace(rscript,"")).find(selector):response);callback&&callback.apply(self,arguments)};$.ajax(options);return this};var escape=encodeURIComponent;function serialize(params,obj,traditional,scope){var type,array=$.isArray(obj),hash=$.isPlainObject(obj);$.each(obj,function(key,value){type=$.type(value);if(scope){key=traditional?scope:scope+"["+(hash||type=="object"||type=="array"?key:"")+"]"}if(!scope&&array){params.add(value.name,value.value)}else{if(type=="array"||(!traditional&&type=="object")){serialize(params,value,traditional,key)}else{params.add(key,value)}}})}$.param=function(obj,traditional){var params=[];params.add=function(key,value){if($.isFunction(value)){value=value()}if(value==null){value=""}this.push(escape(key)+"="+escape(value))};serialize(params,obj,traditional);return params.join("&").replace(/%20/g,"+")}})(Zepto);(function(a){a.fn.serializeArray=function(){var b,c,d=[],e=function(f){if(f.forEach){return f.forEach(e)}d.push({name:b,value:f})};if(this[0]){a.each(this[0].elements,function(f,g){c=g.type,b=g.name;if(b&&g.nodeName.toLowerCase()!="fieldset"&&!g.disabled&&c!="submit"&&c!="reset"&&c!="button"&&c!="file"&&((c!="radio"&&c!="checkbox")||g.checked)){e(a(g).val())}})}return d};a.fn.serialize=function(){var b=[];this.serializeArray().forEach(function(c){b.push(encodeURIComponent(c.name)+"="+encodeURIComponent(c.value))});return b.join("&")};a.fn.submit=function(c){if(0 in arguments){this.bind("submit",c)}else{if(this.length){var b=a.Event("submit");this.eq(0).trigger(b);if(!b.isDefaultPrevented()){this.get(0).submit()}}}return this}})(Zepto);(function(b){if(!("__proto__" in {})){b.extend(b.zepto,{Z:function(e,d){e=e||[];b.extend(e,b.fn);e.selector=d||"";e.__Z=true;return e},isZ:function(d){return b.type(d)==="array"&&"__Z" in d}})}try{getComputedStyle(undefined)}catch(c){var a=getComputedStyle;window.getComputedStyle=function(d){try{return a(d)}catch(f){return null}}}})(Zepto);

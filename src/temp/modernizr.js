/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-fetch-flexbox-json-sizes-srcset-supports-setclasses !*/
!function(e,n,t){function r(e,n){return typeof e===n}function s(){var e,n,t,s,i,o,a;for(var l in C)if(C.hasOwnProperty(l)){if(e=[],n=C[l],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(s=r(n.fn,"function")?n.fn():n.fn,i=0;i<e.length;i++)o=e[i],a=o.split("."),1===a.length?Modernizr[a[0]]=s:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=s),S.push((s?"":"no-")+a.join("-"))}}function i(e){var n=_.className,t=Modernizr._config.classPrefix||"";if(x&&(n=n.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(r,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),x?_.className.baseVal=n:_.className=n)}function o(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):x?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}function a(e,n){if("object"==typeof e)for(var t in e)E(e,t)&&a(t,e[t]);else{e=e.toLowerCase();var r=e.split("."),s=Modernizr[r[0]];if(2==r.length&&(s=s[r[1]]),"undefined"!=typeof s)return Modernizr;n="function"==typeof n?n():n,1==r.length?Modernizr[r[0]]=n:(!Modernizr[r[0]]||Modernizr[r[0]]instanceof Boolean||(Modernizr[r[0]]=new Boolean(Modernizr[r[0]])),Modernizr[r[0]][r[1]]=n),i([(n&&0!=n?"":"no-")+r.join("-")]),Modernizr._trigger(e,n)}return Modernizr}function l(e,n){return!!~(""+e).indexOf(n)}function f(){var e=n.body;return e||(e=o(x?"svg":"body"),e.fake=!0),e}function u(e,t,r,s){var i,a,l,u,c="modernizr",d=o("div"),p=f();if(parseInt(r,10))for(;r--;)l=o("div"),l.id=s?s[r]:c+(r+1),d.appendChild(l);return i=o("style"),i.type="text/css",i.id="s"+c,(p.fake?p:d).appendChild(i),p.appendChild(d),i.styleSheet?i.styleSheet.cssText=e:i.appendChild(n.createTextNode(e)),d.id=c,p.fake&&(p.style.background="",p.style.overflow="hidden",u=_.style.overflow,_.style.overflow="hidden",_.appendChild(p)),a=t(d,e),p.fake?(p.parentNode.removeChild(p),_.style.overflow=u,_.offsetHeight):d.parentNode.removeChild(d),!!a}function c(e){return e.replace(/([A-Z])/g,function(e,n){return"-"+n.toLowerCase()}).replace(/^ms-/,"-ms-")}function d(n,t,r){var s;if("getComputedStyle"in e){s=getComputedStyle.call(e,n,t);var i=e.console;if(null!==s)r&&(s=s.getPropertyValue(r));else if(i){var o=i.error?"error":"log";i[o].call(i,"getComputedStyle returning null, its possible modernizr test results are inaccurate")}}else s=!t&&n.currentStyle&&n.currentStyle[r];return s}function p(n,r){var s=n.length;if("CSS"in e&&"supports"in e.CSS){for(;s--;)if(e.CSS.supports(c(n[s]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var i=[];s--;)i.push("("+c(n[s])+":"+r+")");return i=i.join(" or "),u("@supports ("+i+") { #modernizr { position: absolute; } }",function(e){return"absolute"==d(e,null,"position")})}return t}function A(e){return e.replace(/([a-z])-([a-z])/g,function(e,n,t){return n+t.toUpperCase()}).replace(/^-/,"")}function h(e,n,s,i){function a(){u&&(delete N.style,delete N.modElem)}if(i=r(i,"undefined")?!1:i,!r(s,"undefined")){var f=p(e,s);if(!r(f,"undefined"))return f}for(var u,c,d,h,m,g=["modernizr","tspan","samp"];!N.style&&g.length;)u=!0,N.modElem=o(g.shift()),N.style=N.modElem.style;for(d=e.length,c=0;d>c;c++)if(h=e[c],m=N.style[h],l(h,"-")&&(h=A(h)),N.style[h]!==t){if(i||r(s,"undefined"))return a(),"pfx"==n?h:!0;try{N.style[h]=s}catch(y){}if(N.style[h]!=m)return a(),"pfx"==n?h:!0}return a(),!1}function m(e,n){return function(){return e.apply(n,arguments)}}function g(e,n,t){var s;for(var i in e)if(e[i]in n)return t===!1?e[i]:(s=n[e[i]],r(s,"function")?m(s,t||n):s);return!1}function y(e,n,t,s,i){var o=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+z.join(o+" ")+o).split(" ");return r(n,"string")||r(n,"undefined")?h(a,n,s,i):(a=(e+" "+B.join(o+" ")+o).split(" "),g(a,n,t))}function v(e,n,r){return y(e,t,t,n,r)}var C=[],w={_version:"3.6.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){C.push({name:e,fn:n,options:t})},addAsyncTest:function(e){C.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=w,Modernizr=new Modernizr;var S=[],_=n.documentElement,x="svg"===_.nodeName.toLowerCase();Modernizr.addTest("json","JSON"in e&&"parse"in JSON&&"stringify"in JSON);var b="CSS"in e&&"supports"in e.CSS,T="supportsCSS"in e;Modernizr.addTest("supports",b||T);var E;!function(){var e={}.hasOwnProperty;E=r(e,"undefined")||r(e.call,"undefined")?function(e,n){return n in e&&r(e.constructor.prototype[n],"undefined")}:function(n,t){return e.call(n,t)}}(),w._l={},w.on=function(e,n){this._l[e]||(this._l[e]=[]),this._l[e].push(n),Modernizr.hasOwnProperty(e)&&setTimeout(function(){Modernizr._trigger(e,Modernizr[e])},0)},w._trigger=function(e,n){if(this._l[e]){var t=this._l[e];setTimeout(function(){var e,r;for(e=0;e<t.length;e++)(r=t[e])(n)},0),delete this._l[e]}},Modernizr._q.push(function(){w.addTest=a}),Modernizr.addAsyncTest(function(){var e,n,t,r=o("img"),s="sizes"in r;!s&&"srcset"in r?(n="data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==",e="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",t=function(){a("sizes",2==r.width)},r.onload=t,r.onerror=t,r.setAttribute("sizes","9px"),r.srcset=e+" 1w,"+n+" 8w",r.src=e):a("sizes",s)}),Modernizr.addTest("srcset","srcset"in o("img")),Modernizr.addTest("fetch","fetch"in e);var P="Moz O ms Webkit",z=w._config.usePrefixes?P.split(" "):[];w._cssomPrefixes=z;var O={elem:o("modernizr")};Modernizr._q.push(function(){delete O.elem});var N={style:O.elem.style};Modernizr._q.unshift(function(){delete N.style});var B=w._config.usePrefixes?P.toLowerCase().split(" "):[];w._domPrefixes=B,w.testAllProps=y,w.testAllProps=v,Modernizr.addTest("flexbox",v("flexBasis","1px",!0)),s(),i(S),delete w.addTest,delete w.addAsyncTest;for(var j=0;j<Modernizr._q.length;j++)Modernizr._q[j]();e.Modernizr=Modernizr}(window,document);
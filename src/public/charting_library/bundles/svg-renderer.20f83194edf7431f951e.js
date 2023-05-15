"use strict";(self.webpackChunktradingview=self.webpackChunktradingview||[]).push([[2616],{33268:(t,e,i)=>{i.r(e),i.d(e,{svgRenderer:()=>m});var s=i(50151),r=i(98351);const o=(0,r.getLogger)("Chart.SvgParser");function n(t,e){const i=t.split(/[,\s]/).map((t=>parseFloat(t.trim())));let s=0;for(const t of i){if(!Number.isFinite(t)&&s<e)return null;s+=1}return i}const a=/([a-zA-Z]+)\((.*)\)/g;function l(t){var e;const i=null===(e=t.getAttribute("transform"))||void 0===e?void 0:e.toLowerCase();if(void 0===i)return null;const s=[];let r;a.lastIndex=0;do{if(r=a.exec(i),null!==r){const t=r[1],e=r[2];switch(t){case"matrix":const i=n(e,6);null!==i&&s.push({type:t,a:i[0],b:i[1],c:i[2],d:i[3],e:i[4],f:i[5]});break;case"rotate":const r=n(e,1);null!==r&&s.push({type:t,a:r[0],x:r[1],y:r[2]});break;case"translate":const a=n(e,1);null!==a&&s.push({type:t,x:a[0],y:a[1]});break;case"scale":const l=n(e,1);null!==l&&s.push({type:t,x:l[0],y:l[1]});break;default:o.logWarn(`Unsupported transform operation: ${t}`)}}}while(null!==r);return 0===s.length?null:s}function c(t,e){var i,s;for(const r of e)switch(r.type){case"matrix":t.transform(r.a,r.b,r.c,r.d,r.e,r.f);break;case"rotate":void 0!==r.x&&void 0!==r.y&&t.translate(r.x,r.y),t.rotate(r.a*Math.PI/180),void 0!==r.x&&void 0!==r.y&&t.translate(-r.x,-r.y);break;case"scale":t.scale(r.x,null!==(i=r.y)&&void 0!==i?i:r.x);break;case"translate":t.translate(r.x,null!==(s=r.y)&&void 0!==s?s:0)}}function h(t,e){var i;return parseFloat(null!==(i=t.getAttribute(e))&&void 0!==i?i:"")}function u(t,e){const i={},s=t.getAttribute("fill");null!==s&&(i.fillColor=s);const r=t.getAttribute("stroke");null!==r&&(i.strokeColor=r);const o=h(t,"stroke-width");Number.isFinite(o)&&(i.strokeWidth=o);const n=h(t,"opacity");Number.isFinite(n)&&(i.fillOpacity=n,i.strokeOpacity=n);const a=h(t,"stroke-opacity");Number.isFinite(a)&&(i.strokeOpacity=a);const c=h(t,"fill-opacity");if(Number.isFinite(c)&&(i.fillOpacity=c),e){const e=l(t);null!==e&&(i.transform=e)}return i}class p{constructor(t){this._transformOperations=t}apply(t,e){null!==this._transformOperations?(t.save(),c(t,this._transformOperations)):t.restore()}}class d{constructor(t,e){this._styleData={...e,...u(t,!0)}}apply(t,e){if(!this._isValid())return;const{fillColor:i,strokeColor:s,strokeWidth:r,transform:o,strokeOpacity:n,fillOpacity:a}=this._styleData,l=void 0!==o||void 0!==n||void 0!==a;l&&(t.save(),void 0!==o&&c(t,o)),this._render(t),"none"!==i&&(e.doNotApplyColors||(void 0!==a&&(t.globalAlpha=a),t.fillStyle=null!=i?i:"black"),this._fill(t)),void 0!==s&&"none"!==s&&(void 0!==r&&(t.lineWidth=r),e.doNotApplyColors||(void 0!==a&&(t.globalAlpha=a),t.strokeStyle=s),this._stroke(t)),l&&t.restore()}_fill(t){t.fill()}_stroke(t){t.stroke()}}class _ extends d{constructor(t,e){super(t,e);const i=t.getAttribute("d");this._path=null!==i?new Path2D(i):null}_fill(t){t.fill((0,s.ensureNotNull)(this._path))}_stroke(t){t.stroke((0,s.ensureNotNull)(this._path))}_render(t){}_isValid(){return null!==this._path}}class g extends d{constructor(t,e){super(t,e),this._cx=h(t,"cx"),
this._cy=h(t,"cy"),this._r=h(t,"r")}_render(t){t.beginPath(),t.arc(this._cx,this._cy,this._r,0,2*Math.PI)}_isValid(){return Number.isFinite(this._cx)&&Number.isFinite(this._cy)&&Number.isFinite(this._r)}}class y extends d{constructor(t,e){super(t,e),this._cx=h(t,"cx"),this._cy=h(t,"cy"),this._rx=h(t,"rx"),this._ry=h(t,"ry")}_render(t){t.beginPath(),t.ellipse(this._cx,this._cy,this._rx,this._ry,0,0,2*Math.PI)}_isValid(){return Number.isFinite(this._cx)&&Number.isFinite(this._cy)&&Number.isFinite(this._rx)&&Number.isFinite(this._ry)}}class f{constructor(t){this._originalViewBox=t}apply(t,e){const i=e.targetViewBox;t.translate(i.x,i.y),t.scale(i.width/this._originalViewBox.width,i.height/this._originalViewBox.height),t.beginPath(),t.rect(0,0,this._originalViewBox.width,this._originalViewBox.height),t.clip(),t.translate(-this._originalViewBox.x,-this._originalViewBox.y)}}const x=new DOMParser,b=(0,r.getLogger)("Chart.SvgParser");function v(t,e,i){var s;const r=t.children;let o,n;"g"===t.tagName&&(o=u(t,!1),n=null!==(s=l(t))&&void 0!==s?s:void 0),void 0!==n&&e.push(new p(n));for(let t=0;t<r.length;++t)v(r[t],e,o);switch(void 0!==n&&e.push(new p(null)),t.tagName){case"g":case"svg":break;case"path":e.push(new _(t,i));break;case"circle":e.push(new g(t,i));break;case"ellipse":e.push(new y(t,i));break;default:b.logWarn(`Unsupported tag name: ${t.tagName}`)}}function m(t){const e=x.parseFromString(t,"application/xml"),i=[],r=e.getElementsByTagName("svg")[0],o=(0,s.ensureNotNull)(r.getAttribute("viewBox")).split(" ").map(parseFloat),n={x:o[0],y:o[1],width:o[2],height:o[3]};return i.push(new f(n)),v(r,i),{viewBox:()=>n,render:(t,e)=>{t.save();for(const s of i)s.apply(t,e);t.restore()}}}}}]);
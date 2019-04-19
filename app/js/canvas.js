function Canvas(canvas, w, h, font) {
	var PXR = window.devicePixelRatio
  var ctx = canvas.getContext('2d')
  var methods = [
    'textAlign', 'fillStyle', 'scale', 'globalAlpha', 'setTransform', 'fill', 'stroke', 'shadowColor',
    'beginPath', 'closePath', 'strokeStyle', 'lineJoin', 'lineCap'
  ]
  canvas.setAttribute('width', w * PXR)
  canvas.setAttribute('height', h * PXR)

  for (var i = 0; i < methods.length; i++) {
    this[methods[i]] = ctx[methods[i]]
  }

  this.moveTo = function (x, y) {return ctx.moveTo(x * PXR, y * PXR)}
  this.lineTo = function (x, y) {return ctx.lineTo(x * PXR, y * PXR)}
  this.quadraticCurveTo = function (x, y, x1, y1) {return ctx.quadraticCurveTo(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.rect = function (x, y, x1, y1) {return ctx.rect(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.clearRect = function (x, y, x1, y1) {return ctx.clearRect(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.fillText = function (t, x, y) {return ctx.fillText(t, x * PXR, y * PXR)}
  this.translate = function (x, y) {return ctx.translate(x * PXR, y * PXR)}
  this.arc = function (x, y, r, sa, ea, acw) {return ctx.arc(x * PXR, y * PXR, r * PXR, sa, ea, acw)}
  this.lineWidth = function (w) {ctx.lineWidth = w * PXR}
  this.font = function (fz, fw) {ctx.font = (fw || 400) + ' ' + fz + 'px ' + font}
  this.shadowBlur = function (n) {ctx.shadowBlur = n * PXR}
}

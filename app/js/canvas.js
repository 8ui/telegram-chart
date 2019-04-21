function Canvas(canvas, w, h, font) {
	var PXR = window.devicePixelRatio
  this.d = canvas.getContext('2d')

	this.d.canvas.width = w * PXR
	this.d.canvas.height = h * PXR

  this.moveTo = function (x, y) {return this.d.moveTo(x * PXR, y * PXR)}
  this.lineTo = function (x, y) {return this.d.lineTo(x * PXR, y * PXR)}
  this.quadraticCurveTo = function (x, y, x1, y1) {return this.d.quadraticCurveTo(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.rect = function (x, y, x1, y1) {return this.d.rect(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.clearRect = function (x, y, x1, y1) {return this.d.clearRect(x * PXR, y * PXR, x1 * PXR, y1 * PXR)}
  this.fillText = function (t, x, y) {return this.d.fillText(t, x * PXR, y * PXR)}
  this.translate = function (x, y) {return this.d.translate(x * PXR, y * PXR)}
  this.arc = function (x, y, r, sa, ea, acw) {return this.d.arc(x * PXR, y * PXR, r * PXR, sa, ea, acw)}
  this.lineWidth = function (w) {this.d.lineWidth = w * PXR}
  this.font = function (fz, fw) {this.d.font = (fw || 400) + ' ' + (fz * PXR) + 'px ' + font}
  this.shadowBlur = function (n) {this.d.shadowBlur = n * PXR}

	this.resize = function(W) {
		this.d.canvas.width = W * PXR
	}
}

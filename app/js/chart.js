function Chart(el, data, species) {
	var PXR = window.devicePixelRatio
	var PADDING = 24
	var DURATION = 400
	var PREVIEW_MIN = 64
	var time = 0
	var xs,
			type,
			stacked,
			yscaled,
			series,
			nCoords
	var scaleX,
			minX,
			maxX,
			gminX,
			gmaxX,
			scaleY,
			gscaleX,
			gscaleY,
			maxY,
			gmaxY,
			gminY,
			minY,
			offset,
			step,
			oldMinX,
			oldMaxX,
			YdiffAxis
	var drawMain = true,
			drawOverlay = false,
			drawPreview = true,
			drawHeader = true,
			animOverlay = {
				opacity: createAnim(0, DURATION / 2),
				position: createAnim(0, DURATION / 2),
				arc: createAnim(0, DURATION / 2),
				side: createAnim(1, DURATION),
				text: createAnim(1, DURATION / 3)
			},
			animHeaderDates = createAnim(1, DURATION / 1.5),
			animScaleY,
			animMinY,
			animGMaxY,
			animGMinY,
			animPrevScaleY,
			animRangeY = createAnim(-1, DURATION / 2),
	    oldTextX = {delta: 1, anim: createAnim(0, DURATION)},
	    newTextX = {delta: 1, anim: createAnim(0, DURATION)},
	    oldTextY = {delta: 1, anim: createAnim(0, DURATION)},
	    newTextY = {delta: 1, anim: createAnim(0, DURATION)}
	var activeBarPos = -1,
			activeBarIndex,
			activeBarIndexOld,
			showTooltip = false
	var xRange
	var xAxisH = 54,
			textXW = 30,
			lineW = 2,
			prevLineW = 1,
			color,
			areaTopOffset = 25,
			tooltipW = 250,
			headerH = 59,
			tooltipPos,
	    countAxisX = 6,
	    countAxisY = 6,
			textXOffset = 27,
			font = 'Helvetica, Arial, sans-serif'
	var W, H, PW, PH,
			Wrapper,
			ChartWr,
			PreviewWr,
			MainCanvas,
			MainCTX,
			PreviewCanvas,
			PreviewCTX,
			OverCanvas,
			OverlayCTX,
			AxisCanvas,
			AxisCTX,
			CheckBoxes

	this.species = species.toLowerCase()
	this.setTheme = function(с) {
		color = с
		CheckBoxes && CheckBoxes()
		drawMain = drawHeader = true;
	}

	function createYMap(val) {
		return YdiffAxis.map(function(){
			if (typeof val === 'object') return Object.assign({}, val)
			return val
		})
	}

	function resize() {
		if (W !== ChartWr.offsetWidth) {
			W = ChartWr.offsetWidth
			PW = PreviewWr.offsetWidth
			MainCTX.resize(W)
			OverlayCTX.resize(W)
			AxisCTX.resize(W)
			PreviewCTX.resize(PW)
			update()
			drawMain = drawPreview = drawOverlay = drawHeader = true;
		}
	}

	this.init = function() {
		Wrapper = dom('div', el, 'chart')
		ChartWr = dom('div', Wrapper, 'chart-wrapper')

		W = ChartWr.offsetWidth, H = ChartWr.offsetHeight - headerH

		MainCanvas = dom('canvas', ChartWr, 'canvas')
		MainCTX = new Canvas(MainCanvas, W, H, font)

		OverCanvas = dom('canvas', ChartWr, 'canvas-overlay')
		OverlayCTX = new Canvas(OverCanvas, W, H, font)

		AxisCanvas = dom('canvas', ChartWr, 'axis')
		AxisCTX = new Canvas(AxisCanvas, W, xAxisH + H + headerH, font)

		// PREVIEW
		PreviewWr = dom('div', el, 'preview')
		PW = PreviewWr.offsetWidth, PH = PreviewWr.offsetHeight
		PreviewCanvas = dom('canvas', PreviewWr, 'canvas-preview')
		PreviewCTX = new Canvas(PreviewCanvas, PW, PH, font)

		move(OverCanvas, el, selectBar);
		addEvent(document, 'mousedown', unSelectActive)


		var f = formatData(data, function(n) {
			n.anim = createAnim(1, DURATION)
			return n;
		});
		series = f.series
		xs = f.xs
		type = f.type
		stacked = f.stacked
		yscaled = f.yscaled

		gminX = xs[0]
		gmaxX = xs[xs.length - 1]
		minX = gmaxX - (gmaxX - gminX) * (PREVIEW_MIN / PW)
		maxX = gmaxX
		YdiffAxis = yscaled ? Array.from(Array(series.length)) : [0]

		// Set Y axis
		animScaleY = createYMap(createAnim(-1, DURATION))
		animMinY = createYMap(createAnim(-1, DURATION))
		animGMaxY = createYMap(createAnim(-1, DURATION))
		animGMinY = createYMap(createAnim(-1, DURATION))
		animPrevScaleY = createYMap(createAnim(-1, DURATION))
		gminY = createYMap(Number.MAX_VALUE)
		minY = createYMap(Number.MAX_VALUE)

		scaleY = createYMap()
		gscaleY = createYMap()
		maxY = createYMap()
		gmaxY = createYMap()
		xRange = xs[1] - xs[0]


		previewControls()
		CheckBoxes = checkbox(el, series, onCheck)
		update();

		window.addEventListener('resize', resize)
		requestAnimationFrame(render)
	}

	function play(anim, toValue) {
		anim.startTime = time;
		anim.toValue = toValue;
		anim.fromValue = anim.value;
	}

	function normalize(w, offset) {
		var x = [], space = 0, xw, rx = [], rw = []
		for (var i = 0; i < xs.length; i++) {
			x.push(i * w + offset)
			xw = Math.round(x[i] + w)
			rx.push(Math.round(x[i] + space));
			space = Math.round(x[i] + w) - (x[i] + w)
			rw.push(xw - rx[i])
		}
		return {x: x, rx: rx, rw: rw, w: w}
	}

	function updateAnimation(anim) {
		if (anim.value === anim.toValue) return false;
		var progress = ((time - anim.startTime) - anim.delay) / anim.duration;
		if (progress < 0) progress = 0;
		if (progress > 1) progress = 1;
		var ease = -progress * (progress - 2);
		anim.value = anim.fromValue + (anim.toValue - anim.fromValue) * ease;
		return true;
	}

	function textChangeAnim(ctx, nextText, prevText, x, y, style, anim) {
		var scale = 1 * anim, sc = 0.5
		ctx.d.textAlign = style.textAlign
		ctx.d.fillStyle = style.fillStyle
		ctx.font(style.font[0], style.font[1])

		if (prevText !== nextText && prevText !== false) {
			scale = 1 - sc * anim
			ctx.d.globalAlpha = 1 - anim
			ctx.d.scale(scale, scale)
			ctx.translate(0, 1 / scale * -15 * anim);
			ctx.fillText(prevText, 1 / scale * x, 1 / scale * y);
			ctx.d.setTransform(1, 0, 0, 1, 0, 0);

			scale = sc + (1 - sc) * anim
			ctx.d.globalAlpha = anim
			ctx.d.scale(scale, scale)
			ctx.d.translate(0, 1 / scale * 15 * (1 - anim));
			ctx.fillText(nextText, 1 / scale * x, 1 / scale * y);
			ctx.d.setTransform(1, 0, 0, 1, 0, 0);
		} else {
			ctx.fillText(nextText, x, y);
		}
	}

	function drawTooltip() {
		var ctx = OverlayCTX
		var anim = animOverlay.text.value, op = animOverlay.opacity.value,
				i, side = animOverlay.side.value,
				X = animOverlay.position.value, Y, items = [[],[]], total = [0, 0],
				padY = 13, padX = 19, titleH = 33, itemH = 31, h, w = tooltipW,
				gi = activeBarIndex, old = activeBarIndexOld,
				all, itemsH = 0, isArea = type == 'area', areaPerc = [0, 0]

		if (type == 'bar') X += step / 2

		ctx.d.globalAlpha = op
		ctx.d.shadowColor = color.tooltipBoxShadow;
		ctx.shadowBlur(5);
		ctx.d.fillStyle = color.tooltipBG;

		X = X - (w * side) + (15 - 30 * side)
		Y = 30
		var indexes = [gi, old]

		if (isArea) {
			for (var ind = 0; ind < indexes.length; ind++) {
				if (indexes[ind] === undefined) continue
				for (i = 0; i < series.length; i++) {
					if (series[i].active === false) continue
					areaPerc[ind] += series[i].valumes[indexes[ind]]
				}
			}
		}
		for (var ind = 0; ind < indexes.length; ind++) {
			for (i = 0; i < series.length; i++) {
				if (series[i].active) {
					if (indexes[ind] === undefined) items[ind].push([])
					else {
						items[ind].push([
							color.tooltipText[i],
							series[i].name,
							formatNum(series[i].pts[indexes[ind]]),
							Math.round(series[i].valumes[indexes[ind]] / areaPerc[ind] * 100) + '%'
						])
					}
					if (ind === 0) itemsH += itemH
					if (indexes[ind] !== undefined) total[ind] += series[i].pts[indexes[ind]]
				}
			}
		}
		if (type == 'bar' && items[0].length > 1) {
			all = [color.color, 'All', formatNum(total[0])]
			items[0].push(all)
			items[1].push([0,0,formatNum(total[1])])
		}

		h = titleH + padY * 2 + itemsH + (all ? itemH : 0)
		roundRect(ctx, X, Y, w, h, 18, true);
		tooltipPos = {x: X, y: Y, w: w, h: h}

		ctx.d.globalAlpha = op
		textChangeAnim(ctx, formatDate(xs[gi], 'dname, dnum'), formatDate(xs[old], 'dname, dnum'), X + padX, Y + padY + 18, {
			fillStyle: color.color,
			font: [18, 600],
			textAlign: 'left'
		}, anim)
		ctx.d.globalAlpha = op
		textChangeAnim(ctx, formatDate(xs[gi], 'mnt year'), formatDate(xs[old], 'mnt year'), X + padX + 70, Y + padY + 18, {
			fillStyle: color.color,
			font: [18, 600],
			textAlign: 'left'
		}, anim)

		for (i = 0; i < items[0].length; i++) {
			var top = Y + padY + 18 + titleH + itemH * i;

			ctx.d.globalAlpha = op
			ctx.d.fillStyle = color.color;
			if (isArea) {
				textChangeAnim(ctx, items[0][i][3], items[1][i][3], X + padX + 36, top, {
					font: [18, 600],
					textAlign: 'right'
				}, anim)
				ctx.d.globalAlpha = op
			}

			ctx.d.textAlign = 'left'
			ctx.font(18)
			ctx.fillText(items[0][i][1], X + padX + (isArea ? 44 : 0), top);

			textChangeAnim(ctx, items[0][i][2], items[1][i][2], X + w - padX, top, {
				fillStyle: items[0][i][0],
				font: [18, 600],
				textAlign: 'right'
			}, anim)
		}
	}

	function roundRect(ctx, x, y, width, height, radius) {
		ctx.d.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.d.closePath();
		ctx.d.fill();
		ctx.shadowBlur(0);
	}

	function updateOverlay() {
		var w, op = animOverlay.opacity.value,
				pos = animOverlay.position.value,
				arc = animOverlay.arc.value,
				i = activeBarIndex, oldI = activeBarIndexOld
		var ctx = OverlayCTX
		ctx.clearRect(0, 0, W, H)
		if (activeBarIndex == -1) return;
		ctx.d.globalAlpha = (+(type === 'line') || 0.5) * op
		ctx.shadowBlur(0);
		switch (type) {
			case 'line':
			case 'area': {
				ctx.d.strokeStyle = color.tooltipArrow
      	ctx.lineWidth(1);
		    ctx.d.beginPath();
				ctx.moveTo(pos, 0 + (type === 'area' ? areaTopOffset : 0));
				ctx.lineTo(pos, H)
				ctx.d.stroke()
				ctx.d.closePath();
				if (type == 'line') {
					for (var s = 0; s < series.length; s++) {
						if (series[s].anim.value !== 1) continue
						var se = yscaled ? s : 0
						var y = H - (series[s].pts[i] - minY[se]) / (gmaxY[se] - gminY[se]) * H * scaleY[se]
						if (arc !== 1) {
							var oldY = (H - (series[s].pts[oldI] - minY[se]) / (gmaxY[se] - gminY[se]) * H * scaleY[se])
							var offset = (oldY - y) * (1 - arc)
							y += offset;
						}
						ctx.globalAlpha = 1 - series[s].anim.value
						ctx.d.beginPath();
						ctx.lineWidth(lineW * 2)
						ctx.d.strokeStyle = series[s].color
						ctx.d.fillStyle = color.bg
						ctx.arc(pos, y, 4, 0, 2 * Math.PI)
						ctx.d.stroke();
						ctx.d.fill();
					}
				}
				break
			}
			case 'bar': {
				w = pos
				ctx.d.fillStyle = color.bg
				ctx.rect(0, 0, w, H)
				ctx.d.fill()

				ctx.d.beginPath()
				w = W - pos - nCoords.rw[i]
				ctx.d.fillStyle = color.bg
				ctx.rect(pos + nCoords.rw[i], 0, w, H)
				ctx.d.closePath();
				ctx.d.fill()
				break
			}
			default:
		}

		if (showTooltip) drawTooltip()
	}

	function updateHeader() {
		var ctx = AxisCTX, anim = 1
		ctx.clearRect(0, 0, W, headerH)
		textChangeAnim(ctx, species, '', 24, 39, {
			fillStyle: color.color,
			font: [23, 600],
			textAlign: 'left'
		}, 1)

		var start = formatDate(minX, 'dnum month year')
		var end = formatDate(maxX, 'dnum month year')

		var oldStart = formatDate(oldMinX, 'dnum month year')
		var oldEnd = formatDate(oldMaxX, 'dnum month year')
		textChangeAnim(ctx, start + ' - ' + end, oldStart + ' - ' + oldEnd, W - 25, 40, {
			fillStyle: color.color,
			font: [19, 600],
			textAlign: 'right'
		}, anim)

		ctx.d.globalAlpha = 1
	}

	function updateMain() {
		var ctx = MainCTX
		ctx.d.globalAlpha = 1
		ctx.clearRect(0, 0, W, H)

		AxisCTX.clearRect(0, headerH, W, H)
		if (type === 'line') {
			drawAxisLines(oldTextY)
			drawAxisLines(newTextY)
		}

		switch (type) {
			case 'bar':
				drawBars('main', ctx, step, nCoords, animScaleY)
				break;
			case 'line':
      	ctx.lineWidth(lineW)
				drawLines('main', ctx, nCoords, animScaleY)
				break;
			case 'area':
				drawAreas('main', ctx, offset, PADDING, nCoords)
				break;
			default:
		}

		if (type === 'area') drawYaxis()
		else {
			drawYaxis(oldTextY);
			drawYaxis(newTextY);

			if (type !== 'line') {
				drawAxisLines(oldTextY)
				drawAxisLines(newTextY)
			}
		}

		AxisCTX.clearRect(0, H + headerH, W, xAxisH)
		var skip = oldTextX.delta > newTextX.delta;
		drawXaxis(oldTextX, !skip);
		drawXaxis(newTextX, skip);
	}

	function updatePreview() {
		var ctx = PreviewCTX, width, coords
		ctx.clearRect(0, 0, PW, PH)

		switch (type) {
			case 'bar':
				width = PW / xs.length
				coords = normalize(width, 0)
				drawBars('preview', ctx, width, coords, animPrevScaleY)
				break;
			case 'line':
				width = (xs[1] - gminX) * gscaleX
				coords = normalize(width, 0)
      	ctx.lineWidth(prevLineW)
				drawLines('preview', ctx, coords, animPrevScaleY)
				break;
			case 'area':
				width = (xs[1] - gminX) * gscaleX
				coords = normalize(width, 0)
				drawAreas('preview', ctx, 0, 0, coords)
				break;
			default:
		}
	}

	function drawBars(TYPE, ctx, barW, coords, scaleY) {
		var i, j, x, y, w, sum, barH, gBarH, gH = H, gW = W
		if (TYPE === 'preview') {
			gH = PH, gW = PW
		}
		for (i = 0; i < xs.length; i++) {
			x = [coords.x[i], coords.rx[i]]
			w = [barW, coords.rw[i]]
			sum = 0, y = 0
			if (x[0] + w[0] >= 0 && x[0] <= gW) {
				for (j = 0; j < series.length; j++) {
					sum += series[j].pts[i]
				}
				gBarH = sum / animGMaxY[0].value * gH * scaleY[0].value

				for (j = 0; j < series.length; j++) {
					ctx.d.beginPath()
					barH = ((series[j].pts[i] / sum) * gBarH * series[j].anim.value)
					ctx.d.fillStyle = series[j].color
					ctx.rect(x[1], y, w[1], barH)
					y += barH
					ctx.d.fill()
				}
	    }
		}
	}

	function drawAreas(TYPE, ctx, offset, padding, c) {
		var i, j, a, l, f, g = 0, gi, y = 0, sum = 0, gsum = 0, gH = H - areaTopOffset, gW = W
		if (TYPE === 'preview') {
			gH = PH, gW = PW
		}
		for (gi = 0; gi < series.length; gi++) {
			if(series[gi].anim.value) {
				sum = 0, gsum = 0
				ctx.d.beginPath()
				if (g === 0) {
					if (TYPE === 'preview') {
						ctx.rect(0, 0, gW, gH)
					} else {
						var x = offset > 0 ? offset : 0
						var w = (gmaxX - gminX) * scaleX - (maxX - gminX) * scaleX
						w = w > padding ? gW : gW - (padding - w) - x
						ctx.rect(x, 0, w, gH)
					}
				} else {
					for (i = 0; i < xs.length; i++) {
						if (c.x[i] + c.w >= 0 && c.x[i] <= gW + padding) {
							a = series[gi].anim.value;
							for (j = 0; j < series.length; j++) {
								gsum += series[j].pts[i] * series[j].anim.value
							}
							for (j = 0; j < series.length; j++) {
								if (gi > j) {
									sum += (series[j].pts[i] / gsum) * series[j].anim.value
								}
							}
							if (a < 1) {
								y = sum * gH + ((gH - sum * gH) * (1 - a));
							} else y = sum * gH * a
							ctx.lineTo(c.x[i], y)
							sum = 0
							gsum = 0;
							if (l === undefined) f = i
							l = i
						}
					}
					ctx.lineTo(c.x[l], gH)
					ctx.lineTo(c.x[f], gH)
				}
				ctx.d.fillStyle = series[gi].color
				ctx.d.fill()

				g++;
			}
		}
	}

	function drawLines(TYPE, ctx, c, scaleY) {
		var i, j, y = 0, gH = H, gW = W, anI
		if (TYPE === 'preview') gH = PH, gW = PW
		for (i = 0; i < series.length; i++) {
			anI = yscaled ? i : 0;
			ctx.d.globalAlpha = series[i].anim.value;
			ctx.d.strokeStyle = series[i].color
	    ctx.d.beginPath();
			ctx.d.lineJoin = 'bevel';
			ctx.d.lineCap = 'butt';
			for (j = 0; j < xs.length; j++) {
				if (c.x[j] + c.w >= -20 && c.x[j] - 20 <= gW) {
					y = TYPE == 'preview'
						? series[i].pts[j] / animGMaxY[anI].value * gH
						: (series[i].pts[j] - animMinY[anI].value)
							/ (animGMaxY[anI].value - animGMinY[anI].value)
							* gH * scaleY[anI].value
					ctx.lineTo(c.x[j], y)
				}
	    }
			ctx.d.stroke()
		}
	}

	function drawYaxis(textY) {
		var ctx = AxisCTX

		ctx.font(16);
		ctx.textAlign = 'left';
		if (type === 'area') {
			ctx.d.strokeStyle = color.grid;
			ctx.lineWidth(1);
			for (var i = 0; i < 5; i++) {
				var n = i * (1 / 4)
				var y = (H - 25) - n * (H - 25) + headerH + 25
				ctx.d.beginPath();
				ctx.moveTo(PADDING, y)
				ctx.lineTo(W - PADDING, y)
				ctx.d.fillStyle = color.axisText;
				ctx.fillText(n * 100 + '%', PADDING, y - 6);
				ctx.d.stroke()
			}
		} else {
			if (textY.anim.value > 0) {
				ctx.d.globalAlpha = textY.anim.value;

				for (var i = 0; i < countAxisY; i++) {
					var value = textY.delta * i
					var y = H - value / animRangeY.value * H + headerH - 6
					ctx.d.fillStyle = color.axisText
					if (y > headerH + 16) {
						if (!yscaled || yscaled && series[0].active) {
							// if (ctx.d.globalAlpha === 1) {
							// 	ctx.d.globalAlpha = yscaled ? series[0].anim.value : 1;
							// }
							ctx.d.textAlign = 'left';
							if (yscaled) ctx.d.fillStyle = series[0].color
							ctx.fillText(shortNum(value + minY[0]), PADDING, y);
						}

						if (yscaled && series[1].active) {
							// if (ctx.d.globalAlpha === 1) {
							// 	ctx.d.globalAlpha = series[1].anim.value;
							// }
							var text = series[0].active
								? (value / (maxY[0] - minY[0])) * (maxY[1] - minY[1])
								: textY.delta * i
							ctx.d.textAlign = 'right';
							ctx.d.fillStyle = series[1].color
							ctx.fillText(shortNum(text + minY[1]), W - PADDING, y);
						}
					}
				}
			}
		}
	}

	function drawAxisLines(textY) {
		var ctx = AxisCTX
		if (textY.anim.value > 0) {
			ctx.d.globalAlpha = textY.anim.value;
			ctx.d.strokeStyle = color.grid;
			ctx.lineWidth(1);

			for (var i = 0; i < countAxisY; i++) {
				var value = textY.delta * (i + 1);
				var y = H - value / animRangeY.value * H + headerH;
				// i === -1 && console.log(value / animRangeY.value * H);
				if (y > headerH) {
					ctx.d.beginPath();
					ctx.moveTo(PADDING, y);
					ctx.lineTo(W - PADDING, y);
					ctx.d.stroke();
				}
			}
		}
	}

	function drawXaxis(textX, skip) {
		var ctx = AxisCTX;
		var i, x

    if (textX.anim.value > 0) {
      ctx.d.globalAlpha = textX.anim.value;
			ctx.d.fillStyle = color.axisTextX || color.axisText
			ctx.d.textAlign = 'left'

      var delta = textX.delta;
      if (skip) delta *= 2;

			var startI = 0;
			var endI = xs.length
			if (skip) endI -= textX.delta;

			for (var i = endI - 1; i >= startI; i -= delta) {
				if (nCoords.x[i] >= -100 && nCoords.x[i] - 100 <= W){
					var value = xs[i];
					var x = nCoords.x[i]
					var offsetX = 0;
					if (i === xs.length - 1) {
						offsetX = -textXW;
					} else if (i > 1) {
						offsetX = -(textXW / 2);
					}
					ctx.fillText(formatDate(value, 'dnum mnt'), x + offsetX, H + headerH + textXOffset);
				}
			}
    }
	}

	function render(t) {
		time = t;

		for (var i = 0; i < YdiffAxis.length; i++) {
			if (updateAnimation(animScaleY[i])) drawMain = true;
			if (updateAnimation(animPrevScaleY[i])) drawPreview = true;
			if (updateAnimation(animMinY[i])) drawMain = true;
			if (updateAnimation(animGMaxY[i])) drawMain = drawPreview = true;
			if (updateAnimation(animGMinY[i])) drawMain = drawPreview = true;
		}
		if (updateAnimation(animOverlay.opacity)) drawOverlay = true
		if (updateAnimation(animOverlay.position)) drawOverlay = true
		if (updateAnimation(animOverlay.arc)) drawOverlay = true
		if (updateAnimation(animOverlay.side)) drawOverlay = true
		if (updateAnimation(animOverlay.text)) drawOverlay = true
		if (updateAnimation(animHeaderDates)) drawHeader = true

		if (updateAnimation(animRangeY)) drawMain = true;
		if (updateAnimation(oldTextY.anim)) drawMain = true;
		if (updateAnimation(newTextY.anim)) drawMain = true;
		if (updateAnimation(oldTextX.anim)) drawMain = true;
		if (updateAnimation(newTextX.anim)) drawMain = true;

		for (var i = 0; i < series.length; i++) {
			if (updateAnimation(series[i].anim)) {
				drawMain = true;
				drawPreview = true;
			}
		}

    if (drawPreview) {
    	drawPreview = false;
    	updatePreview()
    }
    if (drawMain) {
      drawMain = false;
			updateMain()
    }
    if (drawOverlay) {
      drawOverlay = false;
			updateOverlay()
    }
    if (drawHeader) {
      drawHeader = false;
			updateHeader()
    }

		requestAnimationFrame(render)
	}

	function update() {
		for (var a = 0; a < YdiffAxis.length; a++) {
			if (yscaled && !series[a].active) continue
			var WIDTH = W - PADDING * 2;
			var sum = []

			maxY[a] = 0
			gmaxY[a] = 0
			gscaleX = WIDTH / (gmaxX - gminX)
			scaleX = WIDTH / (maxX - minX)
			gminY[a] = Number.MAX_VALUE, minY[a] = Number.MAX_VALUE

			if (stacked) {
				for (var i = 0; i < series.length; i++) {
					if (series[i].active) {
						for (var j = 0; j < series[i].pts.length; j++) {
							sum[j] = sum[j] || 0;
							sum[j] += series[i].pts[j];
						}
					}
				}
			}

			for (var i = 0; i < series.length; i++) {
				if (yscaled && i !== a || !series[i].active) continue
				if (!stacked) sum = series[i].pts
				for (var j = 0; j < xs.length; j++) {
					if (minX <= xs[j] && xs[j] <= maxX) {
						maxY[a] = Math.max(maxY[a], sum[j]);
						minY[a] = type === 'bar' ? 0 : Math.min(minY[a], sum[j]);
					}
					gmaxY[a] = Math.max(gmaxY[a], sum[j]);
					gminY[a] = type === 'bar' ? 0 : Math.min(gminY[a], sum[j]);
				}
			}

			if (type == 'line') scaleY[a] = H / ((maxY[a] - minY[a]) / (gmaxY[a] - gminY[a]) * H)
			else scaleY[a] = H / (maxY[a] / gmaxY[a] * H)

			if (type == 'bar') step = (gmaxX - gminX) * scaleX / xs.length
			else step = (xs[1] - gminX) * scaleX

			gscaleY[a] = PH / ((maxY[a] - minY[a]) / (gmaxY[a] - gminY[a]) * PH)

			if (yscaled && !series[a].active) continue

			// SCALEY
			if (animScaleY[a].toValue === -1) {
				animScaleY[a].value = animScaleY[a].toValue = scaleY[a]
				animPrevScaleY[a].value = animPrevScaleY[a].toValue = 1
			}
			else if (animScaleY[a].toValue !== scaleY[a]) play(animScaleY[a], scaleY[a])

			// MINY
			if (animMinY[a].toValue === -1) {
				animMinY[a].value = animMinY[a].toValue = minY[a]
			}
			else if (animMinY[a].toValue !== minY[a]) play(animMinY[a], minY[a])

			// GMAX
			if (animGMaxY[a].toValue === -1) {
				animGMaxY[a].value = animGMaxY[a].toValue = gmaxY[a]
			}
			else if (animGMaxY[a].toValue !== gmaxY[a]) play(animGMaxY[a], gmaxY[a])

			// GMINY
			if (animGMinY[a].toValue === -1) {
				animGMinY[a].value = animGMinY[a].toValue = gminY[a]
			}
			else if (animGMinY[a].toValue !== gminY[a]) play(animGMinY[a], gminY[a])
		}

		offset = (gminX - minX) * scaleX + PADDING
		nCoords = normalize(step, offset)

		// RANGE Y
		var i = yscaled ? (series[0].active ? 0 : 1) : 0
		if (animRangeY.toValue !== maxY[i] - minY[i]) {
			var changeYscaledSeries = yscaled && series[0].anim.toValue !== series[0].anim.value
			if (changeYscaledSeries) {
				animRangeY.value = maxY[i] - minY[i]
			}
			play(animRangeY, maxY[i] - minY[i])

			oldTextY.delta = newTextY.delta;
			oldTextY.anim.value = newTextY.anim.value;
			!changeYscaledSeries && play(oldTextY.anim, 0);

			newTextY.delta = Math.floor(animRangeY.toValue / countAxisX);
			newTextY.anim.value = 1 - oldTextY.anim.value;
			!changeYscaledSeries && play(newTextY.anim, 1);
		}

		// RANGE X
		var delta = (maxX - minX) / xRange / countAxisX;

		var pow = 1;
		while (pow <= delta) pow *= 2;
		delta = pow;

		if (delta < newTextX.delta) {
			oldTextX.delta = newTextX.delta;
			oldTextX.anim.value = 1;
			play(oldTextX.anim, 1);

			newTextX.delta = delta;
			newTextX.anim.value = 0;
			play(newTextX.anim, 1);
		} else if (delta > newTextX.delta) {
			oldTextX.delta = newTextX.delta;
			oldTextX.anim.value = newTextX.anim.value;
			play(oldTextX.anim, 0);

			newTextX.delta = delta;
			newTextX.anim.value = 1;
			play(newTextX.anim, 1);
		}
	}

	function onCheck(el, i) {
		series[i].active = !series[i].active
		play(series[i].anim, +series[i].active);
		update();
	}

	function previewUpdate(e) {
		showTooltip && unSelectActive(e)
		update();
		drawMain = drawHeader = true;
	}

	function getActiveBar() {
		var w = step * xs.length + PADDING * 2
		var i = Math.floor((w - (w + offset - activeBarPos)) / step);
		i = i + +(type == 'line')
		return i < 0 ? 0 : i + 1 > xs.length ? xs.length - 1 : i
	}

	function openDetailed(e, X, Y) {
		if (['touchstart', 'mousedown'].indexOf(e.type) > -1) {
	    var touch = e.touches ? e.touches[0] : e;
			if (
				tooltipPos.x < X && tooltipPos.x + tooltipPos.w > X &&
				tooltipPos.y < Y && tooltipPos.y + tooltipPos.h > Y
			) {
				// alert('Попал!')
				e.preventDefault()
				e.stopPropagation()
			}
			return false
		}
		return false
	}

	function selectBar(e) {
    var touch = e.touches ? e.touches[0] : e;
		var Y = touch.pageY - e.target.getBoundingClientRect().top
		activeBarPos = touch.pageX - e.target.getBoundingClientRect().left

		if (activeBarPos < 0 || e.target !== OverCanvas) return
		if (tooltipPos && openDetailed(e, activeBarPos, Y)) return
		var index = getActiveBar()
		if (index !== activeBarIndex) {
			activeBarIndexOld = activeBarIndex
			activeBarIndex = index
			var pos = nCoords.rx[activeBarIndex]
			animOverlay.opacity.value !== 1 && play(animOverlay.opacity, 1);
			if (activeBarIndexOld === undefined) {
				animOverlay.arc = createAnim(1, DURATION / 2)
				animOverlay.position = createAnim(pos, DURATION / 2)
			} else {
				play(animOverlay.position, pos)
				animOverlay.arc.value = 0
				play(animOverlay.arc, 1)
				animOverlay.text.value = 0
				play(animOverlay.text, 1)
			}
			var side = animOverlay.side.value
			if (side == 0) {
				side = (W - pos - 20) < tooltipW ? 1 : 0
			} else {
				side = pos - 20 > tooltipW ? 1 : 0
			}
			play(animOverlay.side, side)

			showTooltip = true
		}
	}

	function unSelectActive(e) {
		if (activeBarIndex >= 0 && OverCanvas !== e.target) {
			tooltipPos = undefined
			activeBarIndexOld = undefined
			play(animOverlay.opacity, 0);
			showTooltip = false
		}
	}

	function previewControls() {
	  var control = dom('div', PreviewWr, 'control')

	  var previewOvL = dom('div', control, 'overlay')
	  var previewCtrl = dom('div', control, 'visible')
	  var previewCtrlL = dom('div', previewCtrl, 'left')
	  var previewCtrlR = dom('div', previewCtrl, 'right')
	  var previewOvR = dom('div', control, 'overlay')

	  var updateSize = function() {
		  var L = (minX - gminX) / (gmaxX - gminX) + (15 / PW);
		  var R = (maxX - gminX) / (gmaxX - gminX) - (15 / PW);
		  previewOvL.style.width = (L * 100) + '%'
		  previewOvR.style.width = (100 - R * 100) + '%'
	  }

	  updateSize();

	  move(previewCtrl, el, function(e, delta, old) {
	    delta = delta / gscaleX;
	    delta = Math.max(delta, gminX - old.minX);
	    delta = Math.min(delta, gmaxX - old.maxX);
	    minX = old.minX + delta;
	    maxX = old.maxX + delta;
	    previewUpdate(e);
	    updateSize()
	  });
		var LEFT = [previewCtrlL, previewOvL]
	  for (var i = 0; i < 2; i++) {
			move(LEFT[i], el, function(e, delta, old) {
		    delta = delta / gscaleX;
		    minX = Math.max(gminX, old.minX + delta);
		    minX = Math.min(minX, maxX - PREVIEW_MIN / gscaleX);
		    previewUpdate(e);
		    updateSize()
		  });
	  }
		var RIGHT = [previewCtrlR, previewOvR]
	  for (var i = 0; i < 2; i++) {
		  move(RIGHT[i], el, function(e, delta, old) {
		    delta = delta / gscaleX;
		    maxX = Math.max(minX + PREVIEW_MIN / gscaleX, old.maxX + delta);
		    maxX = Math.min(maxX, gmaxX);
		    previewUpdate(e);
		    updateSize()
		  });
	  }
	}

	function move(el, wrapper, handler) {
	  var startX, drag, prevY

	  function onDragStart(e) {
	    if (e.target === el) {
	      var touch = e.touches ? e.touches[0] : e;
	      startX = touch.pageX;
	      oldMinX = minX;
	      oldMaxX = maxX;
	      drag = e.type == 'mousedown';

	      document.addEventListener(e.touches ? 'touchmove' : 'mousemove', onDrag, false);
	      document.addEventListener(e.touches ? 'touchend' : 'mouseup', onDragEnd, false);
	      onDrag(e);

	      if (e.cancelable) {
	        e.preventDefault && e.preventDefault();
	        e.stopPropagation && e.stopPropagation();
	        return false;
	      }
	    }
	  }

	  function onDrag(e) {
	    var touch = e.touches ? e.touches[0] : e;
	    handler(e, touch.pageX - startX, { minX: oldMinX, maxX: oldMaxX }, drag);
	  }

	  function onDragEnd() {
      document.removeEventListener('touchmove', onDrag, false);
      document.removeEventListener('mousemove', onDrag, false);
			document.removeEventListener('touchend', onDragEnd, false);
      document.removeEventListener('mouseup', onDragEnd, false);
	  }

    wrapper.addEventListener('touchstart', onDragStart.bind(this), false);
    wrapper.addEventListener('mousedown', onDragStart.bind(this), false);
	}

	function checkbox(el, data, callback) {
	  if (data.length === 1) return;
	  var checkboxes = [];
	  var legend = dom('div', el, 'legend'),
	      isTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
	  function onCheck(ch, i) {
	    if (ch.classList.contains('checked')) {
	      if (legend.getElementsByClassName('checked').length === 1) return false
	    }
			toggleClass(ch, 'checked')
	    callback(ch, i)
	  }

	  function handlers(ch, i) {
	    var index = i, el = ch;
	    addEvent(ch, 'click', function(e) {
	      onCheck(el, index)
	    })
	    var mouseDown = isTouch ? 'touchstart' : 'mousedown'
	    var mouseUp = isTouch ? 'touchend' : 'mouseup';
			function longTap() {
				for (var i = 0; i < data.length; i++) {
					if (index !== i && checkboxes[i].classList.contains('checked')) {
						onCheck(checkboxes[i], i)
					}
				}
			}
	    addEvent(ch, mouseDown, function() {
	      if (ch.classList.contains('checked')) {
	        timer = setTimeout(longTap, delay)
	      }
	    })
	    addEvent(ch, mouseUp, function(e) {
	      if (timer) {
	        clearTimeout(timer)
	      }
	    })
	  }

	  for (var i = 0; i < data.length; i++) {
	    var ch = dom('div', legend, 'checkbox checked'),
	        delay = 800, timer;
	    checkboxes.push(ch)
	    handlers(ch, i)
	    ch.style.color = color.button[i]
	    dom('i', ch)
	    var text = dom('span', ch)
	    text.innerText = data[i].name
	  }

		return function() {
			for (var i = 0; i < data.length; i++) {
				legend.children[i].style.color = color.button[i]
			}
		}
	}
}

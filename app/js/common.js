function formatDate(date, format) {
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  format = format || 'dname, dnum mnt year'
  date = new Date(date);

  var month = date.getMonth();
  var data = {
    dname: WEEKDAYS[date.getDay()],
    dnum: date.getDate(),
    mnt: MONTHS_SHORT[month],
    month: MONTHS_LONG[month],
    year: date.getFullYear()
  };
  Object.keys(data).forEach(function(k) {
    format = format.replace(k, data[k])
  })
  return format;
}

function formatNum(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function shortNum(n) {
  if (n >= 1000000) {
    return Math.floor(n / 100000) / 10 + 'M';
  }
  if (n >= 1000) {
    return Math.floor(n / 100) / 10 + 'K';
  }
  return n;
}

function formatData(data, map) {
  var series = [], k, j, i, pts, xs, type, sum = 0
  var yscaled = data.y_scaled
  var stacked = data.stacked
  for (k in data.types) {
    for (j = 0; j < data.columns.length; j++) {
      if (data.columns[j][0] == k) {
        pts = data.columns[j].slice(1);
      }
    }
    switch (data.types[k]) {
      case 'x':
        xs = pts;
        break;
      case 'line':
      case 'bar':
      case 'area':
        series.push({
          active: true,
          pts: pts,
          name: data.names[k],
          color: data.colors[k],
          valumes: [],
        });
        type = data.types[k]
        break;
    }
  }
  if (type === 'area') {
    for (k = 0; k < series.length; k++) {
      for (j = 0; j < xs.length; j++) {
        for (i = 0; i < series.length; i++) {
          sum += series[i].pts[j]
        }
        series[k].valumes.push(series[k].pts[j] / sum)
        sum = 0
      }
    }
  }
  if (map) series = series.map(map)
  return {series: series, xs: xs, type: type, stacked: stacked, yscaled: yscaled};
}

function createAnim(value, duration) {
	return {
    value: value,
    fromValue: value,
    toValue: value,
    delay: 0,
    duration: duration,
    startTime: 0,
	}
}

function dom(tag, parent, attrs) {
  attrs = typeof attrs === 'string' ? { className: attrs } : (attrs || {});
  var el = document.createElement(tag)
  if (attrs) {
    Object.keys(attrs).forEach(function(i) {
      el.setAttribute(i === 'className' ? 'class' : i, attrs[i])
    })
  }
  parent.appendChild(el)
  return el;
}

function addEvent(el, ev, func) {
  el.addEventListener(ev, func, false);
}

function removeEvent(el, ev, func) {
  el.removeEventListener(ev, func);
}

function toggleClass(el, className) {
  el.classList.toggle(className);
}

function addClass(el, className) {
  className.split(' ').forEach(function(cl) {
    el.classList.add(cl);
  })
}

function removeClass(el, className) {
  className.split(' ').forEach(function(cl) {
    el.classList.remove(cl);
  })
}

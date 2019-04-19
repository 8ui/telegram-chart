var pxration = dom('div', document.body)
pxration.innerText = window.devicePixelRatio
pxration.style.textAlign = 'center'
pxration.style.padding = '10px 0'

var TITLES = [
  'Followers', 'Interactions', 'Messages', 'Growth', 'Apps'
]

var THEME = 'theme_night'
var charts = []
var SwitchLink;

var THEMES = {
  theme_day: {
    bg: '#fff',
    color: '#000',
    tooltipBG: '#fff',
    tooltipBoxShadow: 'rgba(0, 0, 0, 0.2)',
    grid: 'rgba(24, 45, 59, 0.1)',
    zoomOut: '#108BE3',
    tooltipArrow: '#D2D5D7',
    followers: {
      axisText: '#8E8E93',
      tooltipText: ['#3CC23F', '#F34C44'],
      button: ['#5FB641', '#E65850']
    },
    interactions: {
      axisText: '#8E8E93',
      tooltipText: ['#108BE3', '#E4AE1B'],
      button: ['#3497ED', '#F5BD25']
    },
    growth: {
      axisText: 'rgba(37, 37, 41, 0.5)',
      tooltipText: ['#64ADED'],
      DtooltipText: ['#3896E8', '#558DED', '#5CBCDF'],
      Dbutton: ['#3896E8', '#558DED', '#5CBCDF'],
    },
    messages: {
      axisText: 'rgba(37, 37, 41, 0.5)',
      tooltipText: ['#108BE3', '#2373DB', '#89C32E', '#4BAB29', '#EAAF10', '#F58608', '#F34C44', '#269ED4'],
      button: ['#3497ED', '#3381E8', '#9ED448', '#5FB641', '#F5BD25', '#F79E39', '#E65850', '#35AADC'],
    },
    apps: {
      axisText: 'rgba(37, 37, 41, 0.5)',
      tooltipText: ['#108BE3', '#2373DB', '#89C32E', '#4BAB29', '#EAAF10', '#F58608', '#F34C44', '#269ED4'],
      button: ['#3497ED', '#3381E8', '#9ED448', '#5FB641', '#F5BD25', '#F79E39', '#E65850', '#35AADC'],
    }
  },
  theme_night: {
    bg: '#242f3e',
    color: '#fff',
    tooltipBG: '#1c2533',
    tooltipBoxShadow: 'transparent',
    grid: 'rgba(255, 255, 255, 0.1)',
    zoomOut: '#48AAF0',
    tooltipArrow: '#D2D5D7',
    followers: {
      axisText: 'rgba(163, 177, 194, 0.6)',
      tooltipText: ['#4BD964', '#F7655E'],
      button: ['#5AB34D', '#CF5D57']
    },
    interactions: {
      axisText: 'rgba(163, 177, 194, 0.6)',
      tooltipText: ['#108BE3', '#DEB93F'],
      button: ['#4681BB', '#C9AF4F']
    },
    growth: {
      axisText: 'rgba(236, 242, 248, 0.5)',
      tooltipText: ['#64ADED'],
      DtooltipText: ['#4082CE', '#4461AB', '#4697B3'],
      Dbutton: ['#4082CE', '#4461AB', '#4697B3'],
    },
    messages: {
      axisText: 'rgba(236, 242, 248, 0.5)',
      axisTextX: 'rgba(163, 177, 194, 0.6)',
      tooltipText: ['#5199DF', '#3E65CF', '#99CF60', '#3CB560', '#DBB630', '#EE9D39', '#F7655E', '#43ADDE'],
      button: ['#4681BB', '#466FB3', '#88BA52', '#3DA05A', '#F5BD25', '#D49548', '#CF5D57', '#479FC4'],
    },
    apps: {
      axisText: 'rgba(236, 242, 248, 0.5)',
      axisTextX: 'rgba(163, 177, 194, 0.6)',
      tooltipText: ['#5199DF', '#3E65CF', '#99CF60', '#3CB560', '#DBB630', '#EE9D39', '#F7655E', '#43ADDE'],
      button: ['#4681BB', '#466FB3', '#88BA52', '#3DA05A', '#F5BD25', '#D49548', '#CF5D57', '#479FC4']
    }
  }
}

function changeTheme() {
  if (THEME === 'theme_day') {
    SwitchLink.innerText = 'Switch to Day Mode'
    removeClass(document.body, 'theme_day')
  }
  else {
    SwitchLink.innerText = 'Switch to Night Mode'
    removeClass(document.body, 'theme_night')
  }
  THEME = THEME === 'theme_day' ? 'theme_night' : 'theme_day'
  for (var i = 0; i < charts.length; i++) {
    var species = THEMES[THEME][charts[i].species]
    charts[i].setTheme(Object.assign({}, THEMES[THEME], species))
  }
  addClass(document.body, THEME)
}

var el = document.getElementById('charts');


function init(data) {
  for (var i = 0; i < data.length; i++) {
    var type = TITLES[i];
    var wrapper = dom('div', el, 'chart-view chart-' + type.toLowerCase());
    var chart = new Chart(wrapper, data[i], type);
    chart.setTheme(Object.assign({}, THEMES.theme_night, THEMES.theme_night[type.toLowerCase()]));
    chart.init();
    charts.push(chart);
  }

  var Switch = dom('div', el, 'switch-theme')
  SwitchLink = dom('a', Switch)
  SwitchLink.innerText = 'Switch to Night Mode'
  addEvent(SwitchLink, 'click', changeTheme)
  addClass(document.body, THEME)
}

init(DATA)

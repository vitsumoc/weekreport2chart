import '../scss/app.scss'

import * as wordcloud from 'wordcloud'

import * as echarts from 'echarts';

import { option } from './chartOption.js'

import { data } from './data.js'

// 表格初始化
var myChart = echarts.init(document.getElementById('chart_div'))
myChart.setOption(option)

// 配置项
let settings = {
  _disWord: [], // 固定禁词表
  minFreq: 1, // 最小频率 1
  _minFreqWord: [], // 通过设置最小频率统计的禁词表
  _manualDisWords: [], // 手动屏蔽的词汇列表
}

// 初始绘制
refresh()

function refresh() {
  // 绘制词云
  wordcloud(document.getElementById('wordcloud_div'), {
    list: _data2wc(data),
    minSize: 12,
  })
  // 绘制时序图
  myChart.setOption(_data2op(data))
  // 绘制屏蔽按钮列表
  drawManual(data)
}

// 数据转词云
function _data2wc(data) {
  let result = []
  let dates = Object.keys(data)
  for (let x = 0; x < dates.length; x++) {
    let date = dates[x]
    let wordMap = data[date]
    let words = Object.keys(wordMap)
    for (let y = 0; y < words.length; y++) {
      let word = words[y]
      if (!_wordOk(word)) {
        continue
      }
      let count = wordMap[word]
      let _getIt = false
      for (let z = 0; z < result.length; z++) {
        if (result[z][0] == word) {
          result[z][1] += count
          _getIt = true
          break
        }
      }
      if (!_getIt) {
        result.push([word, count])
      }
    }
  }
  return result
}

// 数据转时序图
function _data2op(data) {
  // 统计时序是需要将词汇出现的数字累加 词汇 <-> 出现次数
  let _data = {}
  let op = {
    legend: {
      data: []
    },
    series: [{
      data: []
    }]
  }
  let dates = Object.keys(data)
  for (let x = 0; x < dates.length; x++) {
    let date = dates[x]
    let wordMap = data[date]
    let words = Object.keys(wordMap)
    for (let y = 0; y < words.length; y++) {
      let word = words[y]
      if (!_wordOk(word)) {
        continue
      }
      let count = wordMap[word]
      // 之前未出现，本次出现的word 新增
      if (!_data[word]) {
        _data[word] = 0
      }
      // 之前出现，本次出现的word 增加技术
      _data[word] += count
      op.series[0].data.push([date, _data[word], word])
    }
    // 之前出现，本此未出现的word保持其频次
    let _dataWords = Object.keys(_data)
    for (let y = 0; y < _dataWords.length; y++) {
      let _dataWord = _dataWords[y]
      if (words.indexOf(_dataWord) == -1) {
        op.series[0].data.push([date, _data[_dataWord], _dataWord])
      }
    }
  }
  op.legend.data = Object.keys(_data)
  return op
}

// 绘制屏蔽按钮列表
function drawManual() {
  let _words = []
  let div = document.getElementById("manualBtns")
  div.innerHTML = ""
  let dates = Object.keys(data)
  for (let x = 0; x < dates.length; x++) {
    let date = dates[x]
    let wordMap = data[date]
    let words = Object.keys(wordMap)
    for (let y = 0; y < words.length; y++) {
      let word = words[y]
      // 去重
      if (_words.indexOf(word) > -1) {
        continue
      }
      _words.push(word)
      // 固定禁词
      if (settings._disWord.indexOf(word) > -1) {
        continue
      }
      // 按频率过滤
      if (settings._minFreqWord.indexOf(word) > -1) {
        continue
      }
      // 按标记绘制
      let btn = document.createElement("button")
      btn.setAttribute("onclick", "manualClick('" + word + "')")
      btn.setAttribute("type", "button")
      if (settings._manualDisWords.indexOf(word) > -1) {
        btn.setAttribute("class", "btn btn-outline-secondary btn-sm")
      } else {
        btn.setAttribute("class", "btn btn-outline-primary btn-sm")
      }
      btn.innerText = word
      div.appendChild(btn)
    }
  }
}

// 手动屏蔽词汇的操作
window.manualClick = function(word) {
  if (settings._manualDisWords.indexOf(word) > -1) {
    settings._manualDisWords.splice(settings._manualDisWords.indexOf(word), 1)
  } else {
    settings._manualDisWords.push(word)
  }
  refresh()
}

// 判断这个词汇是否已经被过滤
function _wordOk(word) {
  if (settings._disWord.indexOf(word) > -1) {
    return false
  }
  if (settings._minFreqWord.indexOf(word) > -1) {
    return false
  }
  if (settings._manualDisWords.indexOf(word) > -1) {
    return false
  }
  return true
}

// 设置最低频率的方法
document.getElementById("btn_minFreq").onclick = function(e) {
  settings._minFreqWord = []
  settings.minFreq = parseInt(document.getElementById("minFreq").value)
  let result = []
  let dates = Object.keys(data)
  for (let x = 0; x < dates.length; x++) {
    let date = dates[x]
    let wordMap = data[date]
    let words = Object.keys(wordMap)
    for (let y = 0; y < words.length; y++) {
      let word = words[y]
      let count = wordMap[word]
      let _getIt = false
      for (let z = 0; z < result.length; z++) {
        if (result[z][0] == word) {
          result[z][1] += count
          _getIt = true
          break
        }
      }
      if (!_getIt) {
        result.push([word, count])
      }
    }
  }
  // 按频率禁词
  for (let x = 0; x < result.length; x++) {
    if (result[x][1] < settings.minFreq) {
      settings._minFreqWord.push(result[x][0])
    }
  }
  refresh()
}
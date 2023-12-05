import os
import datetime as dt
from docx import Document
import jieba
import json
import re

# 分词词典
jieba.load_userdict("dict.txt")

# 遍历文件夹获得文件
def findAllFile(base):
  for root, ds, fs in os.walk(base):
    for f in fs:
      fullname = os.path.join(root, f)
      yield f, fullname

# 从文件名中获得周报对应的周一和周日日期
def getMon2Sun(name):
  # 提取每个文件的日期
  fDate = dt.datetime.strptime(name[9:19], '%Y-%m-%d')
  # 如果是周一，则视为上周的周报，其他情况下都视为本周的周报
  # 然后获得一个时间段，表示这个周报的有效期，从周一到周日
  if fDate.weekday() == 0:
    monday = fDate - dt.timedelta(days=7)
    sunday = monday + dt.timedelta(days=6)
  else:
    monday = fDate - dt.timedelta(days=fDate.weekday())
    sunday = monday + dt.timedelta(days=6)
  return monday, sunday

# 从文件中获得内容的方法
def getContent(fileName):
  texts =[]
  document = Document(fileName)
  all_tables = document.tables
  for table in all_tables:
    for row in table.rows:
      for cell in row.cells:
        text = cell.text
        # 过滤空内容
        if text == "":
          continue
        # 过滤因合并单元格导致的重复
        if len(texts) > 0 and text == texts[-1]:
          continue
        # 记录
        texts.append(text)
  return texts

print("周报文件夹路径:")
wrDir = input()

# 最终数据
data = {}

# 再次遍历文件，这次提取文件中的关键字
for name, fullname in findAllFile(wrDir):
  # 文件日期，用来确认需要把这些关键字加在哪里
  mon, sun = getMon2Sun(name)
  # 文件内容
  lines = getContent(fullname)
  words = {}
  for x in range(len(lines)):
    line = lines[x]
    _words = list(jieba.cut(line, cut_all=False))
    for y in range(len(_words)):
      _word = _words[y]
      # 过滤
      if _word == "" or _word == " ":
        continue
      if _word == "\n" or _word == "\r":
        continue
      if len(_word) <= 1:
        continue
      if _word.isdigit():
        continue
      if re.match(r"^[0-9\.]+$", _word):
        continue
      if _word not in words:
        words[_word] = 1
      else:
        words[_word] = words[_word] + 1
  words[''] = 0
  # 将词汇数据加入到data中
  data[mon.strftime('%Y-%m-%d')] = words

# 保存数据
with open("../page/src/js/data.js", "w", encoding="utf-8") as f:
  f.write("let data = ")
  f.write(json.dumps(data, ensure_ascii=False))
  f.write("\n\n")
  f.write("export { data }")
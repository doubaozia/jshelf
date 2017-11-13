/**
 * 生成数组中若干个元素的排列组合
 * @param {array} arr
 * @param {number} size
 */
function groupSplit(arr, size) {
  const r = [];
  function _(t, a, n) {
    if (n === 0) {
      r[r.length] = t;
      return;
    }
    for (let i = 0, l = a.length - n; i <= l; i += 1) {
      const b = t.slice();
      b.push(a[i]);
      _(b, a.slice(i + 1), n - 1);
    }
  }
  _([], arr, size);
  return r;
}

class Node {
  constructor(c, word) {
    this.c = c;
    this.word = word;
    this.childs = [];
  }
}

class Trie {
  constructor() {
    this.root = new Node();
  }
  /**
   * 添加字符串
   * @param {string} word
   */
  add(word) {
    const me = this;
    let node = me.root;
    for (let i = 0, l = word.length; i < l; i += 1) {
      const c = word.charAt(i);
      let pos = me.find(node, c);
      if (pos < 0) {
        node.childs.push(new Node(c));
        node.childs.sort((a, b) => {
          if (a > b) {
            return 1;
          }
          return -1;
        });
        pos = this.find(node, c);
      }
      node = node.childs[pos];
    }
    node.word = word;
  }
  /**
   * 先序输出
   * @param {object} node
   */
  preOrder(node) {
    const me = this;
    let results = [];
    if (node.word) {
      results.push(node.word);
    }
    for (let i = 0, l = node.childs.length; i < l; i += 1) {
      results = results.concat(me.preOrder(node.childs[i]));
    }
    return results;
  }
  find(node, c) {
    const me = this;
    const childs = node.childs;
    const len = childs.length;
    if (len === 0) {
      return -1;
    }
    for (let i = 0; i < len; i += 1) {
      if (childs[i].c === c) {
        return i;
      }
    }
    return -1;
  }
  setWords(words) {
    const me = this;
    for (let i = 0, l = words.length; i < l; i += 1) {
      me.add(words[i]);
    }
  }
  search(string) {
    const me = this;
    let node = me.root;
    const len = string.length;
    const result = [];
    const word = [];

    for (let i = 0; i < len; i += 1) {
      const c = string.charAt(i);
      const childs = node.childs;
      const cStr = childs.map(v => v.c);
      if (cStr.indexOf(c) < 0) {
        return result;
      }
      word.push(c);
      const cnode = childs[cStr.indexOf(c)];
      if (cnode.word) {
        result.push(word.join(''));
      }
      node = cnode;
    }
    return result;
  }
  splitWords(words) {
    const me = this;
    let start = 0;
    const end = words.length - 1;
    let result = [];
    while (start !== end) {
      const word = [];
      for (let i = start; i <= end; i += 1) {
        const c = words.charAt(i);
        word.push(c);
        const finds = me.search(word.join(''));
        if (finds && finds.length > 0) {
          result = result.concat(finds);
        }
      }
      start += 1;
    }
    const rResult = Array.from(new Set(result));
    let maxMatchedWords = [];
    let match = [];
    for (let i = 0, l = rResult.length; i < l; i += 1) {
      const wordsCombination = groupSplit(rResult, i + 1);

      for (let i = 0, l = wordsCombination.length; i < l; i += 1) {
        const combinationWord = wordsCombination[i].join('');
        if (combinationWord === words.toLowerCase()) {
          return wordsCombination[i];
        }
        if (words.toLowerCase().indexOf(combinationWord) === 0) {
          maxMatchedWords = wordsCombination[i];
        }
      }
    }

    if (maxMatchedWords.length > 0) {
      maxMatchedWords.push(words.slice(maxMatchedWords.join('').length));
      return maxMatchedWords.filter(val => val);
    }

    return [];
  }
}

module.exports = Trie;
const fs = require('fs');
const path = require('path');
const Trie = require('./Trie');

const utils = {
  /**
   * 深拷贝对象
   * @param {*} args
   */
  assign(...args) {
    const target = args.splice(0, 1)[0];
    for (let i = 0, l = args.length; i < l; i += 1) {
      const source = args[i];
      Object.keys(source).forEach((key) => {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          utils.assign(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    }
  },
  /**
   * 判断路径是否为文件
   * @param {string} path
   */
  isFile(fp) {
    return fs.statSync(fp).isFile();
  },
  /**
   * 判断路径是否为文件夹
   * @param {string} path
   */
  isFolder(fp) {
    return fs.statSync(fp).isDirectory();
  },
  /**
   * 字符串拆分为单词
   * @param {string} s 
   * @param {array} d 
   */
  breakToWords(s, d) {
    const trie = new Trie();
    trie.setWords(d);
    const words = trie.splitWords(s);
    if (words.length === 0) {
      return [s];
    }
    return words;
  },
  /**
   * 转换为 kebab case (teststring -> test-string)
   * @param {string} string
   * @param {array} dictionary
   */
  kebabCase(s, d) {
    const words = utils.breakToWords(s, d).join('-');
    return words;
  },
  /**
   * 转换为 snake case (teststring -> test_string)
   * @param {string} string
   * @param {array} dictionary
   */
  snakeCase(s, d) {
    const words = utils.breakToWords(s, d).join('_');
    return words;
  },
  /**
   * 转换为 camel case (teststring -> TestString)
   * @param {string} string
   * @param {array} dictionary
   */
  camelCase(s, d) {
    let words = utils.breakToWords(s, d);
    words = words.map(val => (val.charAt(0).toUpperCase() + val.slice(1))).join('');
    return words;
  },
  /**
   * 转换为 mix case (teststring -> testString)
   * @param {string} string
   * @param {array} dictionary
   */
  mixCase(s, d) {
    let words = utils.breakToWords(s, d);
    words = words.map((val, index) => {
      if (index !== 0) {
        return val.charAt(0).toUpperCase() + val.slice(1);
      }
      return val;
    }).join('');
    return words;
  },
  /**
   * 删除文件夹下的所有子文件夹和文件
   * @param {string} path
   */
  unlinkFolders(f) {
    if (fs.existsSync(f)) {
      fs.readdirSync(f).forEach((file) => {
        const curPath = `${f}/${file}`;
        if (fs.lstatSync(curPath).isDirectory()) {
          utils.unlinkFolders(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(f);
    }
  },
  /**
   * 判断是否为模块语句
   * @param {string} string
   */
  isModuleSyntax(s) {
    return (/(import\s|export|require|exports|from)/).test(s);
  },
  /**
   * 从模块语句中提取模块字符串
   * @param {string} string
   */
  extractModulePathFromString(s) {
    return s.match(/'\.[\w-./]+'/) ? s.match(/'\.[\w-./]+'/)[0].slice(1, -1) : '';
  },
  /**
   * 把unicode字符串转换为汉字
   * @param {string} unicode
   */
  unicodeToHanzi(unicode) {
    const hanzi = unicode.split('\\u').filter(v => v);
    let str = '';
    for (let i = 0; i < hanzi.length; i += 1) {
      str += String.fromCharCode(parseInt(hanzi[i], 16).toString(10));
    }
    return str;
  },
  /**
   * 获取脚本执行绝对路径
   * @param {array} args 
   */
  p(...args) {
    return path.join(process.cwd(), ...args);
  }
};

module.exports = utils;
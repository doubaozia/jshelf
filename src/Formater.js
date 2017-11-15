// dependences
const fs = require('fs');
const path = require('path');
const glob = require('glob');

//babel
const babylon = require('babylon');
const traverse = require('babel-traverse');
const t = require('babel-types');
const generate = require('babel-generator');

const utils = require('./util.js');
const Trie = require('./Trie.js');

const { p } = utils;

// config
if (!fs.existsSync(p('./jshelf.json'))) {
  throw new Error('jshelf.json is required');
}
const config = JSON.parse(fs.readFileSync(p('./jshelf.json')));

// default rule
const DEFAULT_RULES = {
  directory: {
    case: 'mix',
    ignore: [],
  },
  files: [{
    test: '*.*',
    case: 'camel',
    ignore: [],
  }],
  default: {
    case: 'mix',
    ignore: [],
  },
};

class Formater {
  constructor() {
    if (!config.root) {
      throw new Error('Src is required');
    }
    if (!config.rules) {
      throw new Error('Rules is required');
    }
    if (!config.words) {
      throw new Error('Words is required');
    }
    this.processConfig();
    this.src = config.root;
    this.ignore = config.ignore || [];
    this.files = [];
    this.filesMap = {};
    this.words = config.words || [];
    this.rules = {};
    utils.assign(this.rules, DEFAULT_RULES, config.rules);
  }

  /**
   * 初始化
   */
  init() {
    const me = this;
    utils.unlinkFolders(p('./mirror'));
    me.getFiles();
    me.getFilesMap();
    me.copyFile();
    me.processModules();
    me.replaceSrc();
    utils.unlinkFolders(p('./mirror'));
  }

  /**
   * 处理字典中的单词顺序
   */
  processConfig() {
    config.root = utils.getPrefixPath(config.root);
    config.ignore = config.ignore.map(val => utils.getPrefixPath(val));
  }

  /**
   * 根据规则分词
   * @param {string} string
   * @param {string} type
   * @param {array} ignores
   */
  formatByCase(string, type, ignores) {
    const me = this;
    const ignore = ignores.some(word => new RegExp(word).test(string));
    const parseCase = ignore ? me.rules.default.case : type;

    switch (parseCase) {
      case 'kebab':
        return utils.kebabCase(string, me.words);
      case 'snake':
        return utils.snakeCase(string, me.words);
      case 'camel':
        return utils.camelCase(string, me.words);
      case 'mix':
        return utils.mixCase(string, me.words);
      default:
        return string;
    }
  }

  /**
   * 获取文件
   */
  getFiles() {
    const me = this;
    let prefixPath = me.src;
    if (utils.isFile(p(prefixPath))) {
      me.files.push(prefixPath);
      return;
    }
    if (!(/\/$/).test(prefixPath)) {
      prefixPath += '/';
    }
    const path = `${prefixPath}**/*.*`;
    me.files = glob.sync(p(path)).map(v => `.${v.substring(process.cwd().length)}`);
  }

  /**
   * 获取文件映射表
   */
  getFilesMap() {
    const me = this;
    for (let i = 0, l = me.files.length; i < l; i += 1) {
      const file = me.files[i];

      me.filesMap[file] = me.parsePath(file);
    }

    return me.filesMap;
  }

  /**
   * 根据配置规则转换文件路径
   * @param {string} path
   * @param {boolean} lastIsFolder
   */
  parsePath(filePath, lastIsFolder, absolutePath) {
    const me = this;

    const pathArr = filePath.split('/');
    const procPathArr = [];

    const isIgnored = me.ignore.some(v => (
      absolutePath
        ? absolutePath.replace(/^\/?mirror/, '.').indexOf(v) === 0
        : filePath.replace(/mirror\//, '').indexOf(v) === 0
    ));
    if (isIgnored) {
      pathArr.splice(1, 0, 'mirror');
      return pathArr.join('/');
    }

    for (let i = 0, l = pathArr.length; i < l; i += 1) {
      let parsed = pathArr[i].replace(/[-_]/g, '').toLowerCase();

      if (!(/\.\w+/).test(parsed) && i !== l - 1) {
        // 文件夹转换
        parsed = me.formatByCase(parsed, me.rules.directory.case, me.rules.directory.ignore);
      } else if (!(/\.\w+/).test(parsed) && lastIsFolder) {
        parsed = me.formatByCase(parsed, me.rules.directory.case, me.rules.directory.ignore);
      } else {
        // 文件转换
        const fileRule = me.rules.files
          .filter(val => new RegExp(val.test).test(parsed))[0] || me.rules.default;

        if ((/^(page)[\w\d]+(\.js$|\.jsx$|\.less$)/i).test(parsed) && parsed.split('.')[0].substring(4)) {
          parsed = parsed.substring(4);
        }

        parsed = me.formatByCase(parsed, fileRule.case, fileRule.ignore);
      }
      procPathArr.push(parsed);
    }
    if (procPathArr[0] === '.') {
      procPathArr.splice(1, 0, 'mirror');
    }
    return procPathArr.join('/');
  }

  /**
   * 复制文件
   * 如果reverse不存在或为false，从源目录复制到镜像目录
   * 如果reverse为true，从镜像目录复制到源目录
   * @param {boolean} reverse
   */
  copyFile(reverse) {
    const me = this;
    const checkAndCreateFolder = (dest) => {
      if (!fs.existsSync(p(dest))) {
        const paths = dest.split('/');
        let curPath = paths[0];
        for (let i = 0, l = paths.length; i < l - 1; i += 1) {
          if (!fs.existsSync(p(curPath))) {
            fs.mkdirSync(p(curPath));
          }
          curPath += `/${paths[i + 1]}`;
        }
      }
    };
    Object.keys(me.filesMap).forEach((file) => {
      const src = !reverse ? file : me.filesMap[file];
      const dest = !reverse ? me.filesMap[file] : me.filesMap[file].replace(/mirror\//, '');

      if (!fs.existsSync(p(src))) {
        throw new Error(`can't find source ${file}`);
      } else {
        checkAndCreateFolder(dest);
        fs.writeFileSync(p(dest), fs.readFileSync(p(src), 'utf8'));
      }
    });
  }

  /**
   * 获取文件内容的AST对象
   * @param {string} file
   */
  getAst(file) {
    const code = fs.readFileSync(p(file), 'utf8');
    const ast = babylon.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      plugins: [
        'jsx',
        'flow',
        'doExpressions',
        'objectRestSpread',
        'decorators',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'exportExtensions',
        'asyncGenerators',
        'functionBind',
        'functionSent',
        'dynamicImport',
        'numericSeparator',
        'optionalChaining',
        'optionalCatchBinding',
        'throwExpressions',
      ],
    });
    return ast;
  }

  /**
   * 根据变化后的AST生成代码写入目标文件
   * @param {object} ast
   * @param {string} srcFile
   * @param {string} destFile
   */
  applyAstChangesToFile(ast, srcFile, destFile) {
    const code = fs.readFileSync(p(srcFile), 'utf8');
    const output = generate.default(ast, { jsonCompatibleStrings: false }, code);
    const hanziUnicode = output.code.match(/(\\u[\w\d]{4})+/gi);
    if (hanziUnicode) {
      hanziUnicode.forEach((v) => {
        output.code = output.code.replace(v, utils.unicodeToHanzi(v));
      });
    }
    fs.writeFileSync(p(destFile), output.code, 'utf8');
  }

  /**
   * 修改文件内的模块名
   * @param {string} file
   */
  modifyModuleNames(file) {
    const me = this;
    if (!/\.js$|\.jsx$/.test(file)) {
      return;
    }
    const ast = me.getAst(file);
    const fileFolder = file.split('/').slice(0, -1).join('/');

    const getNewModule = (oldModulePath) => {
      let modulePath = oldModulePath;
      let newModulePath = oldModulePath;
      let selfModuleFlag = false;

      if (modulePath.indexOf('./') === 0) {
        modulePath = oldModulePath.slice(2);
        newModulePath = modulePath;
        selfModuleFlag = true;
      }
      const absolutePath = p(fileFolder, modulePath).substring(process.cwd().length);

      // 假设模块是文件
      const moduleAssumeIsFile = mPath => (me.parsePath(mPath, false, absolutePath));
      // 假设模块是文件夹
      const moduleAssumeIsFolder = mPath => (me.parsePath(mPath, true, absolutePath));
      // 获取当前文件目录和模块目录的组合路径
      const joinedPath = mPath => (path.join(fileFolder, mPath));

      if (fs.existsSync(joinedPath(moduleAssumeIsFolder(modulePath)))) {
        newModulePath = moduleAssumeIsFolder(modulePath);
      }
      if (fs.existsSync(joinedPath(moduleAssumeIsFile(modulePath)))) {
        newModulePath = moduleAssumeIsFile(modulePath);
      }
      if (fs.existsSync(joinedPath(moduleAssumeIsFile(`${modulePath}.js`)))) {
        newModulePath = moduleAssumeIsFile(`${modulePath}.js`);
      }
      if (fs.existsSync(joinedPath(moduleAssumeIsFile(`${modulePath}.jsx`)))) {
        newModulePath = moduleAssumeIsFile(`${modulePath}.jsx`);
      }
      if (fs.existsSync(joinedPath(`${modulePath}.js`))) {
        newModulePath = `${modulePath}.js`;
      }
      return selfModuleFlag ? `./${newModulePath}` : newModulePath;
    };

    traverse.default(ast, {
      enter(p) {
        if (t.isIdentifier(p.node, { name: 'require' }) && p.container.arguments) {
          p.container.arguments.forEach((v) => {
            const modulePath = v.value;
            v.value = getNewModule(modulePath);
          });
        }
        if (t.isImportDeclaration(p.node, {})) {
          const modulePath = p.node.source.value;
          p.node.source.value = getNewModule(modulePath);
        }
      },
    });
    me.applyAstChangesToFile(ast, file, file);
  }

  /**
   * 替换文件中的模块语句
   */
  processModules() {
    const me = this;
    // 获取每个文件
    Object.keys(me.filesMap).forEach((key) => {
      const file = me.filesMap[key];
      me.modifyModuleNames(file);
      console.log('[finished]: ', file);
    });
  }

  /**
   * 替换源文件
   */
  replaceSrc() {
    const me = this;
    utils.unlinkFolders(p(me.src));
    me.copyFile(true);
  }
}

module.exports = Formater;
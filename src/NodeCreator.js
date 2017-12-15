const t = require('babel-types');

class NodeCreator {
  constructor(node) {
    this.node = node;
  }

  getIdentifierName() {
    const me = this;
    return me.node.declarations[0].id.name;
  }

  getArgumentValue() {
    const me = this;
    if (me.node.declarations) {
      return me.node.declarations[0].init.arguments[0].value;
    }
    return me.node.expression.arguments[0].value;
  }

  createImportNode() {
    const me = this;
    let identifierName, argumentValue, node;

    if (!t.isExpressionStatement(me.node)) {
      return me.node;
    }

    if (me.node.declarations) {
      identifierName = me.getIdentifierName();
      argumentValue = me.getArgumentValue();
      node = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier(identifierName))],
        t.stringLiteral(argumentValue)
      );
    } else {
      argumentValue = me.getArgumentValue();
      node = t.importDeclaration(
        [],
        t.stringLiteral(argumentValue)
      );
    }

    return node;
  }

  createExportNode() {
    const me = this;
    let identifierName, node;

    if (!t.isExpressionStatement(me.node)) {
      return this.node;
    }

    identifierName = me.node.expression.right.name;
    node = t.exportDefaultDeclaration(t.identifier(identifierName));
    return node;
  }
}

module.exports = NodeCreator;

[toc]
# babel 
babel 是现在前端工具链中使用度非常广的一款编译工具，用来将最新特性的代码打包成浏览器可以运行的代码，另外，我们也可以根据它开放的API编写插件，做一些编译层面工程化的事情，如模板生成，代码注入，lint检查，压缩代码等，这篇文章会介绍 babel 里一些核心的概念，然后会详细讲解各个 API 的用法，最后会以一些案例为指导，通过实战学习用法，准备好了的话，让我们开始吧！

*[文章源代码](https://github.com/LuSuguru/learn-babel)*

## babal 里的一些概念
### AST（抽象语法树）
相信每个前端对 AST 都不陌生，它是源代码语法结构的一种规范抽象表示，采用树状的数据结构。AST 也是 babel 整个转换过程中的核心
```js
old code => ast => new code
```

通过 AST 这座桥梁对我们的代码进行转换，大家可以通过[AST Explorer](https://astexplorer.net/)自己写点 demo 来了解，下面是个转化的案例，如下：

```js
// 源代码
console.log('hello world')
```

```json
// AST结构
{
  "type": "ExpressionStatement",
  "start": 5,
  "end": 31,
  "loc": {
    "start": {
      "line": 2,
      "column": 4
    },
    "end": {
      "line": 2,
      "column": 30
    }
  },
  "expression": {
    "type": "CallExpression",
    "start": 5,
    "end": 31,
    "loc": {
      "start": {
        "line": 2,
        "column": 4
      },
      "end": {
        "line": 2,
        "column": 30
      }
    },
    "callee": {
      "type": "MemberExpression",
      "start": 5,
      "end": 16,
      "loc": {
        "start": {
          "line": 2,
          "column": 4
        },
        "end": {
          "line": 2,
          "column": 15
        }
      },
      "object": {
        "type": "Identifier",
        "start": 5,
        "end": 12,
        "loc": {
          "start": {
            "line": 2,
            "column": 4
          },
          "end": {
            "line": 2,
            "column": 11
          },
          "identifierName": "console"
        },
        "name": "console"
      },
      "computed": false,
      "property": {
        "type": "Identifier",
        "start": 13,
        "end": 16,
        "loc": {
          "start": {
            "line": 2,
            "column": 12
          },
          "end": {
            "line": 2,
            "column": 15
          },
          "identifierName": "log"
        },
        "name": "log"
      }
    },
    "arguments": [{
      "type": "StringLiteral",
      "start": 17,
      "end": 30,
      "loc": {
        "start": {
          "line": 2,
          "column": 16
        },
        "end": {
          "line": 2,
          "column": 29
        }
      },
      "extra": {
        "rawValue": "hello world",
        "raw": "'hello world'"
      },
      "value": "hello world"
    }]
  }
}
```

它们每一层级都很类似，都是由以下结构组成，这样的结构在babel中被称为`Node`，每一棵抽象语法树就是由无数个`Node`组成，`Node`上含有当前语句的所有语法信息以及在源码中的位置信息，通过这些信息我们可以获取所有当前语句的内容，用作静态分析

```js
{
  type:'节点类型',
  ...
}

// 位置信息
{
"start": 5,
  "end": 31,
  "loc": {
    "start": {
      "line": 2,
      "column": 4
    },
    "end": {
      "line": 2,
      "column": 30
    }
  }   
}
```

### babel 的流程
既然一切的编译转换都围绕 AST，那么 babel 的流程也可以描述成 

- 代码生成 AST（parse）
- 转换 AST（transform）
- 根据新 AST 生成目标代码（generate）

下面，我们就介绍这3个过程
#### 代码生成 AST（parse）
代码生成 AST 的过程又叫做解析，它涉及到两个概念，**词法分析**和**语法分析**

##### 词法分析
对于未解析过的代码，它仅仅是一长条字符串，里面包括 javascript 中的关键字，有变量名，由这些组合成的语句。词法分析要做的事情就是将这条长字符串拆分成一个个小的字符，并赋予这些字符**类型**和**含义**。形成一个个有意义的词法单元，我们称之为 **token**
例如：

```js
n * n;
```

经过词法分析：

```js
[
  { type: { ... }, value: "n", start: 0, end: 1, loc: { ... } },
  { type: { ... }, value: "*", start: 2, end: 3, loc: { ... } },
  { type: { ... }, value: "n", start: 4, end: 5, loc: { ... } },
  ...
]
```
其中，type 包含了当前 token 的一些原始信息：

```js
{
  type: {
    label: 'name',
    keyword: undefined,
    beforeExpr: false,
    startsExpr: true,
    rightAssociative: false,
    isLoop: false,
    isAssign: false,
    prefix: false,
    postfix: false,
    binop: null,
    updateContext: null
  },
  ...
}
```

##### 语法分析
有了一个个词法单元后，那我们就可以根据它们之间的关系通过 javascript 的文法介绍进行语法分析，生成一棵描述当前 javascript 文件语义结构的AST，这一块深入可以研究的东西非常多，比如语法解析的回溯，存档，读档等，这里就不深入了，有兴趣的可以自行研究下

在`@babel/parser`中有一个`parser`函数，它接收一段 javascript 代码字符串，将其转换为AST节点，它的内部封装了词法分析和语法分析，具体的使用如下：

```js
parse(code, {
  allowImportExportEverywhere: true,
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
  ],
})
```

#### 转换 AST（transform）
在生成了 AST 后，我们就需要读取并遍历这棵树，并通过增删改查的方式更新树上的节点。从而转化为一棵新的树。babel的插件做的也是这个事情。下面介绍用法时我们要着重讲的也是这一阶段，这里只需要了解这个步骤

#### 根据新 AST 生成目标代码（generate）
在转化完新的AST树后，我们就可以通过**深度优先遍历**读取AST树，将树的信息重新转化成代码，这份代码即编译过后的代码，至此，整个过程就完成了

在`@babel/generator`中有一个`generator`函数，我们可以使用它直接将AST转换为新的js代码：

```js
generate(ast, {
  jsescOption: {
    minimal: true,
  },
  retainLines: true,
}).code
```

## Babel 的使用

### 遍历 AST
到这里，大家都知道我们使用 babel 的核心是遍历 AST，进行增删改查操作，这也是众多 babel 插件做的事情，那么 babel 是如何遍历的呢，我们以刚刚生成的 AST 为例，它同样采用**深度优先遍历**：
- 首先遍历 `File`，发现它有 `program` 属性，对应 `Program` 节点，进入 `Program`
- 它的 `Body` 属性也属于 `Node` 节点，对应 `ExpressionStatement`
- 同理，这样依次进入 `CallExpression`、`MemberExpression`、`Identifier`、`Identifier`
- 到了 `Identifier` 以后，当前已经到了叶子节点，因此往上一层，按照同样的逻辑，直到 `CallExpression` 找打第二个子节点属性`argument`,进入`Argument`
- 通过 `Argument` 进入 `StringLiteral`，整棵树就遍历完了

 
babel中遍历AST的函数在`@babel/traverse`中，我们在实例中将其引入

```js
import traverse from '@babel/traverse'
```

### Visitor
那么我们该如何操作并替换这些节点呢，`traverse` 函数接收一组 `Visitors` 对象，它的结构是这样：

```js
const MyVisitor = {
  Identifier() {
    console.log("Called!");
  }
};
```
 
当 `traverse` 遍历到 `Identifier` 类型的节点时，就会调用上面注册的 `visitor` ，从而执行 `visitor` 中的函数，我们定义的 `visitor` 就像一个记者，如果有他想要拜访的对象，便会通知他进行访问。

`traverse` 函数允许注册任意多个 `visitor`，我们便可以通过这些 `visitor` 的组合去访问并操作节点
在访问节点时，有进入和退出两种状态，因此，我们的 `visitor` 可以再细分，设置访问的时机

```js
const MyVisitor = {
  Identifier: {
    enter(path) {
      console.log('enter')
    },
    exit(path) {
      console.log('exit')
    }
} 
```

### Path
在 `visitor` 访问成功时，它会得到当前要访问的节点信息，但是，仅仅知道一个当前节点的信息是不够的，要知道语义，我们可能需要知道它的父子节点，兄弟节点，作用域，上下文信息等。很方便的是，当 `visitor` 中的函数被执行时，它所接收的，正是一个这样的对象，包含了各种关系信息和很方便的操作函数，在 babel 中定义为 `path`

如下就是一个 `path` 中的属性，其中 `node` 指向的就是当前访问的节点

```ts
    parent: Node;
    hub: Hub;
    contexts: TraversalContext[];
    data: object;
    shouldSkip: boolean;
    shouldStop: boolean;
    removed: boolean;
    state: any;
    opts: object;
    skipKeys: object;
    parentPath: NodePath;
    context: TraversalContext;
    container: object | object[];
    listKey: string;
    inList: boolean;
    parentKey: string;
    key: string | number;
    node: T;
    scope: Scope;
    type: T extends null | undefined ? undefined : T extends Node ? T['type'] : string | undefined;
    typeAnnotation: object;
    ...
```

如果我们要获取一个变量的名字，可以这样写：

```js
const MYvisitor = {
   Identifier(path) {
        console.log(path)
        console.log(path.node.name)
      }
} 
```

### 访问子节点
在 AST 中，子节点在当前节点的各种属性中，如

```js
function parent() {
  let a = 'parent1'
  let b = 'parent2'

  function child() {
    a = 'child1'
    b = 'child2'
  }
}
```

我们要拿到 `child()` 里的赋值表达式右边的节点
整个表达式是一个 `AssignmentExpression` 类型的节点，如果我们要获取右边的 `node`，可以通过 

```js
path.node.right
```

访问到 `'child'` 为 `StringLiteral` 类型的节点

如果你想要获取 `'child'` 的 `path`，可以通过 `path.get` 来访问，`get` 可以接受链式调用的字符串信息，如下：

```js
path.get('right')
```

### 访问上级节点
访问上级节点有多种方式，它们都挂载在 `path` 下，先介绍最基本的一种访问上级节点的方式：

```js
path.findParent((path) => path.isFunctionDeclaration())            
```

`findParent` 会从 `path` 的第一个父节点开始，一直向上遍历，直到根节点，它接收一个 callback，类似于 `array.find` ，返回 `callback return true` 的节点
以上面为例，调用 `findParent` 时，会依次

```
ExpressionStatement => BlockStatement => FunctionDeclaration(true，返回结果) => BlockStatement => FunctionDeclaration => Program
```

如果我们在向上访问时包含当前节点自身， 可以调用 `path.find`，其余使用与 `path.findParent` 一致

```js
path.find((path) => path.isObjectExpression());
```

```
AssignmentExpression => ExpressionStatement => BlockStatement => FunctionDeclaration(true，返回结果) => BlockStatement => FunctionDeclaration => Program
```

除了上述两种最基本的访问上级节点的方式，`path` 中还有一些访问特定上级的函数

```js
// 获取最近的函数父节点
path.getFunctionParent();
// 获取最近的声明节点
path.getStatementParent();
```

### 访问兄弟节点
像函数里面，它有多条语句，每条语句都对应一个节点，那么函数体内是多个节点组成的 `NodeList`。如果我们当前节点是在 `NodeList` 中，我们该如何访问它的兄弟节点呢?
在 `path` 中，同样有关于 `NodeList` 的属性和方法

```js
path.inList // 是否在列表中
path.listKey // 列表在父节点中的属性名
path.key // 列表中的位置
path.getSibling(0) // 获取0位置的元素
path.container // 获取列表
path.getPrevSibling() // 获取上一个节点
path.getNextSibling() // 获取下一个节点
path.getAllPrevSiblings() // 获取左边全部节点
path.getAllNextSiblings() // 获取右边全部节点
```

### 跳过节点，停止遍历
在遍历时，我们可以人为的通过 `path.skip()` 跳过当前节点，提高性能
我们也可以通过 `path.stop()` 停止对AST树的遍历

### 类型断言
如果我们要检查某个节点是否为xx类型的节点，可以通过 `@babel/types` 中的 isXXX 断言函数来判断：

```js
if (t.isStringLiteral(path.node.arguments[0])) {
  console.log(path.node.arguments[0])
}
```

对于`path`，我们可以直接通过`path`中提供的isXXX断言函数来判断：

```js
if ((path.get('arguments.0') as NodePath).isStringLiteral()) {
  console.log(path.get('arguments.0'))
}
```

### Scope
在 javascript 中有**词法作用域**的概念，它们通过 `function` 创建，如下：

```js
// 全局作用域
function scopeOne() {
  // 作用域 1

  function scopeTwo() {
    // 作用域 2
  }
}
```

参考以下例子：

```js
  function one() {
    let one = 'scope1';
    
    function two() {
      one = 'scope2';
    }
  }
```

我们打算修改变量 `one` 为 `two`，我们可以先定位到 `one` 使用的位置

```js
Identifier(path) {
  // 如果节点的名字为 'one' 且它属于表达式的一部分
  if (path.node.name === 'one' && t.isAssignmentExpression(path.parent)) {
    path.node.name = 'two'
  }
}
```

变换后的代码如下：

```js
function one() {
  let one = 'scope1';

  function two() {
    two = 'scope2';
  }
}
```

我们只改了变量在表达式中的名字，它的声明并未修改，这里，我们可以通过`path`中的`scope`，去找到它的申明， 在`path`中有一个属性`scope`，它定义当前节点的作用域信息以及一系列作用域的操作方法，它的结构如下：

```js
{
  path: path, // 当前path
  block: path.node, //单前作用域块的块节点
  parentBlock: path.parent, // 父级作用域的块节点
  parent: parentScope,  // 父级作用域
  bindings: [...], // 绑定关系
  getBinding(name: string): Binding | undefined; // 获取绑定
}
```

我们可以通过 `scope`，找到当前节点变量的申明节点，并替换节点的名字，如下：

```js
Identifier(path) {
  // 如果节点的名字为 'one' 且是一个表达式
  if (path.node.name === 'one' && t.isAssignmentExpression(path.parent)) {
    // 获取当前节点的绑定关系
    const binding = path.scope.getBinding(path.node.name)

    // 替换名字
    binding.identifier.name = 'two'
    path.node.name = 'two'
  }
}
```

### 节点的增加和删除
我们可以通过 `insertBefore` 和 `insertAfter` 插入兄弟节点，这里我们采用 `@babel/template` 中的 `template` 来生成一段模板代码的 AST，具体的用法非常简单，我们已上面的代码为例，要在 `function child` 前面，后面各加一句 `a=1` 的变量赋值语句

```js
if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
  const temp = template('a = 1')
  path.insertBefore(temp())
  path.insertAfter(temp())
}
```
 
如果子节点是列表，我们想在父级直接添加节点在列表头或者末尾，可以使用 `unshiftContainer` 和 `pushContainer`

```js
if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
  const temp = template('const test = 1')
  path.get('body').unshiftContainer('body', temp())
  path.get('body').pushContainer('body', temp())
}
```

我们可以通过调用 `path.remove()` 直接删除当前节点，如下例，我么删除 `function child`

```js
if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
  path.remove()
}
```

### 节点的替换
节点的替换与添加非常类似，`path` 中提供了多个替换的方法：

```js
if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
  const temp = template('const test = 1');
  // 1对1
  (path.get('body.body.0') as NodePath).replaceWith(temp() as t.Statement)
}
```

```js
if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
  // 1对多
  const temp = template('const test = 1;const test2 = 2');
  (path.get('body') as NodePath).replaceWithMultiple(temp() as t.Statement[])
}
```

## 实战
以下案例可在[demo](https://github.com/LuSuguru/learn-babel/blob/main/src/pages/main/demo.tsx)中查看，我们有如下一个 ts 文件，很典型的 React 代码，里面代码如下：

```js
import React, { FC, Suspense } from 'react'

const Demo:FC =() => (
  <div>
    <Suspense>
      <h1>hello,world</h1>
    </Suspense>
  </div>
)
```

下面我们通过 babel 删除 `Suspense` 标签以及 `Suspense` 的引用：
首先，我们将代码转化为 AST，这里我们引入了两个 `plugin`, `jsx` 和 `typescript`，用于解析 ts 文件和 jsx :

```js
const code2AST = (code: string) => parse(code, {
  allowImportExportEverywhere: true,
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
  ],
})
```

获得 AST 后，我们使用 `traverse` 遍历 AST，通过 `JSXElement` 类型定位到 `jsx`标签

```js
traverse(ast, {
      JSXElement: path => {
        const { node } = path
        if (!node?.openingElement) return
        ...
    })
```

然后，我们判断当前访问的节点是否是 `Suspense` 标签节点，是的话，我们将其替换成 `Suspense` 的子节点，通过前面说过的 `replaceWithMultiple`：

```js
traverse(ast, {
      JSXElement: path => {
        const { node } = path
        if (!node?.openingElement) return

        if ((node.openingElement.name as t.JSXIdentifier).name === 'Suspense') {
          // Suspense 替换成 Suspense 的子节点
          path.replaceWithMultiple(node.children)
        }
      }
    })
```

现在，jsx 里面已经没有 `Suspense` 的代码了，那么可以删除它的引用，我们通过作用域 `scope` 快速定位到 `Suspense` 的申明

```js
  const scope = path.scope.getBinding((node.openingElement.name as t.JSXIdentifier).name)
```

然后找到 `import` 语句，删除其中的 `Suspense` 引用

```js
const importNode = scope.path.parent as t.ImportDeclaration
if (importNode.specifiers.length < 0) return

const importKeyIndex = importNode.specifiers.findIndex(item => {
  if (t.isImportSpecifier(item)) {
    return (item.imported as t.Identifier).name === 'Suspense'
  }
  return false
})

if (importKeyIndex > -1) {
  importNode.specifiers.splice(importKeyIndex, 1)
}
```

完整的 `traverse` 代码如下：

```js
    traverse(ast, {
      JSXElement: path => {
        const { node } = path
        if (!node?.openingElement) return

        if ((node.openingElement.name as t.JSXIdentifier).name === 'Suspense') {
          // Suspense 替换成 Suspense 的子节点
          path.replaceWithMultiple(node.children)

          const scope = path.scope.getBinding((node.openingElement.name as t.JSXIdentifier).name)

          const importNode = scope.path.parent as t.ImportDeclaration
          if (importNode.specifiers.length < 0) return

          const importKeyIndex = importNode.specifiers.findIndex(item => {
            if (t.isImportSpecifier(item)) {
              return (item.imported as t.Identifier).name === 'Suspense'
            }
            return false
          })

          if (importKeyIndex > -1) {
            importNode.specifiers.splice(importKeyIndex, 1)
          }
        }
      }
    })
```

最后，我们通过 `generate` 将新的 AST 转化为新的代码，整个改写就完成了：

```js
// 通过 prettier 格式化代码
const AST2Code = (ast: t.File) => prettier.format(generate(ast, {
  jsescOption: {
    minimal: true,
  },
  retainLines: true,
}).code, {
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  plugins: [prettierBabelPlugin]
})
```

## 结语
通过上面的学习，相信大家对 babel 的使用已经有了一定的了解，具体的一些用法，还是需要多多实践，才能孰能生效，下期，我们会解析 babel 的内部实现，探索编译的奥秘

## 参考文章：
. [babel-handbook](https://github.com/jamiebuilds/babel-handbook)





















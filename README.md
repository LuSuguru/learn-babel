# babel 
babel 是现在前端工具链中使用度非常广的一款编译器，用来将最新特性的代码打包成浏览器可以运行的代码，另外，我们也可以提供它开放的API编写插件，做一些编译层面工程化的事情，如模板生成，代码注入，lint检查等等，那么它是如何运作的

## AST（抽象语法树）
相信每个前端对AST都不陌生，它是源代码语法结构的一种规划抽象表示，采用树状的数据结构。AST也是Babel整个转换过程中的核心，通过AST这座桥梁，对我们的代码进行转换，如下：

```js
console.log('hello world')
```

```json
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

它们每一层级结构都相同，都是由以下结构组成，这样的结构在Babel中被称为`Node`，每一棵抽象语法树就是由无数个`Node`组成，`Node`上含有当前结构的所有语法信息以及在源码中的位置信息，可以用作静态分析
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

## Babel的流程
竟然一切的编译转换都围绕AST，那么Babel的流程也可以描述成 

- 代码生成AST（parse）
- 转换AST（transform）
- 根据新AST生成目标代码（generate）

下面，我们就介绍这3个过程
### 代码生成AST（parse）
代码生成AST的过程又叫做解析，它涉及到两个概念，*词法分析*和*语法分析*

#### 词法分析
对于为解析过的代码，它仅仅是一长条字符串，里面有js中的关键字，有变量名，语句等等，词法分析要做的事就将这条长字符串拆分成一个个小的字符，并赋予这些字符的类型赋予一些含义。形成一个个有意义的词法单元，又可以称之为token
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
其中，type包含了当前token的一些原始信息：

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

### 语法分析
有了一个个词法单元后，那我们就可以依据它们之间的关系通过JS的文法介绍进行语法分析，生成一棵描述当前JS文件的AST，这一块深入可以研究的东西非常多，这里就不深入了，有兴趣的可以看看《编译原理》自行研究下

## 转换AST（transform）
在生成了AST后，我们就需要读取并遍历这棵树，并通过增删改查的方式更新树上的节点。从而转化成一棵新的AST。Babel的插件做的就是这个事情，因此，我们要着重学习的也是这一阶段，后面我们会详细展开

## 根据新AST生成目标代码（generate）
在转化完新的AST树后，我们就可以通过*深度优先遍历*读取AST树，将树的信息重新转化成代码，这份代码即编译过后的代码，至此，整个过程就完成了

## 遍历AST
到这里，大家都知道我们的核心是遍历AST，进行替换操作，那么Babel是如何遍历的呢，我们以刚刚生成的AST为例，它同样采用*深度优先遍历*：
- 首先遍历 `File`，发现它有` program`属性，对应`Program`节点，进入`Program `
- 它的`Body`属性也属于`Node`节点，对应`ExpressionStatement`
- 同理，这样依次进入`CallExpression`、`MemberExpression`、`Identifier`、`Identifier`
- `Identifier`以后，当前已经到了叶子节点，因此往上一层，按照同样的逻辑，直到`CallExpression`找打第二个子节点属性`argument`,进入`Argument`
- 通过 `Argument` 进入 `StringLiteral`，整棵树就遍历完了

 
Babel中遍历AST的函数在`@babel/traverse`中，我们在实例中将其引入
```js
import traverse from '@babel/traverse'
```

### Visitor
那么我们该如何操作并替换这些`Node`呢，`traverse`函数接收一组 `Visitors`对象，它的结构是这样：
```js
const MyVisitor = {
  Identifier() {
    console.log("Called!");
  }
};
```
当`traverse`遍历到`Identifier`类型的`Node`时，就会调用上面注册的`visitor`，从而执行`visitor`中的函数，我们定义的`visitor`就像一个记者，如果有他想要拜访的对象，便会通知他进行访问。

`traverse`函数允许任意多个`visitor`，我们便可以通过这些`visitor`的组合去访问并操作这些`Node`节点
在访问节点，有进入和退出两种状态，因此，我们的`visitor`可以再细分，设置访问的时机及操作

```js
const MYvisitor = {
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
在`visitor`访问成功时，它会得到当前要访问的节点信息，但是，我们如何通过这个节点知道它与其他节点的关系，以及一些上下文信息呢，为了方便我们操作节点，当visitor中的函数被执行，它接收一个封装过的巨大的`path`对象，包含了各种关系信息和操作函数
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

如果我们要获取一个`变量`的名字，可以这样写：
```js
const MYvisitor = {
   Identifier(path) {
        console.log(path)
        console.log(path.node.name)
      }
} 
```

### Scope









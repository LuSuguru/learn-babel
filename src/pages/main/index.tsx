import { memo, useState } from 'react'
import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import generate from '@babel/generator'
import template from '@babel/template'
import prettier from 'prettier/standalone'
import prettierBabelPlugin from 'prettier/parser-babel'
import { Button, Space, Row, Col } from 'antd'
import * as t from '@babel/types'

import style from './style.module.less'

const code2AST = (code: string) => parse(code, {
  allowImportExportEverywhere: true,
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
  ],
})

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

function Main() {
  const [code, setCode] = useState('')
  const [ast, setAST] = useState<t.File>(null)

  const onClickAst = () => {
    const code = `
console.log('hello world!');
  `

    setCode(code)
    setAST(code2AST(code))
  }

  const onTraverse = () => {
    traverse(ast, {
      Identifier(path) {
        console.log(path)
        console.log(path.node.name)
      }
    })
  }

  const onTraverseEnter = () => {
    traverse(ast, {
      Identifier: {
        enter() {
          console.log('enter')
        },
        exit() {
          console.log('exit')
        }
      }
    })
  }

  const onCheckType = () => {
    traverse(ast, {
      CallExpression(path) {
        if (t.isStringLiteral(path.node.arguments[0])) {
          console.log(path.node.arguments[0])
        }

        if ((path.get('arguments.0') as NodePath).isStringLiteral()) {
          console.log(path.get('arguments.0'))
        }
      }
    })
  }

  const onClickRelation = () => {
    const code = `
function parent() {
  let a = 'parent1'
  let b = 'parent2'
    
  function child() {
    a = 'child1'
    b = 'child2'
    c = 'child3'
  }
}
`

    setCode(code)
    setAST(code2AST(code))
  }

  const onGetChild = () => {
    traverse(ast, {
      AssignmentExpression(path) {
        console.log(path.node.right)
        console.log(path.get('right'))
      }
    })
  }

  const onGetParent = () => {
    traverse(ast, {
      AssignmentExpression(path) {
        if (t.isStringLiteral(path.node.right) && path.node.right.value === 'child1') {
          path.findParent((path) => path.isFunctionDeclaration())
          console.log(path.getFunctionParent())
          console.log(path.getStatementParent())
        }
      }
    })
  }

  const onGetSibling = () => {
    traverse(ast, {
      ExpressionStatement(path) {
        if (((path.get('expression.left') as NodePath).node as t.Identifier).name === 'b') {
          console.log(path.inList)
          console.log(path.listKey)
          console.log(path.getSibling(+path.listKey - 1))
          console.log(path.container)
          console.log(path.getPrevSibling())
          console.log(path.getNextSibling())
          console.log(path.getAllPrevSiblings())
          console.log(path.getAllNextSiblings())
        }
      }
    })
  }

  const onClickOperate = () => {
    const code = `
function parent() {
  let a = 'parent1'
  let b = 'parent2'
    
  function child() {
    a = 'child1'
    b = 'child2'
    c = 'child3'
  }
}
`

    setCode(code)
    setAST(code2AST(code))
  }

  const onInsert = () => {
    traverse(ast, {
      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
          const temp = template('a = 1')
          path.insertBefore(temp())
          path.insertAfter(temp())
        }
      }
    })

    setCode(AST2Code(ast))
  }

  const onIntertToContainer = () => {
    traverse(ast, {
      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
          const temp = template('const test = 1')
          path.get('body').unshiftContainer('body', temp())
          path.get('body').pushContainer('body', temp())
        }
      }
    })
    setCode(AST2Code(ast))
  }

  const onRemove = () => {
    traverse(ast, {
      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
          path.remove()
        }
      }
    })

    setCode(AST2Code(ast))
  }

  const onReplaceOne = () => {
    traverse(ast, {
      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
          const temp = template('const test = 1');
          // 1对1
          (path.get('body.body.0') as NodePath).replaceWith(temp() as t.Statement)
        }
      }
    })

    setCode(AST2Code(ast))
  }

  const onReplaceMultiple = () => {
    traverse(ast, {
      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id) && path.node.id.name === 'child') {
          // 1对多
          const temp = template('const test = 1;const test2 = 2');
          (path.get('body') as NodePath).replaceWithMultiple(temp() as t.Statement[])
        }
      }
    })

    setCode(AST2Code(ast))
  }

  const onClickScope = () => {
    const code = `
function one() {
  let one = 'scope1';
  function two() {
    one = 'scope2';
  }
}
`

    setCode(code)
    setAST(code2AST(code))
  }

  const onTraverseScope1 = () => {
    traverse(ast, {
      Identifier(path) {
        // 如果节点的名字为 'one' 且是一个表达式
        if (path.node.name === 'one' && t.isAssignmentExpression(path.parent)) {
          path.node.name = 'two'
        }
      }
    })

    setCode(AST2Code(ast))
  }

  const onTraverseScope2 = () => {
    traverse(ast, {
      Identifier(path) {
        if (path.node.name === 'one' && t.isAssignmentExpression(path.parent)) {
          // 获取当前节点的绑定关系
          const binding = path.scope.getBinding(path.node.name)

          // 替换名字
          binding.identifier.name = 'two'

          path.node.name = 'two'
        }
      }
    })

    setCode(AST2Code(ast))
  }

  return (
    <>
      <Space className={style.space}>
        <Button onClick={onClickAst}>parse</Button>
        <Button onClick={onTraverse}>visitor</Button>
        <Button onClick={onTraverseEnter}>visitor enter.exit</Button>
        <Button onClick={onCheckType}>check type</Button>

      </Space>

      <Space className={style.space}>
        <Button onClick={onClickRelation}>relation parse</Button>
        <Button onClick={onGetChild}>getChild</Button>
        <Button onClick={onGetParent}>getParent</Button>
        <Button onClick={onGetSibling}>getSibling</Button>
      </Space>

      <Space className={style.space}>
        <Button onClick={onClickOperate}>operate parse</Button>
        <Button onClick={onInsert}>insert</Button>
        <Button onClick={onIntertToContainer}>insertToContainer</Button>
        <Button onClick={onRemove}>remove</Button>
        <Button onClick={onReplaceOne}>replaceOne</Button>
        <Button onClick={onReplaceMultiple}>replaceMultiple</Button>

      </Space>

      <Space className={style.space}>
        <Button onClick={onClickScope}>scope parse</Button>
        <Button onClick={onTraverseScope1}>scope transform1</Button>
        <Button onClick={onTraverseScope2}>scope transform2</Button>
      </Space>

      <Row>
        <Col className={style.block} span={10}>
          <code>
            {code || ''}
          </code>
        </Col>

        <Col className={style.block} span={10}>
          <code>
            {ast && JSON.stringify(ast, null, 2)}
          </code>
        </Col>
      </Row>
    </>
  )
}

export default memo(Main)

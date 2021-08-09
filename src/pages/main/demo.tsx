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

const sourceCode = `
import React, { FC, Suspense } from 'react'

const Demo:FC =() => (
  <div>
    <Suspense>
      <h1>hello,world</h1>
    </Suspense>
  </div>
)
`

export default memo(() => {
  const [newCode, setNewCode] = useState('')

  const onClick = () => {
    const ast = code2AST(sourceCode)

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

    setNewCode(AST2Code(ast))
  }

  return (
    <>
      <Space>
        <Button onClick={onClick}>change source code</Button>
      </Space>
      <Row>
        <Col className={style.block} span={10}>
          <code>
            {sourceCode || ''}
          </code>
        </Col>

        <Col className={style.block} span={10}>
          <code>
            {newCode || ''}
          </code>
        </Col>
      </Row>
    </>
  )
})

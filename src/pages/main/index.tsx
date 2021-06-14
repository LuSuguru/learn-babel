import { memo, useState } from 'react'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { Button, Space } from 'antd'
import t from '@babel/types'

const formatCode2AST = (code: string) => parse(code, {
  allowImportExportEverywhere: true,
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
  ],
})

interface Props {
}

function Main(props: Props) {
  const [ast, setAST] = useState<t.File>(null)

  const onClickAst = () => {
    const code = `
    console.log('hello world')
  `

    setAST(formatCode2AST(code))
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

  return (
    <>
      <Space>
        <Button onClick={onClickAst}>parse</Button>
        <Button onClick={onTraverse}>traverse-visitor</Button>
        <Button onClick={onTraverseEnter}>traverse-visitor-enter.exit</Button>

      </Space>
      <div style={{ whiteSpace: 'pre' }}>
        {ast && JSON.stringify(ast, null, 2)}
      </div>
    </>
  )
}

export default memo(Main)

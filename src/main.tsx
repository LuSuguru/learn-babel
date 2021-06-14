import ReactDOM from 'react-dom'

import '@/assets/reset.css'
import 'antd/dist/antd.less'
import buffer from 'buffer'

import App from './app'

window.Buffer = buffer.Buffer

ReactDOM.render(<App />, document.getElementById('root'))

if ((module as any).hot) {
  (module as any).hot.accept()
}

import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import ruby from 'highlight.js/lib/languages/ruby'
import php from 'highlight.js/lib/languages/php'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import csharp from 'highlight.js/lib/languages/csharp'

hljs.registerLanguage('javascript', javascript); hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript); hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python);         hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash);             hljs.registerLanguage('shell', bash); hljs.registerLanguage('sh', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml);              hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml);             hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp);               hljs.registerLanguage('c', cpp)
hljs.registerLanguage('ruby', ruby);             hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('php', php)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin);         hljs.registerLanguage('kt', kotlin)
hljs.registerLanguage('csharp', csharp);         hljs.registerLanguage('cs', csharp)

export default hljs

export const HLJS_CSS = `
.hljs-keyword,.hljs-selector-tag,.hljs-built_in,.hljs-name,.hljs-tag { color: #c792ea }
.hljs-string,.hljs-attr,.hljs-selector-attr,.hljs-selector-pseudo { color: #c3e88d }
.hljs-comment,.hljs-quote { color: #546e7a; font-style: italic }
.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable { color: #f78c6c }
.hljs-title,.hljs-section,.hljs-selector-id,.hljs-type,.hljs-class { color: #82aaff }
.hljs-symbol,.hljs-bullet,.hljs-subst,.hljs-meta,.hljs-link { color: #89ddff }
.hljs-deletion { color: #e06c75 }
.hljs-addition { color: #98c379 }
.hljs-emphasis { font-style: italic }
.hljs-strong { font-weight: bold }
`

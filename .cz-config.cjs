module.exports = {
  types: [
    { value: '✨', name: 'feat:     新功能' },
    { value: '🐛', name: 'fix:      修复 Bug' },
    { value: '🔨', name: 'refactor: 代码重构' },
    { value: '💄', name: 'style:    样式/UI' },
    { value: '📝', name: 'docs:     文档/示例' },
    { value: '🔧', name: 'chore:    构建/配置' }
  ],

  subjectLimit: 80,
  skipQuestions: ['scope', 'body'],

  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix', 'refactor']
}

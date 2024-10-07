module.exports = {
  types: [
    {
      value: '🎉',
      name: ' - Initialize'
    },
    {
      value: '✨',
      name: ' - New Feature'
    },
    {
      value: '🐛',
      name: ' - Bug Fix'
    },
    {
      value: '🔨',
      name: ' - Refactor'
    },
    {
      value: '💄',
      name: ' - User Interface'
    },
    {
      value: '✏️️️',
      name: ' - Code Style'
    },
    {
      value: '📝',
      name: ' - Documentation'
    },
    {
      value: '🔥',
      name: ' - Remove Garbage'
    },
    {
      value: '⏪',
      name: ' - Revert'
    },
    {
      value: '🔀',
      name: ' - Branch Merge'
    },
    {
      value: '✅',
      name: ' - Test Code'
    },
    {
      value: '🔧',
      name: ' - Configuration Changes'
    },
    {
      value: '📦',
      name: ' - Destination Files'
    }
  ],

  subjectLimit: 80,
  skipQuestions: ['scope', 'body'],
  
  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix']
}

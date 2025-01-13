import { defineNoteConfig } from 'vuepress-theme-plume'


export default defineNoteConfig({
  dir: 'docs',
  link: '/docs/',
  sidebar: [
    {
      text: '指南',
      items: [
        'bar',
        'foo',
      ]
    },
    {
      text: '禁列表',
      collapsed: false,
      prefix: 'ban',
      items: [
        'banlist'
      ]
    }
  ]

})

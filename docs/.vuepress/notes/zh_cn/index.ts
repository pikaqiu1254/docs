import { collapse } from 'artalk/i18n/ja'
import { defineNoteConfig } from 'vuepress-theme-plume'


export default defineNoteConfig({
  dir: 'docs',
  link: '/docs/',
  sidebar: [
    {
      text: '主页',
      prefix: 'home',
      items: [
        '个人主页-尘甲'
      ]
    },
    // {
    //   text: '封禁列表',
    //   collapsed: false,
    //   prefix: 'ban',
    //   items: [
    //     'banlist'
    //   ]
    // },
    {
      text: '资源分享',
      collapsed: false,
      prefix: '资源分享',
      items: [
        '整合包',
        '其他资源'
      ]
    },
    {
      text: '服务器',
      collapsed: false,
      // prefix: '服务器',
      items: [
        {
          text: '四周目',
          collapsed: false,
          prefix: '四周目专用指南',
          items: [
            '四周目新手指南',
            '服务器生存公约',
            '装备最优附魔表',
            '机器命令指南',
          ]
        }  
      ]
    },
    {
      text: '关于',
      items: [
        '关于'
      ]
    }
  ]

})

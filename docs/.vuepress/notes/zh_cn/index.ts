import { defineNoteConfig } from 'vuepress-theme-plume'


export default defineNoteConfig({
  dir: 'docs',
  link: '/docs/',
  sidebar: [
    {
      text: '通用指南',
      items: [
        '爱玩游戏的尘甲-四周目新手指南',
        '服务器生存公约',
        '装备最优附魔表'
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
      text: '建筑',
      collapsed: false,
      prefix: '建筑',
      items: [
        '计划未来建筑',
        '已完成的建筑'
      ]
    }
  ]

})

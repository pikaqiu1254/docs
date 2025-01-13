import { defineNotesConfig } from 'vuepress-theme-plume'
import guide from './zh_cn/index.ts'

export default defineNotesConfig({
  dir: '/notes',
  link: '/',
  notes: [ 
    guide
  ]
})
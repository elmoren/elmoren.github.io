import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nate Elmore",
  description: "Nate Elmore - Software Engineer",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Billings Commuter Challenge', link: '/bilings-commuter-challenge' },
      { text: 'Other Projects', link: '/markdown-examples' },
      { text: 'Leatherworking', link: '/leatherworking' },
      { text: 'CV', link: '/cv' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/elmoren' },
      { icon: 'instagram', link: 'https://www.instagram.com/birddogleather' }
    ]
  },
  outDir: './dist',
  base: ''
})

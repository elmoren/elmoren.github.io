import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nate Elmore",
  description: "Nate Elmore - Software Engineer",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Billings Commuter Challenge', link: '/commuter-challenge' },
      { text: 'Leatherworking', link: '/leatherworking' },
      { text: 'CV', link: '/cv' }
    ],

    sidebar: [
      // {
      //   text: 'Examples',
      //   items: [
      //     { text: 'Markdown Examples', link: '/markdown-examples' },
      //     { text: 'Runtime API Examples', link: '/api-examples' }
      //   ]
      // }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/elmoren' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/n-elmore/' },
      { icon: 'instagram', link: 'https://www.instagram.com/birddogleather' }
    ],

    footer: {
      message: 'Contact me at <a href="mailto:nate@njelmore.com">nate@njelmore.com</a>',
      copyright: 'Copyright © 2024-present Nathan Elmore'
    }
  },
  outDir: './dist',
  base: ''
})

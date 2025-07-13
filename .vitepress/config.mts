import { defineConfig } from 'vitepress'

import findPosts from './FindPosts'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nate Elmore",
  description: "Nate Elmore - Software Engineer",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Billings Commuter Challenge', link: '/commuter-challenge/' },
      { text: 'Posts', link: '/posts/' },
      { text: 'Leatherworking', link: '/leatherworking/' },
      { text: 'Résumé', link: '/resume/' },
    ],

    sidebar: {
      'posts': [
        {
          text: 'Posts',
          items: [
            {
              text: "Post List",
              link: "/posts/",
            },
            {
              text: 'Recent Posts',
              items: findPosts('posts/posts/')
            }
          ]
        },
      ],
      'commuter-challenge': [
        {
          text: "Commuter Challenge",
          items: [
            {
              text: "How It Started",
              link: "/commuter-challenge/",
            },
            {
              text: 'Recent Posts',
              items: findPosts('commuter-challenge/posts/')
            }
          ]
        },

      ]
    },

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

import { createContentLoader } from 'vitepress'

export interface Post {
  title: string;
  url: string;
  date: string;
  formattedDate: string;
  excerpt: string;
  group: string;
}

declare const data: Post[]
export { data }

export default createContentLoader('/posts/posts/**/*.md', {
  excerpt: true,
  transform(raw): Post[] {
    return raw
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url,
        excerpt,
        date: frontmatter.date,
        formattedDate: formatDate(frontmatter.date),
        group: frontmatter.group
      }))
      .sort((a, b) => b.date - a.date)
  }
})

function formatDate(raw: string): string {
  const date = new Date(raw)
  return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
}
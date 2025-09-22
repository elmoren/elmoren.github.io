---
title:  Posts
---

<script setup lang="ts">
import { data as posts } from '/.vitepress/posts.data.ts'

const grouped = new Map();
posts.forEach((item) => {
     const key = item.group || "Posts";
     const collection = grouped.get(key);
     if (!collection) {
         grouped.set(key, [item]);
     } else {
         collection.push(item);
     }
});

</script>

# {{ $frontmatter.title }}

<template v-for="(group) in new Map([...grouped].sort()).keys()">

### {{ group }}
<ol>
    <li v-for="(post, i) in grouped.get(group)">
        {{ post?.formattedDate }} - <a :href="post.url">{{ post.title }}</a>
    </li>
</ol>
</template>

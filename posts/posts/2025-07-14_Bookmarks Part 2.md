---
title: Pairing With Gemini Part 2 - Folders and Edge Cases
group: Pairing With Gemini
date: 2025-07-14
---

# {{ $frontmatter.title }}

## Folders

Part 2 of the the bookmarks project with Gemini. [Part 1](/posts/posts/2025-07-12_Coding%20With%20Gemini.md)

It's late so this will be a short one. I wasn't thinking I would be back for a week or so but I entered a prompt before mowing the lawn and thought about it the entire time. I wanted to see if Gemini could hand the folders better now that we have the column structure in place. But could it do it?

I was more prepared this time. I wrote a prompt with specific requirements. The bookmarks can be grouped in a folder. Folders can be at most one level deep. The bookmarks and the folder should only take up one cell in the grid. Bookmarks in a folder should be indented to indicate they are in te folder.

![Bookmark Folders](/public/posts/gemini/folders_1.png)

Wow... that worked on the first try. What method did Gemini take accomplish it? It simply added a computed a flattened bookmarks list and iterated over those, adding a different classes to the template if it was a folder or a bookmark in a folder.

```js
const flattenedBookmarks = computed(() => {
    const flatList = [];
    props.bookmarks.forEach(item => {
        flatList.push({ ...item, isFolder: !!item.children });
        if (item.children) {
            item.children.forEach(child => {
                flatList.push({ ...child, isIndented: true });
            });
        }
    });
    return flatList;
});
```

Not too shabby. After some poking around, I found a bug where sometimes last page of the bookmarks wasn't being displayed. The total number of pages was being determined by the length of the bookmarks property rather than the flattened list. Easy fix.

## Refactoring

Let's try something a little different. I noticed some of the variable names no longer make sense (`estimatedRows` was no longer an estimate, for example), the class calculation could be a computed for readability, and I was getting tired of the useless comments. `overflow-y: auto; /* Enable vertical scrolling */`. Gee, thanks.

> Refactor the code in BookmarksTray.vue. There are some variable names that no longer make sense and make the class list of the paginated bookmarks a computed. Remove the comments - they are stating the obvious.

It had no problem extracting the classes to a computed, but didn't fare as well on the other two tasks. I purposefully didn't tell it which variable names I didn't like to see what it came up with so I don't blame it. It decided that `flattenedBookmarks` should be changed to `processedBookmarks` and that `flatList` should just be `list`. I can't fault it for that, I was more curious what it would come up with on its own.

Oddly, it also only removed the comments in the JavaScript and left the comments in the styles untouched so I had it remove those too. (Maybe a little too much snark in the previous prompt? 🤔)

## Edge Case - Minimal Number of Bookmarks

The last issue bugging me was that the height of the tray added a lot of empty space when there were only a few bookmarks and thought it should shrink. So I *probably should* just remove the minimum height, or I could see what Gemini would do.

> When there are zero or a small number of rows, the tray doesn't shrink and there is a lot of empty space. Update the tray so that the height shrinks when there are less items than the maximum number of rows 15.

Not good. It dynamically reduced the number of rows which just looked awful in column order especially with folders. Let's revert and try again with just a slight adjustment...

> When there are zero or a small number of rows, the tray doesn't shrink and there is a lot of empty space. Update the tray so that the height shrinks when there are less items than the maximum number of rows 15. **It should fill those 15 rows up in the first column before adding subsequent columns.**

There we go, it removed the minimum height and changed the template grid to `auto-fill` instead of `auto-fit`. However, there's a bunch of other changes... For some reason Gemini also decided to rename every variable and function in the component with the name "page" to "grid". ¯\\\_(ツ)\_/¯

Oh well, easily reverted. The bookmarks tray is coming along and looking better. Overall, this was another successful session.

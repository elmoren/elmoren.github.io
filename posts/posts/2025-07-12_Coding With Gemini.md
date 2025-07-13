---
title: I Paired with Gemini and This is What I Learned
---

# {{ $frontmatter.title }}

I'm skeptically excited about AI Agent coding. I started working with Copilot about a year ago and I generally appreciate it. I treat it more as a smart auto-complete and sometimes, it's amazing. It saves a significant amount of typing boilerplate and sometimes nails little snippets of logic. Other times it's so bad I say "Sure, Copilot, let's get you to bed" and turn it off.

Like many others, I also had pretty good luck using [phind](https://www.phind.com) and other LLMs to get information or to explain an algorithm to me as if I were five. But, I have no experience Vibe coding or agent coding. Vibe coding just feels like a way for a developer to create a year's worth technical debt in a week. I was holding off on AI agents because I was worried about the security implications (and still am). Besides, how useful could an AI agent be in an entire project given how often Copilot suggests complete nonsense?

I wanted to try coding with an AI agent after listening to an interview with Kent Beck that a colleague sent me on the [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent). There's a plethora of content about AI coding being published daily, but this is the first one that's made me excited about trying it out. He just made it sound so fun and I like the term he uses to describe it: "Augmented Coding".

So, here we are. I installed the Google Gemini CLI and shortly after I was pairing with Gemini. What should we build?

## The Problem: A Bookmarks Display

There's a small problem from work that's been kicking around in my head. At PAI, we are taking small steps every day to migrate 20+ years of JavaScript, jQuery, and RequireJS to TypeScript and Vue. My feature team is currently working on migrating the navigation bar and we want to improve how we handle bookmark navigation.

The current navigation bar displays the bookmarks side-by-side on desktop and is moved into menu on mobile. For the majority of users, this works fine because they have 10 or less bookmarks. For the heavy bookmarks users with >20 bookmarks, this can be a pain because of horizontal scrolling in desktop and a bloated menu in mobile and it's worse for power bookmarks users (>40 bookmarks). We need a solution that works for all customers.

This is a problem that I'm sure many front end developers encounter frequently. If it's not bookmarks, it's is some other large list of items that needs to display on any screen size and paginates intelligently. Because of these reasons I thought it would be a good first task in the world of coding with an AI agent.

I implemented a short code [spike](https://en.wikipedia.org/wiki/Spike_(software_development)) to explore the idea of creating a bookmarks tray in a brand new project. On desktop it should quickly show hundreds of bookmarks and on mobile it should separate bookmarks from the menu and show them in pages.

## AI Agent Coding

### Getting Started

The first prompt (I'm paraphrasing, I should have logged my prompts):

> Before we code let's start with planning. I want to make a proof of concept that displays between 0 and 200 bookmarks in a tray under a menu bar. We will create it in these steps:
>
> 1. Set up the project with Vue and Vite. It will use plain JavaScript and CSS.
> 2. Create a simple menu bar to mock an real one with a menu on the left and a username on the right.
> 3. Create a bookmarks tray vue component that we can add into the menu bar.

I pressed enter and after thinking it asked permission to run some npm commands. I wanted it to confirm the plan first before writing anything but that's okay. I gave it permissions and quickly had a new Vue project.

The first snag I hit was when it wanted to run the Vite dev server. I said okay and it started it, but then I couldn't interact with Gemini because it was busy running the dev server. No problem, I ran the dev server in another terminal and continued.

Next I told Gemini to continue creating the mock navigation bar and a button to open the bookmarks tray. It initially created a small menu, stuck in the center of the screen (I wish I thought to take a screen shot). So I said "Make it 100% width and sticky at the top of the screen." and to "Remove the unused vue demo files that come with the new project". And here is what I received:

![Step 1](/public/posts/gemini/step1.png "Step 1: Mock menu bar and bookmarks")

Looks good so far. The next prompt was something along the lines of "Change the bookmarks menu to be a tray with 100% width below the menu and add 200 placeholder bookmarks"

![Step 2](/public/posts/gemini/step2.png "Step 2: Bookmarks converted to a tray")

We iterated for a bit, changing it to use the Vue Composition API instead of Options API, adding buttons to toggle between 0, 20, 50, 100, and 200 bookmarks, and page navigation. Then I told Gemini to change the page navigation from buttons to arrows and dots.

![Step 3](/public/posts/gemini/step3.png "Step 3: Page navigation")
![Step 4](/public/posts/gemini/step4.png "Step 4: Arrows and Dots")

Wow, this is going great!

### Difficulties

In the next steps I struggled for a while to get it to generate something useful. I needed to change the bookmarks to flow top to bottom in the columns so that bookmarks are displayed in an order that makes sense. Users can group bookmarks into folders and or they could be sorted. A left-to-right ordering doesn't work well when you have dozens of bookmarks.

I think my first mistake was the prompts I was using for this. I asked for both folder grouping and column order at the same time and I got something like this:

![Step 5](/public/posts/gemini/step5.png "Step 5: Struggling with order")

I told it to forget about the folders and spent the next couple hours going back and forth with Gemini, coming up with new prompts and it unsuccessfully doing what it wanted. It was frustrating, to say the least. It really struggled keeping the items in the tray without overflowing during mobile and resizing the browser.

I don't blame the tool, my prompts were often ambiguous and it's a little more complex than it sounds. It's not trivial to display a variable number of items and have it dynamically determine the ideal number of items per page, rows and columns to display in many screen sizes and on browser windows that can resize at any time.

### The Result

The breakthrough came when I gave Gemini more constraints. I simplified the problem limiting the maximum number of rows and columns it supports. Gemini found the right combination of CSS and JavaScript that dynamically calculated the number of bookmarks per page. I manually adjusted the calculation so that it wouldn't have empty grid cells on multi-page use cases and tweaked some css. Overall I'm happy with it as a proof of concept. Here's the results in desktop and mobile:

![Desktop](/public/posts/gemini/final.png "Final result in desktop")
![Mobile](/public/posts/gemini/mobile.png "Final result in mobile")

There are a few more issue to solve: folders and handling long bookmark names. It calculates the number items per page based on the minimum column width and I don't know how it'll handle that. But this is enough for now.

## Conclusions

So did the AI Agent Coding/Augmented Coding live up to my expectations? Yes and no. I'm thrilled at how it turned out and despite the frustrations in the middle, I'm going to keep exploring it. I'll keep improving my prompting. It felt a bit more like supervised coding than augmented coding, so I'm going to be more active in editing the code next time. I don't see this replacing programmers any time soon, but I expect as these get better and better, every programmer will be using them to boost their productivity.

[View the code it generated here](https://github.com/elmoren/bookmark-playground)

### Pros

- It was fun!
- The speed to create this proof of concept is remarkable.
- I didn't have to do any of the boring parts like setting up a new project, removing the demo files, setting up a mock menu bar, or futzing around with CSS.
- I am impressed by its ability to convert options API to the composition API. Granted it was only three simple Vue components. But could it be used to quickly migrate our entire library to composition API, or deprecated features when upgrading to new software versions? These maintenance tasks are some of the most tedious jobs in development.

### Cons

Here's a list of the cons and struggles I came across in no particular order.

- I would have learned more about CSS grids if I did it manually.
- While this is a great tool that will continue to improve, I think it is also a very dangerous one for novice developers. Will a developer be able to learn in-depth when most of the code is not written by them? Will they be sufficiently capable to fix a complex bug?
- I told it to forget about grouping bookmarks in folders and it would randomly come back and try to add folders back in.
- It would randomly change a seemingly unrelated CSS gap to 10 pixels in prompts that were seemingly unrelated. I kept telling to reset it 4px, but it would randomly decide it needed to be 3px or 10px a few prompts later.
- It would ask to run git commands right after making changes. I told it to stop and that I would decide when to commit after reviewing. It stopped for a while but would then start asking again.
- It would constantly apologize or say "oh you are right" whenever I made adjustments to prompts.
- It adds an abundance of useless comments
- It struggled with changing grid to column order and dealing with overflow. I'm sure this is partly because of my prompts.

This was a brand new project. Are AI agents capable enough to find a project's helper libraries, toolkits, and reusable CSS classes that already exist in the code or will they constantly recreate them (and therefore introducing entropy)? Either way, I am excited to continue exploring what these tools can do.

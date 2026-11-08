---
title: Claude Code and a Commuter Challenge Refresh
group: Generative AI
date: 2026-11-06
---
---

# {{ $frontmatter.title }}

It's been months since my last post and over a year since I wrote about Generative AI. I wanted to write more but sometimes other things in life get priority. We recently spent the summer renovating our kitchen and I insisted on doing most of it ourselves. So, most of our evenings and weekends this summer have was spent doing that.

I've been cooped up and sick most of the week and thought this would be a perfect time to give the Commuter Challenge a refresh. I'm also going to talk more about how my thoughts have changed about Generative AI, because a lot has changed since my first experiments with Gemini and Qwen.

## Introduction

While this is my first post in over year on Generative AI, I have using it at home and at work. The first experiences I wrote about last year were exciting, fun, and a bit frustrating. While useful, it felt more like a fun toy than a tool I wanted to use daily. A lot has changed since then. When Claude 4.5 came out, things really started getting good. A lot of my previous complaints just no longer apply.

My goals today are to refresh the Commuter Challenge's UI and make it more pleasant to use. It was sorely needed and honestly was lackluster to begin with.

## Generative AI in the Last Year

Since those first early experiments, I used it in other projects and am started using it in work. One successful method is to define new feature in a markdown file and iterate on it with Claude defining the requirements, edge cases, etc. It even comes back and asks questions when it thinks something is ambiguous. You iterate until you think you have everything covered and tell Claude to implement it. Then you review the code, tests, and merge it in. This is a pretty common loop you see with these tools. 

In one experiment, I created reusable instructions to migrate entire legacy RequireJS modules to Vue. In one case, we had a two comparable and feature-rich pages. The first page was migrated manually by took almost two weeks to be converted, tested and deployed. With these instructions and Claude, it made all the changes on a git worktree while I did other tasks. The whole process took maybe six hours. Most of that was code review and verification. 

The goals today should be pretty easy in comparison.

## The Commuter Challenge

### The Setup

Today I am using RubyMine, its built-in MCP server, Claude CLI and Opus 5.5. 

### The Process

Today I kept it simple. I opened the project and a claude cli in RubyMine and iterated with it a few times to create a simple AGENTS.md. The main points I wanted it to handle were using the existing [Bulma](https://bulma.io) css classes and to be aware of few items in the stack like Pagy and Hotwire Turbo.

**Goals**
1. Learn how well Claude works in an established Rails project. (I wasn't expecting any issues)
2. Make the Commuter Challenge home page look nicer
3. Fix that hideous footer
4. Fix those ugly event and incentive cards
5. Tighten up the styling on all the forms and error reporting

I won't go into much detail on the process of updating the UI here. It's not all that interesting or novel. I wrote short prompts instructing Claude the changes I wanted, and iterating until it looked good enough. I wanted to see what would happen if I simply told Claude the footer was ugly and to fix it. And that's how I got the generic footer you see on every other website. It's not bad by any means, there's a reason so many websites use that format.

There were two things I was not expecting though from a session started to update some page styling:

1. Claude found a few small bugs and suggested changes for them. One of the bugs was a form field that lacked date validation. Neat!
2. Claude decided that my tests were insufficient after it looked at my controllers (Claude was right). It wrote the tests it thought it needed without prompting. They were mostly good tests too.

## Conclusion

Today was a fun little coding session with Claude. We gave the Billings Commuter Challenge a much-needed refresh. While far from perfect, I'm happy with the improvements to the overall look of the website. It was a nice surprise to get few bugs fixed too!

### The Good

- It looks much nicer.
- Claude noticed when tests were missing for the controllers and added them.
- It pointed out a couple bugs where a user could get the rails error page.
- No unexpected issues - it made the changes I asked and didn't write anything crazy.

### The Bad

- The Commuter Challenge kind of looks like every other website you see these days. 
- It's not perfect. It still tried to recreate css rules and helper functions sometimes. But it can be mostly mitigated with a good AGENTS.md file.
- It sometimes produces code I wouldn't want in production. But it's happening less and less and that's what we review for.
- I worry quite a bit about skill atrophy, and how is a junior supposed to learn if they never write code? How can they learn to make good design decisions, perform good reviews, be able to fix outages at 2AM or spot traps without the experience of writing code?

### What's Next?

For the next session, I would like to implement some new features requests from the event organizers. These will require more back end changes and database migrations, and I'm interested to see how it does with Ruby on Rails. I expect it will do it just fine. 

---
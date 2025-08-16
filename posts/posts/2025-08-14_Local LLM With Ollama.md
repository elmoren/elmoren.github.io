---
title: Running an AI Agent Locally?
---

# {{ $frontmatter.title }}

In my latest experiments, I wanted to try running LLMs locally. The easiest way looked to be with Ollama so I started with that. I'm looking at [lama.cpp](https://github.com/ggml-org/llama.cpp) next.

For reference I am running on a MacBook Pro with a M3 Max and 36GB of memory.

## Setup

### The Tools

1. [Ollama](https://ollama.com) - Downloads and runs the AI models
2. [Continue.dev](https://www.continue.dev) - A platform to connect the IDE to the running Ollama models
3. Visual Studio Code as my IDE with the Continue extension
4. Models Tried:
    - [Qwen 2.5 Coder-32b](https://ollama.com/library/qwen2.5-coder)
    - Qwen 2.5 Coder-32b-base-Q4_K_M (4bit Quantized, Grouped quantization, Medium Precision)
    - Qwen 2.5 Coder-14b

## The Project

I recently started learning Japanese. I wanted to do so after we hosted a Japanese exchange student a couple years ago but only recently started. Hiragana and Katakana are some of the first things you need to learn. So why not make a quiz? I'm a big fan of [Tofugu's](https://kana-quiz.tofugu.com) quiz so I'm going to try and make something similar.

I'm focused on learning how to code with AI, the tooling, etc. so I'm keeping to simple projects that can be completed in an evening or two.

### Tool Setup

 I won't go too much into detail on setup instructions because there are already many quality resources out there. Ollama is easy to use. After installation you pick the model you want and run a command and it downloads and runs it. I started with Qwen 2.5 Coder-32b.

 While it downloaded, I added the Continue extension to VS Code and set up the config file:

 ```yaml
name: Local Assistant
version: 1.0.0
schema: v1
models:
  - name: Qwen2.5-Coder 32b
    provider: ollama
    model: qwen2.5-coder:32b-instruct
    roles:
      - autocomplete
      - chat
      - edit
      - apply
    capabilities:
      - tool_use
    models:
  - name: Nomic Embed Text
    provider: ollama
    model: nomic-embed-text:v1.5
    roles:
      - embed
 ```

I asked Qwen a few test questions and we were up and running.

### Getting Started

First thing I did was write a fairly long prompt that we were building a simple quiz app to learn Hiragana. I asked for a Vue project with TypeScript and explained it would show one Hiragana kana as the question and expect the Romaji as the answer. Then I pressed enter and waited... and waited... Eventually it started outputting text on what it would do and how. It then output JSON containing the command to init a new Vue project. Hmm, something is wrong... Ollama says this should support tool calling so maybe Continue.dev is having issues?

I poked at that for a while and eventually gave up. I created the Vue project manually and started with a `QuizQuestion` question component I asked it to generate a TS constant containing each Hiragana as the object key and the Romaji as the value and it suggested.

```TypeScript
  const HiriaganaToRomanji: {
    'い': 'i',
    'あ': 'a',
    'う': 'u',
    'え': 'e',
    'お': 'o',
    // ... and so on.
  }
```

Now we're cooking! It generated the content of simple vue component that display the Hiragana and compared it to the input to mark the question as correct or incorrect. It did it... very slowly. Looking the activity monitor, Ollama is using all my poor MacBook's memory. Let's try a a smaller model.

I downloaded the qwen2.5-coder:32b-instruct-q4_K_M which has 4 bits of quantization and more manageable system requirements. This worked well too, but still worked slower than I wanted. I went to yet a smaller model, the qwen2.5-coder:14b.

Continue reported this model wasn't capable of being used as an agent. It was only able to chat and use the in editor code prompts. However I was able to use the the context commands (`@File`) to give it some context and got into a good rhythm. It was able to generate some unit tests for the QuizQuestion.vue component on its own. I ended staying up way too late, but by the end recreated the Tofugu quiz.

![Quiz App Part 1](/public/posts/localllm/QuizApp_1.png)

## Final Thoughts

### Successes

- We generated a handful of unit Vite Tests with little fuss.
- Qwen generated a large data structure mapping Hiragana to Romaji without having to type it all out. Then Qwen was able convert the JSON object into an array of objects matching an interface.
- Using the `@File` to give the model context helped immensely in getting better results.
- The chat mode helped me answer some questions without needing switch to a browser to look up documentation.

### Difficulties

- It occasionally bugs out and the only thing it output was JSON. I'm not sure which component was the culprit (I suspect Continue) but restarting everything reset it.
- I could not get it to automatically run tools. For example, running commands to create a new Vue project or install eslint. It just output JSON containing the commands.
- I think I'm missing something in the Continue.dev configuration to give the model context. It worked well when I gave the prompts file contexts via the `@File`.
- It was so verbose when generating code. It wrote paragraphs upon paragraphs of explanation for simple code and I constantly told it to only use 1 sentence to explain the code.
- It was painfully slow compared to Gemini, but that's to be expected with the hardware I'm using.

### In Conclusion

- I read a lot of success stories with similar setups, but I can't help but feel a little underwhelmed. Is there something I'm missing or have wrong in the setup/continue.dev config? I need better hardware certainly, but the non agent models worked fast enough.
- The most success I had with this was with asking for tests, documentation, smart autocomplete and generating small, well defined functions. It did save a lot of typing.
- Everything the AI coding space moving incredibly fast. I find that posts not even six months old were often out of date and missing information. Heck, this post is already out of date... Qwen3-coder is already released.

Next I'll get it working with llama.cpp and models built with [MLX](https://opensource.apple.com/projects/mlx/) to see if I have better luck.

I would love you hear your experiences with running Local LLMs, Qwen and/or Continue. Shoot me an email with your experiences or if you have any thoughts!

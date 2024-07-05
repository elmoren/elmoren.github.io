<script setup lang="ts">

</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <main>
    <RouterView />

    <section class="section">
    <div class="container">
      <h1 class="title">
        Hello There
      </h1>
      <p class="subtitle">
        General Kenobi
      </p>
    </div>
  </section>
  </main>
</template>

<style>
</style>

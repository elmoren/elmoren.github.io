<script setup lang="ts">
import { RouterView } from 'vue-router';


</script>

<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="https://www.njelmore.com">
        Nate Elmore
      </a>

      <a class="navbar-burger" role="button" aria-label="menu" aria-expanded="false" data-target="navBarId">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navBarId" class="navbar-menu">
      <div class="navbar-start">
        <RouterLink class="navbar-item" to="/">Home</RouterLink>
        <RouterLink class="navbar-item" to="/about">About</RouterLink>
      </div>
    </div>

  </nav>

  <main>
    <div class="content">
      <RouterView />
    </div>
  </main>
</template>

<style></style>

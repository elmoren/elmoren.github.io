<script setup lang="ts">
import { RouterView } from 'vue-router';


</script>

<template>
  <nav class="navbar has-shadow is-spaced" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <RouterLink class="navbar-item" to="/">Nate Elmore</RouterLink>

      <a class="navbar-burger" role="button" aria-label="menu" aria-expanded="false" data-target="navBarId">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navBarId" class="navbar-menu">
      <div class="navbar-start">
        <RouterLink class="navbar-item" to="/about">About</RouterLink>
        <RouterLink class="navbar-item" to="/projects">Projects</RouterLink>
        <RouterLink class="navbar-item" to="/commuterchallenge">Billings Commuter Challenge</RouterLink>
        <RouterLink class="navbar-item" to="/cv">CV</RouterLink>
        <RouterLink class="navbar-item" to="/leatherwork">Leatherworking</RouterLink>
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

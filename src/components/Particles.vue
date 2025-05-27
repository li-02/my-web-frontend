<template>
  <div class="absolute inset-0 z-10">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="absolute w-1 h-1 bg-accent rounded-full opacity-60"
      :style="particle.style"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Particle {
  id: number
  style: {
    left: string
    top: string
    animation: string
    animationDelay: string
  }
}

const particles = ref<Particle[]>([])

const createParticles = () => {
  const particleCount = 20
  const newParticles: Particle[] = []

  for (let i = 0; i < particleCount; i++) {
    const particle: Particle = {
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `float ${Math.random() * 3 + 3}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 6}s`
      }
    }
    newParticles.push(particle)
  }

  particles.value = newParticles
}

onMounted(() => {
  createParticles()
})
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>

<template>
  <div class="particles">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="particle"
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
    animationDelay: string
    animationDuration: string
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
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${Math.random() * 3 + 3}s`,
      },
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
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0.6;
  animation: float ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>

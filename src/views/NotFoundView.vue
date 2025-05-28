<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goHome = () => {
	router.push("/");
};
</script>

<template>
	<div class="not-found">
		<h1>404</h1>
		<p>页面未找到</p>
		<button @click="goHome">返回首页</button>
	</div>
</template>

<style scoped>
.not-found {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	text-align: center;
	background-color: var(--bg-primary);
	color: var(--text-primary);
}

.not-found h1 {
	font-size: 96px;
	font-weight: bold;
	margin: 0;
}

.not-found p {
	font-size: 18px;
	margin: 16px 0;
}

.not-found button {
	padding: 8px 16px;
	font-size: 16px;
	color: var(--bg-primary);
	background-color: var(--accent);
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.not-found button:hover {
	background-color: var(--accent-hover);
}
</style>

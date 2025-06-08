<template>
	<nav :class="['nav', scrollY > 100 ? 'nav-scrolled' : '']">
		<div class="nav-container w-full">
			<router-link to="/" class="logo">我的博客</router-link>
			<ul class="nav-links">
				<li v-for="(item, index) in navItems" :key="index">
					<a 
						v-if="item.id === 'articles'" 
						href="/articles" 
						@click="navigateToBlog"
					>
						{{ item.name }}
					</a>
					<a 
						v-else 
						:href="`#${item.id}`" 
						@click="smoothScroll"
					>
						{{ item.name }}
					</a>
				</li>
			</ul>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

interface NavItem {
	name: string;
	id: string;
}

const router = useRouter();
const scrollY = ref(0);

const navItems: NavItem[] = [
	{ name: "首页", id: "home" },
	{ name: "文章", id: "articles" },
	{ name: "关于", id: "about" },
	{ name: "联系", id: "contact" },
];

const handleScroll = () => {
	scrollY.value = window.scrollY;
};

const smoothScroll = (event: Event) => {
	event.preventDefault();
	const target = event.target as HTMLAnchorElement;
	const href = target.getAttribute("href");
	if (href?.startsWith("#")) {
		// 如果不在首页，先跳转到首页再滚动
		if (router.currentRoute.value.path !== "/") {
			router.push("/").then(() => {
				setTimeout(() => {
					const element = document.querySelector(href);
					if (element) {
						element.scrollIntoView({ behavior: "smooth", block: "start" });
					}
				}, 100);
			});
		} else {
			const element = document.querySelector(href);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}
	}
};

const navigateToBlog = (event: Event) => {
	event.preventDefault();
	router.push("/articles");
};

onMounted(() => {
	window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
	window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* 导航栏 */
.nav {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	width: 100%;
	background: rgba(15, 20, 25, 0.9);
	backdrop-filter: blur(20px);
	z-index: 1000;
	padding: 1rem 0;
	transition: all 0.3s ease;
}

.nav-scrolled {
	background: rgba(15, 20, 25, 0.95);
}

.nav-container {
	margin: 0 auto;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 2rem;
}

.logo {
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--accent);
	text-decoration: none;
	transition: transform 0.3s ease;
}

.logo:hover {
	transform: scale(1.05);
}

.nav-links {
	display: flex;
	gap: 2rem;
	list-style: none;
}

.nav-links a {
	color: var(--text-secondary);
	text-decoration: none;
	font-weight: 500;
	transition: color 0.3s ease;
	position: relative;
}

.nav-links a:hover {
	color: var(--accent);
}

.nav-links a::after {
	content: "";
	position: absolute;
	bottom: -5px;
	left: 0;
	width: 0;
	height: 2px;
	background: var(--accent);
	transition: width 0.3s ease;
}

.nav-links a:hover::after {
	width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.nav-links {
		display: none;
	}
}
</style> 
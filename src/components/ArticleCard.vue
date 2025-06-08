<template>
	<article class="article-card" :class="{ 'card-visible': isVisible }" ref="cardRef">
		<div class="article-meta">
			<div class="article-date">
				<span>📅</span>
				<span>{{ article.date }}</span>
			</div>
			<span class="article-category">
				{{ article.category }}
			</span>
		</div>

		<h3 class="article-title">
			{{ article.title }}
		</h3>

		<p class="article-excerpt">
			{{ article.excerpt }}
		</p>

		<a href="#" class="read-more" @click.prevent="readMore"> 阅读全文 → </a>
	</article>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

interface Article {
	id?: number;
	date: string;
	category: string;
	title: string;
	excerpt: string;
}

interface Props {
	article: Article;
}

const props = defineProps<Props>();

const cardRef = ref<HTMLElement>();
const isVisible = ref(false);

const router = useRouter();

const readMore = () => {
	// 后续可以实现跳转到文章详情页
	if (props.article.id) {
		console.log("跳转到文章详情页:", props.article.id);
		router.push(`/articles/${props.article.id}`);
	} else {
		console.log("阅读更多");
	}
};

onMounted(() => {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					isVisible.value = true;
					observer.unobserve(entry.target);
				}
			});
		},
		{
			threshold: 0.1,
			rootMargin: "0px 0px -50px 0px",
		}
	);

	if (cardRef.value) {
		observer.observe(cardRef.value);
	}
});
</script>

<style scoped>
.article-card {
	background: var(--bg-secondary);
	border-radius: 20px;
	padding: 2rem;
	transition: all 0.6s ease;
	border: 1px solid rgba(100, 255, 218, 0.1);
	position: relative;
	overflow: hidden;
	opacity: 0;
	transform: translateY(30px);
}

.article-card::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 4px;
	background: var(--gradient);
	transform: scaleX(0);
	transition: transform 0.3s ease;
}

.card-visible {
	opacity: 1;
	transform: translateY(0);
}

.article-card:hover {
	transform: translateY(-10px);
	box-shadow: 0 20px 40px var(--shadow);
}

.article-card:hover::before {
	transform: scaleX(1);
}

.article-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
	font-size: 0.9rem;
	color: var(--text-secondary);
}

.article-date {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.article-category {
	background: rgba(100, 255, 218, 0.1);
	color: var(--accent);
	padding: 0.25rem 0.75rem;
	border-radius: 20px;
	font-size: 0.8rem;
	font-weight: 500;
}

.article-title {
	font-size: 1.4rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: var(--text-primary);
	line-height: 1.4;
}

.article-excerpt {
	color: var(--text-secondary);
	margin-bottom: 1.5rem;
	line-height: 1.6;
}

.read-more {
	color: var(--accent);
	text-decoration: none;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: gap 0.3s ease;
}

.read-more:hover {
	gap: 1rem;
}
</style>

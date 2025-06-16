/**
 * 时间格式化工具函数
 */

/**
 * 将 ISO 8601 格式时间转换为 YYYY-MM-DD HH:mm:ss 格式
 * @param dateTimeString ISO 8601 格式的时间字符串，如 "2025-06-05T19:17:48"
 * @returns 格式化后的时间字符串，如 "2025-06-05 19:17:48"
 */
export const formatDateTime = (dateTimeString: string): string => {
	if (!dateTimeString) return "";

	try {
		// 处理 ISO 格式，去掉毫秒和时区信息
		const cleanDateString = dateTimeString.replace("T", " ").split(".")[0];
		return cleanDateString;
	} catch (error) {
		console.warn("时间格式化失败:", dateTimeString, error);
		return dateTimeString;
	}
};

/**
 * 将时间字符串转换为 YYYY-MM-DD 格式
 * @param dateTimeString 时间字符串
 * @returns 日期字符串，如 "2025-06-05"
 */
export const formatDate = (dateTimeString: string): string => {
	if (!dateTimeString) return "";

	try {
		const date = new Date(dateTimeString);
		return date.toISOString().split("T")[0];
	} catch (error) {
		console.warn("日期格式化失败:", dateTimeString, error);
		return dateTimeString.split("T")[0] || dateTimeString;
	}
};

/**
 * 将时间字符串转换为 HH:mm:ss 格式
 * @param dateTimeString 时间字符串
 * @returns 时间字符串，如 "19:17:48"
 */
export const formatTime = (dateTimeString: string): string => {
	if (!dateTimeString) return "";

	try {
		const date = new Date(dateTimeString);
		return date.toTimeString().split(" ")[0];
	} catch (error) {
		console.warn("时间格式化失败:", dateTimeString, error);
		const timePart = dateTimeString.includes("T") ? dateTimeString.split("T")[1] : "";
		return timePart.split(".")[0] || "";
	}
};

/**
 * 获取相对时间描述
 * @param dateTimeString 时间字符串
 * @returns 相对时间描述，如 "2天前"、"刚刚"
 */
export const formatRelativeTime = (dateTimeString: string): string => {
	if (!dateTimeString) return "";

	try {
		const date = new Date(dateTimeString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();

		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSeconds < 60) {
			return "刚刚";
		} else if (diffMinutes < 60) {
			return `${diffMinutes}分钟前`;
		} else if (diffHours < 24) {
			return `${diffHours}小时前`;
		} else if (diffDays < 30) {
			return `${diffDays}天前`;
		} else {
			return formatDate(dateTimeString);
		}
	} catch (error) {
		console.warn("相对时间格式化失败:", dateTimeString, error);
		return formatDate(dateTimeString);
	}
};

/**
 * 格式化为中文日期时间
 * @param dateTimeString 时间字符串
 * @returns 中文格式的日期时间，如 "2025年06月05日 19时17分"
 */
export const formatChineseDateTime = (dateTimeString: string): string => {
	if (!dateTimeString) return "";

	try {
		const date = new Date(dateTimeString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}年${month}月${day}日 ${hours}时${minutes}分`;
	} catch (error) {
		console.warn("中文时间格式化失败:", dateTimeString, error);
		return formatDateTime(dateTimeString);
	}
};

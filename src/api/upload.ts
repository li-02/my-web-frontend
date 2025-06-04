// 上传相关API
import api from "@/api/index.ts";

export interface UploadResponse {
	code: number;
	message: string;
	success: boolean;
	timestamp: string;
	data: {
		filename: string;
		mediaType: string;
		originalFilename: string;
		size: number;
		url: string;
	};
}

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export const uploadAPI = {
	// 上传单个图片
	uploadImage: (file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", "image");

		return api.post("/media/upload/image", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			onUploadProgress: (progressEvent) => {
				if (onProgress && progressEvent.total) {
					const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress({
						loaded: progressEvent.loaded,
						total: progressEvent.total,
						percentage,
					});
				}
			},
		});
	},

	// 批量上传图片
	uploadImages: async (files: File[], onProgress?: (fileIndex: number, progress: UploadProgress) => void): Promise<UploadResponse[]> => {
		const uploadPromises = files.map((file, index) =>
			uploadAPI.uploadImage(file, (progress) => {
				onProgress?.(index, progress);
			})
		);

		return Promise.all(uploadPromises);
	},

	// 上传文件（通用）
	uploadFile: (file: File, type: "image" | "document" | "video" = "image"): Promise<UploadResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);

		return api.post("/admin/upload/file", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	// 删除上传的文件
	deleteFile: (url: string): Promise<{ success: boolean; message?: string }> => {
		return api.delete("/admin/upload/file", {
			data: { url },
		});
	},

	// 获取上传的文件列表
	getUploadedFiles: (params?: { type?: "image" | "document" | "video"; page?: number; size?: number; keyword?: string }) => {
		return api.get("/admin/upload/files", { params });
	},

	// 验证文件类型和大小
	validateFile: (
		file: File,
		options?: {
			maxSize?: number; // 最大文件大小（字节）
			allowedTypes?: string[]; // 允许的文件类型
		}
	): { valid: boolean; message?: string } => {
		const defaultOptions = {
			maxSize: 10 * 1024 * 1024, // 默认10MB
			allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
		};

		const config = { ...defaultOptions, ...options };

		// 检查文件大小
		if (file.size > config.maxSize) {
			return {
				valid: false,
				message: `文件大小不能超过 ${(config.maxSize / 1024 / 1024).toFixed(1)}MB`,
			};
		}

		// 检查文件类型
		if (!config.allowedTypes.includes(file.type)) {
			return {
				valid: false,
				message: `不支持的文件类型，仅支持: ${config.allowedTypes.map((type) => type.split("/")[1]).join(", ")}`,
			};
		}

		return { valid: true };
	},

	// 压缩图片（客户端压缩，减少上传时间）
	compressImage: (file: File, quality: number = 0.8): Promise<File> => {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				// 计算压缩后的尺寸
				const maxWidth = 1920;
				const maxHeight = 1080;
				let { width, height } = img;

				if (width > height) {
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width = (width * maxHeight) / height;
						height = maxHeight;
					}
				}

				canvas.width = width;
				canvas.height = height;

				// 绘制压缩后的图片
				ctx?.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							const compressedFile = new File([blob], file.name, {
								type: file.type,
								lastModified: Date.now(),
							});
							resolve(compressedFile);
						} else {
							reject(new Error("图片压缩失败"));
						}
					},
					file.type,
					quality
				);
			};

			img.onerror = () => reject(new Error("图片加载失败"));
			img.src = URL.createObjectURL(file);
		});
	},

	// 获取文件预览URL
	getPreviewUrl: (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.onerror = () => reject(new Error("文件读取失败"));
			reader.readAsDataURL(file);
		});
	},
};

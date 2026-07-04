import api from "./api";

export const getCommunityPosts = async (sort = "latest", category = "all", page = 1, search = "") => {
    try {
        let url = `/community/posts?sort=${sort}&category=${category}&page=${page}&limit=20`;
        if (search.trim()) {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch posts" };
    }
};

export const createCommunityPost = async (data) => {
    try {
        const response = await api.post("/community/posts", data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to create post" };
    }
};

export const deleteCommunityPost = async (postId, userId) => {
    try {
        const response = await api.delete(`/community/posts/${postId}`, { data: { userId } });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete post" };
    }
};

export const togglePostLike = async (postId, userId) => {
    try {
        const response = await api.put(`/community/posts/${postId}/like`, { userId });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to toggle like" };
    }
};

export const getPostComments = async (postId) => {
    try {
        const response = await api.get(`/community/posts/${postId}/comments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch comments" };
    }
};

export const addPostComment = async (postId, data) => {
    try {
        const response = await api.post(`/community/posts/${postId}/comments`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to add comment" };
    }
};

export const deletePostComment = async (commentId, userId) => {
    try {
        const response = await api.delete(`/community/comments/${commentId}`, { data: { userId } });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete comment" };
    }
};

export const reportCommunityPost = async (postId, userId, reason) => {
    try {
        const response = await api.post(`/community/posts/${postId}/report`, { userId, reason });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to report post" };
    }
};

export const getTrendingPosts = async () => {
    try {
        const response = await api.get("/community/trending");
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch trending" };
    }
};

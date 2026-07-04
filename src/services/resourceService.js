import api from "./api";

/**
 * Fetch all resources, optionally filtered by search and/or category.
 * @param {Object} params - { search, category }
 */
export const getResources = async (params = {}) => {
    const response = await api.get("/resources", { params });
    return response.data;
};

/**
 * Fetch detailed information for a single resource.
 * @param {string} id - Resource ID
 */
export const getResourceById = async (id) => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
};

/**
 * Upload/create a new resource.
 * @param {Object} resourceData - { title, description, fileData, category, metadata }
 */
export const createResource = async (resourceData) => {
    const response = await api.post("/resources", resourceData);
    return response.data;
};

/**
 * Delete a resource.
 * @param {string} id - Resource ID
 */
export const deleteResource = async (id) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
};

/**
 * Track download of a resource (increments downloadsCount).
 * @param {string} id - Resource ID
 */
export const trackResourceDownload = async (id) => {
    const response = await api.post(`/resources/${id}/download`);
    return response.data;
};

/**
 * Add a comment/review to a resource.
 * @param {string} id - Resource ID
 * @param {Object} reviewData - { rating, comment }
 */
export const addResourceReview = async (id, reviewData) => {
    const response = await api.post(`/resources/${id}/reviews`, reviewData);
    return response.data;
};

/**
 * Delete a review from a resource.
 * @param {string} id - Resource ID
 * @param {string} reviewId - Review ID
 */
export const deleteResourceReview = async (id, reviewId) => {
    const response = await api.delete(`/resources/${id}/reviews/${reviewId}`);
    return response.data;
};

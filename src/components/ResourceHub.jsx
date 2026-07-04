import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import {
    getResources,
    createResource,
    deleteResource,
    trackResourceDownload,
    addResourceReview,
    deleteResourceReview
} from '../services/resourceService';
import {
    Search,
    Plus,
    BookOpen,
    Download,
    MessageSquare,
    Star,
    Trash2,
    FileText,
    X,
    Upload,
    Calendar,
    User,
    BookOpenCheck,
    Tag,
    BookMarked,
    Info
} from 'lucide-react';

const CATEGORIES = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Literature",
    "Other"
];

const CATEGORY_COLORS = {
    "Computer Science": "from-blue-500/20 to-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    "Mathematics": "from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
    "Physics": "from-purple-500/20 to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    "Chemistry": "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "Biology": "from-pink-500/20 to-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
    "Literature": "from-violet-500/20 to-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
    "Other": "from-slate-500/20 to-zinc-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30"
};

const ResourceHub = ({ isDark }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Modal states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [activeResource, setActiveResource] = useState(null);

    // Upload Form State
    const [uploadForm, setUploadForm] = useState({
        title: "",
        description: "",
        category: "Computer Science",
        fileData: "",
        isBook: false,
        author: "",
        publisher: "",
        publishYear: "",
        isbn: "",
        edition: "",
        pageCount: ""
    });
    const [uploading, setUploading] = useState(false);
    const [uploadFileError, setUploadFileError] = useState("");
    const [selectedFileName, setSelectedFileName] = useState("");

    // Review Form State
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ""
    });
    const [submittingReview, setSubmittingReview] = useState(false);

    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    // Load resources on mount & when filters change
    const fetchResources = async () => {
        setLoading(true);
        try {
            const data = await getResources({
                search: searchQuery,
                category: selectedCategory
            });
            setResources(data);
        } catch (error) {
            console.error("Failed to load resources:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchResources();
        }, 300); // debounce API requests for search input

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, selectedCategory]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit size to ~10MB to fit Mongoose limits
        if (file.size > 10 * 1024 * 1024) {
            setUploadFileError("File is too large. Maximum allowed size is 10MB.");
            return;
        }

        setUploadFileError("");
        setSelectedFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadForm(prev => ({
                ...prev,
                fileData: `${file.name}|DATA|${reader.result}`
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.fileData) {
            setUploadFileError("Please select a resource file to upload.");
            return;
        }

        setUploading(true);
        try {
            const resourceData = {
                title: uploadForm.title,
                description: uploadForm.description,
                category: uploadForm.category,
                fileData: uploadForm.fileData,
                metadata: uploadForm.isBook ? {
                    author: uploadForm.author,
                    publisher: uploadForm.publisher,
                    publishYear: uploadForm.publishYear,
                    isbn: uploadForm.isbn,
                    edition: uploadForm.edition,
                    pageCount: uploadForm.pageCount
                } : {}
            };

            await createResource(resourceData);
            setIsUploadOpen(false);
            // Reset upload form
            setUploadForm({
                title: "",
                description: "",
                category: "Computer Science",
                fileData: "",
                isBook: false,
                author: "",
                publisher: "",
                publishYear: "",
                isbn: "",
                edition: "",
                pageCount: ""
            });
            setSelectedFileName("");
            fetchResources();
        } catch (error) {
            console.error("Error uploading resource:", error);
            alert(error.response?.data?.message || "Failed to upload resource. Please check file sizes.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (resource) => {
        try {
            await trackResourceDownload(resource._id);
            const parts = resource.fileData.split('|DATA|');
            const filename = parts[0];
            const base64Content = parts[1];

            const link = document.createElement("a");
            link.href = base64Content;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Update stats count locally
            setResources(prev =>
                prev.map(r => r._id === resource._id ? { ...r, downloadsCount: r.downloadsCount + 1 } : r)
            );
            if (activeResource && activeResource._id === resource._id) {
                setActiveResource(prev => ({ ...prev, downloadsCount: prev.downloadsCount + 1 }));
            }
        } catch (error) {
            console.error("Download tracking failed:", error);
            alert("Error downloading file.");
        }
    };

    const handleDeleteResource = async (resourceId) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;

        try {
            await deleteResource(resourceId);
            setIsDetailsOpen(false);
            setActiveResource(null);
            fetchResources();
        } catch (error) {
            console.error("Delete resource error:", error);
            alert("Failed to delete resource.");
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewForm.comment.trim()) return;

        setSubmittingReview(true);
        try {
            const updated = await addResourceReview(activeResource._id, reviewForm);
            setActiveResource(updated);
            setReviewForm({ rating: 5, comment: "" });
            // Refresh main resource list to sync ratings/reviews
            fetchResources();
        } catch (error) {
            console.error("Review submit error:", error);
            alert("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Delete this comment/review?")) return;

        try {
            const updated = await deleteResourceReview(activeResource._id, reviewId);
            setActiveResource(updated);
            fetchResources();
        } catch (error) {
            console.error("Delete review error:", error);
            alert("Failed to delete review.");
        }
    };

    const handleOpenDetails = (resource) => {
        setActiveResource(resource);
        setIsDetailsOpen(true);
    };

    const getAverageRating = (reviews = []) => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (total / reviews.length).toFixed(1);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#150f24]/60 border border-slate-200 dark:border-[#8c30e8]/20 rounded-3xl shadow-xl backdrop-blur-md">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        Resource Hub
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Explore, share, and review study notes, books, and resources uploaded by students and mentors.
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                    <Plus size={18} />
                    Upload Resource
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resources by title, keywords, authors, or publisher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#150f24]/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-md"
                    />
                </div>
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white dark:bg-[#150f24]/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-md appearance-none cursor-pointer"
                    >
                        <option value="all">All Subjects / Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <Tag size={16} />
                    </div>
                </div>
            </div>

            {/* Resources Grid List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Fetching study resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#150f24]/40 border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl">
                    <BookMarked className="w-16 h-16 text-purple-400 dark:text-purple-600/40 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Resources Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
                        No resources match your current search queries or filters. Try searching for other terms or upload the first notes for this topic!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(res => {
                        const avgRating = getAverageRating(res.reviews);
                        return (
                            <div
                                key={res._id}
                                className="group relative flex flex-col justify-between p-6 bg-white dark:bg-[#150f24]/50 border border-slate-200/80 dark:border-white/[0.06] hover:border-purple-500/50 dark:hover:border-[#8c30e8]/50 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-purple-500/5"
                            >
                                {/* Category Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${CATEGORY_COLORS[res.category] || CATEGORY_COLORS.Other}`}>
                                        {res.category}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                        <Star size={12} fill="currentColor" />
                                        <span>{avgRating > 0 ? avgRating : "No reviews"}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors truncate">
                                        {res.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                                        {res.description}
                                    </p>

                                    {/* Book metadata flag badge */}
                                    {res.metadata?.author && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-[#a855f7] bg-purple-500/5 border border-purple-500/10 px-2 py-1 rounded-lg max-w-max font-semibold">
                                            <BookMarked size={12} />
                                            <span className="truncate">Book by {res.metadata.author}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100 dark:border-white/5 my-4"></div>

                                {/* Bottom Info Row */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                                                {res.uploader?.avatar ? (
                                                    <img src={res.uploader.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    (res.uploader?.name || "U").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="truncate max-w-[100px] font-medium">{res.uploader?.name}</span>
                                            <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${res.uploader?.role === 'teacher' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                {res.uploader?.role === 'teacher' ? 'Mentor' : 'Student'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-semibold">{res.downloadsCount} download{res.downloadsCount !== 1 ? 's' : ''}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleOpenDetails(res)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-white/5 transition-all"
                                        >
                                            <Info size={14} />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleDownload(res)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/10 hover:shadow-purple-600/20 transition-all"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: UPLOAD NEW RESOURCE */}
            {isUploadOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white dark:bg-[#150f24] border border-slate-200 dark:border-[#8c30e8]/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in-50 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Upload className="text-purple-500" size={20} />
                                Upload Study Resource
                            </h2>
                            <button
                                onClick={() => setIsUploadOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Resource Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Introduction to Algorithms Chapter 2"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Category / Subject *
                                    </label>
                                    <select
                                        value={uploadForm.category}
                                        onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm cursor-pointer"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Resource Description *
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Provide details about what topics are covered in these notes or book..."
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                                />
                            </div>

                            {/* File Upload Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Document File (PDF, PPT, DOC, Image) *
                                </label>
                                <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group relative">
                                    <Upload size={24} className="text-slate-400 mb-2 group-hover:text-purple-500 transition-colors" />
                                    {selectedFileName ? (
                                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 truncate max-w-md">
                                            Selected: {selectedFileName}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose file or drag here</span>
                                            <span className="text-[10px] text-slate-400 mt-1">Maximum file size: 10MB</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                {uploadFileError && (
                                    <p className="text-red-500 text-xs font-semibold">{uploadFileError}</p>
                                )}
                            </div>

                            {/* Book Metadata Toggle */}
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookMarked className="text-purple-500" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold">Book Metadata</h4>
                                            <p className="text-[11px] text-slate-500">Toggle if this resource is a complete published book.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={uploadForm.isBook}
                                            onChange={(e) => setUploadForm({ ...uploadForm, isBook: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {uploadForm.isBook && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-purple-500/10 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Author</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Thomas H. Cormen"
                                                value={uploadForm.author}
                                                onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Publisher</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. MIT Press"
                                                value={uploadForm.publisher}
                                                onChange={(e) => setUploadForm({ ...uploadForm, publisher: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Publish Year</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 2009"
                                                value={uploadForm.publishYear}
                                                onChange={(e) => setUploadForm({ ...uploadForm, publishYear: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ISBN</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 978-0262033848"
                                                value={uploadForm.isbn}
                                                onChange={(e) => setUploadForm({ ...uploadForm, isbn: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Edition</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 3rd"
                                                value={uploadForm.edition}
                                                onChange={(e) => setUploadForm({ ...uploadForm, edition: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Page Count</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 1312"
                                                value={uploadForm.pageCount}
                                                onChange={(e) => setUploadForm({ ...uploadForm, pageCount: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex items-center gap-1.5 px-6 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        "Upload Resource"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: VIEW RESOURCE DETAILS & REVIEWS */}
            {isDetailsOpen && activeResource && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white dark:bg-[#150f24] border border-slate-200 dark:border-[#8c30e8]/30 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in-50 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <BookOpenCheck className="text-purple-500 animate-bounce" size={24} />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-md">
                                        {activeResource.title}
                                    </h2>
                                    <p className="text-xs text-slate-400">Category: {activeResource.category}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content grid */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column: Info + Metadata */}
                            <div className="lg:col-span-7 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                        {activeResource.description}
                                    </p>
                                </div>

                                {/* Book metadata */}
                                {activeResource.metadata?.author && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Book Metadata Details</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-xs">
                                            {activeResource.metadata.author && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Author</span>
                                                    <span className="font-semibold">{activeResource.metadata.author}</span>
                                                </div>
                                            )}
                                            {activeResource.metadata.publisher && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Publisher</span>
                                                    <span className="font-semibold">{activeResource.metadata.publisher}</span>
                                                </div>
                                            )}
                                            {activeResource.metadata.publishYear && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Publish Year</span>
                                                    <span className="font-semibold">{activeResource.metadata.publishYear}</span>
                                                </div>
                                            )}
                                            {activeResource.metadata.isbn && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">ISBN</span>
                                                    <span className="font-semibold">{activeResource.metadata.isbn}</span>
                                                </div>
                                            )}
                                            {activeResource.metadata.edition && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Edition</span>
                                                    <span className="font-semibold">{activeResource.metadata.edition}</span>
                                                </div>
                                            )}
                                            {activeResource.metadata.pageCount && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">Pages</span>
                                                    <span className="font-semibold">{activeResource.metadata.pageCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Uploader details */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl text-xs space-y-2 md:space-y-0">
                                    <div className="flex items-center gap-3">
                                        <User className="text-purple-500" size={16} />
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 block">Uploaded By</span>
                                            <span className="font-semibold">{activeResource.uploader?.name} ({activeResource.uploader?.role === 'teacher' ? 'Mentor' : 'Student'})</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-purple-500" size={16} />
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 block">Upload Date</span>
                                            <span className="font-semibold">{new Date(activeResource.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Download className="text-purple-500" size={16} />
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 block">Total Downloads</span>
                                            <span className="font-semibold">{activeResource.downloadsCount} times</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Resource Action */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleDownload(activeResource)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all duration-200"
                                    >
                                        <Download size={18} />
                                        Download File
                                    </button>
                                    {(activeResource.uploader?._id === currentUserId || activeResource.uploader === currentUserId || currentUser?.role === "admin") && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteResource(activeResource._id)}
                                            className="px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all font-bold"
                                            title="Delete Resource"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Comments & Reviews Feed */}
                            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                        <span>Reviews & Comments</span>
                                        <span className="text-xs text-amber-500 font-semibold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                            ★ {getAverageRating(activeResource.reviews)} ({activeResource.reviews.length})
                                        </span>
                                    </h3>

                                    {/* Review Feed list */}
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {activeResource.reviews.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400 text-xs">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-500/50" />
                                                No reviews yet. Be the first to leave a comment!
                                            </div>
                                        ) : (
                                            activeResource.reviews.map(rev => (
                                                <div key={rev._id} className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl space-y-1.5 relative">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{rev.userName}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex text-amber-500">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={10}
                                                                        fill={i < rev.rating ? "currentColor" : "none"}
                                                                        className="stroke-amber-500"
                                                                    />
                                                                ))}
                                                            </div>
                                                            {(rev.user?._id === currentUserId || rev.user === currentUserId || activeResource.uploader === currentUserId || activeResource.uploader?._id === currentUserId || currentUser?.role === "admin") && (
                                                                <button
                                                                    onClick={() => handleDeleteReview(rev._id)}
                                                                    className="text-red-500 hover:text-red-600 p-0.5"
                                                                    title="Delete Review"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {rev.comment}
                                                    </p>
                                                    <span className="text-[9px] text-slate-400 block text-right">
                                                        {new Date(rev.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Review form */}
                                <form onSubmit={handleReviewSubmit} className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-500">Your Rating:</span>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setReviewForm({ ...reviewForm, rating: val })}
                                                    className="text-amber-500 transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={18}
                                                        fill={val <= reviewForm.rating ? "currentColor" : "none"}
                                                        className="stroke-amber-500"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            rows="2"
                                            required
                                            placeholder="Write your review or question about this resource..."
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs resize-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="absolute right-2 bottom-3.5 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceHub;

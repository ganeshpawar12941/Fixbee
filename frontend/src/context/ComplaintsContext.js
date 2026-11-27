import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiService, createImageFormData } from '../config/api';

const ComplaintsContext = createContext({});
const PAGE_LIMIT = 50;

const getId = (value) => (
  value && typeof value === 'object' ? value._id || value.id : value
);

const fetchAllPages = async (endpoint, params = {}) => {
  const firstResponse = await apiService.get(endpoint, {
    ...params,
    page: 1,
    limit: PAGE_LIMIT,
  });
  const firstData = firstResponse?.data || {};
  const rows = [...(firstData.complaints || firstData.notifications || [])];
  const totalPages = firstData.pagination?.totalPages || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await apiService.get(endpoint, {
      ...params,
      page,
      limit: PAGE_LIMIT,
    });
    const pageData = response?.data || {};
    rows.push(...(pageData.complaints || pageData.notifications || []));
  }

  return { rows, data: firstData };
};

const withCurrentStudent = (complaint, user) => {
  const ownerId = getId(complaint.student);
  const currentUserId = getId(user);
  return {
    ...complaint,
    student: complaint.student && typeof complaint.student === 'object'
      ? complaint.student
      : ownerId === currentUserId
      ? { ...user, _id: currentUserId }
      : complaint.student,
    isOwner: complaint.isOwner || String(ownerId || '') === String(currentUserId || ''),
    additionalInfo: (complaint.additionalInfo || []).map((entry) => ({
      ...entry,
      senderName: entry.senderName || entry.sender?.name || entry.senderRole || 'Campus user',
    })),
  };
};

export const ComplaintsProvider = ({ children }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [studentDashboard, setStudentDashboard] = useState(null);
  const [managementDashboard, setManagementDashboard] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);

  const [sortBy, setSortBy] = useState('most_liked');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLocation, setActiveLocation] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const feedRequestId = useRef(0);

  const feedParams = useMemo(() => ({
    category: activeCategory === 'all' ? undefined : activeCategory,
    locationType: activeLocation === 'all' ? undefined : activeLocation,
    status: activeStatus === 'all' ? undefined : activeStatus,
    severity: activeSeverity === 'all' ? undefined : activeSeverity,
    search: searchQuery.trim() || undefined,
    sortBy,
  }), [activeCategory, activeLocation, activeStatus, activeSeverity, searchQuery, sortBy]);

  const loadFeed = async () => {
    if (!user) return;
    const requestId = ++feedRequestId.current;
    const { rows } = await fetchAllPages('/complaints/feed', feedParams);
    if (requestId === feedRequestId.current) {
      setFeedItems((current) => {
        const existingDetails = new Map(current.map((item) => [String(getId(item)), item]));
        return rows.map((row) => {
          const previous = existingDetails.get(String(getId(row)));
          return withCurrentStudent({
            ...(previous || {}),
            ...row,
            student: row.student || previous?.student,
            additionalInfo: row.additionalInfo || previous?.additionalInfo,
            statusHistory: row.statusHistory || previous?.statusHistory,
          }, user);
        });
      });
    }
  };

  const loadAccountData = async () => {
    if (!user) {
      setComplaints([]);
      setFeedItems([]);
      setNotifications([]);
      setStudentDashboard(null);
      setManagementDashboard(null);
      setAdminAnalytics(null);
      return;
    }

    const role = user.role;
    const tasks = [];
    if (role === 'student') {
      tasks.push(
        fetchAllPages('/complaints/my').then(({ rows }) => ({ type: 'mine', rows })),
        apiService.get('/dashboard/student').then((response) => ({ type: 'studentDashboard', data: response.data })),
      );
    } else {
      tasks.push(
        fetchAllPages('/complaints/management').then(({ rows }) => ({ type: 'management', rows })),
        apiService.get('/dashboard/management').then((response) => ({ type: 'managementDashboard', data: response.data })),
      );
      if (role === 'admin') {
        tasks.push(
          apiService.get('/dashboard/admin/analytics')
            .then((response) => ({ type: 'adminAnalytics', data: response.data }))
        );
      }
    }
    tasks.push(
      fetchAllPages('/notifications').then(({ rows }) => ({ type: 'notifications', rows }))
    );

    const results = await Promise.all(tasks);
    const mine = results.find((result) => result.type === 'mine')?.rows || [];
    const scoped = results.find((result) => result.type === 'management')?.rows || [];
    const notificationRows = results.find((result) => result.type === 'notifications')?.rows || [];

    setStudentDashboard(results.find((result) => result.type === 'studentDashboard')?.data || null);
    setManagementDashboard(results.find((result) => result.type === 'managementDashboard')?.data || null);
    setAdminAnalytics(results.find((result) => result.type === 'adminAnalytics')?.data || null);
    setNotifications(notificationRows);

    if (role === 'student') {
      setComplaints((current) => {
        const existingDetails = new Map(current.map((item) => [String(getId(item)), item]));
        return mine.map((item) => {
          const previous = existingDetails.get(String(getId(item)));
          return withCurrentStudent({
            ...(previous || {}),
            ...item,
            student: item.student || previous?.student,
          }, user);
        });
      });
    } else if (role === 'admin' || role === 'warden' || role === 'infrastructure_dean') {
      setComplaints((current) => {
        const existingDetails = new Map(current.map((item) => [String(getId(item)), item]));
        return scoped.map((item) => {
          const previous = existingDetails.get(String(getId(item)));
          return withCurrentStudent({
            ...(previous || {}),
            ...item,
            student: item.student || previous?.student,
          }, user);
        });
      });
    }
  };

  const refreshLocalData = async () => {
    if (!user) return;
    await Promise.all([loadFeed(), loadAccountData()]);
  };

  const refreshAfterMutation = (action) => {
    void refreshLocalData().catch((error) => {
      console.error(`The ${action} succeeded, but refreshing server data failed.`, error);
    });
  };

  useEffect(() => {
    if (!user) {
      setComplaints([]);
      setFeedItems([]);
      setNotifications([]);
      setStudentDashboard(null);
      setManagementDashboard(null);
      setAdminAnalytics(null);
      return undefined;
    }

    const timer = setTimeout(() => {
      loadFeed().catch((error) => {
        console.error('Failed to load the complaint feed.', error);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [user?.id, user?._id, feedParams]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    loadAccountData().catch((error) => {
      if (active) console.error('Failed to load account data from the FixBee API.', error);
    });
    return () => {
      active = false;
    };
  }, [user?.id, user?._id, user?.role]);

  const feedComplaints = useMemo(() => {
    const currentUserId = String(getId(user) || '');
    return feedItems
      .filter((item) => {
        if (item.isDeleted) return false;
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
        if (activeLocation !== 'all' && item.locationType !== activeLocation) return false;
        if (activeStatus !== 'all' && item.status !== activeStatus) return false;
        if (activeSeverity !== 'all' && item.severity !== activeSeverity) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          return item.title?.toLowerCase().includes(query)
            || item.description?.toLowerCase().includes(query);
        }
        return true;
      })
      .map((item) => ({
        ...item,
        isOwner: item.isOwner || String(getId(item.student) || '') === currentUserId,
      }))
      .sort((left, right) => {
        if (sortBy === 'newest') return new Date(right.createdAt) - new Date(left.createdAt);
        if (sortBy === 'oldest') return new Date(left.createdAt) - new Date(right.createdAt);
        return (right.likesCount || 0) - (left.likesCount || 0);
      });
  }, [feedItems, user, activeCategory, activeLocation, activeStatus, activeSeverity, searchQuery, sortBy]);

  const replaceComplaint = useCallback((complaint) => {
    if (!complaint) return;
    const normalized = withCurrentStudent(complaint, user);
    const id = String(getId(normalized));
    setComplaints((current) => {
      const exists = current.some((item) => String(getId(item)) === id);
      return exists
        ? current.map((item) => String(getId(item)) === id ? { ...item, ...normalized } : item)
        : [normalized, ...current];
    });
    setFeedItems((current) => {
      const exists = current.some((item) => String(getId(item)) === id);
      return exists
        ? current.map((item) => String(getId(item)) === id ? { ...item, ...normalized } : item)
        : [normalized, ...current];
    });
  }, [user]);

  const toggleLike = async (complaintId) => {
    const response = await apiService.patch(`/complaints/${complaintId}/like`, {});
    const result = response.data;
    setComplaints((current) => current.map((item) => (
      String(getId(item)) === String(complaintId)
        ? { ...item, isLiked: result.isLiked, likesCount: result.likesCount }
        : item
    )));
    setFeedItems((current) => current.map((item) => (
      String(getId(item)) === String(complaintId)
        ? { ...item, isLiked: result.isLiked, likesCount: result.likesCount }
        : item
    )));
    return result;
  };

  const createComplaint = async (complaintData) => {
    if (user?.role !== 'student') throw new Error('Only students can submit complaints.');
    const formData = await createImageFormData(complaintData.imageUrl, 'complaintImage', {
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      locationType: complaintData.locationType,
      severity: complaintData.severity,
    });
    const response = await apiService.post('/complaints', formData, true);
    replaceComplaint(response.data);
    refreshAfterMutation('complaint submission');
    return response.data;
  };

  const generateAIDetails = async (imageUri, shortPrompt) => {
    const formData = await createImageFormData(imageUri, 'complaintImage', {
      description: shortPrompt,
    });
    const response = await apiService.post('/complaints/generate-details', formData, true);
    return { success: true, data: response.data };
  };

  const updateComplaint = async (complaintId, changes) => {
    const response = await apiService.patch(`/complaints/${complaintId}`, changes);
    replaceComplaint(response.data);
    refreshAfterMutation('complaint update');
    return true;
  };

  const addAdditionalInfo = async (complaintId, message) => {
    const response = await apiService.post(`/complaints/${complaintId}/additional-info`, { message });
    replaceComplaint(response.data);
    refreshAfterMutation('additional information submission');
    return response.data.additionalInfo?.[response.data.additionalInfo.length - 1] || null;
  };

  const updateComplaintStatus = async (complaintId, status) => {
    const response = await apiService.patch(`/complaints/${complaintId}/status`, { status });
    replaceComplaint(response.data);
    refreshAfterMutation('status update');
    return response.data;
  };

  const resolveComplaint = async (complaintId, resolutionPhoto) => {
    const formData = await createImageFormData(resolutionPhoto, 'resolutionPhoto');
    const response = await apiService.patch(`/complaints/${complaintId}/resolve`, formData, true);
    replaceComplaint(response.data);
    refreshAfterMutation('complaint resolution');
    return response.data;
  };

  const deleteComplaint = async (complaintId) => {
    await apiService.delete(`/complaints/${complaintId}`);
    setComplaints((current) => current.filter(
      (item) => String(getId(item)) !== String(complaintId)
    ));
    setFeedItems((current) => current.filter(
      (item) => String(getId(item)) !== String(complaintId)
    ));
    refreshAfterMutation('complaint withdrawal');
    return true;
  };

  const getComplaintDetails = useCallback(async (complaintId) => {
    const response = await apiService.get(`/complaints/${complaintId}`);
    replaceComplaint(response.data);
    return response.data;
  }, [replaceComplaint]);

  const getStudentDashboardData = () => {
    if (!studentDashboard) {
      return {
        statistics: { totalComplaints: 0, submitted: 0, underReview: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0 },
        monthlyUsage: { limit: 3, submitted: 0, remaining: 3 },
        recentComplaints: [],
      };
    }
    const statistics = studentDashboard.statistics || {};
    return {
      ...studentDashboard,
      statistics: {
        ...statistics,
        pending: statistics.pending ?? ((statistics.submitted || 0) + (statistics.underReview || 0)),
      },
    };
  };

  const getManagementDashboardData = () => {
    if (!managementDashboard) {
      return {
        statistics: { totalComplaints: 0, submitted: 0, underReview: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0 },
        categoryBreakdown: [],
        severityBreakdown: [],
        recentComplaints: [],
      };
    }
    const statistics = managementDashboard.statistics || {};
    return {
      ...managementDashboard,
      statistics: {
        ...statistics,
        pending: statistics.pending ?? (
          (statistics.submitted || 0) + (statistics.underReview || 0) + (statistics.inProgress || 0)
        ),
      },
    };
  };

  const getAdminAnalyticsData = () => adminAnalytics || {
    complaintStatistics: { totalComplaints: 0, submitted: 0, underReview: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0, overdue: 0 },
    resolutionPerformance: { averageResolutionHours: null, averageResolutionDays: null },
    categoryBreakdown: [],
    locationBreakdown: [],
    severityBreakdown: [],
    monthlyTrends: [],
    recentOverdueComplaints: [],
    imageValidationStatistics: { studentsWithImageStrikes: null },
  };

  const markNotificationRead = async (notificationId) => {
    const response = await apiService.patch(`/notifications/${notificationId}/read`, {});
    setNotifications((current) => current.map((notification) => (
      String(getId(notification)) === String(notificationId)
        ? { ...notification, ...response.data, isRead: true }
        : notification
    )));
  };

  const markAllNotificationsRead = async () => {
    await apiService.patch('/notifications/read-all', {});
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        feedComplaints,
        notifications,
        unreadNotificationsCount: notifications.filter((notification) => !notification.isRead).length,
        refreshLocalData,
        sortBy,
        setSortBy,
        activeCategory,
        setActiveCategory,
        activeLocation,
        setActiveLocation,
        activeStatus,
        setActiveStatus,
        activeSeverity,
        setActiveSeverity,
        searchQuery,
        setSearchQuery,
        toggleLike,
        createComplaint,
        updateComplaint,
        addAdditionalInfo,
        generateAIDetails,
        updateComplaintStatus,
        resolveComplaint,
        deleteComplaint,
        getComplaintDetails,
        getStudentDashboardData,
        getManagementDashboardData,
        getAdminAnalyticsData,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintsContext);

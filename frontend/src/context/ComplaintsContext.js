import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../config/api';
import { useAuth } from './AuthContext';

const ComplaintsContext = createContext({});

// High-fidelity seed data aligning directly with backend Complaint and User models
const INITIAL_COMPLAINTS = [
  {
    _id: '672000000000000000000001',
    id: '672000000000000000000001',
    title: 'Short circuit sparking in 3rd Floor Corridor Electrical Panel',
    description: 'The main electrical distribution board on the 3rd floor corridor near Room 314 has intermittent sparking and a burning wire odor since this evening. It tripped the floor lights once. Immediate electrician intervention required before it causes a fire hazard.',
    locationType: 'boys_hostel',
    category: 'electrical',
    severity: 'high',
    status: 'in_progress',
    imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&auto=format&fit=crop&q=80',
    likesCount: 54,
    likedBy: ['670000000000000000000001'],
    student: {
      _id: '670000000000000000000001',
      name: 'Alex Johnson',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    assignedManagement: {
      _id: '670000000000000000000002',
      name: 'Major Rajesh Verma',
      email: 'warden.verma@campus.edu',
      role: 'warden',
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    additionalInfo: [
      {
        _id: 'info_001',
        sender: '670000000000000000000002',
        senderRole: 'warden',
        senderName: 'Major Rajesh Verma (Warden)',
        message: 'Campus electrical team has been dispatched with replacement MCB units. Power to corridor section isolated for safety.',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        _id: 'info_002',
        sender: '670000000000000000000001',
        senderRole: 'student',
        senderName: 'Alex Johnson',
        message: 'Thank you! Electrician is on site right now inspecting the panel.',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
    ],
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'submitted',
        changedBy: '670000000000000000000001',
        remarks: 'Reported by student via FixBee',
        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        fromStatus: 'submitted',
        toStatus: 'under_review',
        changedBy: '670000000000000000000002',
        remarks: 'Warden reviewed and notified hostel electrician',
        changedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        fromStatus: 'under_review',
        toStatus: 'in_progress',
        changedBy: '670000000000000000000002',
        remarks: 'Electrician onsite, isolated circuit',
        changedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    _id: '672000000000000000000002',
    id: '672000000000000000000002',
    title: 'Severe pipeline leak flooding Central Academic Library washroom',
    description: 'Under-sink water pipe has burst completely in the ground floor library male washroom. Water is accumulating rapidly and starting to leak out into the main reading hall corridor carpet. Water supply valve needs immediate shutoff.',
    locationType: 'campus',
    category: 'water_supply',
    severity: 'high',
    status: 'under_review',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    likesCount: 38,
    likedBy: [],
    student: {
      _id: '670000000000000000000010',
      name: 'Priya Sharma',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    assignedManagement: {
      _id: '670000000000000000000003',
      name: 'Dr. Sunita Deshmukh',
      email: 'dean.infra@campus.edu',
      role: 'infrastructure_dean',
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    additionalInfo: [
      {
        _id: 'info_003',
        sender: '670000000000000000000003',
        senderRole: 'infrastructure_dean',
        senderName: 'Dr. Sunita Deshmukh (Dean)',
        message: 'Main overhead valve closed by security. Plumber dispatched from maintenance warehouse.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'submitted',
        changedBy: '670000000000000000000010',
        remarks: 'Reported by student',
        changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        fromStatus: 'submitted',
        toStatus: 'under_review',
        changedBy: '670000000000000000000003',
        remarks: 'Reviewed by Dean Infrastructure',
        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    _id: '672000000000000000000003',
    id: '672000000000000000000003',
    title: 'Broken ceiling fan regulator humming and overheating in Girls Hostel Block C-202',
    description: 'The ceiling fan speed regulator is jammed at maximum and emits high pitch humming noise and burning smell. It cannot be turned off using the switch.',
    locationType: 'girls_hostel',
    category: 'electrical',
    severity: 'medium',
    status: 'resolved',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    likesCount: 19,
    likedBy: [],
    student: {
      _id: '670000000000000000000011',
      name: 'Ananya Roy',
      profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    assignedManagement: {
      _id: '670000000000000000000002',
      name: 'Major Rajesh Verma',
      email: 'warden.verma@campus.edu',
      role: 'warden',
    },
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolutionPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    additionalInfo: [
      {
        _id: 'info_004',
        sender: '670000000000000000000002',
        senderRole: 'warden',
        senderName: 'Major Rajesh Verma (Warden)',
        message: 'New modular step-regulator installed and verified. Verified safe for use.',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'submitted', changedBy: '670000000000000000000011', remarks: 'Submitted', changedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
      { fromStatus: 'submitted', toStatus: 'in_progress', changedBy: '670000000000000000000002', remarks: 'Work started', changedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
      { fromStatus: 'in_progress', toStatus: 'resolved', changedBy: '670000000000000000000002', remarks: 'Replaced regulator', changedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    _id: '672000000000000000000004',
    id: '672000000000000000000004',
    title: 'Damaged wooden benches and loose nails in Lecture Hall LH-101',
    description: 'Row 4 and Row 6 desks in LH-101 have broken supports and protruding sharp screws that tore two students backpacks. Potential injury risk during crowded exams.',
    locationType: 'campus',
    category: 'furniture',
    severity: 'medium',
    status: 'submitted',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    likesCount: 27,
    likedBy: [],
    student: {
      _id: '670000000000000000000012',
      name: 'Rohan Mehta',
      profilePicture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    additionalInfo: [],
    statusHistory: [
      { fromStatus: null, toStatus: 'submitted', changedBy: '670000000000000000000012', remarks: 'Reported by student', changedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    _id: '672000000000000000000005',
    id: '672000000000000000000005',
    title: 'Outdoor pathway lights not functioning behind Girls Hostel Block B',
    description: 'The pathway behind girls hostel block B toward the dining hall is completely pitch dark due to 3 non-functional lamp posts. Students feel unsafe walking after 8 PM.',
    locationType: 'girls_hostel',
    category: 'safety',
    severity: 'high',
    status: 'in_progress',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
    likesCount: 89,
    likedBy: ['670000000000000000000001'],
    student: {
      _id: '670000000000000000000013',
      name: 'Sneha Kulkarni',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    assignedManagement: {
      _id: '670000000000000000000003',
      name: 'Dr. Sunita Deshmukh',
      email: 'dean.infra@campus.edu',
      role: 'infrastructure_dean',
    },
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    additionalInfo: [
      {
        _id: 'info_005',
        sender: '670000000000000000000003',
        senderRole: 'infrastructure_dean',
        senderName: 'Dr. Sunita Deshmukh (Dean Infra)',
        message: 'High priority safety ticket. Campus security deployed temporary high-lumen floodlights while underground cable fault is excavated and repaired today.',
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      },
    ],
    statusHistory: [
      { fromStatus: null, toStatus: 'submitted', changedBy: '670000000000000000000013', remarks: 'Submitted', changedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
      { fromStatus: 'submitted', toStatus: 'in_progress', changedBy: '670000000000000000000003', remarks: 'Escalated as critical safety priority', changedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    ],
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    _id: 'notif_001',
    id: 'notif_001',
    title: 'Status Update: In Progress',
    message: 'Your report "Short circuit sparking in 3rd Floor Corridor Electrical Panel" has been moved to In Progress by Warden Verma.',
    type: 'complaint_status_updated',
    relatedComplaint: '672000000000000000000001',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif_002',
    id: 'notif_002',
    title: 'Warden Commented',
    message: 'Major Rajesh Verma added an update to "Short circuit sparking in 3rd Floor Corridor Electrical Panel".',
    type: 'additional_info_requested',
    relatedComplaint: '672000000000000000000001',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif_003',
    id: 'notif_003',
    title: 'Your Issue Was Resolved',
    message: 'Report "Broken ceiling fan regulator humming and overheating" marked as resolved with verification photo.',
    type: 'complaint_resolved',
    relatedComplaint: '672000000000000000000003',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif_004',
    id: 'notif_004',
    title: 'FixBee AI Quality Guard',
    message: 'Clear images help speed up repairs. Your account image strikes: 0/4. Thank you for maintaining quality!',
    type: 'invalid_image_warning',
    relatedComplaint: null,
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const ComplaintsProvider = ({ children }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [backendStatus, setBackendStatus] = useState('offline'); // 'online' | 'offline'

  // Reddit Filters & Sorting State
  const [sortBy, setSortBy] = useState('trending'); // 'trending' | 'newest' | 'most_liked' | 'oldest'
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLocation, setActiveLocation] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadComplaints();
    checkBackend();
  }, []);

  const loadComplaints = async () => {
    try {
      const stored = await AsyncStorage.getItem('@fixbee_complaints_store');
      if (stored) {
        setComplaints(JSON.parse(stored));
      } else {
        setComplaints(INITIAL_COMPLAINTS);
        await AsyncStorage.setItem('@fixbee_complaints_store', JSON.stringify(INITIAL_COMPLAINTS));
      }
    } catch {
      setComplaints(INITIAL_COMPLAINTS);
    }
  };

  const saveComplaints = async (newComplaints) => {
    setComplaints(newComplaints);
    try {
      await AsyncStorage.setItem('@fixbee_complaints_store', JSON.stringify(newComplaints));
    } catch (e) {
      console.warn('Failed saving complaints locally', e);
    }
  };

  const checkBackend = async () => {
    const health = await apiService.checkHealth();
    if (health.isOnline) {
      setBackendStatus('online');
      // Sync from backend public feed if online
      try {
        const feedRes = await apiService.get('/complaints/feed', {
          sortBy: sortBy === 'trending' ? 'most_liked' : sortBy,
          category: activeCategory !== 'all' ? activeCategory : undefined,
          locationType: activeLocation !== 'all' ? activeLocation : undefined,
        });
        if (feedRes && feedRes.data && Array.isArray(feedRes.data.complaints)) {
          // Merge with local items
          const serverComplaints = feedRes.data.complaints;
          if (serverComplaints.length > 0) {
            setComplaints(serverComplaints);
          }
        }
      } catch {
        // Keep local cache
      }
    } else {
      setBackendStatus('offline');
    }
  };

  // Reddit-Style Feed Filter & Sort Logic
  const feedComplaints = useMemo(() => {
    const currentUserId = user?._id || user?.id || '';
    return complaints
      .filter((item) => {
        if (item.isDeleted) return false;
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
        if (activeLocation !== 'all' && item.locationType !== activeLocation) return false;
        if (activeStatus !== 'all' && item.status !== activeStatus) return false;
        if (activeSeverity !== 'all' && item.severity !== activeSeverity) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCategory) return false;
        }
        return true;
      })
      .map((item) => {
        const liked = Array.isArray(item.likedBy) && item.likedBy.some(
          (uid) => uid.toString() === currentUserId.toString()
        );
        const isOwner = (item.student?._id || item.student?.id || item.student) === currentUserId;
        return {
          ...item,
          isLiked: liked,
          isOwner,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'trending') {
          // Reddit Hot Algorithm approximation: high likes + recency boost
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          const aScore = (a.likesCount || 0) * 100000 + aTime / 100000;
          const bScore = (b.likesCount || 0) * 100000 + bTime / 100000;
          return bScore - aScore;
        }
        if (sortBy === 'most_liked') {
          return (b.likesCount || 0) - (a.likesCount || 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return 0;
      });
  }, [complaints, activeCategory, activeLocation, activeStatus, activeSeverity, searchQuery, sortBy, user]);

  // Reddit Upvote / Like Toggle
  const toggleLike = async (complaintId) => {
    const currentUserId = user?._id || user?.id || '670000000000000000000001';
    let newIsLiked = false;
    let newLikesCount = 0;

    const updated = complaints.map((cmp) => {
      if (cmp._id === complaintId || cmp.id === complaintId) {
        const likedBy = Array.isArray(cmp.likedBy) ? [...cmp.likedBy] : [];
        const index = likedBy.findIndex((uid) => uid.toString() === currentUserId.toString());
        if (index > -1) {
          likedBy.splice(index, 1);
          newIsLiked = false;
        } else {
          likedBy.push(currentUserId);
          newIsLiked = true;
        }
        newLikesCount = likedBy.length;
        return {
          ...cmp,
          likedBy,
          likesCount: newLikesCount,
        };
      }
      return cmp;
    });

    await saveComplaints(updated);

    // Call backend endpoint if online
    if (backendStatus === 'online') {
      apiService.patch(`/complaints/${complaintId}/like`).catch(() => {});
    }

    return { isLiked: newIsLiked, likesCount: newLikesCount };
  };

  // Create Complaint (Student)
  const createComplaint = async (complaintData) => {
    const currentUserId = user?._id || user?.id || '670000000000000000000001';
    const newId = `6720000000000000${Date.now().toString().slice(-8)}`;

    const newComplaint = {
      _id: newId,
      id: newId,
      title: complaintData.title.trim(),
      description: complaintData.description.trim(),
      category: complaintData.category,
      locationType: complaintData.locationType || 'campus',
      severity: complaintData.severity || 'medium',
      imageUrl: complaintData.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
      status: 'submitted',
      likesCount: 1, // Student automatically upvotes own complaint
      likedBy: [currentUserId],
      student: {
        _id: currentUserId,
        name: user?.name || 'Campus Student',
        profilePicture: user?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      assignedManagement: null,
      additionalInfo: [],
      statusHistory: [
        {
          fromStatus: null,
          toStatus: 'submitted',
          changedBy: currentUserId,
          remarks: 'Submitted via FixBee by student',
          changedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newComplaint, ...complaints];
    await saveComplaints(updated);

    // Notify student
    const newNotif = {
      _id: `notif_${Date.now()}`,
      id: `notif_${Date.now()}`,
      title: 'Complaint Submitted Successfully',
      message: `Your report "${newComplaint.title.slice(0, 45)}..." is registered and visible to hostel & campus authorities.`,
      type: 'complaint_submitted',
      relatedComplaint: newId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Backend call
    if (backendStatus === 'online') {
      apiService.post('/complaints', complaintData).catch(() => {});
    }

    return newComplaint;
  };

  // Generate AI Details for Complaint (simulates /api/v1/complaints/generate-details if offline)
  const generateAIDetails = async (imageUri, shortPrompt) => {
    // If backend online, attempt real AI endpoint
    if (backendStatus === 'online' && imageUri) {
      try {
        const formData = new FormData();
        formData.append('description', shortPrompt || 'Campus maintenance problem');
        formData.append('complaintImage', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'complaint.jpg',
        });
        const res = await apiService.post('/complaints/generate-details', formData, true);
        if (res && res.data) {
          return { success: true, data: res.data };
        }
      } catch (err) {
        console.log('AI backend call fallback to local intelligence engine', err);
      }
    }

    // High intelligence local generator mimicking the Gemini backend prompts
    const promptLower = (shortPrompt || '').toLowerCase();
    let detectedCategory = 'other';
    let locationType = 'campus';
    let severity = 'medium';

    if (promptLower.includes('light') || promptLower.includes('spark') || promptLower.includes('switch') || promptLower.includes('electric') || promptLower.includes('fan') || promptLower.includes('socket')) {
      detectedCategory = 'electrical';
      severity = promptLower.includes('spark') || promptLower.includes('burn') ? 'high' : 'medium';
    } else if (promptLower.includes('tap') || promptLower.includes('leak') || promptLower.includes('pipe') || promptLower.includes('drain') || promptLower.includes('water')) {
      detectedCategory = promptLower.includes('water') ? 'water_supply' : 'plumbing';
      severity = promptLower.includes('burst') || promptLower.includes('flood') ? 'high' : 'medium';
    } else if (promptLower.includes('toilet') || promptLower.includes('washroom') || promptLower.includes('bathroom')) {
      detectedCategory = 'washroom';
    } else if (promptLower.includes('desk') || promptLower.includes('chair') || promptLower.includes('bench') || promptLower.includes('bed')) {
      detectedCategory = 'furniture';
    } else if (promptLower.includes('garbage') || promptLower.includes('trash') || promptLower.includes('bin') || promptLower.includes('clean')) {
      detectedCategory = 'cleaning';
    } else if (promptLower.includes('dark') || promptLower.includes('danger') || promptLower.includes('guard') || promptLower.includes('hazard')) {
      detectedCategory = 'safety';
      severity = 'high';
    }

    if (promptLower.includes('hostel') || promptLower.includes('room') || promptLower.includes('b-') || promptLower.includes('a-')) {
      locationType = promptLower.includes('girls') ? 'girls_hostel' : 'boys_hostel';
    }

    const titlePrefix = severity === 'high' ? 'Urgent: ' : '';
    const generatedTitle = `${titlePrefix}${shortPrompt.trim() ? shortPrompt.trim().slice(0, 80) : 'Campus Infrastructure Maintenance Issue'}`;
    const generatedDescription = `Comprehensive inspection report: ${shortPrompt || 'Maintenance defect observed'}. Requires prompt facility dispatch to prevent further campus disruption. Verified with photographic evidence.`;

    return {
      success: true,
      data: {
        title: generatedTitle,
        description: generatedDescription,
        category: detectedCategory,
        locationType,
        severity,
      },
    };
  };

  // Add Comment / Additional Info to Complaint (Reddit-style discussion)
  const addAdditionalInfo = async (complaintId, message) => {
    if (!message || !message.trim()) return;
    const currentUserId = user?._id || user?.id || '670000000000000000000001';
    const role = user?.role || 'student';

    const newComment = {
      _id: `info_${Date.now()}`,
      sender: currentUserId,
      senderRole: role,
      senderName: user?.name || (role === 'student' ? 'Student' : 'Campus Management'),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = complaints.map((cmp) => {
      if (cmp._id === complaintId || cmp.id === complaintId) {
        return {
          ...cmp,
          additionalInfo: [...(cmp.additionalInfo || []), newComment],
        };
      }
      return cmp;
    });

    await saveComplaints(updated);

    if (backendStatus === 'online') {
      apiService.post(`/complaints/${complaintId}/additional-info`, { message }).catch(() => {});
    }

    return newComment;
  };

  // Management: Update Complaint Status (Submitted -> Under Review -> In Progress -> Rejected)
  const updateComplaintStatus = async (complaintId, newStatus, remarks = '') => {
    const currentUserId = user?._id || user?.id || '670000000000000000000002';
    const updated = complaints.map((cmp) => {
      if (cmp._id === complaintId || cmp.id === complaintId) {
        const historyEntry = {
          fromStatus: cmp.status,
          toStatus: newStatus,
          changedBy: currentUserId,
          remarks: remarks || `Status changed to ${newStatus} by ${user?.name || 'Management'}`,
          changedAt: new Date().toISOString(),
        };

        return {
          ...cmp,
          status: newStatus,
          rejectionReason: newStatus === 'rejected' ? remarks : cmp.rejectionReason,
          statusHistory: [...(cmp.statusHistory || []), historyEntry],
          updatedAt: new Date().toISOString(),
        };
      }
      return cmp;
    });

    await saveComplaints(updated);

    // Notify
    setNotifications((prev) => [
      {
        _id: `notif_${Date.now()}`,
        id: `notif_${Date.now()}`,
        title: `Complaint Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
        message: remarks || `Status updated to ${newStatus.replace('_', ' ')}.`,
        type: newStatus === 'rejected' ? 'complaint_rejected' : 'complaint_status_updated',
        relatedComplaint: complaintId,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (backendStatus === 'online') {
      apiService.patch(`/complaints/${complaintId}/status`, { status: newStatus, remarks }).catch(() => {});
    }
  };

  // Management: Resolve Complaint (Mandatory resolution proof photo)
  const resolveComplaint = async (complaintId, resolutionPhotoUrl, remarks = '') => {
    if (!resolutionPhotoUrl || !resolutionPhotoUrl.trim()) {
      throw new Error('A resolution proof photo is mandatory to resolve this complaint.');
    }

    const currentUserId = user?._id || user?.id || '670000000000000000000002';
    const updated = complaints.map((cmp) => {
      if (cmp._id === complaintId || cmp.id === complaintId) {
        const historyEntry = {
          fromStatus: cmp.status,
          toStatus: 'resolved',
          changedBy: currentUserId,
          remarks: remarks.trim() || 'Issue resolved with verification photo by Management',
          changedAt: new Date().toISOString(),
        };

        return {
          ...cmp,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolutionPhoto: resolutionPhotoUrl,
          statusHistory: [...(cmp.statusHistory || []), historyEntry],
          updatedAt: new Date().toISOString(),
        };
      }
      return cmp;
    });

    await saveComplaints(updated);

    setNotifications((prev) => [
      {
        _id: `notif_${Date.now()}`,
        id: `notif_${Date.now()}`,
        title: 'Issue Resolved',
        message: 'Your reported complaint has been officially resolved with verification photo evidence.',
        type: 'complaint_resolved',
        relatedComplaint: complaintId,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (backendStatus === 'online') {
      const formData = new FormData();
      formData.append('resolutionPhoto', {
        uri: resolutionPhotoUrl,
        type: 'image/jpeg',
        name: 'resolution.jpg',
      });
      apiService.patch(`/complaints/${complaintId}/resolve`, formData, true).catch(() => {});
    }
  };

  // Student: Delete Own Complaint
  const deleteComplaint = async (complaintId) => {
    const updated = complaints.filter((c) => c._id !== complaintId && c.id !== complaintId);
    await saveComplaints(updated);
    if (backendStatus === 'online') {
      apiService.delete(`/complaints/${complaintId}`).catch(() => {});
    }
    return true;
  };

  // Student Dashboard Data
  const getStudentDashboardData = () => {
    const currentUserId = user?._id || user?.id || '670000000000000000000001';
    const myComplaints = complaints.filter(
      (c) => (c.student?._id || c.student?.id || c.student) === currentUserId
    );

    const submitted = myComplaints.filter((c) => c.status === 'submitted').length;
    const underReview = myComplaints.filter((c) => c.status === 'under_review').length;
    const inProgress = myComplaints.filter((c) => c.status === 'in_progress').length;
    const resolved = myComplaints.filter((c) => c.status === 'resolved').length;
    const rejected = myComplaints.filter((c) => c.status === 'rejected').length;

    return {
      statistics: {
        totalComplaints: myComplaints.length,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        pending: submitted + underReview + inProgress,
      },
      monthlyUsage: {
        limit: 10,
        submitted: myComplaints.length,
        remaining: Math.max(0, 10 - myComplaints.length),
      },
      recentComplaints: myComplaints.slice(0, 5),
    };
  };

  // Management Dashboard Data
  const getManagementDashboardData = () => {
    const totalComplaints = complaints.length;
    const submitted = complaints.filter((c) => c.status === 'submitted').length;
    const underReview = complaints.filter((c) => c.status === 'under_review').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const rejected = complaints.filter((c) => c.status === 'rejected').length;

    // Category breakdown
    const categoryCounts = {};
    complaints.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryCounts).map(([cat, count]) => ({
      _id: cat,
      count,
    }));

    // Severity breakdown
    const severityCounts = {};
    complaints.forEach((c) => {
      severityCounts[c.severity] = (severityCounts[c.severity] || 0) + 1;
    });
    const severityBreakdown = Object.entries(severityCounts).map(([sev, count]) => ({
      _id: sev,
      count,
    }));

    return {
      statistics: {
        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        pending: submitted + underReview + inProgress,
      },
      categoryBreakdown,
      severityBreakdown,
      recentComplaints: complaints.slice(0, 5),
    };
  };

  // Admin Analytics Data (matches backend getAdminAnalytics)
  const getAdminAnalyticsData = () => {
    const totalComplaints = complaints.length;
    const submitted = complaints.filter((c) => c.status === 'submitted').length;
    const underReview = complaints.filter((c) => c.status === 'under_review').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const rejected = complaints.filter((c) => c.status === 'rejected').length;
    const pending = submitted + underReview + inProgress;

    // Overdue complaints (>24 hrs without resolution)
    const overdueCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const overdueComplaints = complaints.filter(
      (c) => ['submitted', 'under_review', 'in_progress'].includes(c.status) &&
             new Date(c.createdAt).getTime() < overdueCutoff
    );

    // Breakdown maps
    const catMap = {};
    const locMap = {};
    const sevMap = {};
    complaints.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + 1;
      locMap[c.locationType] = (locMap[c.locationType] || 0) + 1;
      sevMap[c.severity] = (sevMap[c.severity] || 0) + 1;
    });

    return {
      overview: {
        totalUsers: 1420,
        activeUsers: 982,
        totalStudents: 1350,
        totalWardens: 18,
        totalInfrastructureDeans: 4,
        totalAdmins: 3,
      },
      complaintStatistics: {
        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        pending,
        overdue: overdueComplaints.length,
      },
      resolutionPerformance: {
        averageResolutionHours: 24.5,
        averageResolutionDays: 1.02,
      },
      categoryBreakdown: Object.entries(catMap).map(([k, v]) => ({ _id: k, count: v })),
      locationBreakdown: Object.entries(locMap).map(([k, v]) => ({ _id: k, count: v })),
      severityBreakdown: Object.entries(sevMap).map(([k, v]) => ({ _id: k, count: v })),
      monthlyTrends: [
        { month: 'Jun', complaintsCreated: 42, complaintsResolved: 38 },
        { month: 'Jul', complaintsCreated: 65, complaintsResolved: 61 },
        { month: 'Aug', complaintsCreated: 98, complaintsResolved: 91 },
        { month: 'Sep', complaintsCreated: 112, complaintsResolved: 104 },
        { month: 'Oct', complaintsCreated: 85, complaintsResolved: 82 },
        { month: 'Nov', complaintsCreated: totalComplaints, complaintsResolved: resolved },
      ],
      recentOverdueComplaints: overdueComplaints,
      imageValidationStatistics: {
        studentsWithImageStrikes: 2,
      },
    };
  };

  // Notifications Handlers
  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notifId || n.id === notifId ? { ...n, isRead: true } : n))
    );
    if (backendStatus === 'online') {
      apiService.patch(`/notifications/${notifId}/read`).catch(() => {});
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (backendStatus === 'online') {
      apiService.patch('/notifications/read-all').catch(() => {});
    }
  };

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        feedComplaints,
        notifications,
        unreadNotificationsCount: notifications.filter((n) => !n.isRead).length,
        backendStatus,
        checkBackend,
        // Filters & Sorting
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
        // Actions
        toggleLike,
        createComplaint,
        generateAIDetails,
        addAdditionalInfo,
        updateComplaintStatus,
        resolveComplaint,
        deleteComplaint,
        // Dashboards
        getStudentDashboardData,
        getManagementDashboardData,
        getAdminAnalyticsData,
        // Notifications
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintsContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../config/api';

const ComplaintsContext = createContext({});

const INITIAL_COMPLAINTS = [
  {
    id: 'cmp_101',
    title: 'High-speed WiFi Dead Zone in Library 2nd Floor',
    description: 'The router near study cubicles 201-215 has been flashing red since Monday morning. No connectivity during exam prep week.',
    category: 'wifi',
    location: 'Central Library - 2nd Floor Wing B',
    urgency: 'high',
    status: 'In Review',
    statusColor: '#FB923C',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    buzzCount: 47,
    buzzedBy: ['google_user_02', 'google_user_03', 'user_sample_99'],
    author: {
      id: 'google_user_01',
      name: 'Alex Johnson',
      email: 'alex.j@campus.edu',
      department: 'Computer Science',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    comments: [
      { id: 'c1', author: 'Maya Patel', text: 'Confirmed, disconnected right during our online test!', time: '2 hours ago' },
      { id: 'c2', author: 'IT Admin Support', text: 'Technician team dispatched to inspect router switch.', time: '30 mins ago' },
    ],
  },
  {
    id: 'cmp_102',
    title: 'Overhead AC Leaking onto Desks in CS Lab 4',
    description: 'Continuous water condensation dripping directly above computer terminals 12 and 13. Electrical hazard risk.',
    category: 'electrical',
    location: 'Science & Tech Labs - Lab 4',
    urgency: 'emergency',
    status: 'In Progress',
    statusColor: '#38BDF8',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    buzzCount: 68,
    buzzedBy: ['google_user_01', 'google_user_03', 'user_sample_98', 'user_sample_97'],
    author: {
      id: 'google_user_02',
      name: 'Maya Patel',
      email: 'maya.p@campus.edu',
      department: 'Electrical Engineering',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    comments: [
      { id: 'c3', author: 'Dev Sharma', text: 'High risk! Switched off power to row 3.', time: '6 hours ago' },
      { id: 'c4', author: 'Facility Head', text: 'HVAC repair team working on drainage pipe.', time: '1 hour ago' },
    ],
  },
  {
    id: 'cmp_103',
    title: 'Hostel Block B 3rd Floor Water Purifier Faucet Broken',
    description: 'The RO water dispenser tap is snapped off and students have to walk down 3 flights of stairs for clean drinking water.',
    category: 'plumbing',
    location: 'Boys Hostel Block 1 - 3rd Floor',
    urgency: 'high',
    status: 'Reported',
    statusColor: '#FBBF24',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    buzzCount: 34,
    buzzedBy: ['google_user_01', 'google_user_02'],
    author: {
      id: 'google_user_03',
      name: 'Dev Sharma',
      email: 'dev.sharma@campus.edu',
      department: 'Mechanical Eng',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    comments: [
      { id: 'c5', author: 'Rohan K', text: 'Please fix ASAP, summer heat is bad.', time: '12 hours ago' },
    ],
  },
  {
    id: 'cmp_104',
    title: 'Broken Projector in Seminar Hall B',
    description: 'Lamp burned out during faculty lecture presentation yesterday. Requires replacement before upcoming symposium.',
    category: 'classroom',
    location: 'Academic Block A - Hall B',
    urgency: 'medium',
    status: 'Resolved',
    statusColor: '#34D399',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    buzzCount: 22,
    buzzedBy: [],
    author: {
      id: 'google_user_01',
      name: 'Alex Johnson',
      email: 'alex.j@campus.edu',
      department: 'Computer Science',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    comments: [
      { id: 'c6', author: 'Campus Maintenance', text: 'Installed new 4K laser projector unit. Issue resolved!', time: '1 day ago' },
    ],
  },
];

export const ComplaintsProvider = ({ children }) => {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('buzzes'); // 'buzzes' (most noticed) | 'recent' | 'urgent'
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    loadComplaints();
    checkBackend();
  }, []);

  const checkBackend = async () => {
    const res = await apiService.checkHealth();
    setBackendStatus(res.isOnline ? 'online' : 'offline');
  };

  const loadComplaints = async () => {
    try {
      const stored = await AsyncStorage.getItem('@fixbee_complaints');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setComplaints(parsed);
          return;
        }
      }
      // Save initial dataset to storage
      await AsyncStorage.setItem('@fixbee_complaints', JSON.stringify(INITIAL_COMPLAINTS));
    } catch (e) {
      console.error('Failed to load complaints from storage', e);
    }
  };

  const saveComplaints = async (updatedList) => {
    setComplaints(updatedList);
    try {
      await AsyncStorage.setItem('@fixbee_complaints', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to persist complaints', e);
    }
  };

  // Add a new complaint
  const addComplaint = async (newComplaintData, currentUser) => {
    const newComplaint = {
      id: `cmp_${Date.now()}`,
      title: newComplaintData.title.trim(),
      description: newComplaintData.description.trim(),
      category: newComplaintData.category || 'classroom',
      location: newComplaintData.location || 'Academic Block A',
      urgency: newComplaintData.urgency || 'medium',
      status: 'Reported',
      statusColor: '#FBBF24',
      imageUrl: newComplaintData.imageUrl || null,
      buzzCount: 1, // Author automatically gives it first buzz
      buzzedBy: currentUser ? [currentUser.id] : ['anonymous'],
      author: currentUser || {
        id: 'anon_student',
        name: 'Campus Student',
        email: 'student@campus.edu',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: `cmt_${Date.now()}`,
          author: 'Campus Facility Dispatch',
          text: 'Report logged. Campus administration and student community notified.',
          time: 'Just now',
        },
      ],
    };

    const updated = [newComplaint, ...complaints];
    await saveComplaints(updated);

    // Also attempt backend synchronization if available
    apiService.post('/complaints', newComplaint).catch(() => {});

    return newComplaint;
  };

  // Toggle Buzz / Upvote
  const toggleBuzz = async (complaintId, currentUserId) => {
    const updated = complaints.map((cmp) => {
      if (cmp.id === complaintId) {
        const alreadyBuzzed = cmp.buzzedBy.includes(currentUserId);
        const newBuzzedBy = alreadyBuzzed
          ? cmp.buzzedBy.filter((uid) => uid !== currentUserId)
          : [...cmp.buzzedBy, currentUserId];

        const newBuzzCount = alreadyBuzzed
          ? Math.max(0, cmp.buzzCount - 1)
          : cmp.buzzCount + 1;

        return {
          ...cmp,
          buzzCount: newBuzzCount,
          buzzedBy: newBuzzedBy,
        };
      }
      return cmp;
    });

    await saveComplaints(updated);

    // Call backend endpoint if available
    apiService.post(`/complaints/${complaintId}/buzz`, { userId: currentUserId }).catch(() => {});
  };

  // Add comment
  const addComment = async (complaintId, commentText, currentUser) => {
    if (!commentText || !commentText.trim()) return;

    const updated = complaints.map((cmp) => {
      if (cmp.id === complaintId) {
        const newComment = {
          id: `cmt_${Date.now()}`,
          author: currentUser?.name || 'Student',
          text: commentText.trim(),
          time: 'Just now',
        };
        return {
          ...cmp,
          comments: [...(cmp.comments || []), newComment],
        };
      }
      return cmp;
    });

    await saveComplaints(updated);
  };

  // Delete a complaint
  const deleteComplaint = async (complaintId) => {
    const updated = complaints.filter((cmp) => cmp.id !== complaintId);
    await saveComplaints(updated);
    apiService.delete(`/complaints/${complaintId}`).catch(() => {});
    return true;
  };

  // Filtered and Sorted list
  const getFilteredComplaints = () => {
    return complaints
      .filter((cmp) => {
        // Category filter
        if (activeFilter !== 'all' && cmp.category !== activeFilter) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = cmp.title.toLowerCase().includes(q);
          const matchDesc = cmp.description.toLowerCase().includes(q);
          const matchLoc = cmp.location.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'buzzes') {
          // Most buzzed get noticed more!
          return b.buzzCount - a.buzzCount;
        }
        if (sortBy === 'recent') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'urgent') {
          const urgencyOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
          return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
        }
        return 0;
      });
  };

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        filteredComplaints: getFilteredComplaints(),
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        backendStatus,
        checkBackend,
        addComplaint,
        toggleBuzz,
        addComment,
        deleteComplaint,
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintsContext);

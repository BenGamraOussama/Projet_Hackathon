import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { messageService } from '../../services/message.service';
import { authService } from '../../services/auth.service';
import Navbar from '../../components/feature/Navbar';
import NewConversationModal from './components/NewConversationModal';

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const messages = await messageService.getAll();
      const currentUserEmail = authService.getCurrentUser();

      // Group messages by participant
      const conversationMap = new Map();

      messages.forEach(msg => {
        const participantId = msg.senderId === currentUserEmail ? msg.recipientId : msg.senderId;
        // This is a simplified grouping logic. Ideally we need user details for names/avatars.
        // For demo, we might fall back to ID or fetch user details.

        const isRead = msg.read ?? msg.isRead ?? false;
        if (!conversationMap.has(participantId)) {
          conversationMap.set(participantId, {
            id: participantId, // using participantId as conversation Id for simplicity
            participantId: participantId,
            participantName: participantId, // Placeholder
            participantRole: 'User',
            participantAvatar: 'U',
            lastMessage: msg.content,
            lastMessageTime: msg.timestamp,
            unreadCount: (!isRead && msg.recipientId === currentUserEmail) ? 1 : 0,
            isOnline: false
          });
        } else {
          const conv = conversationMap.get(participantId);
          if (new Date(msg.timestamp) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = msg.content;
            conv.lastMessageTime = msg.timestamp;
          }
          if (!isRead && msg.recipientId === currentUserEmail) {
            conv.unreadCount += 1;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || (selectedFilter === 'unread' && conv.unreadCount > 0);
    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleSelectTrainer = (trainerId: string) => {
    // Find existing conversation with this trainer
    const existingConversation = conversations.find(conv => conv.participantId === trainerId);

    if (existingConversation) {
      // Navigate to existing conversation
      navigate(`/messages/${existingConversation.id}`);
    } else {
      navigate(`/messages/${trainerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messagerie</h1>
              <p className="text-gray-600 mt-1">
                {totalUnreadCount > 0 ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 flex items-center justify-center bg-teal-500 rounded-full"></span>
                    {totalUnreadCount} message{totalUnreadCount > 1 ? 's' : ''} non lu{totalUnreadCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  'Aucun nouveau message'
                )}
              </p>
            </div>
            <button
              onClick={() => setIsNewConversationModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line text-xl" aria-hidden="true"></i>
              <span className="font-medium">Nouvelle conversation</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400" aria-hidden="true"></i>
              </div>
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${selectedFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setSelectedFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${selectedFilter === 'unread'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Non lues
                {totalUnreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-message-3-line text-3xl text-gray-400" aria-hidden="true"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation trouvée</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Essayez avec d\'autres mots-clés' : 'Commencez une nouvelle conversation'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/messages/${conversation.id}`}
                  className={`flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${conversation.unreadCount > 0 ? 'bg-teal-50/30' : ''
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-full text-white font-semibold text-lg">
                      {conversation.participantAvatar}
                    </div>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className={`font-semibold ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                          {conversation.participantName}
                        </h3>
                        <p className="text-xs text-gray-500">{conversation.participantRole}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 text-white text-xs font-semibold rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-lg">
                <i className="ri-message-3-line text-xl text-teal-600" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                <p className="text-sm text-gray-600">Conversations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-user-line text-xl text-green-600" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.filter(c => c.isOnline).length}
                </p>
                <p className="text-sm text-gray-600">En ligne</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
                <i className="ri-notification-line text-xl text-amber-600" aria-hidden="true"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUnreadCount}</p>
                <p className="text-sm text-gray-600">Non lus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onSelectTrainer={handleSelectTrainer}
      />
    </div>
  );
}

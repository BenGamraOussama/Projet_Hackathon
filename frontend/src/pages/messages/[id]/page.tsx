import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import { messageService } from '../../../services/message.service';
import { authService } from '../../../services/auth.service';
import { userService } from '../../../services/user.service';

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversation, setConversation] = useState<{
    participantName: string;
    participantRole: string;
    participantAvatar: string;
    isOnline: boolean;
  } | null>(null);

  const currentUserEmail = authService.getCurrentUser();

  const emojis = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🔥', '✅', '💪', '🙏', '😍', '🤔', '👌', '💯', '🚀'];

  useEffect(() => {
    const loadConversation = async () => {
      if (!id || !currentUserEmail) return;

      try {
        const messages = await messageService.getAll();
        const filtered = messages
          .filter((msg) =>
            (msg.senderId === currentUserEmail && msg.recipientId === id) ||
            (msg.senderId === id && msg.recipientId === currentUserEmail)
          )
          .map((msg) => ({
            ...msg,
            isRead: msg.read || msg.isRead || false
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setConversationMessages(filtered);

        let participantName = id;
        let participantRole = 'Utilisateur';

        try {
          const [admins, formateurs, responsables] = await Promise.all([
            userService.getByRole('ADMIN'),
            userService.getByRole('FORMATEUR'),
            userService.getByRole('RESPONSABLE')
          ]);
          const participant = [...admins, ...formateurs, ...responsables].find((user) => user.email === id);
          if (participant) {
            participantName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email;
            participantRole = participant.role === 'ADMIN'
              ? 'Administrateur'
              : participant.role === 'RESPONSABLE'
                ? 'Responsable formation'
                : 'Formateur';
          }
        } catch (error) {
          console.error("Failed to load participant info", error);
        }

        const initials = participantName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('') || (id ? id[0]?.toUpperCase() : 'U');

        setConversation({
          participantName,
          participantRole,
          participantAvatar: initials,
          isOnline: false
        });
      } catch (error) {
        console.error("Failed to load conversation messages", error);
      }
    };

    loadConversation();
  }, [id, currentUserEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !id || !currentUserEmail) return;

    try {
      const saved = await messageService.sendMessage({
        senderId: currentUserEmail,
        recipientId: id,
        content: messageText
      });

      const newMessage = {
        ...saved,
        isRead: saved.read || saved.isRead || false
      };

      setConversationMessages((prev) => [...prev, newMessage]);
      setMessageText('');
      setShowEmojiPicker(false);

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }, 500);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageText(messageText + emoji);
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-gray-400 mb-4" aria-hidden="true"></i>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" tabIndex={-1}>Conversation introuvable</h1>
            <button
              onClick={() => navigate('/messages')}
              className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              Retour aux messages
            </button>
          </div>
        </main>
      </div>
    );
  }

  const groupedMessages: { [key: string]: typeof conversationMessages } = {};
  conversationMessages.forEach(msg => {
    const dateKey = formatMessageDate(msg.timestamp);
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/messages')}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                aria-label="Retour aux messages"
              >
                <i className="ri-arrow-left-line text-xl" aria-hidden="true"></i>
              </button>
              
              <div className="relative">
                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-full text-white font-semibold text-lg">
                  {conversation.participantAvatar}
                </div>
                {conversation.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 flex items-center justify-center bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900" tabIndex={-1}>{conversation.participantName}</h1>
                <p className="text-sm text-gray-500">
                  {conversation.isOnline ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 flex items-center justify-center bg-green-500 rounded-full"></span>
                      En ligne
                    </span>
                  ) : (
                    conversation.participantRole
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                aria-label="Rechercher dans la conversation"
              >
                <i className="ri-search-line text-xl" aria-hidden="true"></i>
              </button>
              <button
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                aria-label="Plus d'options"
              >
                <i className="ri-more-2-line text-xl" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="sr-only">Messages</h2>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1.5 bg-gray-200 rounded-full">
                  <span className="text-xs font-medium text-gray-600">{date}</span>
                </div>
              </div>

              {msgs.map((message, index) => {
                const isCurrentUser = message.senderId === currentUserEmail;
                const showAvatar = !isCurrentUser && (index === 0 || msgs[index - 1].senderId !== message.senderId);

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 mb-4 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {showAvatar && !isCurrentUser && (
                        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-full text-white font-medium text-sm">
                          {conversation.participantAvatar}
                        </div>
                      )}
                    </div>

                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isCurrentUser
                            ? 'bg-teal-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-xs text-gray-500">{formatMessageTime(message.timestamp)}</span>
                        {isCurrentUser && (
                          <i
                            className={`text-xs ${
                              message.isRead ? 'ri-check-double-line text-teal-600' : 'ri-check-line text-gray-400'
                            }`}
                            aria-hidden="true"
                          ></i>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-full text-white font-medium text-sm">
                {conversation.participantAvatar}
              </div>
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 flex items-center justify-center bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 flex items-center justify-center bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 flex items-center justify-center bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

        <div className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="sr-only">Composer un message</h2>
            {showEmojiPicker && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="text-2xl hover:scale-125 transition-transform duration-200 cursor-pointer"
                    aria-label={`Ajouter emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                showEmojiPicker ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Emojis"
            >
              <i className="ri-emotion-line text-xl" aria-hidden="true"></i>
            </button>

            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                messageText.trim()
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Envoyer le message"
            >
              <i className="ri-send-plane-fill text-xl" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

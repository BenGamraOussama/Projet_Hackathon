export const conversations = [
  {
    id: '1',
    participantId: 'user-2',
    participantName: 'Sarah Mansour',
    participantRole: 'Formatrice Robotique',
    participantAvatar: 'SM',
    lastMessage: 'Parfait, je te confirme pour demain à 14h. On pourra discuter du nouveau programme Arduino.',
    lastMessageTime: '2024-01-15T16:45:00',
    unreadCount: 2,
    isOnline: true
  },
  {
    id: '2',
    participantId: 'user-3',
    participantName: 'Ahmed Ben Ali',
    participantRole: 'Formateur Programmation',
    participantAvatar: 'AB',
    lastMessage: 'Les élèves ont vraiment apprécié le workshop Python de la semaine dernière. On devrait organiser une suite.',
    lastMessageTime: '2024-01-15T14:20:00',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '3',
    participantId: 'user-4',
    participantName: 'Leila Trabelsi',
    participantRole: 'Coordinatrice Pédagogique',
    participantAvatar: 'LT',
    lastMessage: 'N\'oublie pas d\'envoyer le rapport de présences avant vendredi. Merci !',
    lastMessageTime: '2024-01-15T11:30:00',
    unreadCount: 1,
    isOnline: true
  },
  {
    id: '4',
    participantId: 'user-5',
    participantName: 'Mohamed Karim',
    participantRole: 'Formateur Électronique',
    participantAvatar: 'MK',
    lastMessage: 'Super ! Je vais préparer le matériel pour la session de demain.',
    lastMessageTime: '2024-01-14T18:15:00',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '5',
    participantId: 'user-6',
    participantName: 'Fatma Gharbi',
    participantRole: 'Formatrice Design 3D',
    participantAvatar: 'FG',
    lastMessage: 'Les imprimantes 3D sont de nouveau opérationnelles. On peut reprendre les ateliers.',
    lastMessageTime: '2024-01-14T15:50:00',
    unreadCount: 0,
    isOnline: true
  },
  {
    id: '6',
    participantId: 'user-7',
    participantName: 'Youssef Hamdi',
    participantRole: 'Formateur IoT',
    participantAvatar: 'YH',
    lastMessage: 'J\'ai commandé les nouveaux capteurs ESP32. Ils devraient arriver la semaine prochaine.',
    lastMessageTime: '2024-01-13T16:40:00',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '7',
    participantId: 'user-8',
    participantName: 'Amira Sassi',
    participantRole: 'Responsable Administrative',
    participantAvatar: 'AS',
    lastMessage: 'Les certificats pour la session de décembre sont prêts. Tu peux passer les récupérer.',
    lastMessageTime: '2024-01-13T10:25:00',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '8',
    participantId: 'user-9',
    participantName: 'Karim Bouaziz',
    participantRole: 'Formateur Web Development',
    participantAvatar: 'KB',
    lastMessage: 'Excellente idée ! On pourrait faire un hackathon inter-formations.',
    lastMessageTime: '2024-01-12T14:10:00',
    unreadCount: 0,
    isOnline: true
  }
];

export const messages = [
  {
    id: 'msg-1',
    conversationId: '1',
    senderId: 'user-2',
    senderName: 'Sarah Mansour',
    content: 'Salut ! Tu as vu les nouveaux kits Arduino qui sont arrivés ?',
    timestamp: '2024-01-15T15:30:00',
    isRead: true
  },
  {
    id: 'msg-2',
    conversationId: '1',
    senderId: 'current-user',
    senderName: 'Moi',
    content: 'Oui ! Ils ont l\'air vraiment complets. On pourrait organiser un atelier la semaine prochaine ?',
    timestamp: '2024-01-15T15:35:00',
    isRead: true
  },
  {
    id: 'msg-3',
    conversationId: '1',
    senderId: 'user-2',
    senderName: 'Sarah Mansour',
    content: 'Bonne idée ! Je suis disponible mardi ou jeudi après-midi. Qu\'est-ce qui t\'arrange ?',
    timestamp: '2024-01-15T16:20:00',
    isRead: true
  },
  {
    id: 'msg-4',
    conversationId: '1',
    senderId: 'current-user',
    senderName: 'Moi',
    content: 'Mardi me convient parfaitement. On dit 14h ?',
    timestamp: '2024-01-15T16:30:00',
    isRead: true
  },
  {
    id: 'msg-5',
    conversationId: '1',
    senderId: 'user-2',
    senderName: 'Sarah Mansour',
    content: 'Parfait, je te confirme pour demain à 14h. On pourra discuter du nouveau programme Arduino.',
    timestamp: '2024-01-15T16:45:00',
    isRead: false
  }
];

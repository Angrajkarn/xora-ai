

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  where,
  onSnapshot,
  arrayUnion,
  type Unsubscribe,
  getDoc,
} from 'firebase/firestore';
import type { Message, ChatSummary, ModelId, CustomPersona, Workspace } from '@/lib/types';
import type { User } from 'firebase/auth';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

function toDbMessage(message: Message, ownerId: string): any {
    const dbMessage: any = { ...message };
    delete dbMessage.id;
    delete dbMessage.feedback;
    delete dbMessage.attachment;
    
    // Add ownerId to the message for collection group queries
    dbMessage.ownerId = ownerId;

    // Convert Date to Timestamp
    if (dbMessage.createdAt instanceof Date) {
        dbMessage.createdAt = Timestamp.fromDate(dbMessage.createdAt);
    } else {
        // Fallback to server timestamp if createdAt is not set
        dbMessage.createdAt = serverTimestamp();
    }
    
    // Sanitize the author object to prevent undefined values.
    if (dbMessage.author && dbMessage.author.avatar === undefined) {
        delete dbMessage.author.avatar;
    }
    
    // Remove undefined fields from the top level
    Object.keys(dbMessage).forEach(key => {
        if (dbMessage[key] === undefined) {
            delete dbMessage[key];
        }
    });

    return dbMessage;
}

export function listenToChatMessages(
    chatId: string, 
    callback: (messages: Message[], chatData: ChatSummary | null) => void
): Unsubscribe {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Message
    });

    const chatDoc = await getDoc(doc(db, CHATS_COLLECTION, chatId));
    const chatData = chatDoc.exists() ? ({ id: chatDoc.id, ...chatDoc.data() } as ChatSummary) : null;
    
    callback(messages, chatData);
  });
  
  return unsubscribe;
}

export async function createChatAndAddMessage(user: User, message: Message, defaultModelId?: ModelId, customTitle?: string, workspaceId?: string): Promise<{id: string, defaultModelId?: ModelId}> {
    const now = Timestamp.now();
    
    const title = customTitle || (message.content.split(' ').length > 4 
      ? message.content.split(' ').slice(0, 4).join(' ') + '...'
      : message.content) || 'New Chat';

    // Step 1: Create the chat document first.
    const newChatData: any = {
        ownerId: user.uid,
        members: [user.uid],
        title,
        createdAt: now,
        updatedAt: now,
        isStarred: false,
        expiresAt: null,
        workspaceId: workspaceId || null,
    };

    if (defaultModelId) {
        newChatData.defaultModelId = defaultModelId;
    }
    
    const newChatDocRef = await addDoc(collection(db, CHATS_COLLECTION), newChatData);

    // Step 2: Now that the chat exists, create the first message document.
    // This ensures the security rules for message creation can successfully `get()` the parent chat.
    const messageData = toDbMessage(message, user.uid);
    // Override serverTimestamp with the consistent timestamp from chat creation for perfect sorting.
    messageData.createdAt = now;

    const messagesRef = collection(newChatDocRef, MESSAGES_COLLECTION);
    await addDoc(messagesRef, messageData);
    
    return { id: newChatDocRef.id, defaultModelId };
}

export async function createGroupChat(user: User, aiMembers: ModelId[], title: string, customPersonas?: CustomPersona[], workspaceId?: string): Promise<string> {
    const chatsRef = collection(db, CHATS_COLLECTION);
    const now = serverTimestamp();

    const newChatData: any = {
        ownerId: user.uid,
        members: [user.uid],
        aiMembers,
        title,
        createdAt: now,
        updatedAt: now,
        isStarred: false,
        expiresAt: null,
        workspaceId: workspaceId || null,
    };

    if (customPersonas && customPersonas.length > 0) {
        newChatData.customPersonas = customPersonas;
    }

    const chatDocRef = await addDoc(chatsRef, newChatData);

    return chatDocRef.id;
}

export async function addMessageToChat(chatId: string, message: Message): Promise<string> {
    const chatDocRef = doc(db, CHATS_COLLECTION, chatId);
    const now = serverTimestamp();

    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) {
        throw new Error("Chat does not exist.");
    }
    const chatData = chatSnap.data();
    let ownerId = chatData.ownerId;

    // Fallback for legacy chats that might not have an ownerId
    if (!ownerId && chatData.members && chatData.members.length > 0) {
        ownerId = chatData.members[0]; // Assume first member is the owner
    }

    if (!ownerId) {
        throw new Error("Chat owner could not be determined.");
    }

    const batch = writeBatch(db);
    batch.update(chatDocRef, { updatedAt: now });
    
    const messageData = toDbMessage(message, ownerId);
    
    const newMessageRef = doc(collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION));
    batch.set(newMessageRef, messageData);
    
    await batch.commit();
    return newMessageRef.id;
}


export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  await updateDoc(chatRef, { title });
}

export async function setChatExpiry(chatId: string, expiresAt: Timestamp | null): Promise<void> {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  await updateDoc(chatRef, { expiresAt });
}

export async function updateChatDefaultModel(chatId: string, modelId: ModelId): Promise<void> {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  await updateDoc(chatRef, { defaultModelId: modelId });
}

export async function toggleChatStar(chatId: string, isStarred: boolean, userId: string): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, { isStarred });
}

export async function joinChat(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, {
        members: arrayUnion(userId)
    });
}

export async function updateMessageReaction(
    chatId: string,
    messageId: string,
    reaction: string | null,
    isAiReaction: boolean
): Promise<void> {
    const messageRef = doc(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION, messageId);
    if (isAiReaction) {
        await updateDoc(messageRef, { aiReaction: reaction });
    } else {
        await updateDoc(messageRef, { userReaction: reaction });
    }
}


'use server';

import { db } from '@/lib/firebase-admin';
import type { ChatSummary, Workspace } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * A server action to securely delete a chat and all its messages.
 * This should be used for all chat deletion operations.
 * @param chatId The ID of the chat to delete.
 */
export async function deleteChatAction(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const chatRef = db.collection('chats').doc(chatId);
        const messagesRef = chatRef.collection('messages');

        // Delete all messages in a batch
        const messagesSnapshot = await messagesRef.get();
        if (!messagesSnapshot.empty) {
            const batch = db.batch();
            messagesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // Delete the chat itself
        await chatRef.delete();
        
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to delete chat ${chatId}:`, error);
        return { success: false, error: error.message };
    }
}


/**
 * A server action to get a user's chat history, ordered by most recent.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of ChatSummary objects.
 */
export async function getChatHistoryAction(userId: string): Promise<Pick<ChatSummary, 'id' | 'title'>[]> {
    if (!userId) return [];
    
    const chatsRef = db.collection('chats');
    const q = chatsRef.where('ownerId', '==', userId).orderBy('updatedAt', 'desc').limit(10);
    const querySnapshot = await q.get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
    }));
}


/**
 * A robust, server-side action to get all data needed for the sidebar.
 * It fetches all chats and workspaces a user is a member of.
 * It also purges any chats that have passed their self-destruct timer.
 * @param userId The ID of the user whose data to fetch.
 * @returns A promise that resolves to an object containing chats and workspaces.
 */
export async function getSidebarDataAction(userId: string): Promise<{ chats: ChatSummary[], workspaces: Workspace[] }> {
  if (!userId) {
    return { chats: [], workspaces: [] };
  }

  // --- Purge expired chats BEFORE fetching the list ---
  try {
      const now = Timestamp.now();
      const expiredChatsQuery = db.collection('chats')
          .where('ownerId', '==', userId)
          .where('expiresAt', '!=', null)
          .where('expiresAt', '<=', now);
      
      const expiredChatsSnapshot = await expiredChatsQuery.get();

      if (!expiredChatsSnapshot.empty) {
          console.log(`Found ${expiredChatsSnapshot.size} expired chats for user ${userId}. Purging...`);
          const deletionPromises = expiredChatsSnapshot.docs.map(doc => deleteChatAction(doc.id));
          await Promise.all(deletionPromises);
          console.log(`Purged ${expiredChatsSnapshot.size} expired chats.`);
      }
  } catch (err) {
      // We don't want this to block the main data fetching, so we just log the error.
      console.error("Error during expired chat cleanup:", err);
  }

  // --- Fetch Chats ---
  const chatsRef = db.collection('chats');
  const chatsQuery = chatsRef.where('members', 'array-contains', userId);
  const chatsSnapshot = await chatsQuery.get();
  
  const chats: ChatSummary[] = chatsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || 'Untitled Chat',
      workspaceId: data.workspaceId || null,
      isStarred: data.isStarred || false,
      ownerId: data.ownerId,
      members: data.members || [],
      aiMembers: data.aiMembers || [],
      customPersonas: data.customPersonas || [],
      defaultModelId: data.defaultModelId,
      updatedAt: data.updatedAt,
      expiresAt: data.expiresAt,
    } as ChatSummary;
  });

  // --- Fetch Workspaces ---
  const workspacesRef = db.collection('workspaces');
  const workspacesQuery = workspacesRef.where('members', 'array-contains', userId);
  const workspacesSnapshot = await workspacesQuery.get();

  const workspaces: Workspace[] = workspacesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          ownerId: data.ownerId,
          members: data.members,
          createdAt: data.createdAt,
      } as Workspace;
  });

  // --- Sort Data ---
  chats.sort((a, b) => {
    const timeA = (a.updatedAt as Timestamp)?.toMillis() || 0;
    const timeB = (b.updatedAt as Timestamp)?.toMillis() || 0;
    return timeB - timeA;
  });

  workspaces.sort((a, b) => {
    const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
    const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
    return timeA - timeB;
  });

  // --- Serialize Data for Client ---
  const serializableChats = chats.map(chat => ({
    ...chat,
    updatedAt: (chat.updatedAt as Timestamp)?.toDate(),
    expiresAt: (chat.expiresAt as Timestamp)?.toDate(),
  })).slice(0, 100); // Limit to latest 100 chats for performance

  const serializableWorkspaces = workspaces.map(ws => ({
      ...ws,
      createdAt: (ws.createdAt as Timestamp)?.toDate(),
  }));

  return { chats: serializableChats, workspaces: serializableWorkspaces };
}

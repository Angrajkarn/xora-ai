
'use server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function createWorkspaceAction(
  userId: string,
  name: string,
  icon: string,
  color: string
): Promise<string> {
    const newWorkspaceRef = db.collection('workspaces').doc();
    await newWorkspaceRef.set({
        name,
        icon,
        color,
        ownerId: userId,
        members: [userId],
        createdAt: FieldValue.serverTimestamp(),
    });
    return newWorkspaceRef.id;
}


export async function updateWorkspaceNameAction(
    workspaceId: string,
    name: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const workspaceRef = db.collection('workspaces').doc(workspaceId);
        await workspaceRef.update({ name });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating workspace name:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteWorkspaceAction(
    workspaceId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const workspaceRef = db.collection('workspaces').doc(workspaceId);

        // Find all chats in the workspace
        const chatsQuery = db.collection('chats').where('workspaceId', '==', workspaceId);
        const chatsSnapshot = await chatsQuery.get();

        const batch = db.batch();

        // Delete all messages within each chat, then delete the chat itself
        for (const chatDoc of chatsSnapshot.docs) {
            const messagesRef = chatDoc.ref.collection('messages');
            const messagesSnapshot = await messagesRef.get();
            messagesSnapshot.forEach(msgDoc => batch.delete(msgDoc.ref));
            batch.delete(chatDoc.ref);
        }

        // Finally, delete the workspace document
        batch.delete(workspaceRef);

        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting workspace:", error);
        return { success: false, error: error.message };
    }
}

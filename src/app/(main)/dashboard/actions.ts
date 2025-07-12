
'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { type AIResponse, type Message, type ModelId } from '@/lib/types';
import { MODELS } from '@/lib/constants';


interface WeeklyUsage {
  date: string;
  [key: string]: string | number;
}

const processMessagesForCharts = (
  messages: Message[],
  days: number
): {
  weeklyUsage: WeeklyUsage[];
  monthlyVolume: { date: string; prompts: number }[];
  totalPrompts: number;
  smartAiUsage: number;
} => {
  const now = new Date();
  const dailyData: {
    [date: string]: {
      prompts: number;
      models: { [modelId: string]: number };
    };
  } = {};

  // Initialize daily data for the last 'days'
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyData[dateStr] = { prompts: 0, models: {} };
  }

  let totalPrompts = 0;
  let smartAiUsage = 0;

  messages.forEach((msg) => {
    if (!msg.createdAt) return;
    const msgDate = (msg.createdAt as Timestamp).toDate();
    const dateStr = msgDate.toISOString().split('T')[0];

    if (dailyData[dateStr]) {
      if (msg.role === 'user') {
        dailyData[dateStr].prompts += 1;
        totalPrompts +=1;
      }
      if (msg.isSummary) {
          smartAiUsage += 1;
          if (!dailyData[dateStr].models['smart-ai']) dailyData[dateStr].models['smart-ai'] = 0;
          dailyData[dateStr].models['smart-ai']++;
      }
      if (msg.isPersonaResponse) {
          const modelId = msg.personaName === 'Xora Persona' ? 'xora' : (MODELS.find(m => m.name === msg.personaName)?.id || 'xora');
          if (!dailyData[dateStr].models[modelId]) dailyData[dateStr].models[modelId] = 0;
          dailyData[dateStr].models[modelId]++;
      }
      if (msg.responses) {
        msg.responses.forEach((res: AIResponse) => {
          if (!dailyData[dateStr].models[res.modelId]) dailyData[dateStr].models[res.modelId] = 0;
          dailyData[dateStr].models[res.modelId]++;
        });
      }
    }
  });

  const monthlyVolume = Object.entries(dailyData)
    .map(([date, data]) => ({ date, prompts: data.prompts }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const weeklyUsage: WeeklyUsage[] = [];
  for (let i = 6; i >= 0; i--) {
     const d = new Date(now);
     d.setDate(now.getDate() - i);
     const dateStr = d.toISOString().split('T')[0];
     const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
     
     if (dailyData[dateStr]) {
        weeklyUsage.push({
            date: dayOfWeek,
            ...dailyData[dateStr].models
        });
     } else {
         weeklyUsage.push({ date: dayOfWeek });
     }
  }

  return { weeklyUsage, monthlyVolume, totalPrompts, smartAiUsage };
};

export async function getDashboardData(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

  // Query 1: All messages from the last 30 days for chart data (still potentially large)
  const statsMessagesQuery = db
    .collectionGroup('messages')
    .where('ownerId', '==', userId)
    .where('createdAt', '>=', thirtyDaysAgoTimestamp)
    .get();

  // Query 2: Saved chats count (very fast)
  const savedChatsQuery = db
    .collection('chats')
    .where('ownerId', '==', userId)
    .where('isStarred', '==', true)
    .count()
    .get();
  
  // Query 3: A small, fast query for recent activity
  const recentActivityQuery = db
    .collectionGroup('messages')
    .where('ownerId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(20) // Fetch last 20 messages to find the last 4 user prompts
    .get();

  const [
    statsMessagesSnapshot, 
    savedChatsSnapshot, 
    recentActivitySnapshot
  ] = await Promise.all([
    statsMessagesQuery,
    savedChatsQuery,
    recentActivityQuery,
  ]);

  // Process chart data from the larger query
  const allMessagesForStats = statsMessagesSnapshot.docs.map((doc) => doc.data() as Message);
  const { weeklyUsage, monthlyVolume, totalPrompts, smartAiUsage } =
    processMessagesForCharts(allMessagesForStats, 30);
  
  // Process saved chats count
  const savedChatsCount = savedChatsSnapshot.data().count;

  // Process recent activity from the much smaller, targeted query
  const recentMessages = recentActivitySnapshot.docs.map(doc => doc.data() as Message);
  const recentActivity = recentMessages
    .filter(m => m.role === 'user')
    .slice(0, 4)
    .map((msg) => {
        const timeDiff = new Date().getTime() - (msg.createdAt as Timestamp).toDate().getTime();
        const minutesAgo = Math.floor(timeDiff / 60000);
        const hoursAgo = Math.floor(minutesAgo / 60);
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let time = `${minutesAgo}m ago`;
        if (minutesAgo >= 60) time = `${hoursAgo}h ago`;
        if (hoursAgo >= 24) time = `${daysAgo}d ago`;

        return {
            id: msg.id || Math.random().toString(),
            prompt: msg.content,
            // This is a simplification; a real app might need to find the corresponding assistant message
            model: 'xora', 
            time,
        }
    });

  return {
    stats: {
      totalPrompts,
      smartUsage: smartAiUsage,
      savedChats: savedChatsCount,
    },
    weeklyUsage,
    monthlyVolume,
    recentActivity,
  };
}

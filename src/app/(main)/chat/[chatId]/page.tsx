import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPageWithId({ params }: { params: { chatId: string } }) {
  return (
    <div className="h-full">
      <ChatInterface chatId={params.chatId} />
    </div>
  );
}

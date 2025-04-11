import { ChatInterface } from '../components/ChatInterface';

export default function ChatView() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
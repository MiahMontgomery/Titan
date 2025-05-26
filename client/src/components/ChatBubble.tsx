import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CodeBlock } from "./CodeBlock";
import { ScreenshotBlock } from "./ScreenshotBlock";
import { DATE_FORMATS, SENDERS } from "@/lib/constants";
import type { Message } from "@shared/schema";

interface ChatBubbleProps {
  message: Message;
  onRollback?: (messageId: number) => void;
}

export function ChatBubble({ message, onRollback }: ChatBubbleProps) {
  const isUser = message.sender === SENDERS.USER;
  const formattedTime = message.timestamp ? format(new Date(message.timestamp), DATE_FORMATS.MESSAGE_TIME) : "";

  // Determine if message contains code or screenshot
  const hasMetadata = message.metadata && typeof message.metadata === 'object';
  const hasCode = hasMetadata && (message.metadata as any).type === "code";
  const hasScreenshot = hasMetadata && (message.metadata as any).type === "screenshot";

  return (
    <motion.div
      className="message my-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="message-header flex items-center gap-2 mb-1">
        <div 
          className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs 
            ${isUser 
              ? 'bg-gray-700 text-white' 
              : 'bg-[#39FF14] bg-opacity-20 text-[#39FF14]'}
          `}
        >
          {isUser ? 'U' : 'J'}
        </div>
        <div className="text-sm font-medium text-white">
          {isUser ? 'You' : 'Jason (AI)'}
        </div>
        <div className="text-xs text-[#A9A9A9]">{formattedTime}</div>
      </div>
      
      <div className="message-content pl-8">
        {/* Regular text message */}
        {!hasMetadata && (
          <div className="text-sm text-white whitespace-pre-wrap">{message.content}</div>
        )}
        
        {/* Code block */}
        {hasCode && (
          <CodeBlock
            code={(message.metadata as any)?.data?.code}
            language={(message.metadata as any)?.data?.language || "javascript"}
            filename={(message.metadata as any)?.data?.filename || "code.js"}
            messageId={message.id}
            onRollback={onRollback}
          />
        )}
        
        {/* Screenshot */}
        {hasScreenshot && (
          <ScreenshotBlock
            url={(message.metadata as any)?.data?.url}
            caption={(message.metadata as any)?.data?.caption || ""}
          />
        )}
      </div>
    </motion.div>
  );
}

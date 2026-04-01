'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/src/types';

interface MessageDisplayProps {
  messages: Message[];
  loading?: boolean;
}

export function MessageDisplay({ messages, loading }: MessageDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <Card
          key={index}
          className={`${
            message.role === 'user'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                  {message.role}
                </p>
                <p className="text-gray-900 break-words">{message.content}</p>
                {message.timestamp && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content, `${index}`)}
                className="shrink-0"
              >
                {copiedId === `${index}` ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {loading && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-200" />
              </div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

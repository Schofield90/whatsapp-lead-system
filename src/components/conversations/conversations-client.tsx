'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getRelativeTime } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Phone, 
  User,
  Calendar,
  ExternalLink,
  Send,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { ManualMessageDialog } from './manual-message-dialog';
import { TestMessageDialog } from './test-message-dialog';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  status: string;
  last_message_at: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    status: string;
  };
  messages: Message[];
  bookings: Array<{
    id: string;
    status: string;
    scheduled_at: string;
  }>;
}

interface ConversationsClientProps {
  conversations: Conversation[];
  selectedLeadId?: string;
}

export function ConversationsClient({ conversations, selectedLeadId }: ConversationsClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Auto-select conversation if lead ID is provided
  useEffect(() => {
    if (selectedLeadId && conversations.length > 0) {
      const conversation = conversations.find(c => c.lead.id === selectedLeadId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [selectedLeadId, conversations]);

  // Update messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
    }
  }, [selectedConversation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConversation.lead.phone,
          message: newMessage,
        }),
      });

      if (response.ok) {
        // Add message to local state optimistically
        const newMsg: Message = {
          id: Date.now().toString(),
          direction: 'outbound',
          content: newMessage,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <div className="flex h-[calc(100vh-200px)]">
        {/* Chat View */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 bg-white">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold">{selectedConversation.lead.name}</h2>
                  <Badge className={getLeadStatusColor(selectedConversation.lead.status)}>
                    {selectedConversation.lead.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span>{selectedConversation.lead.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length > 0 ? messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.direction === 'outbound' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-900 border'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {getRelativeTime(message.created_at)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4 bg-white">
            <div className="flex space-x-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim() || sendingMessage}
                size="lg"
              >
                {sendingMessage ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground">
            Monitor and manage WhatsApp conversations with your leads
          </p>
        </div>
        <ManualMessageDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.reduce((total, conv) => total + (conv.messages?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.bookings && c.bookings.length > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
          <CardDescription>
            {conversations.length} total conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => {
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  const messageCount = conversation.messages?.length || 0;
                  const hasBooking = conversation.bookings && conversation.bookings.length > 0;
                  
                  return (
                    <TableRow key={conversation.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{conversation.lead?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{conversation.lead?.phone}</span>
                          </div>
                          <Badge className={getLeadStatusColor(conversation.lead?.status || '')}>
                            {conversation.lead?.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {getRelativeTime(conversation.last_message_at)}
                          </div>
                          {lastMessage && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {lastMessage.direction === 'inbound' ? '📱 ' : '🤖 '}
                              {lastMessage.content}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{messageCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasBooking ? (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Booked</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No booking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewChat(conversation)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            View Chat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">
                Conversations will appear here when leads start messaging via WhatsApp
              </p>
              <TestMessageDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
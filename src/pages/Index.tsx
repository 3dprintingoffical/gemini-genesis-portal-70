import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Mic, 
  File, 
  Search,
  Bot,
  User,
  Sparkles,
  Camera,
  Download,
  Copy,
  Volume2,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'audio' | 'file';
    name: string;
    url: string;
    file?: File;
  }[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Gemini. I can help you with text conversations, analyze images, transcribe audio, process files, search the web, and even generate images. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{type: 'image' | 'audio' | 'file', name: string, url: string, file: File}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const generateResponse = async (userMessage: string, attachments?: any[]) => {
    const GEMINI_API_KEY = 'AIzaSyDBMWX5dw8D2H18KG3Er8aieov_A7i2TIY';
    
    try {
      let prompt = userMessage;
      
      // Enhanced prompt based on user intent
      if (userMessage.toLowerCase().includes('search') || userMessage.toLowerCase().includes('latest')) {
        prompt = `Please search for recent information about: ${userMessage}. Provide current, accurate details.`;
      }
      
      if (userMessage.toLowerCase().includes('generate image') || userMessage.toLowerCase().includes('create image')) {
        prompt = `I understand you want to generate an image. Here's a detailed description for image generation: ${userMessage}. While I can't directly generate images, I can provide detailed prompts for image generation tools.`;
      }

      const parts: any[] = [{ text: prompt }];

      // Handle file attachments - Enhanced debugging
      if (attachments && attachments.length > 0) {
        console.log('Processing attachments:', attachments.length);
        for (const attachment of attachments) {
          console.log('Processing attachment:', attachment.name, 'Type:', attachment.type);
          if (attachment.type === 'image' && attachment.file) {
            try {
              console.log('Converting image to base64...');
              const base64Data = await convertFileToBase64(attachment.file);
              console.log('Base64 conversion successful, length:', base64Data.length);
              
              const base64Image = base64Data.split(',')[1]; // Remove data:image/...;base64, prefix
              console.log('Cleaned base64 length:', base64Image.length);
              console.log('MIME type:', attachment.file.type);
              
              const imagePart = {
                inline_data: {
                  mime_type: attachment.file.type,
                  data: base64Image
                }
              };
              
              parts.push(imagePart);
              console.log('Added image part to request');
              
              // Make the prompt more explicit about image analysis
              prompt = `Please analyze and describe this uploaded image in detail. ${prompt}`;
              
            } catch (error) {
              console.error('Error processing image:', error);
              throw new Error(`Failed to process image ${attachment.name}: ${error}`);
            }
          } else if (attachment.file) {
            // For non-image files, we can only mention them in the prompt
            prompt += ` I've uploaded a file: ${attachment.name} (${attachment.file.type}). Please help me understand or process this file based on its name and type.`;
          }
        }
      }

      console.log('Final prompt:', prompt);
      console.log('Total parts in request:', parts.length);
      console.log('Request parts structure:', JSON.stringify(parts, null, 2));

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      console.log('Sending request to Gemini API...');
      console.log('Request body structure:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error Details:', errorData);
        throw new Error(`Failed to get response from Gemini AI: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini API full response:', JSON.stringify(data, null, 2));
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || 'Shared files',
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await generateResponse(inputValue || 'Please analyze the uploaded files', currentAttachments);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast({
        title: "Response generated",
        description: "AI has responded to your message",
      });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (type: 'image' | 'audio' | 'file') => {
    const input = type === 'image' ? imageInputRef : 
                  type === 'audio' ? audioInputRef : fileInputRef;
    input.current?.click();
  };

  const processFileUpload = (file: File, type: 'image' | 'audio' | 'file') => {
    const url = URL.createObjectURL(file);
    const newAttachment = {
      type,
      name: file.name,
      url,
      file
    };
    
    setAttachedFiles(prev => [...prev, newAttachment]);
    toast({
      title: "File attached",
      description: `${file.name} is ready to send`
    });
    
    console.log('File attached:', file.name, 'Type:', file.type, 'Size:', file.size);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: isRecording ? "Processing your voice message..." : "Speak now..."
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gemini AI Assistant
              </h1>
              <p className="text-sm text-gray-600">Multimodal AI powered by Google Gemini</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 mb-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white shadow-md'}`}>
                    <CardContent className="p-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {/* Display attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-black/10 rounded">
                              {attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                               attachment.type === 'audio' ? <Mic className="w-4 h-4" /> :
                               <File className="w-4 h-4" />}
                              <span className="text-sm truncate">{attachment.name}</span>
                              {attachment.type === 'image' && (
                                <img src={attachment.url} alt={attachment.name} className="max-w-32 max-h-32 object-cover rounded" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {message.type === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="bg-white shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 shadow-lg">
            <CardContent className="p-4">
              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  <Search className="w-3 h-3 mr-1" />
                  Web Search
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Image Analysis
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Input
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <File className="w-3 h-3 mr-1" />
                  File Processing
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Camera className="w-3 h-3 mr-1" />
                  Image Generation
                </Badge>
              </div>

              <Separator className="mb-4" />

              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                         file.type === 'audio' ? <Mic className="w-4 h-4" /> :
                         <File className="w-4 h-4" />}
                        <span className="truncate max-w-32">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-4 w-4 p-0 hover:bg-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {/* File Upload Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('image')}
                    className="p-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceRecord}
                    className={`p-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('file')}
                    className="p-2"
                  >
                    <File className="w-4 h-4" />
                  </Button>
                </div>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything... I can search the web, analyze images, process files, and more!"
                    className="pr-12 min-h-[2.5rem] resize-none"
                    disabled={isLoading}
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processFileUpload(file, 'image');
                  }
                }}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processFileUpload(file, 'audio');
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processFileUpload(file, 'file');
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

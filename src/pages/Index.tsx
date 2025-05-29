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
  X,
  Palette
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

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
  generatedImage?: {
    url: string;
    prompt: string;
  };
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Gemini. I can help you with text conversations, analyze images, transcribe audio, process files, search the web, and even generate images using Gemini\'s free image generation. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{type: 'image' | 'audio' | 'file', name: string, url: string, file: File}[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const voiceRecording = useVoiceRecording({
    onTranscriptionComplete: (text: string) => {
      console.log('Voice transcription completed:', text);
      setInputValue(text);
      toast({
        title: "Voice recorded",
        description: "Your message has been transcribed",
      });
    },
    onError: (error: string) => {
      console.error('Voice recording error:', error);
      toast({
        title: "Voice recording error",
        description: error,
        variant: "destructive"
      });
    }
  });

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

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const isTextFile = (file: File): boolean => {
    const textTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/xhtml+xml'
    ];
    
    const textExtensions = [
      '.html', '.htm', '.css', '.js', '.json', '.xml', '.txt', '.md', 
      '.csv', '.svg', '.php', '.py', '.java', '.cpp', '.c', '.h',
      '.ts', '.tsx', '.jsx', '.vue', '.scss', '.sass', '.less'
    ];
    
    return textTypes.some(type => file.type.startsWith(type)) ||
           textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const generateImageWithGemini = async (prompt: string) => {
    const GEMINI_API_KEY = 'AIzaSyDBMWX5dw8D2H18KG3Er8aieov_A7i2TIY';
    
    try {
      setIsGeneratingImage(true);
      console.log('Generating image with Gemini API, prompt:', prompt);
      
      // Clean and enhance the prompt for better results
      const enhancedPrompt = prompt.toLowerCase().includes('generate image') 
        ? prompt.replace(/generate image of?/i, '').trim()
        : prompt;
      
      console.log('Enhanced prompt:', enhancedPrompt);
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `Generate an image: ${enhancedPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseModalities: ["TEXT", "IMAGE"]
        }
      };
      
      console.log('Request body:', requestBody);
      
      // Use the correct model for image generation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = `Gemini API Error (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.log('Error data:', errorData);
          errorMessage = errorData.error?.message || errorData.error?.code || 'Unknown error';
        } catch (e) {
          console.log('Could not parse error response');
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log('Success response:', data);
      
      // Look for image data in the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        
        for (const part of parts) {
          if (part.inline_data && part.inline_data.data) {
            console.log('Found image data in response');
            // Create a data URL from the base64 image data
            const mimeType = part.inline_data.mime_type || 'image/png';
            const imageUrl = `data:${mimeType};base64,${part.inline_data.data}`;
            console.log('Image URL created:', imageUrl.substring(0, 100) + '...');
            return imageUrl;
          }
        }
        
        // If no image found, throw an error
        console.error('No image data found in response parts:', parts);
        throw new Error('No image data found in Gemini response. Image generation may not be available for this model.');
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
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

      const parts: any[] = [];

      // Handle file attachments - ENHANCED: Support for text files
      if (attachments && attachments.length > 0) {
        console.log('Processing attachments:', attachments.length);
        for (const attachment of attachments) {
          console.log('Processing attachment:', attachment.name, 'Type:', attachment.type, 'MIME:', attachment.file?.type);
          
          if (attachment.type === 'image' && attachment.file) {
            try {
              console.log('Converting image to base64...');
              const base64Data = await convertFileToBase64(attachment.file);
              console.log('Base64 conversion successful, length:', base64Data.length);
              
              // Extract just the base64 data without the data URL prefix
              const base64Image = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
              console.log('Cleaned base64 length:', base64Image.length);
              console.log('MIME type:', attachment.file.type);
              
              // Add the image first
              parts.push({
                inline_data: {
                  mime_type: attachment.file.type,
                  data: base64Image
                }
              });
              
              console.log('Added image part to request');
              
              // Make the prompt more explicit about image analysis
              if (prompt.toLowerCase().includes('describe') || prompt.toLowerCase().includes('what')) {
                prompt = `Please analyze and describe this uploaded image in detail. ${prompt}`;
              } else {
                prompt = `Please analyze this uploaded image and ${prompt}`;
              }
              
            } catch (error) {
              console.error('Error processing image:', error);
              throw new Error(`Failed to process image ${attachment.name}: ${error}`);
            }
          } else if (attachment.file && isTextFile(attachment.file)) {
            try {
              console.log('Reading text file content...');
              const fileContent = await readFileAsText(attachment.file);
              console.log('File content read successfully, length:', fileContent.length);
              
              // Add file content to the prompt
              prompt += `\n\nHere is the content of the uploaded file "${attachment.name}" (${attachment.file.type}):\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease analyze this file content and ${userMessage}`;
              
            } catch (error) {
              console.error('Error reading text file:', error);
              prompt += ` I've uploaded a file: ${attachment.name} (${attachment.file.type}). Please help me understand or process this file based on its name and type.`;
            }
          } else if (attachment.file) {
            // For non-image, non-text files, we can only mention them in the prompt
            prompt += ` I've uploaded a file: ${attachment.name} (${attachment.file.type}). Please help me understand or process this file based on its name and type.`;
          }
        }
      }

      // Add the text prompt after images
      parts.push({ text: prompt });

      console.log('Final prompt:', prompt);
      console.log('Total parts in request:', parts.length);
      console.log('Request parts structure:', JSON.stringify(parts.map(part => ({
        ...part,
        inline_data: part.inline_data ? { ...part.inline_data, data: `[${part.inline_data.data.length} chars]` } : undefined
      })), null, 2));

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error Details:', errorData);
        throw new Error(`Failed to get response from Gemini AI: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini API response received');
      
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

    // Check if this is an image generation request
    const isImageGenRequest = inputValue.toLowerCase().includes('generate image') || 
                              inputValue.toLowerCase().includes('create image') ||
                              inputValue.toLowerCase().includes('draw') ||
                              inputValue.toLowerCase().includes('make image') ||
                              inputValue.toLowerCase().includes('paint') ||
                              inputValue.toLowerCase().includes('design');

    console.log('Input value:', inputValue);
    console.log('Is image generation request:', isImageGenRequest);

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
      if (isImageGenRequest) {
        console.log('Starting image generation with Gemini...');
        // Generate image with Gemini
        const imageUrl = await generateImageWithGemini(inputValue);
        console.log('Image generated successfully:', imageUrl.substring(0, 100) + '...');
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've generated an image based on your prompt: "${inputValue}"`,
          timestamp: new Date(),
          generatedImage: {
            url: imageUrl,
            prompt: inputValue
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast({
          title: "Image generated",
          description: "Your image has been created successfully with Gemini",
        });
      } else {
        // Regular text response with Gemini
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
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request. Please try again.",
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
              <p className="text-sm text-gray-600">Multimodal AI with free image generation powered by Google Gemini</p>
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
                      
                      {/* Display generated images */}
                      {message.generatedImage && (
                        <div className="mt-3">
                          <img 
                            src={message.generatedImage.url} 
                            alt={message.generatedImage.prompt}
                            className="max-w-full rounded-lg shadow-md"
                          />
                          <p className="text-xs text-gray-600 mt-2">Generated from: "{message.generatedImage.prompt}"</p>
                        </div>
                      )}
                      
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
              
              {(isLoading || isGeneratingImage) && (
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
                        <span className="text-sm text-gray-600">
                          {isGeneratingImage ? 'Generating image with Gemini...' : 'AI is thinking...'}
                        </span>
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
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                  <Palette className="w-3 h-3 mr-1" />
                  Free Gemini Generation
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
                    onClick={voiceRecording.toggleRecording}
                    className={`p-2 ${voiceRecording.isRecording ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}
                    disabled={!voiceRecording.isSupported}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100"
                    title="Use keywords like 'generate image' or 'create image' in your message"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                </div>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={voiceRecording.isRecording ? "Listening..." : "Ask me anything or type 'generate image of...' to create images with Gemini!"}
                    className="pr-12 min-h-[2.5rem] resize-none"
                    disabled={isLoading || voiceRecording.isRecording || isGeneratingImage}
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0) || voiceRecording.isRecording || isGeneratingImage}
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

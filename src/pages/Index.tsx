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
  Palette,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  Database
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
    fileType?: string;
    fileSize?: number;
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
      content: 'Hello! I\'m your AI assistant powered by Gemini. I can analyze virtually any file type including:\n\n📄 Documents (PDF, DOC, TXT, MD)\n📊 Spreadsheets (XLS, CSV)\n🖼️ Images (JPG, PNG, GIF, SVG)\n🎵 Audio files (MP3, WAV)\n🎬 Video files (MP4, AVI)\n💻 Code files (JS, PY, HTML, CSS)\n📦 Archives (ZIP, RAR)\n🗄️ Data files (JSON, XML, SQL)\n\nJust upload any file and I\'ll analyze its content, structure, and provide insights!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{type: 'image' | 'audio' | 'file', name: string, url: string, file: File, fileType?: string, fileSize?: number}[]>([]);
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

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = error => reject(error);
    });
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '')) {
      return <FileImage className="w-4 h-4" />;
    }
    
    // Audio
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension || '')) {
      return <FileAudio className="w-4 h-4" />;
    }
    
    // Video
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
      return <FileVideo className="w-4 h-4" />;
    }
    
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />;
    }
    
    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(extension || '')) {
      return <FileSpreadsheet className="w-4 h-4" />;
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension || '') ||
        ['html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml'].includes(extension || '')) {
      return <Code className="w-4 h-4" />;
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
      return <Archive className="w-4 h-4" />;
    }
    
    // Database
    if (['sql', 'db', 'sqlite', 'mdb'].includes(extension || '')) {
      return <Database className="w-4 h-4" />;
    }
    
    return <File className="w-4 h-4" />;
  };

  const isTextFile = (file: File): boolean => {
    const textTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/xhtml+xml',
      'application/sql',
      'application/x-sql'
    ];
    
    const textExtensions = [
      '.html', '.htm', '.css', '.js', '.json', '.xml', '.txt', '.md', '.csv', 
      '.svg', '.php', '.py', '.java', '.cpp', '.c', '.h', '.ts', '.tsx', '.jsx', 
      '.vue', '.scss', '.sass', '.less', '.yaml', '.yml', '.sql', '.sh', '.bat',
      '.ps1', '.rb', '.go', '.rs', '.swift', '.kt', '.dart', '.r', '.m', '.pl',
      '.lua', '.scala', '.clj', '.hs', '.elm', '.f', '.pas', '.asm', '.cfg',
      '.ini', '.conf', '.log', '.diff', '.patch'
    ];
    
    return textTypes.some(type => file.type.startsWith(type)) ||
           textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const isBinaryFile = (file: File): boolean => {
    const binaryTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/octet-stream'
    ];
    
    const binaryExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
      '.exe', '.dll', '.so', '.dylib',
      '.bin', '.dat', '.db', '.sqlite'
    ];
    
    return binaryTypes.some(type => file.type === type) ||
           binaryExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const analyzeFileStructure = (file: File): string => {
    const size = file.size;
    const type = file.type || 'Unknown';
    const extension = file.name.split('.').pop()?.toLowerCase() || 'none';
    const lastModified = new Date(file.lastModified);
    
    let sizeStr = '';
    if (size < 1024) sizeStr = `${size} bytes`;
    else if (size < 1024 * 1024) sizeStr = `${(size / 1024).toFixed(1)} KB`;
    else if (size < 1024 * 1024 * 1024) sizeStr = `${(size / 1024 / 1024).toFixed(1)} MB`;
    else sizeStr = `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
    
    return `📊 **File Analysis:**
• **Name:** ${file.name}
• **Type:** ${type}
• **Extension:** .${extension}
• **Size:** ${sizeStr}
• **Last Modified:** ${lastModified.toLocaleString()}`;
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
            text: enhancedPrompt
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
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
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
      console.log('Success response structure:', JSON.stringify(data, null, 2));
      
      // Look for image data in the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        console.log('Found parts in response:', parts.length);
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          console.log(`Part ${i}:`, JSON.stringify(part, null, 2));
          
          // Check different possible property names for image data
          if (part.inline_data?.data || part.inlineData?.data) {
            console.log('Found image data in response');
            const imageData = part.inline_data || part.inlineData;
            const mimeType = imageData.mime_type || imageData.mimeType || 'image/png';
            const imageUrl = `data:${mimeType};base64,${imageData.data}`;
            console.log('Image URL created successfully');
            return imageUrl;
          }
          
          // Also check for other possible structures
          if (part.image?.data) {
            console.log('Found image data in part.image');
            const mimeType = part.image.mime_type || 'image/png';
            const imageUrl = `data:${mimeType};base64,${part.image.data}`;
            return imageUrl;
          }
        }
        
        // If no image found, provide more detailed error
        console.error('No image data found in response parts. Parts structure:', parts);
        throw new Error('The model returned a response but no image was generated. This might be due to content restrictions or the model not supporting image generation for this specific prompt.');
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

      // Enhanced file processing for ALL file types
      if (attachments && attachments.length > 0) {
        console.log('Processing attachments:', attachments.length);
        
        for (const attachment of attachments) {
          console.log('Processing attachment:', attachment.name, 'Type:', attachment.type, 'MIME:', attachment.file?.type);
          
          // Add file structure analysis to prompt
          const fileAnalysis = analyzeFileStructure(attachment.file);
          prompt += `\n\n${fileAnalysis}\n`;
          
          if (attachment.type === 'image' && attachment.file) {
            try {
              console.log('Converting image to base64...');
              const base64Data = await convertFileToBase64(attachment.file);
              const base64Image = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
              
              parts.push({
                inline_data: {
                  mime_type: attachment.file.type,
                  data: base64Image
                }
              });
              
              prompt = `Please analyze this uploaded image in detail and ${prompt}`;
              
            } catch (error) {
              console.error('Error processing image:', error);
              throw new Error(`Failed to process image ${attachment.name}: ${error}`);
            }
          } else if (attachment.file && isTextFile(attachment.file)) {
            try {
              console.log('Reading text file content...');
              const fileContent = await readFileAsText(attachment.file);
              console.log('File content read successfully, length:', fileContent.length);
              
              // Analyze content structure
              const lines = fileContent.split('\n').length;
              const words = fileContent.split(/\s+/).length;
              const chars = fileContent.length;
              
              prompt += `\n\n📝 **Content Analysis:**
• **Lines:** ${lines}
• **Words:** ${words}
• **Characters:** ${chars}

**File Content:**
\`\`\`
${fileContent.length > 10000 ? fileContent.substring(0, 10000) + '\n... (content truncated)' : fileContent}
\`\`\`

Please analyze this file content comprehensively. If it's code, explain its functionality. If it's data, analyze patterns. If it's documentation, summarize key points.`;
              
            } catch (error) {
              console.error('Error reading text file:', error);
              prompt += `\n\n⚠️ Could not read text content from ${attachment.name}. Please provide analysis based on file metadata.`;
            }
          } else if (attachment.file && isBinaryFile(attachment.file)) {
            // For binary files, provide detailed metadata analysis
            prompt += `\n\n🔍 **Binary File Detected:** ${attachment.name}
This appears to be a binary file format. Based on the file extension and MIME type, please provide:
• Expected file structure and format
• Common use cases and applications
• Possible content analysis approaches
• Recommendations for further processing`;
          } else if (attachment.file) {
            // For any other file types
            prompt += `\n\n📎 **File Upload:** ${attachment.name}
• **MIME Type:** ${attachment.file.type}
• **Category:** ${attachment.file.type.startsWith('audio/') ? 'Audio' : 
                      attachment.file.type.startsWith('video/') ? 'Video' :
                      attachment.file.type.startsWith('application/') ? 'Application' : 'Other'}

Please analyze this file based on its type and provide relevant insights about its likely content and structure.`;
          }
        }
      }

      // Add the text prompt after processing all files
      parts.push({ text: prompt });

      console.log('Final prompt:', prompt);
      console.log('Total parts in request:', parts.length);

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Increased for more detailed analysis
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
        console.log('Image generated successfully');
        
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
      file,
      fileType: file.type,
      fileSize: file.size
    };
    
    setAttachedFiles(prev => [...prev, newAttachment]);
    
    // Enhanced file upload feedback
    const sizeStr = file.size < 1024 ? `${file.size} bytes` :
                   file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` :
                   `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    
    toast({
      title: "File attached successfully!",
      description: `${file.name} (${sizeStr}) is ready for analysis`
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
                Universal File Analyzer
              </h1>
              <p className="text-sm text-gray-600">Analyze ANY file type with AI - Documents, Images, Code, Data & More!</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                All Files Supported
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
                      
                      {/* Enhanced attachments display */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-black/10 rounded-lg">
                              {getFileIcon(attachment.name, attachment.file?.type || '')}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block">{attachment.name}</span>
                                {attachment.fileSize && (
                                  <span className="text-xs opacity-70">
                                    {attachment.fileSize < 1024 ? `${attachment.fileSize} bytes` :
                                     attachment.fileSize < 1024 * 1024 ? `${(attachment.fileSize / 1024).toFixed(1)} KB` :
                                     `${(attachment.fileSize / 1024 / 1024).toFixed(1)} MB`}
                                  </span>
                                )}
                              </div>
                              {attachment.type === 'image' && (
                                <img src={attachment.url} alt={attachment.name} className="max-w-20 max-h-20 object-cover rounded" />
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
                          {isGeneratingImage ? 'Generating image with Gemini...' : 'Analyzing your files...'}
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
              {/* Enhanced Feature Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  PDF & Documents
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  Spreadsheets
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Code className="w-3 h-3 mr-1" />
                  Source Code
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <FileImage className="w-3 h-3 mr-1" />
                  Images & Media
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Archive className="w-3 h-3 mr-1" />
                  Archives
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  Data Files
                </Badge>
              </div>

              <Separator className="mb-4" />

              {/* Enhanced Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                        {getFileIcon(file.name, file.file?.type || '')}
                        <div className="flex flex-col">
                          <span className="truncate max-w-32 font-medium">{file.name}</span>
                          {file.fileSize && (
                            <span className="text-xs opacity-70">
                              {file.fileSize < 1024 ? `${file.fileSize} bytes` :
                               file.fileSize < 1024 * 1024 ? `${(file.fileSize / 1024).toFixed(1)} KB` :
                               `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`}
                            </span>
                          )}
                        </div>
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
                    title="Upload Images"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={voiceRecording.toggleRecording}
                    className={`p-2 ${voiceRecording.isRecording ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}
                    disabled={!voiceRecording.isSupported}
                    title="Voice Input"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('file')}
                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100"
                    title="Upload ANY File Type"
                  >
                    <File className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100"
                    title="Generate Images"
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
                    placeholder={voiceRecording.isRecording ? "Listening..." : "Upload any file type for AI analysis or ask questions!"}
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

              {/* Hidden File Inputs - Enhanced to accept ALL file types */}
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
                accept="*/*"
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
